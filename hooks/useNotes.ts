import { useState, useMemo, useEffect, useCallback } from 'react';
import { Note, Category } from '../types';
import { processNoteWithAI, findSmartConnections } from '../services/geminiService';

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState("");
    const [editingTitle, setEditingTitle] = useState("");
    const [editingTags, setEditingTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
    const [isLinkingLoading, setIsLinkingLoading] = useState(false);

    const selectedNote = useMemo(() => notes.find(note => note.id === selectedNoteId), [notes, selectedNoteId]);

    const handleSaveNote = useCallback(async () => {
        if (!selectedNote) return;
        const updatedNote: Note = {
            ...selectedNote,
            title: editingTitle,
            content: editingContent,
            tags: editingTags,
            updatedAt: Date.now(),
            history: [selectedNote.content, ...(selectedNote.history || []).slice(0, 9)]
        };
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? updatedNote : n));
        setSaveStatus('saving');
        try {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (_err) {
            setSaveStatus('error');
        }
    }, [selectedNote, editingTitle, editingContent, editingTags, selectedNoteId]);

    const handleAutoTitle = async (content: string) => {
        if (!content.trim()) return;
        setSaveStatus('saving');
        try {
            const result = await processNoteWithAI(content, categories);
            setEditingTitle(result.title);
            if (result.tags && result.tags.length > 0) {
                setEditingTags(prev => Array.from(new Set([...prev, ...result.tags])));
            }
            setToast({ message: "Název a tagy vygenerovány", type: 'success' });
        } catch (err) {
            console.error("Auto-title failed:", err);
            setToast({ message: "Chyba při generování názvu", type: 'error' });
        } finally {
            setSaveStatus('idle');
        }
    };

    const handleFindConnections = async () => {
        if (!selectedNoteId || !editingContent) return;
        setIsLinkingLoading(true);
        try {
            const suggestions = await findSmartConnections(selectedNoteId, editingContent, notes);
            if (suggestions.length === 0) {
                setToast({ message: "Žádné nové souvislosti nenalezeny", type: 'success' });
                return;
            }

            // Vložíme nalezené souvislosti na konec poznámky
            let newContent = editingContent;
            if (!newContent.includes("### Související poznámky")) {
                newContent += "\n\n### Související poznámky\n";
            }
            
            suggestions.forEach((s: any) => {
                const linkStr = `- [[${s.targetNoteId}|${s.targetNoteTitle}]] (${s.reason})`;
                if (!newContent.includes(s.targetNoteId)) {
                    newContent += linkStr + "\n";
                }
            });

            setEditingContent(newContent);
            setToast({ message: `Nalezeno ${suggestions.length} souvislostí`, type: 'success' });
        } catch (err) {
            console.error("Find connections failed:", err);
            setToast({ message: "Chyba při hledání souvislostí", type: 'error' });
        } finally {
            setIsLinkingLoading(false);
        }
    };

    const handleAudioTranscription = useCallback(async (transcribedNote: any) => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: transcribedNote.title || "Hlasová poznámka",
            content: transcribedNote.formattedContent || "",
            categoryId: categories.find(c => c.name === transcribedNote.category)?.id || categories[0]?.id || "default",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: transcribedNote.tags || [],
            type: transcribedNote.type === 'music' ? 'lyric' : 'text'
        };
        
        setNotes(prev => [newNote, ...prev]);
        setSelectedNoteId(newNote.id);
        setEditingTitle(newNote.title);
        setEditingContent(newNote.content);
        setEditingTags(newNote.tags);
        setIsEditing(false);
        setToast({ message: "Hlasová poznámka uložena", type: 'success' });
    }, [categories]);

    const autoLink = useCallback(() => {
        if (!editingContent || !notes.length || !selectedNoteId) return;
        
        let newContent = editingContent;
        let linksAdded = 0;

        // Seřadíme poznámky podle délky názvu (delší dříve, abychom se vyhnuli částečným shodám)
        const otherNotes = notes
            .filter(n => n.id !== selectedNoteId && n.title.length > 3)
            .sort((a, b) => b.title.length - a.title.length);

        otherNotes.forEach(note => {
            // Regex hledá název poznámky, který není součástí jiného odkazu nebo slova
            // Používáme negativní lookbehind/lookahead pro detekci [[...]] nebo [...]()
            const escapedTitle = note.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<!\\[\\[|\\|\\[|\\(#|\\w)${escapedTitle}(?!\\|\\]\\]|\\w|\\))`, 'gi');
            
            if (regex.test(newContent)) {
                // Nahradíme pouze první výskyt pro každou poznámku, abychom nespamovali linky
                newContent = newContent.replace(regex, (match) => {
                    linksAdded++;
                    return `[[${note.id}|${match}]]`;
                });
            }
        });

        if (linksAdded > 0) {
            setEditingContent(newContent);
            setToast({ message: `Automaticky vytvořeno ${linksAdded} odkazů`, type: 'success' });
        }
    }, [editingContent, notes, selectedNoteId]);

    // Auto-save po 2 sekundách nečinnosti
    useEffect(() => {
        if (!isEditing || !selectedNote) return;
        const handler = setTimeout(() => {
            handleSaveNote();
            autoLink();
        }, 2000);
        return () => clearTimeout(handler);
    }, [editingContent, editingTitle, editingTags, selectedNote, handleSaveNote, autoLink]);

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!editingTags.includes(tagInput.trim())) {
                setEditingTags(prev => [...prev, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    useEffect(() => {
        const storedNotes = localStorage.getItem('ainotes_notes');
        const storedCategories = localStorage.getItem('ainotes_categories');
        if (storedNotes) setNotes(JSON.parse(storedNotes));
        
        if (storedCategories) {
            setCategories(JSON.parse(storedCategories));
        } else {
            // Inicializace výchozích hierarchických kategorií
            const initialCategories: Category[] = [
                { id: 'personal', name: 'Osobní' },
                { id: 'work', name: 'Práce' },
                { id: 'projects', name: 'Projekty', parentId: 'work' },
                { id: 'meetings', name: 'Schůzky', parentId: 'work' },
                { id: 'music', name: 'Hudba' },
                { id: 'lyrics', name: 'Texty', parentId: 'music' },
                { id: 'ideas', name: 'Nápady', parentId: 'music' }
            ];
            setCategories(initialCategories);
            localStorage.setItem('ainotes_categories', JSON.stringify(initialCategories));
        }
        setIsDataLoaded(true);
    }, []);

    useEffect(() => {
        if (isDataLoaded) {
            localStorage.setItem('ainotes_notes', JSON.stringify(notes));
            localStorage.setItem('ainotes_categories', JSON.stringify(categories));
        }
    }, [notes, categories, isDataLoaded]);

    const handleSetSelectedNote = (noteId: string | null) => {
        setSelectedNoteId(noteId);
        setIsEditing(false);
    };

    const createNewNote = (categoryId: string, type: 'text' | 'lyric' = 'text') => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: "Nová poznámka",
            content: "",
            categoryId: categoryId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: [],
            type: type
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedNoteId(newNote.id);
        setEditingTitle(newNote.title);
        setEditingContent(newNote.content);
        setIsEditing(true);
    };

    const handleDeleteNote = useCallback((noteId: string, onNoteDeleted?: () => void) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNoteId === noteId) {
            setSelectedNoteId(null);
            setEditingContent("");
            setEditingTitle("");
            setEditingTags([]);
        }
        // Callback pro cleanup v jiných hookech (např. removeNoteFromStudio)
        if (onNoteDeleted) {
            onNoteDeleted();
        }
        setToast({ message: "Poznámka smazána", type: 'success' });
    }, [selectedNoteId]);

    const restoreVersion = (versionIndex: number) => {
        if (!selectedNote || !selectedNote.history || versionIndex >= selectedNote.history.length) return;
        
        const restoredContent = selectedNote.history[versionIndex];
        const newHistory = selectedNote.history.slice(versionIndex + 1);
        
        const updatedNote = {
            ...selectedNote,
            content: restoredContent,
            history: newHistory,
            updatedAt: Date.now()
        };
        
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? updatedNote : n));
        setEditingContent(restoredContent);
        setToast({ message: "Verze obnovena", type: 'success' });
    };

    return {
        notes, setNotes, categories, setCategories, selectedCategoryId, setSelectedCategoryId,
        selectedTag, setSelectedTag, selectedNoteId, setSelectedNoteId: handleSetSelectedNote,
        searchTerm, setSearchTerm, isEditing, setIsEditing, editingContent, setEditingContent,
        editingTitle, setEditingTitle, editingTags, setEditingTags, tagInput, setTagInput,
        handleTagInputChange, handleTagInputKeyDown,
        toast, setToast, isDataLoaded, saveStatus, noteToDeleteId, setNoteToDeleteId,
        selectedNote, handleSaveNote, createNewNote, handleDeleteNote, restoreVersion,
        handleAutoTitle, handleFindConnections, isLinkingLoading, handleAudioTranscription,
        autoLink
    };
}
