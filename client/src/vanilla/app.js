/**
 * =============================================================================
 * app.js - Titik Masuk Utama & Router Aplikasi (Vanilla JavaScript)
 * =============================================================================
 * Menghubungkan URL Hash (#presensi, #admin, #rekap, dsb.) ke tampilan halaman.
 * Sepenuhnya menggunakan Vanilla JS murni, bebas dari React dan TypeScript.
 * =============================================================================
 */

import '../index.css';
import { initAuthFromStorage, getState, subscribeState } from './state.js';
import { renderAppLayout, updateActiveRoute } from './layout.js';
import { renderLogin } from './views/loginView.js';
import { renderAttendance } from './views/attendanceView.js';
import { renderAdmin } from './views/adminView.js';
import {
    renderRecap,
    renderMaterials,
    renderTasks,
    renderCalendar,
    renderReports,
    renderProfile,
    renderHistory
} from './views/otherViews.js';

const rootElement = document.getElementById('root');
let currentLayoutRendered = null; // Menyimpan status render layout agar tidak dirender ulang tanpa perlu

/**
 * Fungsi pembantu navigasi halaman berbasis URL Hash
 */
export function navigate(route) {
    window.location.hash = route.startsWith('#') ? route : `#${route}`;
}

/**
 * Menangani perubahan rute (Routing)
 */
async function handleRouting() {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const route = hash || '';
    const state = getState();
    const user = state.user;
    const token = state.token;
    const isAuthenticated = !!(user && token);

    // 1. Jika belum login dan rute bukan login, arahkan ke login
    if (!isAuthenticated) {
        if (route !== 'login') {
            navigate('login');
            return;
        }
        currentLayoutRendered = null;
        renderLogin(rootElement, navigate);
        return;
    }

    // 2. Jika sudah login tapi membuka halaman login, arahkan ke halaman utama sesuai peran
    if (route === 'login' || route === '') {
        navigate(user.role === 'admin' ? 'admin' : 'presensi');
        return;
    }

    // 3. Batasan hak akses rute (Role Protection)
    if (route === 'admin' && user.role !== 'admin') {
        navigate('presensi');
        return;
    }

    if ((route === 'presensi' || route === 'attendance' || route === 'riwayat') && user.role === 'admin') {
        navigate('admin');
        return;
    }

    // 4. Pastikan Kerangka Tata Letak Utama (Layout) sudah terpasang
    const hasLayout = !!document.getElementById('app-layout');
    if (!hasLayout || currentLayoutRendered !== user.role) {
        renderAppLayout(rootElement, navigate, route);
        currentLayoutRendered = user.role;
    } else {
        updateActiveRoute(route);
    }

    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    // 5. Muat konten halaman sesuai rute
    switch (route) {
        case 'admin':
            await renderAdmin(mainContainer, navigate);
            break;

        case 'presensi':
        case 'attendance':
            await renderAttendance(mainContainer, navigate);
            break;

        case 'rekap':
            await renderRecap(mainContainer, navigate);
            break;

        case 'tugas':
            await renderTasks(mainContainer, navigate);
            break;

        case 'riwayat':
            await renderHistory(mainContainer, navigate);
            break;

        case 'materi':
            await renderMaterials(mainContainer, navigate);
            break;

        case 'kalender':
            await renderCalendar(mainContainer, navigate);
            break;

        case 'laporan':
            await renderReports(mainContainer, navigate);
            break;

        case 'profil':
            await renderProfile(mainContainer, navigate);
            break;

        default:
            mainContainer.innerHTML = `
                <div class="card" style="text-align: center; padding: 48px 24px; max-width: 500px; margin: 40px auto;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin-bottom: 8px;">404 - Halaman Tidak Ditemukan</h2>
                    <p style="color: var(--color-text-secondary); margin-bottom: 24px;">Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.</p>
                    <button type="button" class="btn btn-primary" id="btn-back-home" style="margin: 0 auto;">
                        Kembali ke Beranda
                    </button>
                </div>
            `;
            mainContainer.querySelector('#btn-back-home')?.addEventListener('click', () => {
                navigate(user.role === 'admin' ? 'admin' : 'presensi');
            });
            break;
    }
}

/**
 * Inisialisasi awal aplikasi saat dokumen selesai dimuat
 */
function initApp() {
    // Muat sesi autentikasi dan tema dari penyimpanan lokal browser
    initAuthFromStorage();

    // Pantau perubahan URL hash
    window.addEventListener('hashchange', handleRouting);

    // Pantau perubahan state (misal login / logout)
    subscribeState(() => {
        handleRouting();
    });

    // Jalankan routing untuk rute saat pertama kali aplikasi dibuka
    handleRouting();
}

// Mulai aplikasi
initApp();
