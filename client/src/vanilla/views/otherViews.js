/**
 * =============================================================================
 * otherViews.js - Kumpulan Halaman Pendukung (Vanilla JavaScript)
 * =============================================================================
 * Berisi render fungsi untuk:
 * - Rekap Kehadiran (renderRecap)
 * - Riwayat Presensi (renderHistory)
 * - Bank Materi (renderMaterials)
 * - Pengumpulan Tugas (renderTasks)
 * - Kalender Akademik (renderCalendar)
 * - Laporan & Saran (renderReports)
 * - Profil & Pengaturan Tema (renderProfile)
 * =============================================================================
 */

import { api, API_URL } from '../api.js';
import { getState, applyTheme, clearAuth } from '../state.js';
import { showToast } from '../toast.js';
import {
    fileTextIcon,
    downloadIcon,
    uploadIcon,
    calendarIcon,
    bookOpenIcon,
    whatsAppIcon,
    clockIcon,
    historyIcon,
    refreshIcon,
    trashIcon
} from '../icons.js';

// --- 1. REKAP KEHADIRAN MAHASISWA ---
export async function renderRecap(container, navigate) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div></div>';
    try {
        const data = await api.getAttendanceRecap().catch(() => ({ recap: [] }));
        const recap = data?.recap || [];

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">Rekapitulasi Kehadiran</h1>
                    <p class="page-subtitle">Statistik dan Catatan Presensi Kelas Statistika TI25C</p>
                </div>

                <div class="card">
                    <div style="overflow-x: auto;">
                        <table class="table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
                                    <th style="padding: 10px;">Pertemuan</th>
                                    <th style="padding: 10px;">Topik Materi</th>
                                    <th style="padding: 10px;">Status Anda</th>
                                    <th style="padding: 10px;">Waktu Presensi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recap.length > 0 ? recap.map(r => `
                                    <tr style="border-bottom: 1px solid var(--color-border);">
                                        <td style="padding: 10px; font-weight: 600;">Pertemuan ${r.meeting_number}</td>
                                        <td style="padding: 10px;">${r.title || 'Materi Kuliah'}</td>
                                        <td style="padding: 10px;"><span class="badge ${r.status === 'hadir' ? 'badge-success' : 'badge-warning'}">${(r.status || 'Alpha').toUpperCase()}</span></td>
                                        <td style="padding: 10px; font-size: 0.813rem; color: var(--color-text-muted);">${r.submitted_at || '-'}</td>
                                    </tr>
                                `).join('') : `
                                    <tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--color-text-muted);">Belum ada catatan rekapitulasi.</td></tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--color-danger);">Gagal memuat rekap: ${err.message}</div>`;
    }
}

