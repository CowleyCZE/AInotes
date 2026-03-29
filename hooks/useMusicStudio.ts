import React, { useState, useRef, useEffect } from 'react';
import { RhymeAnalysis } from '../types';
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

    useEffect(() => {
        const storedComposition = localStorage.getItem('ainotes_composition');
        if (storedComposition) setCompositionContent(storedComposition);
    }, []);

    const updateCompositionContent = (newContent: string) => {
        setCompositionContent(newContent);
        localStorage.setItem('ainotes_composition', newContent);
    };

    const addTextToComposition = (text: string, sourceId: string) => {
        const newContent = compositionContent + `\n\n[Zdroj: ${sourceId}]\n${text}`;
        updateCompositionContent(newContent);
        setSourceNoteContents(prev => ({
            ...prev,
            [sourceId]: (prev[sourceId] || "") + text
        }));
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

    return {
        isSongwriterMode, setIsSongwriterMode, selectedSongwriterNotes, setSelectedSongwriterNotes,
        compositionContent, setCompositionContent: updateCompositionContent, 
        sourceNoteContents, setSourceNoteContents, scrollSyncRefs, syncScrollEnabled, 
        setSyncScrollEnabled, syncScrollMode, setSyncScrollMode, activeScrollIndex, 
        showRhymeAnalyzer, setShowRhymeAnalyzer, rhymeAnalysis, isAnalyzingRhyme, 
        autoNumbering, setAutoNumbering, showLyricModal, setShowLyricModal,
        addTextToComposition, handleSyncScroll, handleAnalyzeRhyme
    };
}
