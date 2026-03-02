import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Note, Category, AIAction, ChatMessage, LinkSuggestion, RhymeAnalysis } from '../types';
import { 
    processNoteWithAI, 
    formatAndAppendTextWithAI, 
    performAIQuickAction, 
    initializeChatWithNotes, 
    findSmartConnections, 
    createNoteFromAudio, 
    analyzeLyricsRhymeAndMeter 
} from '../services/geminiService';
import { 
    saveDataToFirestore, 
    loadDataFromFirestore, 
    deleteNoteFromFirestore 
} from '../services/firebaseService';

export function useAppLogic() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isAppendingAI, setIsAppendingAI] = useState(false);
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
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [activeSection, setActiveSection] = useState<'notes' | 'music'>('notes');
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [selection, setSelection] = useState<{ text: string; range: Range | null } | null>(null);
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
    const [activeAIAction, setActiveAIAction] = useState<AIAction | null>(null);
    const [aiActionResult, setAiActionResult] = useState<string | null>(null);
    const [isAIActionLoading, setIsAIActionLoading] = useState(false);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatSessionRef = useRef<any>(null);
    const [isLinkingLoading, setIsLinkingLoading] = useState(false);
    const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
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
    const [expandedMusicFolders, setExpandedMusicFolders] = useState<string[]>([]);

    const selectedNote = useMemo(() => notes.find(note => note.id === selectedNoteId), [notes, selectedNoteId]);

    useEffect(() => {
        loadDataFromFirestore().then(({ notes, categories }) => {
            setNotes(notes);
            setCategories(categories);
            setIsDataLoaded(true);
        }).catch(() => setToast({ message: "Chyba načítání", type: 'error' }));
    }, []);

    useEffect(() => {
        if (!isDataLoaded) return;
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        setSaveStatus('saving');
        autoSaveTimeoutRef.current = window.setTimeout(() => {
            saveDataToFirestore(notes, categories)
                .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); })
                .catch(() => setSaveStatus('error'));
        }, 1500);
    }, [notes, categories, isDataLoaded]);

    const handleSaveNote = useCallback(() => {
        if (!selectedNote) return;
        setNotes(prev => {
            const noteToUpdate = prev.find(n => n.id === selectedNoteId);
            if (!noteToUpdate) return prev;
            if (noteToUpdate.content === editingContent && noteToUpdate.title === editingTitle && JSON.stringify(noteToUpdate.tags) === JSON.stringify(editingTags)) return prev;
            const newHistory = noteToUpdate.content !== editingContent ? [noteToUpdate.content, ...(noteToUpdate.history || [])].slice(0, 5) : (noteToUpdate.history || []);
            return prev.map(n => n.id === selectedNoteId ? { ...n, title: editingTitle.trim() || "Bez názvu", content: editingContent, tags: editingTags, updatedAt: Date.now(), history: newHistory } : n);
        });
    }, [selectedNoteId, editingContent, editingTitle, editingTags, selectedNote]);

    const handleSetSelectedNote = useCallback((id: string | null) => {
        if (isEditing) handleSaveNote();
        setIsEditing(false);
        setSelectedNoteId(id);
    }, [isEditing, handleSaveNote]);

    useEffect(() => { if (selectedNote) { setEditingContent(selectedNote.content); setEditingTitle(selectedNote.title); setEditingTags(selectedNote.tags || []); } }, [selectedNoteId]);

    const handleAIProcess = async () => {
        setIsLoadingAI(true);
        try {
            const result = await processNoteWithAI(editingContent, categories);
            let cat = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
            if (!cat) { cat = { id: `cat-${Date.now()}`, name: result.category }; setCategories(prev => [...prev, cat!]); }
            const finalId = `note-${Date.now()}`;
            setNotes(prev => [{ id: finalId, title: result.title, content: result.formattedContent, categoryId: cat!.id, createdAt: Date.now(), updatedAt: Date.now(), history: [], tags: result.tags, type: 'text' }, ...prev.filter(n => n.id !== selectedNoteId)]);
            handleSetSelectedNote(finalId);
            setIsEditing(false);
        } catch (e: any) { setError(e.message); } finally { setIsLoadingAI(false); }
    };

    const handleSendChatMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;
        const userMsg = { id: Date.now().toString(), role: 'user' as const, text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        const input = chatInput; setChatInput(''); setIsChatLoading(true);
        if (!chatSessionRef.current) chatSessionRef.current = initializeChatWithNotes(notes);
        try {
            const stream = await chatSessionRef.current.sendMessageStream({ message: input });
            const modelMsgId = (Date.now() + 1).toString();
            setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);
            let acc = '';
            for await (const chunk of stream) {
                acc += (chunk as any).text;
                setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: acc } : m));
            }
            setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, isStreaming: false } : m));
        } catch { setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Chyba" }]); } finally { setIsChatLoading(false); }
    };

    const handleSyncScroll = (e: React.UIEvent<HTMLDivElement>, noteIndex: number) => {
        if (!syncScrollEnabled || isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        const target = e.target as HTMLDivElement;
        const ratio = target.scrollTop / (target.scrollHeight - target.clientHeight);
        Object.values(scrollSyncRefs.current).forEach(ref => { if (ref && ref !== target) ref.scrollTop = ratio * (ref.scrollHeight - ref.clientHeight); });
        setActiveScrollIndex(noteIndex);
        setTimeout(() => { isSyncingScroll.current = false; setTimeout(() => setActiveScrollIndex(null), 1000); }, 50);
    };

    const addTextToComposition = (text: string, noteId: string, colorIndex: number) => {
        const span = `<span class="text-xs bg-gray-800 px-1 rounded mx-1" data-source="${noteId}">${text}</span> `;
        setCompositionContent(prev => prev + span);
    };

    const createNewNote = () => {
        const id = `new-${Date.now()}`;
        setNotes(prev => [{ id, title: "Nová poznámka", content: "", categoryId: categories[0]?.id || '', createdAt: Date.now(), updatedAt: Date.now(), history: [], tags: [], type: 'text' }, ...prev]);
        handleSetSelectedNote(id);
        setIsEditing(true);
    };

    return {
        notes, setNotes, categories, setCategories, selectedCategoryId, setSelectedCategoryId,
        selectedTag, setSelectedTag, selectedNoteId, handleSetSelectedNote, searchTerm, setSearchTerm,
        isLoadingAI, isAppendingAI, error, isEditing, setIsEditing, editingContent, setEditingContent,
        editingTitle, setEditingTitle, editingTags, setEditingTags, tagInput, setTagInput,
        textToAppend, setTextToAppend, toast, setToast, isDataLoaded, saveStatus, viewMode, setViewMode,
        activeSection, setActiveSection, draggedNoteId, setDraggedNoteId, editingCategoryId, setEditingCategoryId,
        editingCategoryName, setEditingCategoryName, toolbarPosition, setToolbarPosition,
        activeAIAction, setActiveAIAction, isAIActionLoading, setIsAIActionLoading, isChatMode, setIsChatMode,
        chatMessages, setChatMessages, chatInput, setChatInput, isChatLoading, setIsChatLoading,
        isLinkingLoading, setIsLinkingLoading, linkSuggestions, setLinkSuggestions, showLinkModal, setShowLinkModal,
        isRecording, setIsRecording, isProcessingAudio, setIsProcessingAudio, noteToDeleteId, setNoteToDeleteId,
        isSongwriterMode, setIsSongwriterMode, selectedSongwriterNotes, setSelectedSongwriterNotes,
        compositionContent, setCompositionContent, sourceNoteContents, setSourceNoteContents,
        scrollSyncRefs, syncScrollEnabled, setSyncScrollEnabled, syncScrollMode, setSyncScrollMode,
        activeScrollIndex, showRhymeAnalyzer, setShowRhymeAnalyzer, rhymeAnalysis, setRhymeAnalysis,
        isAnalyzingRhyme, setIsAnalyzingRhyme, autoNumbering, setAutoNumbering, showLyricModal, setShowLyricModal,
        lyricForm, setLyricForm, expandedMusicFolders, setExpandedMusicFolders, selectedNote,
        handleSaveNote, handleAIProcess, handleSendChatMessage, handleSyncScroll, addTextToComposition, createNewNote
    };
}
