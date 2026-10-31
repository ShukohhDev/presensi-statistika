/**
 * =============================================================================
 * state.js - Manajemen Data Global Sederhana (Vanilla JavaScript)
 * =============================================================================
 * Menyimpan data pengguna yang sedang login, sesi presensi aktif, dan tema.
 * Dibuat sederhana tanpa Redux / Zustand / React Context agar ramah pemula.
 * =============================================================================
 */

// Objek penyimpan data aplikasi
const appState = {
    user: null,
    token: null,
    activeSession: null,
    theme: 'cobalt-slate',
    darkMode: false,
    currentTab: 'attendance', // Tab default halaman
};

// Daftar fungsi pendengar perubahan data (listeners)
const listeners = [];

/**
 * Mengambil token dan user yang tersimpan di browser (LocalStorage / SessionStorage)
 */
export function initAuthFromStorage() {
    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (token && userStr) {
            appState.token = token;
            appState.user = JSON.parse(userStr);
        } else {
            appState.token = null;
            appState.user = null;
        }

        // Muat preferensi tema
        const savedTheme = localStorage.getItem('theme') || 'cobalt-slate';
        const savedDark = localStorage.getItem('darkMode') === 'true';
        appState.theme = savedTheme;
        appState.darkMode = savedDark;

        applyTheme(savedTheme, savedDark);
    } catch (e) {
        console.warn('Gagal membaca sesi penyimpanan:', e);
    }
}

/**
 * Menyimpan data login pengguna
 */
export function setAuth(user, token, rememberMe = true) {
    appState.user = user;
    appState.token = token;

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));

    notifyStateChange();
}

/**
 * Menghapus data login (Logout)
 */
export function clearAuth() {
    appState.user = null;
    appState.token = null;
    appState.activeSession = null;

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    notifyStateChange();
}

/**
 * Menerapkan tema warna dan mode gelap ke elemen HTML
 */
export function applyTheme(themeName, isDark) {
    appState.theme = themeName;
    appState.darkMode = isDark;

    document.documentElement.setAttribute('data-theme', themeName);
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', themeName);
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

/**
 * Mendapatkan salinan data state saat ini
 */
export function getState() {
    return { ...appState };
}

/**
 * Memperbarui sesi presensi aktif
 */
export function setActiveSession(session) {
    appState.activeSession = session;
    notifyStateChange();
}

/**
 * Mendaftarkan fungsi untuk dipanggil saat ada perubahan state
 */
export function subscribeState(callback) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index !== -1) listeners.splice(index, 1);
    };
}

/**
 * Memberitahu semua bagian aplikasi bahwa data telah berubah
 */
function notifyStateChange() {
    for (const listener of listeners) {
        try {
            listener(appState);
        } catch (e) {
            console.error('Error in state subscriber:', e);
        }
    }
}
