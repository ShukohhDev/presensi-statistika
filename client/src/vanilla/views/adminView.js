/**
 * =============================================================================
 * adminView.js - Panel Kendali Admin & Dosen / PJ MK (Vanilla JavaScript)
 * =============================================================================
 * Berisi 3 Tab Utama:
 * 1. Sesi Perkuliahan (Buka/Tutup Sesi, Alih Mode Mandiri/Manual, Salin Rekap WA)
 * 2. Verifikasi Presensi (Ubah status kehadiran mahasiswa Hadir/Izin/Sakit/Alpha)
 * 3. Rekapitulasi & Ekspor Excel
 * =============================================================================
 */

import { api, formatStudentName, sortStudentsByName } from '../api.js';
import { showToast } from '../toast.js';
import { clockIcon, checkCircleIcon, searchIcon, downloadIcon, editIcon, whatsAppIcon } from '../icons.js';

let activeTab = 'sessions'; // 'sessions' | 'verification' | 'recap'
let adminCountdownInterval = null;

export async function renderAdmin(container, navigate) {
    if (adminCountdownInterval) {
        clearInterval(adminCountdownInterval);
        adminCountdownInterval = null;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
            <div class="spinner"></div>
        </div>
    `;

    try {
        const [stats, sessionsData, studentsData, sessionData] = await Promise.all([
            api.getDashboardStats().catch(() => null),
            api.getSessions().catch(() => ({ sessions: [] })),
            api.getStudents().catch(() => ({ students: [] })),
            api.getActiveSession().catch(() => ({ session: null })),
        ]);

        const sessions = sessionsData?.sessions || [];
        const students = sortStudentsByName(studentsData?.students || []);
        const activeSession = sessionData?.session;

        // Hitung nomor pertemuan berikutnya
        const maxMeeting = sessions.length > 0 ? Math.max(...sessions.map(s => s.meeting_number || 1)) : 0;
        const nextMeetingNumber = maxMeeting + 1;

        container.innerHTML = `
            <div class="page-container">
                <!-- Header Admin -->
                <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h1 class="page-title">Panel Kendali Dosen / PJ MK</h1>
                        <p class="page-subtitle">Kelola Sesi Presensi & Rekapitulasi Mahasiswa TI25C</p>
                    </div>
                    <div>
                        <button id="btn-export-excel" class="btn btn-outline" style="display: flex; align-items: center; gap: 6px;">
                            ${downloadIcon('', 16)} Ekspor Data Excel
                        </button>
                    </div>
                </div>

                <!-- Kartu Statistik Cepat -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="padding: 16px;">
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">TOTAL MAHASISWA</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${students.length} Mahasiswa</div>
                    </div>
                    <div class="card" style="padding: 16px;">
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">SESI SAAT INI</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">
                            ${activeSession ? `Pertemuan ke-${activeSession.meeting_number}` : 'Tidak Ada Sesi'}
                        </div>
                    </div>
                    <div class="card" style="padding: 16px;">
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">STATUS SISTEM</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${activeSession ? 'var(--color-success)' : 'var(--color-text-muted)'};">
                            ${activeSession ? 'Sesi Terbuka' : 'Sesi Ditutup'}
                        </div>
                    </div>
                </div>

                <!-- Tab Navigasi Admin -->
                <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); margin-bottom: 24px;">
                    <button id="tab-sessions-btn" class="btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-outline'}" style="border-radius: 8px 8px 0 0;">
                        1. Sesi Perkuliahan
                    </button>
                    <button id="tab-verification-btn" class="btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-outline'}" style="border-radius: 8px 8px 0 0;">
                        2. Verifikasi Presensi Mahasiswa
                    </button>
                    <button id="tab-recap-btn" class="btn ${activeTab === 'recap' ? 'btn-primary' : 'btn-outline'}" style="border-radius: 8px 8px 0 0;">
                        3. Rekapitulasi Seluruh Kelas
                    </button>
                </div>

                <!-- Kontainer Konten Tab -->
                <div id="admin-tab-content">
                    ${renderTabContent(activeTab, activeSession, sessions, students, nextMeetingNumber)}
                </div>
            </div>
        `;

        // Hubungkan Event Listener Admin
        attachAdminEvents(container, activeSession, sessions, students, nextMeetingNumber, navigate);

    } catch (err) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <p style="color: var(--color-danger);">Gagal memuat dashboard admin: ${err.message}</p>
                <button id="retry-admin-btn" class="btn btn-primary" style="margin-top: 12px;">Coba Lagi</button>
            </div>
        `;
        container.querySelector('#retry-admin-btn')?.addEventListener('click', () => renderAdmin(container, navigate));
    }
}