// --- 2. BANK MATERI KULIAH ---
export async function renderMaterials(container, navigate) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div></div>';
    try {
        const data = await api.getMaterials().catch(() => ({ materials: [] }));
        const materials = data?.materials || [];

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">Bank Materi Perkuliahan</h1>
                    <p class="page-subtitle">Modul, Slide Presentasi, dan Bahan Belajar Statistika</p>
                </div>

                <div class="card">
                    ${materials.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                            ${materials.map(m => `
                                <div style="padding: 16px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-secondary);">
                                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                                        <span class="badge badge-primary">Pertemuan ${m.meeting_number || 1}</span>
                                        <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">${m.category || 'Materi'}</span>
                                    </div>
                                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 6px;">${m.title}</h3>
                                    <p style="font-size: 0.813rem; color: var(--color-text-secondary); margin-bottom: 12px;">${m.description || 'Tidak ada deskripsi tambahan.'}</p>
                                    ${m.file_path ? `
                                        <a href="${m.file_path}" target="_blank" class="btn btn-sm btn-outline" style="display: inline-flex; align-items: center; gap: 4px;">
                                            ${downloadIcon('', 14)} Unduh Materi
                                        </a>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 36px; color: var(--color-text-muted);">
                            <div style="font-size: 2rem; margin-bottom: 8px;">📚</div>
                            <p>Belum ada materi perkuliahan yang diunggah.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--color-danger);">Gagal memuat materi: ${err.message}</div>`;
    }
}

// --- 3. PENGUMPULAN TUGAS ---
export async function renderTasks(container, navigate) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div></div>';
    try {
        const [assignmentsData, myTasksData] = await Promise.all([
            api.getAssignments().catch(() => ({ assignments: [] })),
            api.getTaskHistory().catch(() => ({ tasks: [] }))
        ]);

        const assignments = assignmentsData?.assignments || [];
        const myTasks = myTasksData?.tasks || [];

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">Pengumpulan Tugas Kuliah</h1>
                    <p class="page-subtitle">Daftar Penugasan Statistika & Status Pengiriman</p>
                </div>

                <div class="card" style="margin-bottom: 24px;">
                    <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px;">Tugas Aktif</h2>
                    ${assignments.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${assignments.map(as => `
                                <div style="padding: 16px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-secondary);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                        <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${as.title}</h3>
                                        <span class="badge badge-warning">Tenggat: ${as.due_date}</span>
                                    </div>
                                    <p style="font-size: 0.813rem; color: var(--color-text-secondary); margin-bottom: 12px;">${as.description || '-'}</p>
                                    <form class="task-upload-form" data-aid="${as.id}" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                                        <input type="file" class="form-input" style="max-width: 240px; font-size: 0.813rem;" required />
                                        <button type="submit" class="btn btn-sm btn-primary">${uploadIcon('', 14)} Kirim Tugas</button>
                                    </form>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Tidak ada tugas aktif saat ini.</div>
                    `}
                </div>

                <div class="card">
                    <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px;">Riwayat Pengumpulan Tugas Anda</h2>
                    ${myTasks.length > 0 ? `
                        <div style="overflow-x: auto;">
                            <table class="table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
                                        <th style="padding: 8px;">Tugas</th>
                                        <th style="padding: 8px;">File</th>
                                        <th style="padding: 8px;">Waktu Kirim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${myTasks.map(t => `
                                        <tr style="border-bottom: 1px solid var(--color-border);">
                                            <td style="padding: 8px; font-weight: 500;">${t.task_title || 'Tugas'}</td>
                                            <td style="padding: 8px; font-size: 0.813rem;">${t.file_name}</td>
                                            <td style="padding: 8px; font-size: 0.813rem; color: var(--color-text-muted);">${t.submitted_at}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Anda belum pernah mengumpulkan tugas.</div>
                    `}
                </div>
            </div>
        `;

        // Upload handler
        container.querySelectorAll('.task-upload-form').forEach(f => {
            f.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fileInput = f.querySelector('input[type="file"]');
                const aid = f.getAttribute('data-aid');
                if (!fileInput.files[0]) return;

                const formData = new FormData();
                formData.append('assignment_id', aid);
                formData.append('file', fileInput.files[0]);

                try {
                    showToast('Mengunggah berkas tugas...', 'info');
                    await api.uploadTask(formData);
                    showToast('Tugas berhasil dikirim!', 'success');
                    renderTasks(container, navigate);
                } catch (err) {
                    showToast(err.message || 'Gagal mengirim tugas.', 'error');
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--color-danger);">Gagal memuat tugas: ${err.message}</div>`;
    }
}

// --- 4. KALENDER AKADEMIK ---
export async function renderCalendar(container, navigate) {
    container.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">Kalender Akademik</h1>
                <p class="page-subtitle">Jadwal Perkuliahan & Agenda Penting Statistika TI25C</p>
            </div>

            <div class="card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="font-size: 2rem;">📅</div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Jadwal Rutin Mingguan</h3>
                        <p style="margin: 2px 0 0; color: var(--color-text-muted); font-size: 0.875rem;">Setiap Hari Rabu, Pukul 13:00 - 15:30 WIB (G. Mahdor R. C 306)</p>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--color-border); padding-top: 16px;">
                    <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6;">
                        Kuliah Statistika diadakan secara tatap muka di ruang kelas C 306. Mahasiswa diwajibkan melakukan presensi tepat waktu saat sesi perkuliahan dibuka oleh Dosen / PJ MK.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// --- 5. LAPORAN & SARAN ---
export async function renderReports(container, navigate) {
    container.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">Laporan, Kritik & Saran</h1>
                <p class="page-subtitle">Sampaikan Masukan atau Laporkan Kendala Presensi kepada Pengelola</p>
            </div>

            <div class="card">
                <form id="report-form">
                    <div class="form-group">
                        <label class="form-label" for="report-category">Kategori Laporan</label>
                        <select id="report-category" class="form-input">
                            <option value="saran">Saran Pengembangan</option>
                            <option value="kritik">Kritik & Masukan</option>
                            <option value="bug">Laporan Kendala / Bug</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="report-title">Judul Laporan</label>
                        <input type="text" id="report-title" class="form-input" placeholder="Ringkasan kendala..." required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="report-desc">Keterangan Detail</label>
                        <textarea id="report-desc" class="form-input" rows="3" placeholder="Tuliskan penjelasan selengkapnya..." required></textarea>
                    </div>
                    <button type="submit" id="btn-submit-report" class="btn btn-primary">
                        Kirim Laporan
                    </button>
                </form>
            </div>
        </div>
    `;

    container.querySelector('#report-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cat = container.querySelector('#report-category').value;
        const title = container.querySelector('#report-title').value.trim();
        const desc = container.querySelector('#report-desc').value.trim();

        try {
            showToast('Mengirim laporan...', 'info');
            await api.createReport(cat, title, desc);
            showToast('Laporan Anda berhasil dikirim!', 'success');
            container.querySelector('#report-title').value = '';
            container.querySelector('#report-desc').value = '';
        } catch (err) {
            showToast(err.message || 'Gagal mengirim laporan.', 'error');
        }
    });
}

// --- 6. PROFIL & PENGATURAN TEMA ---
export async function renderProfile(container, navigate) {
    const state = getState();
    const user = state.user || {};

    const THEMES = [
        { id: 'cobalt-slate', name: 'Cobalt & Modern Slate (Rekomendasi)', swatch: '#2563EB' },
        { id: 'excel-statistika', name: 'Excel & Data Green', swatch: '#107C41' },
        { id: 'midnight', name: 'Academic Navy', swatch: '#004E8C' },
        { id: 'ocean', name: 'Power BI Teal', swatch: '#038387' },
    ];

    container.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">Profil & Pengaturan Akun</h1>
                <p class="page-subtitle">Kelola Informasi Pengguna & Tampilan Antarmuka</p>
            </div>

            <div class="card" style="margin-bottom: 24px;">
                <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px;">Informasi Akun</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">NAMA LENGKAP</div>
                        <div style="font-size: 1rem; font-weight: 600;">${user.name || '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">PERAN AKUN</div>
                        <div style="font-size: 1rem; font-weight: 600; text-transform: uppercase;">${user.role === 'admin' ? 'PJ MK / Dosen' : 'Mahasiswa'}</div>
                    </div>
                </div>

                <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border);">
                    <button id="btn-logout" class="btn btn-danger">
                        Keluar dari Akun (Logout)
                    </button>
                </div>
            </div>

            <div class="card">
                <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px;">Pilihan Tema Warna Antarmuka</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                    ${THEMES.map(th => `
                        <div class="theme-card" data-tid="${th.id}" style="cursor: pointer; padding: 12px; border: 2px solid ${state.theme === th.id ? 'var(--color-primary)' : 'var(--color-border)'}; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                            <span style="width: 20px; height: 20px; border-radius: 50%; background: ${th.swatch}; display: inline-block;"></span>
                            <span style="font-size: 0.875rem; font-weight: 500;">${th.name}</span>
                        </div>
                    `).join('')}
                </div>

                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
                    <input type="checkbox" id="toggle-dark-mode" ${state.darkMode ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-primary);" />
                    <span style="font-weight: 500; font-size: 0.938rem;">Aktifkan Mode Gelap (Dark Mode)</span>
                </label>
            </div>
        </div>
    `;

    // Logout handler
    container.querySelector('#btn-logout')?.addEventListener('click', () => {
        clearAuth();
        showToast('Anda telah berhasil keluar akun.', 'info');
        navigate('login');
    });

    // Theme select handler
    container.querySelectorAll('.theme-card').forEach(tc => {
        tc.addEventListener('click', () => {
            const tid = tc.getAttribute('data-tid');
            const isDark = container.querySelector('#toggle-dark-mode').checked;
            applyTheme(tid, isDark);
            showToast(`Tema warna diubah ke: ${tid}`, 'success');
            renderProfile(container, navigate);
        });
    });

    // Dark mode toggle handler
    container.querySelector('#toggle-dark-mode')?.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        applyTheme(state.theme, isDark);
        showToast(`Mode gelap ${isDark ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
    });
}

// --- 8. RIWAYAT AKTIVITAS & PRESENSI ---
export async function renderHistory(container, navigate) {
    let activeTab = 'attendance'; // 'attendance' | 'tasks' | 'activity'

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    async function loadDataAndRender() {
        container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div></div>';
        try {
            const [attData, taskData, actData] = await Promise.all([
                api.getAttendanceHistory().catch(() => ({ history: [] })),
                api.getTaskHistory().catch(() => ({ tasks: [] })),
                api.getActivity().catch(() => ({ activities: [] }))
            ]);

            const attendanceList = attData?.history || [];
            const taskList = taskData?.tasks || [];
            const activityList = actData?.activities || [];

            function renderTabContent() {
                const tabContent = container.querySelector('#history-tab-content');
                if (!tabContent) return;

                if (activeTab === 'attendance') {
                    if (attendanceList.length === 0) {
                        tabContent.innerHTML = `
                            <div class="empty-state">
                                ${clockIcon('', 32)}
                                <h3>Belum Ada Riwayat Kehadiran</h3>
                                <p>Data kehadiran akan dicatat saat Anda melakukan presensi perkuliahan.</p>
                            </div>
                        `;
                    } else {
                        tabContent.innerHTML = `
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th style="width: 48px;">No</th>
                                            <th>Pertemuan</th>
                                            <th>Materi Perkuliahan</th>
                                            <th>Status</th>
                                            <th>Waktu Presensi</th>
                                            <th>Keterangan / Bukti</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${attendanceList.map((item, index) => `
                                            <tr>
                                                <td style="font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--color-text-muted);">${index + 1}</td>
                                                <td style="font-weight: 600; font-family: var(--font-mono);">P${item.meeting_number}</td>
                                                <td>${item.title || `Pertemuan ${item.meeting_number}`}</td>
                                                <td>
                                                    <span class="badge-status badge-${item.status}">
                                                        ${item.status === 'hadir' ? 'Masuk (Hadir)' : item.status}
                                                    </span>
                                                </td>
                                                <td style="font-size: 0.813rem; color: var(--color-text-secondary); font-family: var(--font-mono);">
                                                    ${formatDateTime(item.timestamp)}
                                                </td>
                                                <td>
                                                    ${item.note ? `<div style="font-size: 0.813rem; margin-bottom: 4px;">${item.note}</div>` : ''}
                                                    ${item.evidence_image ? `
                                                        <a href="${API_URL}${item.evidence_image}" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; text-decoration: underline;">
                                                            Lihat Bukti Foto
                                                        </a>
                                                    ` : ''}
                                                    ${!item.note && !item.evidence_image ? '<span style="color: var(--color-text-muted);">-</span>' : ''}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                } else if (activeTab === 'tasks') {
                    if (taskList.length === 0) {
                        tabContent.innerHTML = `
                            <div class="empty-state">
                                ${fileTextIcon('', 32)}
                                <h3>Belum Ada Tugas Dikumpulkan</h3>
                                <p>Tugas yang Anda kumpulkan akan muncul dalam daftar riwayat ini.</p>
                            </div>
                        `;
                    } else {
                        tabContent.innerHTML = `
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th style="width: 48px;">No</th>
                                            <th>Judul Tugas</th>
                                            <th>Keterangan</th>
                                            <th>Nama Berkas</th>
                                            <th>Ukuran</th>
                                            <th>Tanggal Pengumpulan</th>
                                            <th>Waktu Masuk</th>
                                            <th style="text-align: center; width: 80px;">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${taskList.map((t, index) => `
                                            <tr>
                                                <td style="font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--color-text-muted);">${index + 1}</td>
                                                <td style="font-weight: 600;">${t.task_title || 'Tugas Statistika'}</td>
                                                <td style="font-size: 0.813rem; color: var(--color-text-secondary);">${t.description || '-'}</td>
                                                <td style="font-family: var(--font-mono); fontSize: 0.813rem;">${t.file_name}</td>
                                                <td style="font-family: var(--font-mono); fontSize: 0.813rem;">${formatBytes(t.file_size)}</td>
                                                <td style="font-family: var(--font-mono); fontSize: 0.813rem;">${t.submitted_date}</td>
                                                <td style="font-size: 0.813rem; color: var(--color-text-muted); font-family: var(--font-mono);">${formatDateTime(t.submitted_at)}</td>
                                                <td style="text-align: center;">
                                                    <button type="button" class="btn btn-ghost btn-sm btn-delete-task" data-id="${t.id}" data-title="${t.task_title || t.file_name}" style="color: var(--color-danger); padding: 4px 8px; font-size: 0.75rem;" title="Hapus berkas tugas ini">
                                                        ${trashIcon('', 14)} Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;

                        tabContent.querySelectorAll('.btn-delete-task').forEach(btn => {
                            btn.addEventListener('click', async () => {
                                const id = btn.getAttribute('data-id');
                                const title = btn.getAttribute('data-title');
                                if (!window.confirm(`Hapus berkas tugas "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
                                try {
                                    await api.deleteTask(id);
                                    showToast('Berkas tugas berhasil dihapus.', 'success');
                                    loadDataAndRender();
                                } catch (e) {
                                    showToast(e.message || 'Gagal menghapus berkas tugas.', 'error');
                                }
                            });
                        });
                    }
                } else {
                    if (activityList.length === 0) {
                        tabContent.innerHTML = `
                            <div class="empty-state">
                                ${historyIcon('', 32)}
                                <h3>Belum Ada Catatan Aktivitas</h3>
                                <p>Setiap tindakan seperti login, presensi, dan upload akan terekam di sini.</p>
                            </div>
                        `;
                    } else {
                        tabContent.innerHTML = `
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th style="width: 48px;">No</th>
                                            <th>Waktu</th>
                                            <th>Jenis Aksi</th>
                                            <th>Deskripsi Aktivitas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${activityList.map((act, index) => `
                                            <tr>
                                                <td style="font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--color-text-muted);">${index + 1}</td>
                                                <td style="font-size: 0.813rem; color: var(--color-text-muted); white-space: nowrap; font-family: var(--font-mono);">${formatDateTime(act.created_at)}</td>
                                                <td><span class="badge-status badge-hadir">${act.action}</span></td>
                                                <td>${act.description}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                }
            }

            container.innerHTML = `
                <div>
                    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <h1 class="page-title">Riwayat Aktivitas</h1>
                            <p class="page-subtitle">Pencatatan rekam jejak presensi, tugas, dan aktivitas akun Anda</p>
                        </div>
                        <button type="button" class="btn btn-ghost btn-sm" id="btn-refresh-history">
                            ${refreshIcon('', 16)} Segarkan Data
                        </button>
                    </div>

                    <div class="tabs">
                        <button type="button" class="tab ${activeTab === 'attendance' ? 'active' : ''}" data-tab="attendance">
                            Riwayat Kehadiran (${attendanceList.length})
                        </button>
                        <button type="button" class="tab ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
                            Riwayat Tugas (${taskList.length})
                        </button>
                        <button type="button" class="tab ${activeTab === 'activity' ? 'active' : ''}" data-tab="activity">
                            Log Aktivitas (${activityList.length})
                        </button>
                    </div>

                    <div class="card" id="history-tab-content"></div>
                </div>
            `;

            renderTabContent();

            container.querySelector('#btn-refresh-history')?.addEventListener('click', loadDataAndRender);

            container.querySelectorAll('.tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    activeTab = btn.getAttribute('data-tab');
                    container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
                    renderTabContent();
                });
            });

        } catch (err) {
            container.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--color-danger);">Gagal memuat riwayat: ${err.message}</div>`;
        }
    }

    loadDataAndRender();
}
