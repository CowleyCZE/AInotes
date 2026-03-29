import React, { useState, useRef, useEffect } from 'react';
import { Note, RhymeAnalysis } from '../types';
import { analyzeLyricsRhymeAndMeter } from '../services/geminiService';

export function useMusicStudio() {
    const [isSongwriterMode, setIsSongwriterMode] = useState(false);
    const [selectedSongwriterNotes, setSelectedSongwriterNotes] = useState<string[]>([]);
    const [compositionContent, setCompositionContent] = useState("");
    const [sourceNoteContents, setSourceNoteContents] = useState<Record<string, string>>({});
    const [syncScrollEnabled, setSyncScrollEnabled] = useState(true);
    const [syncScrollMode, setSyncScrollMode] = useState<'percentage' | 'paragraph' | 'line'>('percentage');
    const [activeScrollIndex, setActiveScrollIndex] = useState<number | null>(null);
    const [showRhymeAnalyzer, setShowRhymeAnalyzer] = useState(false);
    const [rhymeAnalysis, setRhymeAnalysis] = useState<RhymeAnalysis | null>(null);
    const [isAnalyzingRhyme, setIsAnalyzingRhyme] = useState(false);
    const [autoNumbering, setAutoNumbering] = useState(true);
    const [showLyricModal, setShowLyricModal] = useState(false);
    const scrollSyncRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Načtení uložených dat při startu
    useEffect(() => {
        const storedComposition = localStorage.getItem('ainotes_composition');
        if (storedComposition) setCompositionContent(storedComposition);
        
        const storedSelectedNotes = localStorage.getItem('ainotes_selected_songwriter_notes');
        if (storedSelectedNotes) {
            try {
                setSelectedSongwriterNotes(JSON.parse(storedSelectedNotes));
            } catch (e) {
                console.error('Failed to parse selected notes:', e);
                setSelectedSongwriterNotes([]);
            }
        }
        
        const storedSourceContents = localStorage.getItem('ainotes_source_note_contents');
        if (storedSourceContents) {
            try {
                setSourceNoteContents(JSON.parse(storedSourceContents));
            } catch (e) {
                console.error('Failed to parse source contents:', e);
                setSourceNoteContents({});
            }
        }
    }, []);

    const updateCompositionContent = (newContent: string) => {
        setCompositionContent(newContent);
        localStorage.setItem('ainotes_composition', newContent);
    };

    const updateSelectedSongwriterNotes = (notes: string[]) => {
        setSelectedSongwriterNotes(notes);
        localStorage.setItem('ainotes_selected_songwriter_notes', JSON.stringify(notes));
    };

    const updateSourceNoteContents = (contents: Record<string, string>) => {
        setSourceNoteContents(contents);
        localStorage.setItem('ainotes_source_note_contents', JSON.stringify(contents));
    };

    const addTextToComposition = (text: string, sourceId: string) => {
        const newContent = compositionContent + `\n\n[Zdroj: ${sourceId}]\n${text}`;
        updateCompositionContent(newContent);
        const newSourceContents = {
            ...sourceNoteContents,
            [sourceId]: (sourceNoteContents[sourceId] || "") + text
        };
        updateSourceNoteContents(newSourceContents);
    };

    const addNoteToStudio = (noteId: string) => {
        if (!selectedSongwriterNotes.includes(noteId)) {
            const newSelectedNotes = [...selectedSongwriterNotes, noteId];
            updateSelectedSongwriterNotes(newSelectedNotes);
        }
    };

    const removeNoteFromStudio = (noteId: string) => {
        const newSelectedNotes = selectedSongwriterNotes.filter(id => id !== noteId);
        updateSelectedSongwriterNotes(newSelectedNotes);
    };

    const getLyricNotes = (notes: Note[]): Note[] => {
        return notes.filter(n => n.type === 'lyric');
    };

    const handleSyncScroll = (e: React.UIEvent<HTMLDivElement>, index: number) => {
        if (!syncScrollEnabled) return;
        setActiveScrollIndex(index);
        const target = e.currentTarget;
        const scrollPercentage = target.scrollTop / (target.scrollHeight - target.clientHeight);
        Object.values(scrollSyncRefs.current).forEach((ref) => {
            if (ref && (ref as HTMLDivElement) !== target) {
                const el = ref as HTMLDivElement;
                el.scrollTop = scrollPercentage * (el.scrollHeight - el.clientHeight);
            }
        });
    };

    const handleAnalyzeRhyme = async (creativeModel: string) => {
        setIsAnalyzingRhyme(true);
        setShowRhymeAnalyzer(true);
        try {
            const analysis = await analyzeLyricsRhymeAndMeter(compositionContent, creativeModel);
            setRhymeAnalysis(analysis);
        } catch (err) {
            console.error("Chyba při analýze rýmů", err);
        } finally {
            setIsAnalyzingRhyme(false);
        }
    };

    const saveCompositionToLocalStorage = () => {
        localStorage.setItem('ainotes_composition', compositionContent);
    };

    return {
        isSongwriterMode, setIsSongwriterMode, selectedSongwriterNotes, setSelectedSongwriterNotes: updateSelectedSongwriterNotes,
        compositionContent, setCompositionContent: updateCompositionContent,
        sourceNoteContents, setSourceNoteContents: updateSourceNoteContents, scrollSyncRefs, syncScrollEnabled,
        setSyncScrollEnabled, syncScrollMode, setSyncScrollMode, activeScrollIndex,
        showRhymeAnalyzer, setShowRhymeAnalyzer, rhymeAnalysis, isAnalyzingRhyme,
        autoNumbering, setAutoNumbering, showLyricModal, setShowLyricModal,
        addTextToComposition, handleSyncScroll, handleAnalyzeRhyme,
        addNoteToStudio, removeNoteFromStudio, getLyricNotes, saveCompositionToLocalStorage
    };
}
