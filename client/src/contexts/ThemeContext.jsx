import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const ThemeContext = createContext(null);

export const THEMES = [
    { id: 'biru-klasik', name: 'Biru Microsoft', swatch: '#0078D4' },
    { id: 'midnight', name: 'Navy Modern', swatch: '#004E8C' },
    { id: 'ocean', name: 'Teal Fluent', swatch: '#038387' },
    { id: 'slate', name: 'Steel Blue', swatch: '#3A6BA5' },
    { id: 'arctic', name: 'Sky Fluent', swatch: '#0099BC' },
    { id: 'steel', name: 'Slate Neutral', swatch: '#5C6B73' },
    { id: 'navy', name: 'Deep Navy', swatch: '#0B4F8A' },
];

export function ThemeProvider({ children }) {
    const { settings, updateSettings } = useAuth();
    const [theme, setThemeState] = useState('biru-klasik');
    const [darkMode, setDarkModeState] = useState(false);

    // Load from settings or localStorage
    useEffect(() => {
        if (settings) {
            setThemeState(settings.theme || 'biru-klasik');
            setDarkModeState(settings.dark_mode === 1);
        } else {
            const savedTheme = localStorage.getItem('theme') || 'biru-klasik';
            const savedDark = localStorage.getItem('darkMode') === 'true';
            setThemeState(savedTheme);
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
