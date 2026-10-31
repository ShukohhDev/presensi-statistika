/**
 * =============================================================================
 * layout.js - Kerangka Tata Letak Utama (Vanilla JavaScript)
 * =============================================================================
 * Mengatur Navbar Atas, Sidebar Navigasi, Panel Notifikasi, dan Logout Otomatis.
 * Dibuat tanpa React, menggunakan elemen DOM murni dan Tailwind/CSS bawaan.
 * =============================================================================
 */

import { getState, applyTheme, clearAuth } from './state.js';
import { api, API_URL } from './api.js';
import { showToast } from './toast.js';
import siteLogo from '../assets/logo-ketelitian.jpg';
import {
    sunIcon,
    moonIcon,
    bellIcon,
    xIcon,
    shieldIcon,
    checkCircleIcon,
    barChartIcon,
    uploadIcon,
    historyIcon,
    bookOpenIcon,
    calendarIcon,
    messageSquareIcon,
    whatsAppIcon,
    userIcon,
    logOutIcon,
    checkIcon
} from './icons.js';

let isSidebarOpen = false;
let isDesktopCollapsed = false;
let isNotificationsOpen = false;
let unreadNotificationsCount = 0;
let autoLogoutTimer = null;
let notificationPollInterval = null;

/**
 * Mendapatkan inisial nama mahasiswa (maksimal 2 huruf)
 */
