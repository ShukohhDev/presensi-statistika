/**
 * =============================================================================
 * reports.js - Laporan & Analitik Kehadiran (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';

export async function renderReportsPage(container, navigate) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                    Laporan & Analitik Kehadiran
                </h1>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                    Ringkasan performa kehadiran mahasiswa kelas TI25C pada semester berjalan.
                </p>
            </div>

            <div id="reports-content-box">
                <div class="card" style="padding: 24px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: var(--color-text-secondary);">Memuat laporan kehadiran...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const stats = await api.getAdminStats().catch(() => ({ total_students: 30, present_today: 0, sick_today: 0, permit_today: 0, attendance_rate: 0 }));
        const box = container.querySelector('#reports-content-box');

        const rate = stats.attendance_rate || 0;
        const total = stats.total_students || 30;
        const present = stats.present_today || 0;
        const sick = stats.sick_today || 0;
        const permit = stats.permit_today || 0;

        box.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div class="card" style="padding: 24px; border-radius: 10px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-text); margin: 0 0 16px;">
                        Tingkat Kehadiran Kumulatif
                    </h2>
                    <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                        <div style="font-size: 3rem; font-weight: 800; color: var(--color-primary, #107C41); line-height: 1;">
                            ${rate}%
                        </div>
                        <div style="flex: 1; min-width: 240px;">
                            <div style="height: 12px; background: var(--color-bg, #f3f2f1); border-radius: 9999px; overflow: hidden; margin-bottom: 8px;">
                                <div style="height: 100%; width: ${rate}%; background: var(--color-primary, #107C41); border-radius: 9999px;"></div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
                                Standar minimal kehadiran akademik adalah 75% untuk dapat mengikuti Ujian Akhir Semester (UAS).
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
                    <div class="card" style="padding: 18px; border-radius: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border);">
                        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">Total Hadir</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #15803d; margin-top: 4px;">${present}</div>
                    </div>
                    <div class="card" style="padding: 18px; border-radius: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border);">
                        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">Total Izin</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1d4ed8; margin-top: 4px;">${permit}</div>
                    </div>
                    <div class="card" style="padding: 18px; border-radius: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border);">
                        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">Total Sakit</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #a16207; margin-top: 4px;">${sick}</div>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        container.querySelector('#reports-content-box').innerHTML = `
            <div style="color: #dc2626; font-size: 0.85rem; padding: 20px;">Gagal memuat laporan: ${e.message}</div>
        `;
    }
}
