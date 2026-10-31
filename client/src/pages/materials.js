/**
 * =============================================================================
 * materials.js - Materi Perkuliahan Statistika (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';
import { getIcon } from '../icons.js';

export async function renderMaterialsPage(container, navigate) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                    Materi Perkuliahan Statistika
                </h1>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                    Unduh modul, slide presentasi dosen, dan bahan ajar setiap pertemuan.
                </p>
            </div>

            <div id="materials-container">
                <div class="card" style="padding: 24px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: var(--color-text-secondary);">Memuat materi kuliah...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const matData = await api.getMaterials().catch(() => ({ materials: [] }));
        const list = matData?.materials || [];
        const box = container.querySelector('#materials-container');

        if (list.length === 0) {
            box.innerHTML = `
                <div class="card" style="padding: 36px 20px; text-align: center; border-radius: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border);">
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px;">Belum Ada Berkas Materi</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-secondary);">Materi perkuliahan akan diunggah oleh Dosen atau PJ MK.</div>
                </div>
            `;
            return;
        }

        box.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
                ${list.map(m => `
                    <div class="card" style="
                        padding: 18px;
                        border-radius: 8px;
                        background: var(--color-bg-card, #ffffff);
                        border: 1px solid var(--color-border, #edebe9);
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        gap: 12px;
                    ">
                        <div>
                            <span style="padding: 2px 8px; border-radius: 4px; background: #e0e7ff; color: #4338ca; font-size: 0.72rem; font-weight: 700;">
                                Pertemuan ${m.meeting_number || '1'}
                            </span>
                            <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--color-text); margin: 8px 0 4px;">
                                ${m.title || 'Materi Perkuliahan'}
                            </h3>
                            <p style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4; margin: 0;">
                                ${m.description || 'Bahan ajar perkuliahan Statistika.'}
                            </p>
                        </div>

                        ${m.file_url ? `
                            <a
                                href="${m.file_url}"
                                target="_blank"
                                class="btn"
                                style="
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 6px;
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    background: var(--color-primary, #107C41);
                                    color: #ffffff;
                                    font-size: 0.8rem;
                                    font-weight: 600;
                                    text-decoration: none;
                                "
                            >
                                ${getIcon('download', 'w-4 h-4')}
                                <span>Unduh Materi</span>
                            </a>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        container.querySelector('#materials-container').innerHTML = `
            <div style="color: #dc2626; font-size: 0.85rem; padding: 20px;">Gagal memuat materi: ${e.message}</div>
        `;
    }
}
