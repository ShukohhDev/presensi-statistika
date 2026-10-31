/**
 * =============================================================================
 * layout.js - Main Application Layout Shell (Vanilla JavaScript)
 * =============================================================================
 */

import { renderNavbar } from './navbar.js';
import { renderSidebar } from './sidebar.js';
import { renderNotifications } from './notifications.js';

export function renderLayout(rootElement, navigate, currentRoute) {
    rootElement.innerHTML = `
        <div id="app-shell" style="min-height: 100vh; display: flex; flex-direction: column; background: var(--color-bg, #f3f2f1);">
            <div id="navbar-container"></div>
            
            <div style="display: flex; flex: 1; position: relative;">
                <div id="sidebar-container"></div>
                <main id="main-content" style="flex: 1; min-width: 0; padding: 20px 24px 60px; max-width: 1400px; margin: 0 auto; width: 100%;">
                    <div id="page-content"></div>
                </main>
            </div>

            <div id="notifications-container"></div>
        </div>
    `;

    const navContainer = rootElement.querySelector('#navbar-container');
    const sideContainer = rootElement.querySelector('#sidebar-container');
    const notifContainer = rootElement.querySelector('#notifications-container');

    renderNavbar(navContainer, navigate);
    renderSidebar(sideContainer, navigate, currentRoute);
    renderNotifications(notifContainer);

    return rootElement.querySelector('#page-content');
}