function getInitials(name) {
    if (!name) return 'U';
    return name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Merender struktur kerangka utama ke dalam elemen root
 */
export function renderAppLayout(rootElement, navigate, currentRoute) {
    const state = getState();
    const user = state.user || {};
    const isAdmin = user.role === 'admin';
    const photoUrl = user.profile_photo ? `${API_URL}${user.profile_photo}` : null;

    rootElement.innerHTML = `
        <div class="app-layout ${isDesktopCollapsed ? 'sidebar-collapsed' : ''}" id="app-layout">
            <!-- NAVBAR ATAS -->
            <header class="navbar">
                <div class="navbar-container">
                    <a href="${isAdmin ? '#admin' : '#presensi'}" class="navbar-brand" style="text-decoration: none;" title="Presensi MK Statistika - Motto: Ketelitian">
                        <div class="navbar-logo-box">
                            <img src="${siteLogo}" alt="Logo Presensi MK Statistika - Ketelitian" class="navbar-logo-img" />
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h1 style="font-size: 0.975rem; font-weight: 700; margin: 0; letter-spacing: -0.02em; color: var(--color-text);">
                                Statistika <span style="color: var(--color-primary); font-weight: 600; font-size: 0.813rem;">TI25C</span>
                            </h1>
                            <span style="font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: var(--radius-sm); background-color: ${isAdmin ? 'var(--color-primary-light)' : 'var(--color-bg-hover)'}; color: ${isAdmin ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid var(--color-border);">
                                ${isAdmin ? 'PJ MK' : 'Mahasiswa'}
                            </span>
                        </div>
                    </a>

                    <div class="navbar-actions">
                        <!-- Tombol Tema Gelap/Terang -->
                        <button type="button" class="navbar-icon-btn" id="btn-toggle-dark" title="${state.darkMode ? 'Mode Terang' : 'Mode Gelap'}" aria-label="Ubah tema gelap terang">
                            ${state.darkMode ? sunIcon('', 20) : moonIcon('', 20)}
                        </button>

                        <!-- Tombol Buka Notifikasi -->
                        <button type="button" class="navbar-icon-btn" id="btn-toggle-notifications" title="Notifikasi" aria-label="Buka notifikasi" style="position: relative;">
                            ${bellIcon('', 20)}
                            <span class="badge" id="navbar-unread-badge" style="display: ${unreadNotificationsCount > 0 ? 'inline-flex' : 'none'};">
                                ${unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                            </span>
                        </button>

                        <!-- Tombol Hamburger Navigasi -->
                        <button type="button" class="hamburger-btn ${isSidebarOpen ? 'active' : ''}" id="btn-hamburger" aria-label="Menu navigasi">
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                        </button>
                    </div>
                </div>
            </header>

            <!-- OVERLAY SIDEBAR MOBILE -->
            <div class="sidebar-overlay ${isSidebarOpen ? 'visible' : ''}" id="sidebar-overlay" aria-hidden="true"></div>

            <!-- SIDEBAR NAVIGASI SAMPING -->
            <aside class="sidebar ${isSidebarOpen ? 'open' : ''}" id="sidebar" aria-label="Menu navigasi utama">
                <!-- Info Pengguna Login -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                        ${photoUrl ? `
                            <img src="${photoUrl}" alt="${user.name || 'User'}" class="avatar avatar-md" />
                        ` : `
                            <div class="avatar avatar-md">${getInitials(user.name)}</div>
                        `}
                        <div style="overflow: hidden;">
                            <div style="font-weight: 600; font-size: 0.938rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                                ${user.name || 'Pengguna'}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--color-text-secondary);">
                                ${isAdmin ? 'PJ MK (Admin)' : 'Mahasiswa'}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="modal-close" id="btn-close-sidebar" aria-label="Tutup navigasi">
                        ${xIcon('', 18)}
                    </button>
                </div>

                <!-- Menu Navigasi Utama -->
                <div class="sidebar-section">
                    <div class="sidebar-section-title">Menu Utama</div>

                    ${isAdmin ? `
                        <a href="#admin" class="sidebar-item ${currentRoute === 'admin' ? 'active' : ''}">
                            ${shieldIcon('', 18)}
                            <span>Dashboard Admin</span>
                        </a>
                    ` : `
                        <a href="#presensi" class="sidebar-item ${currentRoute === 'presensi' || currentRoute === 'attendance' ? 'active' : ''}">
                            ${checkCircleIcon('', 18)}
                            <span>Presensi</span>
                        </a>
                    `}

                    <a href="#rekap" class="sidebar-item ${currentRoute === 'rekap' ? 'active' : ''}">
                        ${barChartIcon('', 18)}
                        <span>Rekap Kehadiran</span>
                    </a>

                    <a href="#tugas" class="sidebar-item ${currentRoute === 'tugas' ? 'active' : ''}">
                        ${uploadIcon('', 18)}
                        <span>${isAdmin ? 'Kelola Tugas' : 'Pengumpulan Tugas'}</span>
                    </a>

                    ${!isAdmin ? `
                        <a href="#riwayat" class="sidebar-item ${currentRoute === 'riwayat' ? 'active' : ''}">
                            ${historyIcon('', 18)}
                            <span>Riwayat</span>
                        </a>
                    ` : ''}

                    <a href="#materi" class="sidebar-item ${currentRoute === 'materi' ? 'active' : ''}">
                        ${bookOpenIcon('', 18)}
                        <span>Bank Materi Kuliah</span>
                    </a>

                    <a href="#kalender" class="sidebar-item ${currentRoute === 'kalender' ? 'active' : ''}">
                        ${calendarIcon('', 18)}
                        <span>Kalender Akademik</span>
                    </a>

                    <a href="#laporan" class="sidebar-item ${currentRoute === 'laporan' ? 'active' : ''}">
                        ${messageSquareIcon('', 18)}
                        <span>Laporan & Saran</span>
                    </a>
                </div>

                <div class="sidebar-divider"></div>

                <!-- Komunitas & Kontak WhatsApp PJ MK Faqih -->
                <div class="sidebar-section">
                    <div class="sidebar-section-title">Komunitas & Akun</div>

                    <a href="https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain" target="_blank" rel="noopener noreferrer" class="sidebar-item" style="color: #25D366;">
                        ${whatsAppIcon('', 18)}
                        <span style="color: var(--color-text);">Grup WhatsApp MK</span>
                    </a>

                    <a href="https://wa.me/6282316188656?text=Halo%20PJ%20MK%20(Faqih),%20saya%20mahasiswa%20Statistika%20TI25C%20ingin%20bertanya" target="_blank" rel="noopener noreferrer" class="sidebar-item" style="color: #25D366;" title="Hubungi PJ MK Statistika: Faqih Hidayatus Salam via WhatsApp">
                        ${whatsAppIcon('', 18)}
                        <span style="color: var(--color-text);">Hubungi PJ MK (Faqih)</span>
                    </a>

                    <a href="#profil" class="sidebar-item ${currentRoute === 'profil' ? 'active' : ''}">
                        ${userIcon('', 18)}
                        <span>Profil & Pengaturan</span>
                    </a>

                    <button type="button" class="sidebar-item" id="btn-sidebar-logout" style="color: var(--color-danger); width: 100%; border: none; background: transparent; cursor: pointer; text-align: left;">
                        ${logOutIcon('', 18)}
                        <span>Keluar Akun</span>
                    </button>
                </div>

                <!-- Footer Brand Identitas -->
                <div style="margin-top: auto; padding: 12px 14px; border-radius: var(--radius-md); background-color: var(--color-bg-hover); border: 1px solid var(--color-border); display: flex; align-items: center; gap: 10px;">
                    <div style="width: 34px; height: 41px; border-radius: var(--radius-sm); overflow: hidden; background-color: #0b0f19; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <img src="${siteLogo}" alt="Logo Ketelitian" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
                    </div>
                    <div style="overflow: hidden;">
                        <div style="font-size: 0.781rem; font-weight: 700; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            Statistika TI25C
                        </div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                            Motto: Ketelitian & Presisi
                        </div>
                    </div>
                </div>
            </aside>

            <!-- PANEL NOTIFIKASI SLIDE-IN -->
            <aside class="notification-panel ${isNotificationsOpen ? 'open' : ''}" id="notifications-panel" aria-label="Panel Notifikasi">
                <div class="card-header" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${bellIcon('', 20)}
                        <h3 class="card-title" style="margin: 0;">Notifikasi</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" class="btn btn-ghost btn-sm" id="btn-mark-all-read" style="font-size: 0.75rem; padding: 4px 8px;">
                            ${checkIcon('', 14)} Tandai Dibaca
                        </button>
                        <button type="button" class="modal-close" id="btn-close-notifications" aria-label="Tutup notifikasi">
                            ${xIcon('', 18)}
                        </button>
                    </div>
                </div>
                <div id="notifications-list-container" style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="text-align: center; padding: 20px; color: var(--color-text-muted);">Memuat notifikasi...</div>
                </div>
            </aside>

            <!-- KONTEN HALAMAN UTAMA -->
            <main class="main-content content-wrapper" id="main-content"></main>
        </div>
    `;

    // Pasang Event Listeners
    setupLayoutEvents(rootElement, navigate);

    // Muat data notifikasi awal
    fetchNotifications();

    // Jalankan timer polling notifikasi tiap 30 detik
    if (!notificationPollInterval) {
        notificationPollInterval = setInterval(fetchNotifications, 30000);
    }

    // Jalankan deteksi aktivitas untuk logout otomatis (30 menit)
    setupAutoLogout(navigate);
}

/**
 * Memasang interaksi tombol Navbar, Sidebar, dan Panel Notifikasi
 */
function setupLayoutEvents(rootElement, navigate) {
    const layout = rootElement.querySelector('#app-layout');
    const sidebar = rootElement.querySelector('#sidebar');
    const sidebarOverlay = rootElement.querySelector('#sidebar-overlay');
    const notifPanel = rootElement.querySelector('#notifications-panel');
    const hamburgerBtn = rootElement.querySelector('#btn-hamburger');

    // Toggle Tema Gelap / Terang
    rootElement.querySelector('#btn-toggle-dark')?.addEventListener('click', () => {
        const state = getState();
        const nextDark = !state.darkMode;
        applyTheme(state.theme, nextDark);
        const btnDark = rootElement.querySelector('#btn-toggle-dark');
        if (btnDark) {
            btnDark.innerHTML = nextDark ? sunIcon('', 20) : moonIcon('', 20);
            btnDark.title = nextDark ? 'Mode Terang' : 'Mode Gelap';
        }
        showToast(`Mode ${nextDark ? 'gelap' : 'terang'} diaktifkan.`, 'info');
    });

    // Toggle Sidebar Navigasi
    const closeSidebar = () => {
        isSidebarOpen = false;
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('visible');
        hamburgerBtn?.classList.remove('active');
    };

    hamburgerBtn?.addEventListener('click', () => {
        if (window.innerWidth >= 1025) {
            isDesktopCollapsed = !isDesktopCollapsed;
            layout?.classList.toggle('sidebar-collapsed', isDesktopCollapsed);
        } else {
            isSidebarOpen = !isSidebarOpen;
            sidebar?.classList.toggle('open', isSidebarOpen);
            sidebarOverlay?.classList.toggle('visible', isSidebarOpen);
            hamburgerBtn?.classList.toggle('active', isSidebarOpen);
        }
        if (isNotificationsOpen) {
            isNotificationsOpen = false;
            notifPanel?.classList.remove('open');
        }
    });

    sidebarOverlay?.addEventListener('click', closeSidebar);
    rootElement.querySelector('#btn-close-sidebar')?.addEventListener('click', closeSidebar);

    // Tutup sidebar saat item navigasi diklik pada layar mobile
    sidebar?.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1025) {
                closeSidebar();
            }
        });
    });

    // Toggle Panel Notifikasi
    rootElement.querySelector('#btn-toggle-notifications')?.addEventListener('click', () => {
        isNotificationsOpen = !isNotificationsOpen;
        notifPanel?.classList.toggle('open', isNotificationsOpen);
        if (isSidebarOpen) closeSidebar();
        if (isNotificationsOpen) fetchNotifications();
    });

    rootElement.querySelector('#btn-close-notifications')?.addEventListener('click', () => {
        isNotificationsOpen = false;
        notifPanel?.classList.remove('open');
    });

    // Tandai Semua Notifikasi Dibaca
    rootElement.querySelector('#btn-mark-all-read')?.addEventListener('click', async () => {
        try {
            await api.markAllNotificationsRead();
            unreadNotificationsCount = 0;
            updateUnreadBadge();
            fetchNotifications();
            showToast('Semua notifikasi telah ditandai dibaca.', 'success');
        } catch (e) {
            showToast('Gagal memperbarui notifikasi.', 'error');
        }
    });

    // Logout via Sidebar
    rootElement.querySelector('#btn-sidebar-logout')?.addEventListener('click', () => {
        clearAuth();
        showToast('Anda telah keluar akun.', 'info');
        navigate('login');
    });
}

