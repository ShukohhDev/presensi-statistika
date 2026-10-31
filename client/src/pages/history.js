/**
 * =============================================================================
 * history.js - Riwayat Kehadiran Mahasiswa (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';

export async function renderHistoryPage(container, navigate) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                    Riwayat Kehadiran Saya
                </h1>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                    Catatan lengkap waktu presensi dan status kehadiran perkuliahan Anda.
                </p>
            </div>

            <div id="history-container">
                <div class="card" style="padding: 24px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: var(--color-text-secondary);">Memuat riwayat kehadiran...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const historyData = await api.getAttendanceHistory().catch(() => ({ history: [] }));
        const list = historyData?.history || [];
        const box = container.querySelector('#history-container');

        if (list.length === 0) {
            box.innerHTML = `
                <div class="card" style="padding: 36px 20px; text-align: center; border-radius: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border);">
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px;">Belum Ada Riwayat Presensi</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-secondary);">Data riwayat akan tercatat setiap kali Anda mengisi presensi perkuliahan.</div>
                </div>
            `;
            return;
        }

        box.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${list.map(h => `
                    <div class="card" style="
                        padding: 16px 20px;
                        border-radius: 8px;
                        background: var(--color-bg-card, #ffffff);
                        border: 1px solid var(--color-border, #edebe9);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 12px;
                    ">
                        <div>
                            <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin-bottom: 2px;">
                                Pertemuan ${h.meeting_number || '-'} • ${h.session_title || 'Perkuliahan Statistika'}
                            </div>
                            <div style="font-size: 0.78rem; color: var(--color-text-secondary);">
                                Tanggal: ${h.date || h.created_at ? new Date(h.date || h.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                ${h.time ? `• Pukul: ${h.time}` : ''}
                            </div>
                        </div>

                        <div>
                            <span style="
                                padding: 4px 10px;
                                border-radius: 9999px;
                                font-size: 0.75rem;
                                font-weight: 700;
                                text-transform: uppercase;
                                background: ${h.status === 'hadir' ? '#dcfce7' : h.status === 'izin' ? '#eff6ff' : '#fef9c3'};
                                color: ${h.status === 'hadir' ? '#15803d' : h.status === 'izin' ? '#1d4ed8' : '#a16207'};
                            ">
                                ${h.status || 'Hadir'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        container.querySelector('#history-container').innerHTML = `
            <div style="color: #dc2626; font-size: 0.85rem; padding: 20px;">Gagal memuat riwayat: ${e.message}</div>
        `;
    }
}
