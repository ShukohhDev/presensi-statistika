/**
 * =============================================================================
 * notifications.js - Slide-out Notifications Drawer (Vanilla JavaScript)
 * =============================================================================
 */

import { getState, toggleNotificationsPanel } from '../state.js';
import { api } from '../utils/api.js';
import { getIcon } from '../icons.js';
import { showToast } from '../toast.js';

export function renderNotifications(container) {
    const state = getState();
    const isOpen = state.notificationsOpen;
    const notifs = state.notifications || [];
    const unreadCount = state.unreadNotifCount || 0;

    container.innerHTML = `
        <div id="notif-backdrop" style="
            display: ${isOpen ? 'block' : 'none'};
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 200;
            backdrop-filter: blur(2px);
        "></div>

        <div id="notif-panel" style="
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 380px;
            max-width: 100vw;
            background: var(--color-bg-card, #ffffff);
            border-left: 1px solid var(--color-border, #edebe9);
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
            z-index: 210;
            display: flex;
            flex-direction: column;
            transform: translateX(${isOpen ? '0' : '100%'});
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        ">
            <!-- Header -->
            <div style="
                padding: 16px;
                border-bottom: 1px solid var(--color-border, #edebe9);
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700; font-size: 1rem; color: var(--color-text);">Pemberitahuan</span>
                    ${unreadCount > 0 ? `
                        <span style="background: #fee2e2; color: #dc2626; font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 9999px;">
                            ${unreadCount} Baru
                        </span>
                    ` : ''}
                </div>

                <div style="display: flex; align-items: center; gap: 6px;">
                    ${unreadCount > 0 ? `
                        <button type="button" id="btn-read-all" style="background: none; border: none; color: var(--color-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; padding: 4px 6px;">
                            Tandai Dibaca
                        </button>
                    ` : ''}
                    <button type="button" id="btn-close-notif" style="background: none; border: none; color: var(--color-text-secondary); cursor: pointer; padding: 6px; border-radius: 6px;" title="Tutup">
                        ${getIcon('x', 'w-5 h-5')}
                    </button>
                </div>
            </div>

            <!-- List -->
            <div style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                ${notifs.length === 0 ? `
                    <div style="text-align: center; padding: 48px 16px; color: var(--color-text-secondary);">
                        <div style="margin-bottom: 8px; opacity: 0.5;">
                            ${getIcon('bell', 'w-8 h-8 mx-auto')}
                        </div>
                        <div style="font-size: 0.875rem; font-weight: 500;">Tidak ada pemberitahuan baru</div>
                        <div style="font-size: 0.75rem; margin-top: 4px;">Pemberitahuan kuliah atau presensi akan muncul di sini.</div>
                    </div>
                ` : notifs.map(n => `
                    <div class="card" style="padding: 12px; border-radius: 8px; border: 1px solid ${n.is_read ? 'var(--color-border)' : 'var(--color-primary)'}; background: ${n.is_read ? 'transparent' : 'rgba(16, 124, 65, 0.04)'};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px;">
                            <span style="font-weight: 600; font-size: 0.85rem; color: var(--color-text);">${n.title}</span>
                            <span style="font-size: 0.7rem; color: var(--color-text-secondary);">${new Date(n.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style="font-size: 0.8rem; color: var(--color-text-secondary); line-height: 1.4; margin: 0;">${n.message}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelector('#btn-close-notif')?.addEventListener('click', () => {
        toggleNotificationsPanel(false);
    });

    container.querySelector('#notif-backdrop')?.addEventListener('click', () => {
        toggleNotificationsPanel(false);
    });

    container.querySelector('#btn-read-all')?.addEventListener('click', async () => {
        try {
            await api.markAllNotificationsRead();
            showToast('Semua notifikasi telah ditandai sebagai dibaca', 'success');
            toggleNotificationsPanel(false);
        } catch {
            showToast('Gagal menandai notifikasi', 'error');
        }
    });
}
