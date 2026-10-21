import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getStoredToken, clearStoredAuth } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getStoredToken();
        const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                api.getMe().then(data => {
                    setUser(data.user);
                    setSettings(data.settings);
                    if (localStorage.getItem('token')) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    } else {
                        sessionStorage.setItem('user', JSON.stringify(data.user));
                    }
                }).catch(() => {
                    clearStoredAuth();
                    setUser(null);
                });
            } catch {
                clearStoredAuth();
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (name, password, rememberMe = false) => {
        const data = await api.login(name, password);
        
        // Bersihkan sesi lama terlebih dahulu
        clearStoredAuth();

        if (rememberMe) {
            // Jika memilih Ingat Saya: simpan permanen di localStorage (tetap login antar tab/restart)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        } else {
            // DEFAULT (Paling Aman untuk perangkat bersama/pinjam):
            // Sesi hanya aktif di tab ini (sessionStorage). Buka tab baru atau tutup tab = minta login ulang!
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        
        setUser(data.user);

        // Load settings
        try {
            const meData = await api.getMe();
            setSettings(meData.settings);
        } catch {
            // Settings will load on next refresh
        }

        return data.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch {
            // Continue logout even if API fails
        }
        clearStoredAuth();
        setUser(null);
        setSettings(null);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        if (localStorage.getItem('token')) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
    }, []);

    const updateSettings = useCallback((newSettings) => {
        setSettings(newSettings);
    }, []);

    const value = {
        user,
        settings,
        loading,
        login,
        logout,
        updateUser,
        updateSettings,
        isAdmin: user?.role === 'admin',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
