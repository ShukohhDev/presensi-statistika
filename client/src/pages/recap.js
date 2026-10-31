/**
 * =============================================================================
 * recap.js - Rekapitulasi Presensi Perkuliahan (Vanilla JavaScript)
 * =============================================================================
 */

import { api, formatStudentName } from '../utils/api.js';
import { showToast } from '../toast.js';
import { getIcon } from '../icons.js';

export async function renderRecapPage(container, navigate) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                        Rekapitulasi Kehadiran Mahasiswa
                    </h1>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                        Matriks pencatatan presensi Pertemuan 1 s.d. 16 Kelas TI25C
                    </p>
                </div>

                <button
                    type="button"
                    id="btn-recap-export-excel"
                    class="btn"
                    style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-size: 0.825rem; font-weight: 600; cursor: pointer;"
                >
                    ${getIcon('download', 'w-4 h-4 text-emerald-700')}
                    <span>Unduh Rekap Excel</span>
                </button>
            </div>

            <div class="card" style="padding: 24px; border-radius: 10px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="margin-bottom: 16px;">
                    <input
                        type="text"
                        id="recap-search"
                        placeholder="Cari nama mahasiswa..."
                        style="max-width: 300px; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--color-border); font-size: 0.825rem;"
                    />
                </div>

                <div id="recap-table-container">
                    <div style="text-align: center; padding: 32px; color: var(--color-text-secondary);">
                        Memuat data rekapitulasi presensi...
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#btn-recap-export-excel')?.addEventListener('click', async () => {
        try {
            showToast('Menyiapkan file Excel...', 'info');
            const res = await api.exportRecapExcel();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rekap_Presensi_TI25C_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast('Rekap Excel berhasil diunduh!', 'success');
        } catch (e) {
            showToast(e.message || 'Gagal mengunduh Excel', 'error');
        }
    });

    try {
        const recapData = await api.getAttendanceRecap().catch(() => ({ recap: [] }));
        const students = recapData?.recap || [];
        renderTable(container.querySelector('#recap-table-container'), students);

        container.querySelector('#recap-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = students.filter(s => s.name.toLowerCase().includes(q));
            renderTable(container.querySelector('#recap-table-container'), filtered);
        });
    } catch (err) {
        container.querySelector('#recap-table-container').innerHTML = `
            <div style="color: #dc2626; font-size: 0.85rem; padding: 20px;">Gagal memuat rekap: ${err.message}</div>
        `;
    }
}

function renderTable(container, list) {
    if (!list || list.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--color-text-secondary);">Tidak ada data mahasiswa ditemukan.</div>`;
        return;
    }

    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary); text-transform: uppercase; font-size: 0.7rem;">
                        <th style="padding: 8px 10px; width: 40px;">No</th>
                        <th style="padding: 8px 10px; min-width: 180px;">Nama Mahasiswa</th>
                        ${Array.from({ length: 16 }, (_, i) => `<th style="padding: 8px 4px; text-align: center; width: 28px;">P${i+1}</th>`).join('')}
                        <th style="padding: 8px 10px; text-align: center; width: 70px;">%</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map((st, idx) => {
                        const sessions = st.sessions || {};
                        const percent = st.percentage !== undefined ? st.percentage : 100;
                        return `
                            <tr style="border-bottom: 1px solid var(--color-border);">
                                <td style="padding: 10px; color: var(--color-text-secondary);">${idx + 1}</td>
                                <td style="padding: 10px; font-weight: 600; color: var(--color-text);">${formatStudentName(st.name)}</td>
                                ${Array.from({ length: 16 }, (_, i) => {
                                    const val = sessions[i+1] || sessions[`p${i+1}`] || '-';
                                    const isHadir = val === 'H' || val === 'hadir';
                                    const isIzin = val === 'I' || val === 'izin';
                                    const isSakit = val === 'S' || val === 'sakit';
                                    const isAlpa = val === 'A' || val === 'alpa';
                                    return `
                                        <td style="padding: 6px 2px; text-align: center;">
                                            <span style="
                                                display: inline-block;
                                                width: 22px;
                                                height: 22px;
                                                line-height: 22px;
                                                border-radius: 4px;
                                                font-size: 0.68rem;
                                                font-weight: 700;
                                                background: ${isHadir ? '#dcfce7' : isIzin ? '#eff6ff' : isSakit ? '#fef9c3' : isAlpa ? '#fee2e2' : 'transparent'};
                                                color: ${isHadir ? '#15803d' : isIzin ? '#1d4ed8' : isSakit ? '#a16207' : isAlpa ? '#b91c1c' : 'var(--color-text-muted)'};
                                            ">
                                                ${isHadir ? 'H' : isIzin ? 'I' : isSakit ? 'S' : isAlpa ? 'A' : '·'}
                                            </span>
                                        </td>
                                    `;
                                }).join('')}
                                <td style="padding: 10px; text-align: center; font-weight: 700; color: ${percent >= 75 ? 'var(--color-primary)' : '#dc2626'};">
                                    ${percent}%
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
