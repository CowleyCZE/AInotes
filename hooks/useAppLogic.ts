
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Note, Category, AIAction, ChatMessage, RhymeAnalysis } from '../types';
import { 
    processNoteWithAI, 
    initializeChatWithNotes,
    analyzeLyricsRhymeAndMeter,
    findSmartConnections,
    performAIQuickAction,
    formatAndAppendTextWithAI
} from '../services/geminiService';
import { 
    saveDataToFirestore, 
    loadDataFromFirestore 
} from '../services/firebaseService';
import React from 'react';

export function useAppLogic() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState('');
    const [editingTitle, setEditingTitle] = useState('');
    const [editingTags, setEditingTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [textToAppend, setTextToAppend] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [activeSection, setActiveSection] = useState<'notes' | 'music'>('notes');
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatSessionRef = useRef<any>(null); // TODO: Replace any with actual type for Gemini chat session
    const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
    const [isSongwriterMode, setIsSongwriterMode] = useState(false);
    const [selectedSongwriterNotes, setSelectedSongwriterNotes] = useState<string[]>([]);
    const [compositionContent, setCompositionContent] = useState('');
    const [sourceNoteContents, setSourceNoteContents] = useState<{[key:string]: string}>({});
    const scrollSyncRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
    const isSyncingScroll = useRef(false);
    const [syncScrollEnabled, setSyncScrollEnabled] = useState(true);
    const [syncScrollMode, setSyncScrollMode] = useState<'percentage' | 'paragraph' | 'line'>('percentage');
    const [activeScrollIndex, setActiveScrollIndex] = useState<number | null>(null);
    const [showRhymeAnalyzer, setShowRhymeAnalyzer] = useState(false);
    const [rhymeAnalysis, setRhymeAnalysis] = useState<RhymeAnalysis | null>(null);
    const [isAnalyzingRhyme, setIsAnalyzingRhyme] = useState(false);
    const [autoNumbering, setAutoNumbering] = useState(true);
    const [showLyricModal, setShowLyricModal] = useState(false);
    const [lyricForm, setLyricForm] = useState({ title: '', userNotes: '', content: '', musicDescription: '' });
    const [isLinkingLoading, setIsLinkingLoading] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [isAIActionLoading, setIsAIActionLoading] = useState(false);
    const [isAppendingAI, setIsAppendingAI] = useState(false);
    const contentAreaRef = useRef<HTMLDivElement>(null);

    const selectedNote = useMemo(() => notes.find(note => note.id === selectedNoteId), [notes, selectedNoteId]);

    useEffect(() => {
        // Nejprve načteme z localStorage pro okamžitý start
        const localNotes = localStorage.getItem('ainotes_notes');
        const localCategories = localStorage.getItem('ainotes_categories');
        const localComposition = localStorage.getItem('ainotes_composition');
        
        if (localNotes) setNotes(JSON.parse(localNotes));
        if (localCategories) setCategories(JSON.parse(localCategories));
        if (localComposition) setCompositionContent(localComposition);

        // Poté asynchronně z Firebase
        loadDataFromFirestore().then(({ notes: fbNotes, categories: fbCategories }) => {
            if (fbNotes.length > 0) {
                setNotes(fbNotes);
                localStorage.setItem('ainotes_notes', JSON.stringify(fbNotes));
            }
            if (fbCategories.length > 0) {
                setCategories(fbCategories);
                localStorage.setItem('ainotes_categories', JSON.stringify(fbCategories));
            }
            setIsDataLoaded(true);
        }).catch((err) => {
            console.error("Chyba při načítání z Firebase:", err);
            setToast({ message: "Chyba synchronizace (pracujete v lokálním režimu)", type: 'error' });
            setIsDataLoaded(true); // I při chybě zobrazi data z localu
        });
    }, []);

    useEffect(() => {
        if (!isDataLoaded) return;
        const autoSaveTimeoutId = setTimeout(() => {
            setSaveStatus('saving');
            
            // Uložit do Local Storage hned
            localStorage.setItem('ainotes_notes', JSON.stringify(notes));
            localStorage.setItem('ainotes_categories', JSON.stringify(categories));
            
            // Uložit do Firestore
            saveDataToFirestore(notes, categories)
                .then(() => { 
                    setSaveStatus('saved'); 
                    setTimeout(() => setSaveStatus('idle'), 2000); 
                })
                .catch((err) => {
                    console.error("Chyba auto-save do Firebase:", err);
                    setSaveStatus('error');
                });
        }, 1500);
        return () => clearTimeout(autoSaveTimeoutId);
    }, [notes, categories, isDataLoaded]);

    const handleSaveNote = useCallback(() => {
        if (!selectedNoteId) return;
        setNotes(prev => {
            const noteToUpdate = prev.find(n => n.id === selectedNoteId);
            if (!noteToUpdate) return prev;
            if (noteToUpdate.content === editingContent && noteToUpdate.title === editingTitle && JSON.stringify(noteToUpdate.tags) === JSON.stringify(editingTags)) return prev;
            
            const newHistory = noteToUpdate.content !== editingContent 
                ? [noteToUpdate.content, ...(noteToUpdate.history || [])].slice(0, 10) 
                : (noteToUpdate.history || []);

            return prev.map(n => n.id === selectedNoteId ? { 
                ...n, 
                title: editingTitle.trim() || "Bez názvu", 
                content: editingContent, 
                tags: editingTags, 
                updatedAt: Date.now(), 
                history: newHistory 
            } : n);
        });
    }, [selectedNoteId, editingContent, editingTitle, editingTags]);

    const handleSetSelectedNote = useCallback((id: string | null) => {
        if (isEditing) handleSaveNote();
        setIsEditing(false);
        setSelectedNoteId(id);
    }, [isEditing, handleSaveNote]);

    useEffect(() => { 
        if (selectedNoteId) {
            const note = notes.find(n => n.id === selectedNoteId);
            if (note) {
                setEditingContent(note.content); 
                setEditingTitle(note.title); 
                setEditingTags(note.tags || []); 
            }
        } 
    }, [selectedNoteId, notes]);

    const handleAIProcess = async () => {
        if (!editingContent.trim()) return;
        setIsLoadingAI(true);
        try {
            const result = await processNoteWithAI(editingContent, categories);
            let cat = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
            if (!cat) { 
                cat = { id: `cat-${Date.now()}`, name: result.category }; 
                setCategories(prev => [...prev, cat!]); 
            }
            
            // Pokud jsme v editačním módu existující poznámky, aktualizujeme ji místo vytvoření nové
            // Nebo vytvoříme novou, pokud selectedNoteId začíná na 'new-'
            const isNew = selectedNoteId?.startsWith('new-');
            const targetId = isNew ? `note-${Date.now()}` : selectedNoteId!;
            
            setNotes(prev => {
                const existing = prev.find(n => n.id === targetId);
                const updatedNote: Note = {
                    id: targetId,
                    title: result.title,
                    content: result.formattedContent,
                    categoryId: cat!.id,
                    createdAt: existing?.createdAt || Date.now(),
                    updatedAt: Date.now(),
                    history: existing ? [existing.content, ...(existing.history || [])].slice(0, 10) : [],
                    tags: result.tags,
                    type: existing?.type || 'text'
                };
                
                if (existing) {
                    return prev.map(n => n.id === targetId ? updatedNote : n);
                } else {
                    return [updatedNote, ...prev.filter(n => n.id !== selectedNoteId)];
                }
            });

            if (isNew || targetId !== selectedNoteId) {
                handleSetSelectedNote(targetId);
            }
            setIsEditing(false);
            setToast({ message: "AI zpracování dokončeno", type: 'success' });
        } catch (e: any) { 
            console.error("AI Error:", e);
            setError(e.message); 
            setToast({ message: "AI selhalo: " + e.message, type: 'error' });
        } finally { 
            setIsLoadingAI(false); 
        }
    };

    const saveCompositionToLocalStorage = useCallback((content: string) => {
        setCompositionContent(content);
        localStorage.setItem('ainotes_composition', content);
    }, []);

    const handleSendChatMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;
        const userMsg = { id: Date.now().toString(), role: 'user' as const, text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        const input = chatInput; setChatInput(''); setIsChatLoading(true);
        
        try {
            if (!chatSessionRef.current) chatSessionRef.current = initializeChatWithNotes(notes);
            const stream = await chatSessionRef.current.sendMessageStream(input);
            const modelMsgId = (Date.now() + 1).toString();
            setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);
            let acc = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text();
                acc += chunkText;
                setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: acc } : m));
            }
            setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, isStreaming: false } : m));
        } catch (err) { 
            console.error("Chat Error:", err);
            setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Omlouvám se, ale došlo k chybě při komunikaci s AI." }]); 
        } finally { 
            setIsChatLoading(false); 
        }
    };

    const handleSyncScroll = (e: React.UIEvent<HTMLDivElement>, noteIndex: number) => {
        if (!syncScrollEnabled || isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        const target = e.currentTarget;
        const ratio = target.scrollTop / (target.scrollHeight - target.clientHeight);
        Object.entries(scrollSyncRefs.current).forEach(([id, ref]) => { 
            if (ref && ref !== target) {
                ref.scrollTop = ratio * (ref.scrollHeight - ref.clientHeight);
            }
        });
        setActiveScrollIndex(noteIndex);
        setTimeout(() => { 
            isSyncingScroll.current = false; 
            // Necháme activeScrollIndex chvíli svítit pro vizuální feedback
            setTimeout(() => setActiveScrollIndex(null), 1000); 
        }, 50);
    };

    const addTextToComposition = (text: string, noteId: string, colorIndex: number = 0) => {
        const colorClasses = ['bg-purple-900/40 border-purple-500', 'bg-teal-900/40 border-teal-500', 'bg-green-900/40 border-green-500', 'bg-orange-900/40 border-orange-500'];
        const colorClass = colorClasses[colorIndex] || colorClasses[0];
        const span = `<span class="text-xs ${colorClass} px-1 rounded mx-1 border" data-source="${noteId}">${text}</span> `;
        const newContent = compositionContent + span;
        saveCompositionToLocalStorage(newContent);
    };

    const createNewNote = () => {
        const id = `new-${Date.now()}`;
        const newNote: Note = { 
            id, 
            title: "Nová poznámka", 
            content: "", 
            categoryId: categories[0]?.id || 'all', 
            createdAt: Date.now(), 
            updatedAt: Date.now(), 
            history: [], 
            tags: [], 
            type: activeSection === 'music' ? 'lyric' : 'text' 
        };
        setNotes(prev => [newNote, ...prev]);
        handleSetSelectedNote(id);
        setIsEditing(true);
    };

    const handleAnalyzeRhyme = async () => {
        if (!compositionContent.trim()) return;
        setIsAnalyzingRhyme(true);
        setShowRhymeAnalyzer(true);
        try {
            const analysis = await analyzeLyricsRhymeAndMeter(compositionContent);
            setRhymeAnalysis(analysis);
        } catch (err) {
            console.error("Rhyme analysis error:", err);
            setToast({ message: "Chyba při analýze rýmů", type: 'error' });
        } finally {
            setIsAnalyzingRhyme(false);
        }
    };

    const handleUndo = useCallback(() => {
        if (!selectedNote || !selectedNote.history || selectedNote.history.length === 0) return;
        const previousContent = selectedNote.history[0];
        const newHistory = selectedNote.history.slice(1);
        
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? { 
            ...n, 
            content: previousContent, 
            history: newHistory,
            updatedAt: Date.now() 
        } : n));
        
        setEditingContent(previousContent);
        setToast({ message: "Změna vrácena", type: 'success' });
    }, [selectedNote, selectedNoteId]);

    const handleFindConnections = async () => {
        if (!selectedNoteId || !editingContent) return;
        setIsLinkingLoading(true);
        try {
            const suggestions = await findSmartConnections(selectedNoteId, editingContent, notes);
            if (suggestions.length === 0) {
                setToast({ message: "Nebyly nalezeny žádné nové souvislosti", type: 'success' });
                return;
            }

            let newContent = editingContent;
            suggestions.forEach((s: any) => {
                const regex = new RegExp(`(${s.originalText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
                if (!newContent.includes(`[[${s.targetNoteId}|`)) {
                    newContent = newContent.replace(regex, `[[${s.targetNoteId}|$1]]`);
                }
            });

            setEditingContent(newContent);
            setToast({ message: `Nalezeno a vytvořeno ${suggestions.length} propojení`, type: 'success' });
        } catch (err) {
            console.error("Link Error:", err);
            setToast({ message: "Chyba při hledání souvislostí", type: 'error' });
        } finally {
            setIsLinkingLoading(false);
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        if (text && text.length > 2 && contentAreaRef.current?.contains(selection?.anchorNode as Node)) {
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            const containerRect = contentAreaRef.current.getBoundingClientRect();
            
            if (rect) {
                setToolbarPosition({
                    top: rect.top - containerRect.top + contentAreaRef.current.scrollTop - 45,
                    left: rect.left - containerRect.left + rect.width / 2
                });
                setSelectedText(text);
            }
        } else {
            setToolbarPosition(null);
            setSelectedText('');
        }
    };

    const handleAIAction = async (action: AIAction) => {
        if (!selectedText || isAIActionLoading) return;
        setIsAIActionLoading(true);
        try {
            const result = await performAIQuickAction(selectedText, editingContent, action);
            
            if (action === 'summarize') {
                setToast({ message: "Shrnutí: " + result, type: 'success' });
            } else {
                if (isEditing) {
                    setEditingContent(prev => prev.replace(selectedText, result));
                    setToast({ message: "Text byl upraven", type: 'success' });
                } else {
                    setToast({ message: "Výsledek: " + result, type: 'success' });
                }
            }
        } catch (err) {
            setToast({ message: "AI akce selhala", type: 'error' });
        } finally {
            setIsAIActionLoading(false);
            setToolbarPosition(null);
        }
    };

    const handleAIAppend = async () => {
        if (!textToAppend.trim() || !selectedNote || isAppendingAI) return;
        setIsAppendingAI(true);
        try {
            const result = await formatAndAppendTextWithAI(textToAppend, selectedNote.content);
            const newContent = selectedNote.content + "\n\n" + result.appendedContent;
            
            setNotes(prev => prev.map(n => n.id === selectedNoteId ? { 
                ...n, 
                content: newContent, 
                updatedAt: Date.now(),
                history: [n.content, ...(n.history || [])].slice(0, 10)
            } : n));
            
            setTextToAppend('');
            setToast({ message: "Text byl přidán a naformátován", type: 'success' });
        } catch (err) {
            setToast({ message: "Chyba při přidávání textu", type: 'error' });
        } finally {
            setIsAppendingAI(false);
        }
    };

    const removeEditingTag = (tag: string) => {
        setEditingTags(prev => prev.filter(t => t !== tag));
    };

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!editingTags.includes(newTag)) {
                setEditingTags(prev => [...prev, newTag]);
            }
            setTagInput('');
        }
    };

    const handleCopyText = async () => {
        if (selectedText) {
            await navigator.clipboard.writeText(selectedText);
            setToast({ message: "Zkopírováno do schránky", type: 'success' });
            setToolbarPosition(null);
        }
    };

    const handleCancelEditing = () => {
        if (selectedNote) {
            setEditingContent(selectedNote.content);
            setEditingTitle(selectedNote.title);
            setEditingTags(selectedNote.tags || []);
        }
        setIsEditing(false);
    };

    return {
        notes, setNotes, categories, setCategories, selectedCategoryId, setSelectedCategoryId,
        selectedTag, setSelectedTag, selectedNoteId, handleSetSelectedNote, searchTerm, setSearchTerm,
        isLoadingAI, error, isEditing, setIsEditing, editingContent, setEditingContent,
        editingTitle, setEditingTitle, editingTags, setEditingTags, tagInput, setTagInput,
        textToAppend, setTextToAppend, toast, isDataLoaded, saveStatus,
        activeSection, setActiveSection,
        isChatMode, setIsChatMode,
        chatMessages, setChatMessages, chatInput, setChatInput, isChatLoading, setIsChatLoading,
        noteToDeleteId, setNoteToDeleteId,
        isSongwriterMode, setIsSongwriterMode, selectedSongwriterNotes, setSelectedSongwriterNotes,
        compositionContent, setCompositionContent, sourceNoteContents, setSourceNoteContents,
        scrollSyncRefs, syncScrollEnabled, setSyncScrollEnabled, syncScrollMode, setSyncScrollMode,
        activeScrollIndex, showRhymeAnalyzer, setShowRhymeAnalyzer, rhymeAnalysis, setRhymeAnalysis,
        isAnalyzingRhyme, setIsAnalyzingRhyme, autoNumbering, setAutoNumbering, showLyricModal, setShowLyricModal,
        lyricForm, setLyricForm, selectedNote,
        handleSaveNote, handleAIProcess, handleSendChatMessage, handleSyncScroll, addTextToComposition, createNewNote,
        saveCompositionToLocalStorage, handleAnalyzeRhyme,
        handleUndo, handleFindConnections, isLinkingLoading, handleMouseUp, toolbarPosition,
        handleAIAction, isAIActionLoading, handleAIAppend, isAppendingAI,
        removeEditingTag, handleTagInputChange, handleTagInputKeyDown, handleCopyText, contentAreaRef,
        handleCancelEditing
    };
}
