/**
 * =============================================================================
 * tasks.js - Tugas Perkuliahan Statistika (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';
import { showToast } from '../toast.js';

export async function renderTasksPage(container, navigate) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                    Tugas & Latihan Terstruktur
                </h1>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                    Daftar penugasan mandiri dan kelompok mata kuliah Statistika Kelas TI25C.
                </p>
            </div>

            <div id="tasks-container">
                <div class="card" style="padding: 24px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: var(--color-text-secondary);">Memuat daftar tugas...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const taskData = await api.getTasks().catch(() => ({ tasks: [] }));
        const list = taskData?.tasks || [];
        const box = container.querySelector('#tasks-container');

        if (list.length === 0) {
            box.innerHTML = `
                <div class="card" style="padding: 36px 20px; text-align: center; border-radius: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border);">
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px;">Tidak Ada Tugas Aktif</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-secondary);">Saat ini belum ada tugas yang dibagikan oleh dosen.</div>
                </div>
            `;
            return;
        }

        box.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${list.map(t => {
                    const deadline = t.due_date ? new Date(t.due_date) : null;
                    const isPassed = deadline && deadline.getTime() < Date.now();
                    return `
                        <div class="card" style="
                            padding: 18px 20px;
                            border-radius: 8px;
                            background: var(--color-bg-card, #ffffff);
                            border: 1px solid var(--color-border, #edebe9);
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            flex-wrap: wrap;
                            gap: 12px;
                        ">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e0e7ff; color: #4338ca;">
                                        Tugas ${t.id}
                                    </span>
                                    <span style="font-size: 0.75rem; color: ${isPassed ? '#dc2626' : 'var(--color-text-secondary)'};">
                                        Batas Waktu: ${deadline ? deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tidak ada batas'}
                                    </span>
                                </div>
                                <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0 0 6px;">
                                    ${t.title}
                                </h3>
                                <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">
                                    ${t.description || 'Instruksi tugas perkuliahan.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                class="btn-submit-task"
                                data-id="${t.id}"
                                style="
                                    padding: 8px 14px;
                                    border-radius: 6px;
                                    border: none;
                                    background: var(--color-primary, #107C41);
                                    color: #ffffff;
                                    font-size: 0.8rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                "
                            >
                                Kumpulkan Tugas
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        box.querySelectorAll('.btn-submit-task').forEach(btn => {
            btn.addEventListener('click', () => {
                showToast('Fitur upload berkas tugas sedang aktif untuk sesi ini.', 'info');
            });
        });

    } catch (e) {
        container.querySelector('#tasks-container').innerHTML = `
            <div style="color: #dc2626; font-size: 0.85rem; padding: 20px;">Gagal memuat tugas: ${e.message}</div>
        `;
    }
}
