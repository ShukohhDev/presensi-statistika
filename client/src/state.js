/**
 * =============================================================================
 * state.js - Reactive Global State Store (Vanilla JavaScript)
 * =============================================================================
 */

const STATE_KEY_TOKEN = 'token';
const STATE_KEY_USER = 'user';
const STATE_KEY_THEME = 'fluent_theme';
const STATE_KEY_DARK = 'fluent_dark';

const subscribers = new Set();

const state = {
    token: null,
    user: null,
    theme: 'cobalt-slate',
    darkMode: false,
    activeSession: null,
    notifications: [],
    unreadNotifCount: 0,
    sidebarOpen: false,
    notificationsOpen: false,
};

export function subscribeState(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}

function notifySubscribers(changedKey) {
    subscribers.forEach(fn => {
        try {
            fn(state, changedKey);
        } catch (e) {
            console.error('State listener error:', e);
        }
    });
}

export function getState() {
    return state;
}

export function initAuthFromStorage() {
    const token = sessionStorage.getItem(STATE_KEY_TOKEN) || localStorage.getItem(STATE_KEY_TOKEN);
    const userStr = sessionStorage.getItem(STATE_KEY_USER) || localStorage.getItem(STATE_KEY_USER);

    if (token && userStr) {
        try {
            state.token = token;
            state.user = JSON.parse(userStr);
        } catch {
            state.token = null;
            state.user = null;
        }
    }

    // Theme initialization
    const savedDark = localStorage.getItem(STATE_KEY_DARK);
    if (savedDark !== null) {
        state.darkMode = savedDark === 'true';
    } else {
        state.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    applyThemeToDOM();
    notifySubscribers('init');
}

export function setAuth(user, token, remember = false) {
    state.user = user;
    state.token = token;

    if (remember) {
        localStorage.setItem(STATE_KEY_TOKEN, token);
        localStorage.setItem(STATE_KEY_USER, JSON.stringify(user));
        sessionStorage.removeItem(STATE_KEY_TOKEN);
        sessionStorage.removeItem(STATE_KEY_USER);
    } else {
        sessionStorage.setItem(STATE_KEY_TOKEN, token);
        sessionStorage.setItem(STATE_KEY_USER, JSON.stringify(user));
        localStorage.removeItem(STATE_KEY_TOKEN);
        localStorage.removeItem(STATE_KEY_USER);
    }

    notifySubscribers('auth');
}

export function clearAuth() {
    state.user = null;
    state.token = null;
    state.activeSession = null;
    state.notifications = [];
    state.unreadNotifCount = 0;

    sessionStorage.removeItem(STATE_KEY_TOKEN);
    sessionStorage.removeItem(STATE_KEY_USER);
    localStorage.removeItem(STATE_KEY_TOKEN);
    localStorage.removeItem(STATE_KEY_USER);

    notifySubscribers('auth');
}

export function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem(STATE_KEY_DARK, state.darkMode ? 'true' : 'false');
    applyThemeToDOM();
    notifySubscribers('theme');
}

export function applyThemeToDOM() {
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

export function setActiveSession(session) {
    state.activeSession = session;
    notifySubscribers('activeSession');
}

export function setNotifications(notifs, unreadCount) {
    state.notifications = notifs || [];
    state.unreadNotifCount = unreadCount !== undefined ? unreadCount : 0;
    notifySubscribers('notifications');
}

export function toggleSidebar(force) {
    state.sidebarOpen = typeof force === 'boolean' ? force : !state.sidebarOpen;
    notifySubscribers('sidebar');
}

export function toggleNotificationsPanel(force) {
    state.notificationsOpen = typeof force === 'boolean' ? force : !state.notificationsOpen;
    notifySubscribers('notificationsPanel');
}
