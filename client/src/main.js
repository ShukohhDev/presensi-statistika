/**
 * =============================================================================
 * main.js - Titik Masuk Utama & Router Single Page App (Vanilla JavaScript)
 * =============================================================================
 * 100% Vanilla JavaScript, HTML5 & Tailwind CSS.
 * ZERO React, ZERO TypeScript.
 * =============================================================================
 */

import './index.css';
import './App.css';
import { getState, initAuthFromStorage, subscribeState } from './state.js';
import { renderLayout } from './components/layout.js';
import { renderSidebar } from './components/sidebar.js';
import { renderNotifications } from './components/notifications.js';
import { renderLoginPage } from './pages/login.js';
import { renderAttendancePage } from './pages/attendance.js';
import { renderAdminPage } from './pages/admin.js';
import { renderRecapPage } from './pages/recap.js';
import { renderHistoryPage } from './pages/history.js';
import { renderMaterialsPage } from './pages/materials.js';
import { renderTasksPage } from './pages/tasks.js';
import { renderCalendarPage } from './pages/calendar.js';
import { renderReportsPage } from './pages/reports.js';
import { renderProfilePage } from './pages/profile.js';

const rootElement = document.getElementById('root');
let currentLayoutRenderedForRole = null;
let currentPageContentContainer = null;

/**
 * Normalisasi path rute saat ini dari URL (mendukung baik URL biasa / maupun Hash #/)
 */
export function getCurrentRoute() {
    // Cek Hash terlebih dahulu jika ada
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (hash) {
        return hash.split('?')[0].split('/')[0].toLowerCase();
    }

    // Jika tanpa hash, ambil pathname
    const pathname = window.location.pathname.replace(/^\//, '').trim();
    if (pathname && pathname !== '200.html' && pathname !== 'index.html') {
        return pathname.split('/')[0].toLowerCase();
    }

    return '';
}

/**
 * Navigasi antar halaman (menggunakan Hash URL untuk kompatibilitas mutlak di static hosting)
 */
export function navigate(route) {
    const clean = route.replace(/^#\/?/, '').trim();
    window.location.hash = `#/${clean}`;
}

/**
 * Router Handler - Memilih tampilan yang sesuai dengan URL dan peran akun
 */
export async function handleRouting() {
    try {
        const route = getCurrentRoute();
        const state = getState();
        const user = state.user;
        const isAuthenticated = !!(user && state.token);

        // 1. Jika belum login, wajib tampilkan halaman Login
        if (!isAuthenticated) {
            currentLayoutRenderedForRole = null;
            currentPageContentContainer = null;
            renderLoginPage(rootElement, navigate);
            return;
        }

        // 2. Jika sudah login tapi rute adalah login atau kosong, arahkan ke halaman utama sesuai role
        if (!route || route === 'login') {
            navigate(user.role === 'admin' ? 'admin' : 'attendance');
            return;
        }

        // 3. Proteksi Hak Akses (RBAC)
        if (route === 'admin' && user.role !== 'admin') {
            navigate('attendance');
            return;
        }

        if (route === 'attendance' && user.role === 'admin') {
            navigate('admin');
            return;
        }

        // 4. Pastikan App Shell Layout sudah terpasang
        if (!currentPageContentContainer || currentLayoutRenderedForRole !== user.role) {
            currentPageContentContainer = renderLayout(rootElement, navigate, route);
            currentLayoutRenderedForRole = user.role;
        } else {
            // Perbarui sidebar active class
            const sideContainer = document.getElementById('sidebar-container');
            if (sideContainer) {
                renderSidebar(sideContainer, navigate, route);
            }
        }

        const pageContainer = currentPageContentContainer || document.getElementById('page-content');
        if (!pageContainer) return;

        // 5. Render Halaman
        switch (route) {
            case 'attendance':
            case 'presensi':
                await renderAttendancePage(pageContainer, navigate);
                break;

            case 'admin':
                await renderAdminPage(pageContainer, navigate);
                break;

            case 'rekap':
                await renderRecapPage(pageContainer, navigate);
                break;

            case 'history':
            case 'riwayat':
                await renderHistoryPage(pageContainer, navigate);
                break;

            case 'materials':
            case 'materi':
                await renderMaterialsPage(pageContainer, navigate);
                break;

            case 'tasks':
            case 'tugas':
                await renderTasksPage(pageContainer, navigate);
                break;

            case 'calendar':
            case 'kalender':
                await renderCalendarPage(pageContainer, navigate);
                break;

            case 'reports':
            case 'laporan':
                await renderReportsPage(pageContainer, navigate);
                break;

            case 'profile':
            case 'profil':
                await renderProfilePage(pageContainer, navigate);
                break;

            default:
                pageContainer.innerHTML = `
                    <div class="card" style="text-align: center; padding: 48px 24px; max-width: 500px; margin: 40px auto; border-radius: 10px;">
                        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin-bottom: 8px;">404 - Halaman Tidak Ditemukan</h2>
                        <p style="color: var(--color-text-secondary); margin-bottom: 24px;">Halaman yang Anda tuju (${route}) tidak tersedia atau telah dipindahkan.</p>
                        <button type="button" class="btn btn-primary" id="btn-err-home" style="margin: 0 auto; padding: 10px 20px; border-radius: 6px; border: none; background: var(--color-primary); color: #fff; font-weight: 600; cursor: pointer;">
                            Kembali ke Halaman Utama
                        </button>
                    </div>
                `;
                pageContainer.querySelector('#btn-err-home')?.addEventListener('click', () => {
                    navigate(user.role === 'admin' ? 'admin' : 'attendance');
                });
                break;
        }

        // Gulir ke atas saat ganti halaman
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error('Fatal routing error:', err);
        if (rootElement) {
            rootElement.innerHTML = `
                <div style="padding: 40px 20px; max-width: 600px; margin: 60px auto; background: #fff; border-radius: 12px; border: 1px solid #fecaca; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 12px;">⚠️</div>
                    <h2 style="color: #b91c1c; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Terjadi Kesalahan Sistem</h2>
                    <p style="color: #4b5563; font-size: 0.875rem; margin-bottom: 20px;">${err.message || 'Gagal memproses tampilan.'}</p>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; border-radius: 6px; border: none; background: #107C41; color: #fff; font-weight: 600; cursor: pointer;">
                        Muat Ulang Halaman
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Inisialisasi Aplikasi Saat DOM Selesai Dimuat
 */
function init() {
    initAuthFromStorage();

    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);

    subscribeState((state, changedKey) => {
        if (changedKey === 'auth') {
            handleRouting();
        } else if (changedKey === 'sidebar') {
            const sideContainer = document.getElementById('sidebar-container');
            if (sideContainer) {
                renderSidebar(sideContainer, navigate, getCurrentRoute());
            }
        } else if (changedKey === 'notificationsPanel') {
            const notifContainer = document.getElementById('notifications-container');
            if (notifContainer) {
                renderNotifications(notifContainer);
            }
        }
    });

    handleRouting();
}

init();
