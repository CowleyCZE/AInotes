import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUI } from './useUI';

describe('useUI hook', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useUI());
        expect(result.current.activeSection).toBe('notes');
        expect(result.current.isFocusMode).toBe(false);
        expect(result.current.theme).toBe('dark');
    });

    it('should change active section', () => {
        const { result } = renderHook(() => useUI());
        act(() => {
            result.current.setActiveSection('music');
        });
        expect(result.current.activeSection).toBe('music');
    });

    it('should toggle theme and persist to localStorage', () => {
        const { result } = renderHook(() => useUI());
        act(() => {
            result.current.setTheme('light');
        });
        expect(result.current.theme).toBe('light');
        expect(window.localStorage.getItem('ainotes_theme')).toBe('light');
    });

    it('should set focus mode', () => {
        const { result } = renderHook(() => useUI());
        act(() => {
            result.current.setIsFocusMode(true);
        });
        expect(result.current.isFocusMode).toBe(true);
    });
});
