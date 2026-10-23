import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const ThemeContext = createContext(null);

export const THEMES = [
    { id: 'cobalt-slate', name: 'Cobalt & Modern Slate', swatch: '#2563EB' },
    { id: 'ocean', name: 'Power BI Teal', swatch: '#038387' },
    { id: 'midnight', name: 'Academic Navy', swatch: '#004E8C' },
    { id: 'biru-klasik', name: 'Microsoft Blue', swatch: '#0078D4' },
    { id: 'excel-statistika', name: 'Excel & Data Green', swatch: '#107C41' },
    { id: 'slate', name: 'Slate Steel', swatch: '#2B5B84' },
    { id: 'arctic', name: 'Cyan Analytics', swatch: '#0099BC' },
    { id: 'steel', name: 'Graphite Neutral', swatch: '#5C6B73' },
];

export function ThemeProvider({ children }) {
    const { settings, updateSettings } = useAuth();
    const [theme, setThemeState] = useState('cobalt-slate');
    const [darkMode, setDarkModeState] = useState(false);

    // Load from settings or localStorage (migrate old default theme to cobalt-slate)
    useEffect(() => {
        let activeTheme = 'cobalt-slate';
        if (settings) {
            activeTheme = settings.theme || 'cobalt-slate';
            if (activeTheme === 'biru-klasik' || activeTheme === 'excel-statistika') {
                activeTheme = 'cobalt-slate';
                localStorage.setItem('theme', 'cobalt-slate');
            }
            setThemeState(activeTheme);
            setDarkModeState(settings.dark_mode === 1);
        } else {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme && savedTheme !== 'biru-klasik' && savedTheme !== 'excel-statistika') {
                activeTheme = savedTheme;
            } else {
                localStorage.setItem('theme', 'cobalt-slate');
            }
            const savedDark = localStorage.getItem('darkMode') === 'true';
            setThemeState(activeTheme);
            setDarkModeState(savedDark);
        }
    }, [settings]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme, darkMode]);

    const setTheme = useCallback(async (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        try {
            await api.updateSettings({ theme: newTheme });
            if (updateSettings) {
                updateSettings(prev => ({ ...prev, theme: newTheme }));
            }
        } catch {
            // Silently fail for logged-out users
        }
    }, [updateSettings]);

    const toggleDarkMode = useCallback(async () => {
        const newDarkMode = !darkMode;
        setDarkModeState(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
        try {
            await api.updateSettings({ dark_mode: newDarkMode ? 1 : 0 });
            if (updateSettings) {
                updateSettings(prev => ({ ...prev, dark_mode: newDarkMode ? 1 : 0 }));
            }
        } catch {
            // Silently fail for logged-out users
        }
    }, [darkMode, updateSettings]);

    const value = {
        theme,
        setTheme,
        darkMode,
        toggleDarkMode,
        themes: THEMES,
        THEMES,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
