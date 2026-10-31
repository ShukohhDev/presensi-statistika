/**
 * =============================================================================
 * navbar.js - Top Navigation Bar (Vanilla JavaScript)
 * =============================================================================
 */

import { getState, toggleDarkMode, toggleNotificationsPanel, toggleSidebar, clearAuth } from '../state.js';
import { getIcon } from '../icons.js';
import siteLogo from '../assets/logo-ketelitian.jpg';

export function renderNavbar(container, navigate) {
    const state = getState();
    const user = state.user || {};
    const unread = state.unreadNotifCount || 0;
    const isDark = state.darkMode;

    container.innerHTML = `
        <header class="fluent-navbar" style="
            position: sticky;
            top: 0;
            z-index: 100;
            height: 60px;
            background: var(--color-bg-card, #ffffff);
            border-bottom: 1px solid var(--color-border, #edebe9);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            box-shadow: var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05));
        ">
            <!-- Left: Mobile Menu Toggle & Brand -->
            <div style="display: flex; align-items: center; gap: 12px;">
                <button
                    type="button"
                    id="nav-mobile-toggle"
                    class="btn-icon"
                    style="display: none; padding: 8px; border-radius: 6px; border: none; background: transparent; cursor: pointer; color: var(--color-text);"
                    title="Menu Navigasi"
                >
                    ${getIcon('menu', 'w-5 h-5')}
                </button>

                <a href="#/attendance" id="brand-link" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit;">
                    <img src="${siteLogo}" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" />
                    <div style="line-height: 1.2;">
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text); letter-spacing: -0.01em;">
                            Presensi Statistika
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px;">
                            <span>TI25C</span>
                            <span style="opacity: 0.4;">•</span>
                            <span style="color: var(--color-primary); font-weight: 500;">Ketelitian</span>
                        </div>
                    </div>
                </a>
            </div>

            <!-- Right: Actions & User Menu -->
            <div style="display: flex; align-items: center; gap: 8px;">
                <!-- Theme Toggle -->
                <button
                    type="button"
                    id="theme-toggle-btn"
                    class="btn-icon"
                    style="padding: 8px; border-radius: 6px; border: 1px solid var(--color-border, #edebe9); background: var(--color-bg, #f3f2f1); cursor: pointer; color: var(--color-text); display: flex; align-items: center; justify-content: center;"
                    title="${isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}"
                >
                    ${isDark ? getIcon('sun', 'w-4 h-4 text-amber-400') : getIcon('moon', 'w-4 h-4 text-slate-700')}
                </button>

                <!-- Notifications Bell -->
                <button
                    type="button"
                    id="notif-toggle-btn"
                    class="btn-icon"
                    style="position: relative; padding: 8px; border-radius: 6px; border: 1px solid var(--color-border, #edebe9); background: var(--color-bg, #f3f2f1); cursor: pointer; color: var(--color-text); display: flex; align-items: center; justify-content: center;"
                    title="Notifikasi"
                >
                    ${getIcon('bell', 'w-4 h-4')}
                    ${unread > 0 ? `
                        <span style="
                            position: absolute;
                            top: -4px;
                            right: -4px;
                            background: #d13438;
                            color: #ffffff;
                            font-size: 0.65rem;
                            font-weight: 700;
                            border-radius: 9999px;
                            padding: 1px 5px;
                            min-width: 16px;
                            text-align: center;
                            line-height: 1.2;
                            border: 2px solid var(--color-bg-card, #ffffff);
                        ">${unread > 99 ? '99+' : unread}</span>
                    ` : ''}
                </button>

                <!-- User Info & Logout -->
                <div style="display: flex; align-items: center; gap: 8px; margin-left: 6px; padding-left: 8px; border-left: 1px solid var(--color-border, #edebe9);">
                    <div style="text-align: right; line-height: 1.2; display: none;" class="desktop-user-info">
                        <div style="font-size: 0.825rem; font-weight: 600; color: var(--color-text); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${user.name || 'Pengguna'}
                        </div>
                        <div style="font-size: 0.7rem; color: var(--color-text-secondary); text-transform: uppercase;">
                            ${user.role === 'admin' ? 'PJ MK' : 'Mahasiswa'}
                        </div>
                    </div>

                    <button
                        type="button"
                        id="logout-btn"
                        class="btn-icon"
                        style="padding: 8px; border-radius: 6px; border: 1px solid #fecaca; background: #fff1f2; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                        title="Keluar dari Akun"
                    >
                        ${getIcon('logout', 'w-4 h-4')}
                    </button>
                </div>
            </div>
        </header>
    `;

    // Event Listeners
    container.querySelector('#theme-toggle-btn')?.addEventListener('click', () => {
        toggleDarkMode();
    });

    container.querySelector('#notif-toggle-btn')?.addEventListener('click', () => {
        toggleNotificationsPanel();
    });

    container.querySelector('#nav-mobile-toggle')?.addEventListener('click', () => {
        toggleSidebar();
    });

    container.querySelector('#logout-btn')?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
            clearAuth();
            navigate('login');
        }
    });

    container.querySelector('#brand-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(user.role === 'admin' ? 'admin' : 'attendance');
    });

    // Responsive styles check
    if (window.innerWidth <= 768) {
        const toggle = container.querySelector('#nav-mobile-toggle');
        if (toggle) toggle.style.display = 'flex';
    } else {
        const userInfo = container.querySelector('.desktop-user-info');
        if (userInfo) userInfo.style.display = 'block';
    }
}
