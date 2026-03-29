import { useState, useEffect } from 'react';

export function useUI() {
    const [activeSection, setActiveSection] = useState<'notes' | 'music' | 'chat'>('notes');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [theme, setTheme] = useState<'light' | 'dark'>(
        (localStorage.getItem('ainotes_theme') as 'light' | 'dark') || 'dark'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ainotes_theme', theme);
    }, [theme]);

    return {
        activeSection, setActiveSection,
        isFocusMode, setIsFocusMode,
        theme, setTheme,
        toolbarPosition, setToolbarPosition
    };
}
