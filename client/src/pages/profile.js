/**
 * =============================================================================
 * profile.js - Profil Pengguna & Pengaturan Akun (Vanilla JavaScript)
 * =============================================================================
 */

import { getState, toggleDarkMode, clearAuth } from '../state.js';
import { showToast } from '../toast.js';

export function renderProfilePage(container, navigate) {
    const state = getState();
    const user = state.user || {};
    const isDark = state.darkMode;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; max-width: 720px;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                    Profil & Akun Pengguna
                </h1>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                    Informasi identitas akademik dan preferensi antarmuka sistem.
                </p>
            </div>

            <div class="card" style="padding: 24px; border-radius: 10px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border);">
                    <div style="
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        background: var(--color-primary, #107C41);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        font-weight: 700;
                    ">
                        ${(user.name || 'M')[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                            ${user.name || 'Nama Mahasiswa'}
                        </h2>
                        <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
                            Peran: <strong style="color: var(--color-primary); text-transform: uppercase;">${user.role === 'admin' ? 'PJ MK (Admin)' : 'Mahasiswa'}</strong> • Kelas TI25C
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">
                            Program Studi & Kelas
                        </label>
                        <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-text);">
                            Teknik Informatika - Kelas TI25C
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">
                            Mata Kuliah
                        </label>
                        <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-text);">
                            Statistika (Dosen Pengampu: Rifqi Hidayat)
                        </div>
                    </div>

                    <div style="padding-top: 16px; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-text);">Tema Gelap (Dark Mode)</div>
                            <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Sesuaikan tampilan dengan kenyamanan mata Anda</div>
                        </div>
                        <button
                            type="button"
                            id="profile-toggle-dark-btn"
                            style="padding: 6px 14px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg); font-size: 0.8rem; font-weight: 600; cursor: pointer; color: var(--color-text);"
                        >
                            ${isDark ? 'Mode Terang' : 'Mode Gelap'}
                        </button>
                    </div>

                    <div style="padding-top: 16px; border-top: 1px solid var(--color-border);">
                        <button
                            type="button"
                            id="profile-logout-btn"
                            style="padding: 9px 18px; border-radius: 6px; border: 1px solid #fecaca; background: #fff1f2; color: #dc2626; font-size: 0.825rem; font-weight: 600; cursor: pointer;"
                        >
                            Keluar dari Sesi Ini
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#profile-toggle-dark-btn')?.addEventListener('click', () => {
        toggleDarkMode();
        renderProfilePage(container, navigate);
    });

    container.querySelector('#profile-logout-btn')?.addEventListener('click', () => {
        if (confirm('Yakin ingin keluar?')) {
            clearAuth();
            navigate('login');
        }
    });
}
