/**
 * =============================================================================
 * admin.js - Dashboard Admin / Pengelolaan PJ MK (Vanilla JavaScript)
 * =============================================================================
 */

import { api, formatStudentName } from '../utils/api.js';
import { showToast } from '../toast.js';
import { getIcon } from '../icons.js';

let adminTimerInterval = null;

export async function renderAdminPage(container, navigate) {
    if (adminTimerInterval) {
        clearInterval(adminTimerInterval);
        adminTimerInterval = null;
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                <div>
                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 9999px; background: #e0e7ff; color: #4338ca; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
                        <span>Panel Kontrol PJ MK</span>
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                        Dashboard Pengelolaan Presensi
                    </h1>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                        Kelola sesi perkuliahan, verifikasi presensi kelas, dan rekapitulasi data mahasiswa.
                    </p>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button
                        type="button"
                        id="btn-refresh-admin"
                        class="btn"
                        style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.825rem; font-weight: 600; cursor: pointer;"
                    >
                        ${getIcon('refresh', 'w-4 h-4')}
                        <span>Segarkan</span>
                    </button>

                    <button
                        type="button"
                        id="btn-export-excel"
                        class="btn"
                        style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-size: 0.825rem; font-weight: 600; cursor: pointer;"
                    >
                        ${getIcon('download', 'w-4 h-4 text-emerald-700')}
                        <span>Unduh Excel</span>
                    </button>
                </div>
            </div>

            <!-- Stats Grid -->
            <div id="admin-stats-container">
                <div class="card" style="padding: 20px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: var(--color-text-secondary);">Memuat statistik presensi...</div>
                </div>
            </div>

            <!-- Session Controller Card -->
            <div id="admin-session-controller-container"></div>

            <!-- Verification Table & Management -->
            <div id="admin-verification-container"></div>
        </div>
    `;

    loadAdminDashboard(container, navigate);

    container.querySelector('#btn-refresh-admin')?.addEventListener('click', () => {
        loadAdminDashboard(container, navigate);
        showToast('Data dashboard telah diperbarui', 'info');
    });

    container.querySelector('#btn-export-excel')?.addEventListener('click', async () => {
        try {
            showToast('Menyiapkan file Excel...', 'info');
            const res = await api.exportRecapExcel();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rekap_Presensi_Statistika_TI25C_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showToast('Berhasil mengunduh rekap Excel!', 'success');
        } catch (e) {
            showToast(e.message || 'Gagal mengunduh Excel', 'error');
        }
    });
}

async function loadAdminDashboard(container, navigate) {
    const statsBox = container.querySelector('#admin-stats-container');
    const sessionBox = container.querySelector('#admin-session-controller-container');
    const verifBox = container.querySelector('#admin-verification-container');

    try {
        const [stats, activeData, studentsData] = await Promise.all([
            api.getAdminStats().catch(() => ({ total_students: 30, present_today: 0, sick_today: 0, permit_today: 0, attendance_rate: 0 })),
            api.getActiveSession().catch(() => ({ session: null })),
            api.getStudents().catch(() => ({ students: [] }))
        ]);

        const session = activeData?.session;
        const students = studentsData?.students || [];

        renderStats(statsBox, stats, session);
        renderSessionController(sessionBox, session, () => loadAdminDashboard(container, navigate));
        renderVerificationTable(verifBox, session, students, () => loadAdminDashboard(container, navigate));

    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        showToast('Gagal memuat sebagian data admin', 'error');
    }
}

function renderStats(container, stats, session) {
    const total = stats.total_students || 30;
    const present = stats.present_today || 0;
    const rate = stats.attendance_rate !== undefined ? stats.attendance_rate : (total > 0 ? Math.round((present / total) * 100) : 0);

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
            <div class="card" style="padding: 16px 20px; border-radius: 8px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                    Total Mahasiswa TI25C
                </div>
                <div style="font-size: 1.75rem; font-weight: 700; color: var(--color-text); margin-top: 4px;">
                    ${total} <span style="font-size: 0.9rem; font-weight: 500; color: var(--color-text-secondary);">Orang</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
                    Kelas Terdaftar
                </div>
            </div>

            <div class="card" style="padding: 16px 20px; border-radius: 8px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                    Hadir Hari Ini
                </div>
                <div style="font-size: 1.75rem; font-weight: 700; color: var(--color-primary, #107C41); margin-top: 4px;">
                    ${present} <span style="font-size: 0.9rem; font-weight: 500; color: var(--color-text-secondary);">Mahasiswa</span>
                </div>
                <div style="font-size: 0.72rem; color: #16a34a; margin-top: 2px;">
                    ${rate}% Tingkat Kehadiran
                </div>
            </div>

            <div class="card" style="padding: 16px 20px; border-radius: 8px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                    Status Sesi Perkuliahan
                </div>
                <div style="font-size: 1.35rem; font-weight: 700; color: ${session && session.is_active ? '#15803d' : 'var(--color-text-secondary)'}; margin-top: 6px;">
                    ${session && session.is_active ? `Pertemuan ${session.meeting_number}` : 'Tidak Ada Sesi'}
                </div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
                    ${session && session.is_active ? `Mode: ${session.attendance_mode === 'manual' ? 'Manual' : 'Mandiri'}` : 'Klik Buka Sesi di bawah'}
                </div>
            </div>
        </div>
    `;
}

function renderSessionController(container, session, onRefresh) {
    if (session && session.is_active) {
        // ACTIVE SESSION CONTROLS
        container.innerHTML = `
            <div class="card" style="
                padding: 24px;
                border-radius: 10px;
                background: var(--color-bg-card, #ffffff);
                border: 2px solid var(--color-primary, #107C41);
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span style="padding: 2px 8px; border-radius: 9999px; background: #dcfce7; color: #15803d; font-size: 0.72rem; font-weight: 700;">
                                ● Sesi Sedang Berlangsung
                            </span>
                            <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">
                                Pertemuan Ke-${session.meeting_number}
                            </span>
                        </div>
                        <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                            ${session.title || `Pertemuan ${session.meeting_number}`}
                        </h2>
                        <div style="font-size: 0.825rem; color: var(--color-text-secondary);">
                            Mode: <strong>${session.attendance_mode === 'manual' ? 'Manual (PJ MK)' : 'Mandiri (Mahasiswa)'}</strong>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <button
                            type="button"
                            id="btn-close-session"
                            class="btn"
                            style="padding: 10px 18px; border-radius: 6px; border: none; background: #dc2626; color: #ffffff; font-size: 0.85rem; font-weight: 600; cursor: pointer;"
                        >
                            Tutup Sesi Sekarang
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#btn-close-session')?.addEventListener('click', async () => {
            if (confirm(`Yakin ingin menutup Sesi Pertemuan ${session.meeting_number}? Mahasiswa tidak dapat mengisi presensi lagi.`)) {
                try {
                    await api.closeSession(session.id);
                    showToast('Sesi perkuliahan berhasil ditutup!', 'success');
                    onRefresh();
                } catch (e) {
                    showToast(e.message || 'Gagal menutup sesi', 'error');
                }
            }
        });

    } else {
        // OPEN NEW SESSION FORM
        container.innerHTML = `
            <div class="card" style="
                padding: 24px;
                border-radius: 10px;
                background: var(--color-bg-card, #ffffff);
                border: 1px solid var(--color-border, #edebe9);
            ">
                <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-text); margin: 0 0 6px;">
                    Buka Sesi Presensi Baru
                </h2>
                <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin: 0 0 20px;">
                    Tentukan nomor pertemuan, materi kuliah, dan durasi waktu presensi untuk mahasiswa.
                </p>

                <form id="open-session-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div>
                        <label class="form-label" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                            Pertemuan Ke-
                        </label>
                        <input
                            type="number"
                            id="input-meeting-number"
                            class="form-input"
                            min="1"
                            max="16"
                            value="1"
                            required
                            style="width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.85rem;"
                        />
                    </div>

                    <div style="grid-column: span 2;">
                        <label class="form-label" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                            Judul / Topik Materi
                        </label>
                        <input
                            type="text"
                            id="input-session-title"
                            class="form-input"
                            placeholder="Contoh: Distribusi Frekuensi & Ukuran Pemusatan Data"
                            required
                            style="width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.85rem;"
                        />
                    </div>

                    <div>
                        <label class="form-label" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                            Durasi (Menit)
                        </label>
                        <input
                            type="number"
                            id="input-session-duration"
                            class="form-input"
                            min="5"
                            max="360"
                            value="120"
                            required
                            style="width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.85rem;"
                        />
                    </div>

                    <div>
                        <label class="form-label" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                            Mode Presensi
                        </label>
                        <select
                            id="select-session-mode"
                            class="form-select"
                            style="width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.85rem;"
                        >
                            <option value="self">Mandiri (Mahasiswa isi sendiri)</option>
                            <option value="manual">Manual (Dicatat PJ MK)</option>
                        </select>
                    </div>

                    <div style="grid-column: 1 / -1; margin-top: 4px;">
                        <button
                            type="submit"
                            id="btn-open-session-submit"
                            class="btn btn-primary"
                            style="
                                padding: 11px 24px;
                                border-radius: 6px;
                                border: none;
                                background: var(--color-primary, #107C41);
                                color: #ffffff;
                                font-size: 0.875rem;
                                font-weight: 600;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 8px;
                            "
                        >
                            ${getIcon('check', 'w-4 h-4')}
                            <span>Buka Sesi Presensi Sekarang</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = container.querySelector('#open-session-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const meetingNum = parseInt(container.querySelector('#input-meeting-number').value, 10);
            const titleVal = container.querySelector('#input-session-title').value.trim();
            const durationVal = parseInt(container.querySelector('#input-session-duration').value, 10);
            const modeVal = container.querySelector('#select-session-mode').value;

            try {
                const btn = container.querySelector('#btn-open-session-submit');
                btn.disabled = true;
                btn.textContent = 'Membuka sesi...';

                await api.openSession(meetingNum, titleVal, durationVal, modeVal);
                showToast(`Sesi Pertemuan ${meetingNum} berhasil dibuka!`, 'success');
                onRefresh();
            } catch (err) {
                showToast(err.message || 'Gagal membuka sesi', 'error');
                const btn = container.querySelector('#btn-open-session-submit');
                btn.disabled = false;
                btn.innerHTML = `${getIcon('check', 'w-4 h-4')}<span>Buka Sesi Presensi Sekarang</span>`;
            }
        });
    }
}

function renderVerificationTable(container, session, students, onRefresh) {
    let filterStatus = 'all';
    let searchQuery = '';

    const render = () => {
        let filtered = [...students];

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        container.innerHTML = `
            <div class="card" style="
                padding: 24px;
                border-radius: 10px;
                background: var(--color-bg-card, #ffffff);
                border: 1px solid var(--color-border, #edebe9);
            ">
                <!-- Table Header & Controls -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                            Daftar Mahasiswa & Verifikasi Kehadiran
                        </h2>
                        <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
                            Total ${filtered.length} mahasiswa terdaftar di kelas TI25C
                        </div>
                    </div>

                    <!-- Search Input -->
                    <div style="position: relative; width: 280px; max-width: 100%;">
                        <input
                            type="text"
                            id="student-search-input"
                            class="form-input"
                            placeholder="Cari nama mahasiswa..."
                            value="${searchQuery}"
                            style="width: 100%; padding: 8px 12px 8px 36px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.825rem;"
                        />
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-secondary);">
                            ${getIcon('search', 'w-4 h-4')}
                        </span>
                    </div>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.825rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--color-border, #edebe9); color: var(--color-text-secondary); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em;">
                                <th style="padding: 10px 12px; width: 48px;">No</th>
                                <th style="padding: 10px 12px;">Nama Mahasiswa</th>
                                <th style="padding: 10px 12px; text-align: center; width: 120px;">Peran</th>
                                <th style="padding: 10px 12px; text-align: center; width: 140px;">Status Hari Ini</th>
                                <th style="padding: 10px 12px; text-align: right; width: 240px;">Ubah Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map((st, idx) => {
                                const isUserAdmin = st.role === 'admin';
                                const currentStatus = st.status_today || (isUserAdmin ? 'PJ MK' : 'Belum Presensi');
                                return `
                                    <tr style="border-bottom: 1px solid var(--color-border, #edebe9); transition: background 0.1s ease;">
                                        <td style="padding: 12px; color: var(--color-text-secondary);">${idx + 1}</td>
                                        <td style="padding: 12px; font-weight: 600; color: var(--color-text);">
                                            ${formatStudentName(st.name)}
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            <span style="
                                                padding: 2px 8px;
                                                border-radius: 4px;
                                                font-size: 0.72rem;
                                                font-weight: 600;
                                                background: ${isUserAdmin ? '#e0e7ff' : 'var(--color-bg, #f3f2f1)'};
                                                color: ${isUserAdmin ? '#4338ca' : 'var(--color-text-secondary)'};
                                            ">
                                                ${isUserAdmin ? 'PJ MK' : 'Mahasiswa'}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            <span style="
                                                padding: 3px 8px;
                                                border-radius: 9999px;
                                                font-size: 0.72rem;
                                                font-weight: 700;
                                                text-transform: uppercase;
                                                background: ${
                                                    currentStatus === 'hadir' ? '#dcfce7' :
                                                    currentStatus === 'izin' ? '#eff6ff' :
                                                    currentStatus === 'sakit' ? '#fef9c3' : 'var(--color-bg, #f3f2f1)'
                                                };
                                                color: ${
                                                    currentStatus === 'hadir' ? '#15803d' :
                                                    currentStatus === 'izin' ? '#1d4ed8' :
                                                    currentStatus === 'sakit' ? '#a16207' : 'var(--color-text-secondary)'
                                                };
                                            ">
                                                ${currentStatus}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: right;">
                                            ${session && session.is_active && !isUserAdmin ? `
                                                <div style="display: inline-flex; gap: 4px;">
                                                    <button type="button" class="btn-status-toggle" data-user="${st.id}" data-status="hadir" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-size: 0.72rem; font-weight: 600; cursor: pointer;">Hadir</button>
                                                    <button type="button" class="btn-status-toggle" data-user="${st.id}" data-status="izin" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af; font-size: 0.72rem; font-weight: 600; cursor: pointer;">Izin</button>
                                                    <button type="button" class="btn-status-toggle" data-user="${st.id}" data-status="sakit" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #fef08a; background: #fefce8; color: #854d0e; font-size: 0.72rem; font-weight: 600; cursor: pointer;">Sakit</button>
                                                    <button type="button" class="btn-status-toggle" data-user="${st.id}" data-status="alpa" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; font-size: 0.72rem; font-weight: 600; cursor: pointer;">Alpa</button>
                                                </div>
                                            ` : `
                                                <span style="font-size: 0.75rem; color: var(--color-text-muted);">-</span>
                                            `}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Search event listener
        const searchInput = container.querySelector('#student-search-input');
        searchInput?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            render();
            // Restore focus
            const newSearch = container.querySelector('#student-search-input');
            if (newSearch) {
                newSearch.focus();
                newSearch.setSelectionRange(searchQuery.length, searchQuery.length);
            }
        });

        // Status toggle buttons
        container.querySelectorAll('.btn-status-toggle').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.getAttribute('data-user');
                const status = btn.getAttribute('data-status');
                try {
                    btn.disabled = true;
                    await api.updateAttendanceStatus(userId, session.id, status);
                    showToast(`Status berhasil diubah menjadi ${status.toUpperCase()}`, 'success');
                    onRefresh();
                } catch (e) {
                    showToast(e.message || 'Gagal mengubah status', 'error');
                    btn.disabled = false;
                }
            });
        });
    };

    render();
}
