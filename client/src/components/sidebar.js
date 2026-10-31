/**
 * =============================================================================
 * sidebar.js - Side Navigation Menu (Vanilla JavaScript)
 * =============================================================================
 */

import { getState, toggleSidebar } from '../state.js';
import { getIcon } from '../icons.js';

export function renderSidebar(container, navigate, currentRoute) {
    const state = getState();
    const user = state.user || {};
    const isAdmin = user.role === 'admin';
    const isOpen = state.sidebarOpen;

    const navItems = isAdmin ? [
        { id: 'admin', label: 'Dashboard PJ MK', icon: 'dashboard', path: 'admin' },
        { id: 'rekap', label: 'Rekapitulasi', icon: 'recap', path: 'rekap' },
        { id: 'materials', label: 'Materi Kuliah', icon: 'materials', path: 'materials' },
        { id: 'tasks', label: 'Tugas Kuliah', icon: 'tasks', path: 'tasks' },
        { id: 'calendar', label: 'Kalender', icon: 'calendar', path: 'calendar' },
        { id: 'reports', label: 'Laporan Presensi', icon: 'reports', path: 'reports' },
        { id: 'profile', label: 'Profil Saya', icon: 'profile', path: 'profile' },
    ] : [
        { id: 'attendance', label: 'Presensi', icon: 'attendance', path: 'attendance' },
        { id: 'history', label: 'Riwayat Kehadiran', icon: 'history', path: 'history' },
        { id: 'rekap', label: 'Rekapitulasi', icon: 'recap', path: 'rekap' },
        { id: 'materials', label: 'Materi Kuliah', icon: 'materials', path: 'materials' },
        { id: 'tasks', label: 'Tugas Kuliah', icon: 'tasks', path: 'tasks' },
        { id: 'calendar', label: 'Kalender', icon: 'calendar', path: 'calendar' },
        { id: 'reports', label: 'Laporan Presensi', icon: 'reports', path: 'reports' },
        { id: 'profile', label: 'Profil Saya', icon: 'profile', path: 'profile' },
    ];

    container.innerHTML = `
        <div id="sidebar-backdrop" style="
            display: ${isOpen ? 'block' : 'none'};
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 150;
            backdrop-filter: blur(2px);
        "></div>

        <aside id="fluent-sidebar" style="
            width: 250px;
            background: var(--color-bg-card, #ffffff);
            border-right: 1px solid var(--color-border, #edebe9);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: calc(100vh - 60px);
            position: sticky;
            top: 60px;
            z-index: 160;
            padding: 16px 12px;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        " class="${isOpen ? 'sidebar-open' : ''}">
            <!-- Nav Links -->
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; padding: 4px 12px 8px; letter-spacing: 0.05em;">
                    Menu Utama
                </div>
                ${navItems.map(item => {
                    const isActive = currentRoute === item.path || (currentRoute === '' && (item.path === 'attendance' || item.path === 'admin'));
                    return `
                        <button
                            type="button"
                            class="nav-item-btn"
                            data-path="${item.path}"
                            style="
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                width: 100%;
                                padding: 9px 12px;
                                border-radius: 6px;
                                border: none;
                                background: ${isActive ? 'var(--color-primary-light, #e7f4eb)' : 'transparent'};
                                color: ${isActive ? 'var(--color-primary, #107C41)' : 'var(--color-text)'};
                                font-size: 0.85rem;
                                font-weight: ${isActive ? '600' : '500'};
                                text-align: left;
                                cursor: pointer;
                                transition: all 0.15s ease;
                            "
                        >
                            <span style="display: flex; align-items: center; justify-content: center; color: ${isActive ? 'var(--color-primary, #107C41)' : 'var(--color-text-secondary)'};">
                                ${getIcon(item.icon, 'w-4 h-4')}
                            </span>
                            <span style="flex: 1;">${item.label}</span>
                            ${isActive ? '<span style="width: 4px; height: 16px; background: var(--color-primary, #107C41); border-radius: 4px;"></span>' : ''}
                        </button>
                    `;
                }).join('')}
            </div>

            <!-- Footer: WhatsApp PJ MK Support -->
            <div style="border-top: 1px solid var(--color-border, #edebe9); padding-top: 12px; margin-top: 12px;">
                <a
                    href="https://wa.me/6282316188656?text=Halo%20PJ%20MK%20Statistika%20(Faqih%20Hidayatus%20Salam)%2C%20saya%20${encodeURIComponent(user.name || 'Mahasiswa')}%20ingin%20bertanya%20terkait%20presensi"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 10px;
                        border-radius: 6px;
                        background: #ecfdf5;
                        color: #047857;
                        border: 1px solid #a7f3d0;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-decoration: none;
                        transition: background 0.15s ease;
                    "
                    title="Hubungi PJ MK via WhatsApp"
                >
                    ${getIcon('whatsapp', 'w-4 h-4 text-emerald-600')}
                    <div style="line-height: 1.2;">
                        <div>Bantuan PJ MK</div>
                        <div style="font-size: 0.68rem; font-weight: 400; opacity: 0.85;">Faqih Hidayatus Salam</div>
                    </div>
                </a>
            </div>
        </aside>
    `;

    // Click handler for nav buttons
    container.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const path = btn.getAttribute('data-path');
            toggleSidebar(false);
            navigate(path);
        });
    });

    // Backdrop click
    container.querySelector('#sidebar-backdrop')?.addEventListener('click', () => {
        toggleSidebar(false);
    });
}
