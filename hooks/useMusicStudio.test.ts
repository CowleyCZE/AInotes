import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMusicStudio } from './useMusicStudio';

describe('useMusicStudio hook', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('should initialize with empty composition', () => {
        const { result } = renderHook(() => useMusicStudio());
        expect(result.current.compositionContent).toBe("");
        expect(result.current.isSongwriterMode).toBe(false);
    });

    it('should update composition content and persist', () => {
        const { result } = renderHook(() => useMusicStudio());
        act(() => {
            result.current.setCompositionContent('Nová skladba');
        });
        expect(result.current.compositionContent).toBe('Nová skladba');
        expect(window.localStorage.getItem('ainotes_composition')).toBe('Nová skladba');
    });

    it('should add text to composition from source', () => {
        const { result } = renderHook(() => useMusicStudio());
        act(() => {
            result.current.setCompositionContent('Základ');
        });
        act(() => {
            result.current.addTextToComposition('Přidaný text', 'note123');
        });
        expect(result.current.compositionContent).toContain('Základ');
        expect(result.current.compositionContent).toContain('[Zdroj: note123]');
        expect(result.current.compositionContent).toContain('Přidaný text');
        expect(result.current.sourceNoteContents['note123']).toBe('Přidaný text');
    });

    it('should toggle songwriter mode', () => {
        const { result } = renderHook(() => useMusicStudio());
        act(() => {
            result.current.setIsSongwriterMode(true);
        });
        expect(result.current.isSongwriterMode).toBe(true);
    });

    it('should handle lyric modal visibility', () => {
        const { result } = renderHook(() => useMusicStudio());
        act(() => {
            result.current.setShowLyricModal(true);
        });
        expect(result.current.showLyricModal).toBe(true);
    });
});
