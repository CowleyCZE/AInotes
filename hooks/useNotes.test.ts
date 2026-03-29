import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotes } from './useNotes';
import * as geminiService from '../services/geminiService';

describe('useNotes hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default hierarchical categories', () => {
    const { result } = renderHook(() => useNotes());
    expect(result.current.categories.length).toBeGreaterThan(0);
    const projectsCat = result.current.categories.find(c => c.id === 'projects');
    expect(projectsCat?.parentId).toBe('work');
  });

  it('should create a new note', () => {
    const { result } = renderHook(() => useNotes());
    act(() => {
      result.current.createNewNote('personal', 'text');
    });
    expect(result.current.notes.length).toBe(1);
    expect(result.current.notes[0].title).toBe('Nová poznámka');
  });

  it('should handle audio transcription result', async () => {
    const { result } = renderHook(() => useNotes());
    const mockTranscribedNote = {
        title: "Hlasový nápad",
        category: "Osobní",
        formattedContent: "Obsah z audia",
        tags: ["voice"],
        type: "general"
    };

    await act(async () => {
        await result.current.handleAudioTranscription(mockTranscribedNote);
    });

    expect(result.current.notes[0].title).toBe("Hlasový nápad");
    expect(result.current.notes[0].content).toBe("Obsah z audia");
    expect(result.current.notes[0].tags).toContain("voice");
  });

  it('should automatically link existing notes in text', async () => {
    const { result } = renderHook(() => useNotes());
    
    // Vytvoříme cílovou poznámku
    act(() => {
        const newNote = { id: 'note1', title: 'Projekt Mars', content: '...', categoryId: 'work', createdAt: 0, updatedAt: 0, type: 'text' as const };
        result.current.setNotes([newNote]);
    });

    // Vytvoříme druhou poznámku a budeme ji editovat
    act(() => {
        result.current.createNewNote('work', 'text');
    });

    const secondNoteId = result.current.notes[0].id;
    act(() => {
        result.current.setSelectedNoteId(secondNoteId);
        result.current.setEditingContent('Píšu o Projekt Mars a jeho cílech.');
    });

    // Spustíme autoLink ručně (v hooku se spouští po 2s timeoutu)
    act(() => {
        result.current.autoLink();
    });

    expect(result.current.editingContent).toBe('Píšu o [[note1|Projekt Mars]] a jeho cílech.');
  });

  it('should restore previous version', () => {
    const { result } = renderHook(() => useNotes());
    
    act(() => {
        const noteWithHistory = { 
            id: '1', title: 'T', content: 'Nová verze', categoryId: 'c', createdAt: 0, updatedAt: 0, 
            history: ['Stará verze'], type: 'text' as const 
        };
        result.current.setNotes([noteWithHistory]);
        result.current.setSelectedNoteId('1');
    });

    act(() => {
        result.current.restoreVersion(0);
    });

    expect(result.current.editingContent).toBe('Stará verze');
    expect(result.current.notes[0].content).toBe('Stará verze');
  });
});