/**
 * Mengambil daftar notifikasi dari backend
 */
async function fetchNotifications() {
    try {
        const data = await api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 }));
        const notifs = data?.notifications || [];
        unreadNotificationsCount = data?.unreadCount || 0;
        updateUnreadBadge();

        const container = document.getElementById('notifications-list-container');
        if (!container) return;

        if (notifs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Tidak ada notifikasi baru.</div>';
            return;
        }

        container.innerHTML = notifs.map(n => `
            <div class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background-color: ${n.is_read ? 'transparent' : 'var(--color-bg-hover)'}; cursor: pointer;">
                <div style="font-weight: 600; font-size: 0.875rem; color: var(--color-text);">${n.title || 'Pemberitahuan'}</div>
                <div style="font-size: 0.813rem; color: var(--color-text-secondary); margin-top: 2px;">${n.message || ''}</div>
                <div style="font-size: 0.719rem; color: var(--color-text-muted); margin-top: 4px;">${n.created_at ? new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </div>
        `).join('');

        // Klik salah satu notifikasi untuk tandai dibaca
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.getAttribute('data-id');
                try {
                    await api.markNotificationRead(id);
                    item.classList.remove('unread');
                    item.style.backgroundColor = 'transparent';
                    if (unreadNotificationsCount > 0) {
                        unreadNotificationsCount--;
                        updateUnreadBadge();
                    }
                } catch (e) {
                    // Abaikan jika sudah dibaca
                }
            });
        });
    } catch (e) {
        // Mode offline/silent fail
    }
}

/**
 * Memperbarui angka lencana notifikasi di navbar
 */
function updateUnreadBadge() {
    const badge = document.getElementById('navbar-unread-badge');
    if (!badge) return;
    if (unreadNotificationsCount > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount;
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Menghitung waktu inaktivitas untuk logout otomatis setelah 30 menit
 */
function setupAutoLogout(navigate) {
    if (autoLogoutTimer) clearTimeout(autoLogoutTimer);

    const resetTimer = () => {
        if (autoLogoutTimer) clearTimeout(autoLogoutTimer);
        const state = getState();
        if (!state.token) return;

        autoLogoutTimer = setTimeout(() => {
            showToast('Sesi Anda berakhir karena tidak ada aktivitas selama 30 menit.', 'info');
            clearAuth();
            navigate('login');
        }, 30 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();
}