/**
 * Render Konten Berdasarkan Tab yang Aktif
 */
function renderTabContent(tab, activeSession, sessions, students, nextMeetingNumber) {
    if (tab === 'sessions') {
        return renderSessionsTab(activeSession, sessions, nextMeetingNumber);
    } else if (tab === 'verification') {
        return renderVerificationTab(activeSession, sessions);
    } else {
        return renderRecapTab(students);
    }
}

/**
 * Tab 1: Sesi Perkuliahan
 */
function renderSessionsTab(activeSession, sessions, nextMeetingNumber) {
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
            <!-- Kartu Kendali Sesi Aktif -->
            <div class="card">
                <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Sesi Presensi Aktif</h2>
                ${activeSession ? `
                    <div style="padding: 16px; border-radius: 8px; background: rgba(37, 99, 235, 0.08); border: 1px solid var(--color-primary); margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span class="badge badge-success">SESI TERBUKA</span>
                            <span id="admin-countdown" style="font-family: var(--font-mono); font-weight: 600;">--:--</span>
                        </div>
                        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Pertemuan ke-${activeSession.meeting_number}: ${activeSession.title}</h3>
                        <p style="font-size: 0.813rem; color: var(--color-text-secondary); margin-bottom: 12px;">
                            Mode: <strong>${activeSession.attendance_mode === 'admin_only' ? 'Manual oleh Admin/Dosen' : 'Mandiri oleh Mahasiswa'}</strong>
                        </p>

                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button id="btn-toggle-mode" class="btn btn-outline" style="font-size: 0.813rem;">
                                Ganti ke Mode: ${activeSession.attendance_mode === 'admin_only' ? 'Mandiri' : 'Manual PJ MK'}
                            </button>
                            <button id="btn-copy-wa" class="btn btn-outline" style="color: #25D366; font-size: 0.813rem;">
                                ${whatsAppIcon('', 14)} Salin Rekap WhatsApp
                            </button>
                            <button id="btn-close-session" class="btn btn-danger" style="font-size: 0.813rem;">
                                Tutup Sesi Sekarang
                            </button>
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 24px; color: var(--color-text-muted); background: var(--color-bg-secondary); border-radius: 8px; margin-bottom: 16px;">
                        Saat ini tidak ada sesi perkuliahan yang sedang terbuka.
                    </div>
                `}

                <!-- Form Buka Sesi Baru -->
                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px;">Buka Sesi Perkuliahan Baru</h3>
                <form id="form-open-session">
                    <div class="form-group">
                        <label class="form-label" for="open-meeting-number">Nomor Pertemuan</label>
                        <input type="number" id="open-meeting-number" class="form-input" value="${nextMeetingNumber}" min="1" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="open-session-title">Materi / Topik Bahasan</label>
                        <input type="text" id="open-session-title" class="form-input" placeholder="Contoh: Pengantar Statistika & Probabilitas" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="open-duration">Durasi Buka Sesi (Menit)</label>
                        <input type="number" id="open-duration" class="form-input" value="15" min="5" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="open-mode">Mode Presensi Awal</label>
                        <select id="open-mode" class="form-input">
                            <option value="self">Mandiri oleh Mahasiswa</option>
                            <option value="admin_only">Manual oleh Admin / Dosen</option>
                        </select>
                    </div>
                    <button type="submit" id="btn-submit-open-session" class="btn btn-primary btn-block">
                        Buka Sesi Presensi Sekarang
                    </button>
                </form>
            </div>

            <!-- Daftar Riwayat Sesi Perkuliahan -->
            <div class="card">
                <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Riwayat Pertemuan Kuliah</h2>
                <div style="max-height: 480px; overflow-y: auto;">
                    ${sessions.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${sessions.map(s => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-secondary);">
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.938rem;">Pertemuan ke-${s.meeting_number}</div>
                                        <div style="font-size: 0.813rem; color: var(--color-text-secondary);">${s.title || 'Materi Pertemuan'}</div>
                                    </div>
                                    <span class="badge ${s.status === 'open' ? 'badge-success' : 'badge-outline'}">
                                        ${s.status === 'open' ? 'Aktif' : 'Selesai'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; color: var(--color-text-muted); padding: 24px;">Belum ada riwayat sesi.</div>
                    `}
                </div>
            </div>
        </div>
    `;
}

/**
 * Tab 2: Verifikasi Presensi Mahasiswa
 */
function renderVerificationTab(activeSession, sessions) {
    return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                <div>
                    <h2 style="font-size: 1.15rem; font-weight: 700; margin: 0;">Daftar Presensi Mahasiswa</h2>
                    <p style="font-size: 0.813rem; color: var(--color-text-muted); margin: 4px 0 0;">
                        ${activeSession ? `Menampilkan presensi pada Pertemuan ke-${activeSession.meeting_number}` : 'Pilih sesi untuk melihat presensi'}
                    </p>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="position: relative;">
                        <input type="text" id="search-student-input" class="form-input" placeholder="Cari nama mahasiswa..." style="padding-left: 32px; width: 220px;" />
                        <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">${searchIcon('', 14)}</span>
                    </div>
                </div>
            </div>

            <div id="verification-table-container">
                <div style="text-align: center; padding: 32px;">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Tab 3: Rekap Seluruh Kelas
 */
function renderRecapTab(students) {
    return `
        <div class="card">
            <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Rekapitulasi Kehadiran Mahasiswa Kelas TI25C</h2>
            <div style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
                            <th style="padding: 10px;">No</th>
                            <th style="padding: 10px;">Nama Mahasiswa</th>
                            <th style="padding: 10px;">Peran</th>
                            <th style="padding: 10px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((st, idx) => `
                            <tr style="border-bottom: 1px solid var(--color-border);">
                                <td style="padding: 10px;">${idx + 1}</td>
                                <td style="padding: 10px; font-weight: 500;">${st.name}</td>
                                <td style="padding: 10px;"><span class="badge ${st.role === 'admin' ? 'badge-primary' : 'badge-outline'}">${st.role === 'admin' ? 'PJ MK / Dosen' : 'Mahasiswa'}</span></td>
                                <td style="padding: 10px;"><span class="badge badge-success">Terdaftar Aktif</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Event Handlers Dashboard Admin
 */
function attachAdminEvents(container, activeSession, sessions, students, nextMeetingNumber, navigate) {
    // Tombol Tab Navigasi
    container.querySelector('#tab-sessions-btn')?.addEventListener('click', () => {
        activeTab = 'sessions';
        renderAdmin(container, navigate);
    });
    container.querySelector('#tab-verification-btn')?.addEventListener('click', () => {
        activeTab = 'verification';
        renderAdmin(container, navigate);
        loadSessionAttendances(container, activeSession?.id || (sessions[0]?.id));
    });
    container.querySelector('#tab-recap-btn')?.addEventListener('click', () => {
        activeTab = 'recap';
        renderAdmin(container, navigate);
    });

    // Ekspor Excel
    container.querySelector('#btn-export-excel')?.addEventListener('click', async () => {
        try {
            showToast('Menyiapkan file unduhan Excel...', 'info');
            await api.exportExcel();
            showToast('File Excel berhasil diunduh!', 'success');
        } catch (err) {
            showToast(err.message || 'Gagal mengunduh Excel.', 'error');
        }
    });

    // Buka Sesi Baru
    const formOpen = container.querySelector('#form-open-session');
    if (formOpen) {
        formOpen.addEventListener('submit', async (e) => {
            e.preventDefault();
            const meetingNum = parseInt(container.querySelector('#open-meeting-number').value, 10);
            const title = container.querySelector('#open-session-title').value.trim();
            const duration = parseInt(container.querySelector('#open-duration').value, 10);
            const mode = container.querySelector('#open-mode').value;

            try {
                showToast('Membuka sesi presensi...', 'info');
                await api.openSession(meetingNum, title, duration, mode);
                showToast(`Sesi Pertemuan ke-${meetingNum} berhasil dibuka!`, 'success');
                renderAdmin(container, navigate);
            } catch (err) {
                showToast(err.message || 'Gagal membuka sesi presensi.', 'error');
            }
        });
    }

    // Alih Mode Presensi (Mandiri vs Manual PJ MK)
    container.querySelector('#btn-toggle-mode')?.addEventListener('click', async () => {
        if (!activeSession) return;
        const nextMode = activeSession.attendance_mode === 'admin_only' ? 'self' : 'admin_only';
        try {
            await api.updateSessionMode(activeSession.id, nextMode);
            showToast(`Mode presensi dialihkan ke: ${nextMode === 'admin_only' ? 'Manual oleh PJ MK' : 'Mandiri Mahasiswa'}.`, 'success');
            renderAdmin(container, navigate);
        } catch (err) {
            showToast(err.message || 'Gagal mengubah mode.', 'error');
        }
    });

    // Tutup Sesi Sekarang
    container.querySelector('#btn-close-session')?.addEventListener('click', async () => {
        if (!activeSession) return;
        if (confirm('Tutup sesi presensi sekarang? Mahasiswa yang belum presensi akan dihitung Alpha.')) {
            try {
                await api.closeSession(activeSession.id);
                showToast('Sesi presensi telah ditutup.', 'success');
                renderAdmin(container, navigate);
            } catch (err) {
                showToast(err.message || 'Gagal menutup sesi.', 'error');
            }
        }
    });

    // Salin Rekap WhatsApp
    container.querySelector('#btn-copy-wa')?.addEventListener('click', async () => {
        if (!activeSession) return;
        try {
            const data = await api.getSessionWASummary(activeSession.id);
            if (data?.text) {
                await navigator.clipboard.writeText(data.text);
                showToast('Format pesan WhatsApp berhasil disalin ke clipboard!', 'success');
            }
        } catch (err) {
            showToast('Gagal menyalin format WhatsApp.', 'error');
        }
    });

    // Pasang Countdown jika sedang di tab sesi
    if (activeSession && activeSession.opened_at && activeTab === 'sessions') {
        const timerElem = container.querySelector('#admin-countdown');
        if (timerElem) {
            const updateAdminTimer = () => {
                const openedAt = new Date(activeSession.opened_at).getTime();
                const durationMs = (activeSession.duration_minutes || 15) * 60 * 1000;
                const endTime = openedAt + durationMs;
                const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            };
            updateAdminTimer();
            adminCountdownInterval = setInterval(updateAdminTimer, 1000);
        }
    }

    // Jika sedang di tab verifikasi, muat tabel kehadiran
    if (activeTab === 'verification') {
        loadSessionAttendances(container, activeSession?.id || (sessions[0]?.id));
    }
}

/**
 * Muat dan render daftar presensi per sesi mahasiswa
 */
async function loadSessionAttendances(container, sessionId) {
    const tableBox = container.querySelector('#verification-table-container');
    if (!tableBox) return;

    if (!sessionId) {
        tableBox.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Pilih sesi perkuliahan terlebih dahulu.</div>';
        return;
    }

    try {
        const data = await api.getSessionAttendances(sessionId);
        const attendances = data?.attendances || [];

        tableBox.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
                            <th style="padding: 10px;">No</th>
                            <th style="padding: 10px;">Nama Mahasiswa</th>
                            <th style="padding: 10px;">Status Kehadiran</th>
                            <th style="padding: 10px;">Waktu Presensi</th>
                            <th style="padding: 10px;">Aksi Cepat</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-rows">
                        ${attendances.map((item, idx) => `
                            <tr style="border-bottom: 1px solid var(--color-border);" data-name="${item.name.toLowerCase()}">
                                <td style="padding: 10px;">${idx + 1}</td>
                                <td style="padding: 10px; font-weight: 500;">${item.name}</td>
                                <td style="padding: 10px;">
                                    <span class="badge ${getStatusBadgeClass(item.status)}">
                                        ${item.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style="padding: 10px; font-size: 0.813rem; color: var(--color-text-muted);">
                                    ${item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString('id-ID') + ' WIB' : '-'}
                                </td>
                                <td style="padding: 10px;">
                                    <div style="display: flex; gap: 4px;">
                                        <button class="btn btn-sm btn-outline btn-status" data-uid="${item.user_id}" data-sid="${sessionId}" data-status="hadir">Hadir</button>
                                        <button class="btn btn-sm btn-outline btn-status" data-uid="${item.user_id}" data-sid="${sessionId}" data-status="izin">Izin</button>
                                        <button class="btn btn-sm btn-outline btn-status" data-uid="${item.user_id}" data-sid="${sessionId}" data-status="sakit">Sakit</button>
                                        <button class="btn btn-sm btn-outline btn-status" data-uid="${item.user_id}" data-sid="${sessionId}" data-status="alpha">Alpha</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Search filter
        const searchInput = container.querySelector('#search-student-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const rows = tableBox.querySelectorAll('#attendance-rows tr');
                rows.forEach(r => {
                    const name = r.getAttribute('data-name') || '';
                    r.style.display = name.includes(query) ? '' : 'none';
                });
            });
        }

        // Tombol Ubah Status
        tableBox.querySelectorAll('.btn-status').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = btn.getAttribute('data-uid');
                const sid = btn.getAttribute('data-sid');
                const nextStatus = btn.getAttribute('data-status');
                try {
                    await api.updateAttendanceStatus(uid, sid, nextStatus);
                    showToast(`Status kehadiran berhasil diubah ke: ${nextStatus.toUpperCase()}`, 'success');
                    loadSessionAttendances(container, sessionId);
                } catch (err) {
                    showToast(err.message || 'Gagal mengubah status.', 'error');
                }
            });
        });

    } catch (err) {
        tableBox.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 24px;">Gagal memuat presensi: ${err.message}</div>`;
    }
}

function getStatusBadgeClass(status) {
    if (status === 'hadir') return 'badge-success';
    if (status === 'izin') return 'badge-primary';
    if (status === 'sakit') return 'badge-warning';
    return 'badge-danger';
}
