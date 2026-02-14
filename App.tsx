
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Note, Category, AIAction, ChatMessage, LinkSuggestion } from './types';
import { processNoteWithAI, formatAndAppendTextWithAI, performAIQuickAction, initializeChatWithNotes, findSmartConnections, createNoteFromAudio, analyzeLyricsRhymeAndMeter, RhymeAnalysis } from './services/geminiService';
import { saveDataToFirestore, loadDataFromFirestore, deleteNoteFromFirestore } from './services/firebaseService';
import { Chat, GenerateContentResponse } from "@google/genai";


// --- ICONS ---
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);

const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.363-.448-1.256-2.512a2 2 0 00-3.578 0L9.957 14.432l-2.363.448a2 2 0 00-1.022.547M12 21a9 9 0 100-18 9 9 0 000 18z" /><path d="M12 14a2 2 0 100-4 2 2 0 000 4z" /></svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m10-16l-2.293 2.293a1 1 0 000 1.414L15 12l-4.293-4.293a1 1 0 00-1.414 0L7 10m10 10l-2.293-2.293a1 1 0 000-1.414L15 12l-4.293 4.293a1 1 0 00-1.414 0L7 14" /></svg>
);

const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

const SummarizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
);

const GrammarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /><path d="M12 20.5c-4.23.09-7.5-3.32-7.5-7.5S7.86 2.45 12.14 2.5c4.1.05 7.36 3.43 7.36 7.5" strokeDasharray="2 2" /></svg>
);

const TranslateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13l4-4-4-4M18 11h-8" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>
);

const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
);

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-3 w-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const MusicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


// --- HELPER FUNCTIONS ---
const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const normalizeTitle = (title: string) => {
    return title.toLowerCase()
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '')
        .replace(/verze\s*\d+/g, '')
        .replace(/v\.\s*\d+/g, '')
        .replace(/v\d+/g, '')
        .replace(/draft/g, '')
        .replace(/\d{1,2}\.\d{1,2}\.\d{2,4}/g, '') // dates
        .trim();
};

const groupNotesByTitle = (notes: Note[]) => {
    const groups: { [key: string]: Note[] } = {};
    notes.forEach(note => {
        // Use exact title matching for the folder system as requested
        const key = note.title.trim() || "Bez názvu";
        if (!groups[key]) groups[key] = [];
        groups[key].push(note);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
};

// --- MARKDOWN RENDERER ---
const SimpleMarkdownRenderer: React.FC<{ content: string, onLinkClick?: (id: string) => void }> = ({ content, onLinkClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const htmlContent = useMemo(() => {
        if (!content) return '';
        let processedContent = content;
        
        // 1. Protect Code Blocks
        const codeBlocks: string[] = [];
        processedContent = processedContent.replace(/```([\s\S]*?)```/g, (match, p1) => {
            const code = p1.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            codeBlocks.push(`<pre class="bg-gray-800 p-4 rounded-md my-4 overflow-x-auto"><code class="text-sm text-cyan-300">${code}</code></pre>`);
            return `___CODEBLOCK_${codeBlocks.length - 1}___`;
        });

        // 2. Process standard Markdown
        processedContent = processedContent
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b border-gray-600 pb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 border-b-2 border-gray-500 pb-2">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-700 text-red-300 px-1 py-0.5 rounded-sm">$1</code>')
            .replace(/^\s*[-*] (.*$)/gim, '<li>$1</li>')
            .replace(/(\<li\>[\s\S]*?\<\/li\>)/g, '<ul>$1</ul>')
            .replace(/\<\/ul\>\s*\<ul\>/g, '')
            .replace(/\n/g, '<br />')
            .replace(/(\<br \/\>){2,}/g, '<br />')
            .replace(/\<ul\>\<br \/\>/g, '<ul>')
            .replace(/\<\/li\>\<br \/\>/g, '</li>');
        
        // 3. Process Links: [Title](#note-id) or [Title](note-id)
        processedContent = processedContent.replace(/\[(.*?)\]\(#(.*?)\)/g, '<a href="#$2" class="internal-link text-cyan-400 hover:underline cursor-pointer" data-note-id="$2">$1</a>');
        
        // 4. Restore Code Blocks
        codeBlocks.forEach((block, index) => {
            processedContent = processedContent.replace(`___CODEBLOCK_${index}___`, block);
        });

        return processedContent;

    }, [content]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !onLinkClick) return;

        const handleInternalLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.classList.contains('internal-link')) {
                e.preventDefault();
                const noteId = target.getAttribute('data-note-id');
                if (noteId) {
                    onLinkClick(noteId);
                }
            }
        };

        container.addEventListener('click', handleInternalLinkClick);
        return () => {
            container.removeEventListener('click', handleInternalLinkClick);
        };
    }, [htmlContent, onLinkClick]);

    return <div ref={containerRef} className="prose prose-invert max-w-none leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

// --- APP COMPONENT ---
export default function App() {
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
    
    // App Section: 'notes' (default) or 'music' (lyrics/descriptions)
    const [activeSection, setActiveSection] = useState<'notes' | 'music'>('notes');

    // Drag & Drop State
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
    
    // State for Category Management
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    // State for AI Quick Actions
    const [selection, setSelection] = useState<{ text: string; range: Range | null } | null>(null);
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
    const [activeAIAction, setActiveAIAction] = useState<AIAction | null>(null);
    const [aiActionResult, setAiActionResult] = useState<string | null>(null);
    const [isAIActionLoading, setIsAIActionLoading] = useState(false);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const TOOLBAR_HEIGHT = 44; 
    const autoSaveTimeoutRef = useRef<number | null>(null);

    // --- CHAT STATE ---
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatSessionRef = useRef<Chat | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- SMART LINKING STATE ---
    const [isLinkingLoading, setIsLinkingLoading] = useState(false);
    const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
    const [showLinkModal, setShowLinkModal] = useState(false);

    // --- VOICE NOTES STATE ---
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);

    // --- DELETE CONFIRMATION STATE ---
    const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

    // --- SONGWRITER MODE STATE ---
    const [isSongwriterMode, setIsSongwriterMode] = useState(false);
    const [selectedSongwriterNotes, setSelectedSongwriterNotes] = useState<string[]>([]);
    const [compositionContent, setCompositionContent] = useState('');
    const [sourceNoteContents, setSourceNoteContents] = useState<{[key:string]: string}>({});
    const scrollSyncRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
    const isSyncingScroll = useRef(false);
    
    // --- LYRICS MODAL STATE ---
    const [showLyricModal, setShowLyricModal] = useState(false);
    const [lyricForm, setLyricForm] = useState({
        title: '',
        userNotes: '',
        content: '',
        musicDescription: ''
    });
    // Expanded music folder state
    const [expandedMusicFolders, setExpandedMusicFolders] = useState<string[]>([]);

    const songwriterColors = ['bg-purple-900/40 border-purple-500', 'bg-teal-900/40 border-teal-500', 'bg-green-900/40 border-green-500', 'bg-orange-900/40 border-orange-500'];
    const songwriterTextColors = ['text-purple-300', 'text-teal-300', 'text-green-300', 'text-orange-300'];
    const songwriterBgSolid = ['bg-purple-600', 'bg-teal-600', 'bg-green-600', 'bg-orange-600'];

    // Songwriter Mode - Scroll Sync Settings
    const [syncScrollEnabled, setSyncScrollEnabled] = useState(true);
    const [syncScrollMode, setSyncScrollMode] = useState<'percentage' | 'paragraph' | 'line'>('percentage');
    const [activeScrollIndex, setActiveScrollIndex] = useState<number | null>(null);

    // Songwriter Mode - Rhyme & Meter Analyzer
    const [showRhymeAnalyzer, setShowRhymeAnalyzer] = useState(false);
    const [rhymeAnalysis, setRhymeAnalysis] = useState<RhymeAnalysis | null>(null);
    const [isAnalyzingRhyme, setIsAnalyzingRhyme] = useState(false);

    // Songwriter Mode - Composition Panel Enhancement
    const [autoNumbering, setAutoNumbering] = useState(true);
    const [compositionSection, setCompositionSection] = useState<string | null>(null);

    const selectedNote = useMemo(() => notes.find(note => note.id === selectedNoteId), [notes, selectedNoteId]);
    
    // Initial data load
    useEffect(() => {
        setIsDataLoaded(false);
        loadDataFromFirestore()
            .then(({ notes, categories }) => {
                setNotes(notes);
                setCategories(categories);
            })
            .catch(error => {
                console.error("Failed to load data from Firestore:", error);
                setToast({ message: "Nepodařilo se načíst data. Zkuste to prosím znovu.", type: 'error' });
            })
            .finally(() => {
                setIsDataLoaded(true);
            });
    }, []);

    // Autosave
    useEffect(() => {
        if (!isDataLoaded) {
            return;
        }

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        setSaveStatus('saving');

        autoSaveTimeoutRef.current = window.setTimeout(() => {
            saveDataToFirestore(notes, categories)
                .then(() => {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                })
                .catch(error => {
                    console.error("Autosave to Firestore failed:", error);
                    setSaveStatus('error');
                    setToast({ message: "Automatické uložení selhalo.", type: 'error' });
                });
        }, 1500);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [notes, categories, isDataLoaded]);


    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (selectedNote) {
            setEditingContent(selectedNote.content);
            setEditingTitle(selectedNote.title);
            setEditingTags(selectedNote.tags || []);
            setTextToAppend('');
        } else {
            setIsEditing(false);
        }
    }, [selectedNoteId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isChatMode]);

    useEffect(() => {
        if (isChatMode && !chatSessionRef.current && notes.length > 0) {
            chatSessionRef.current = initializeChatWithNotes(notes);
            setChatMessages([{ id: 'welcome', role: 'model', text: 'Ahoj! Jsem tvůj osobní asistent. Přečetl jsem všechny tvé poznámky. Na co se chceš zeptat?' }]);
        }
    }, [isChatMode, notes]);


    const handleSaveNote = useCallback(() => {
        if (!selectedNote) return;

        setNotes(prev => {
            const noteToUpdate = prev.find(note => note.id === selectedNoteId);
            if (!noteToUpdate) return prev;
            
            const contentChanged = noteToUpdate.content !== editingContent || noteToUpdate.title !== editingTitle || JSON.stringify(noteToUpdate.tags) !== JSON.stringify(editingTags);
            if (!contentChanged) return prev;

            const newHistory = (noteToUpdate.content !== editingContent)
                ? [noteToUpdate.content, ...(noteToUpdate.history || [])].slice(0, 5)
                : (noteToUpdate.history || []);

            return prev.map(note =>
                note.id === selectedNoteId
                    ? { ...note, title: editingTitle.trim() || "Bez názvu", content: editingContent, tags: editingTags, updatedAt: Date.now(), history: newHistory }
                    : note
            );
        });
        
    }, [selectedNoteId, editingContent, editingTitle, editingTags, setNotes, selectedNote]);

    const handleSetSelectedNote = useCallback((noteId: string | null) => {
        if (isEditing) {
            handleSaveNote();
        }
        setIsEditing(false);
        setTagInput('');
        setSelectedNoteId(noteId);
    }, [isEditing, isChatMode, handleSaveNote]);

    const handleInternalLinkClick = useCallback((noteId: string) => {
        handleSetSelectedNote(noteId);
        // Switch section if necessary based on target note type
        const targetNote = notes.find(n => n.id === noteId);
        if (targetNote && targetNote.type === 'lyric') {
            setActiveSection('music');
        } else {
            setActiveSection('notes');
        }
    }, [handleSetSelectedNote, notes]);
    
    useEffect(() => {
        if (isEditing) {
            handleSaveNote();
        }
    }, [editingContent, editingTitle, editingTags, isEditing, handleSaveNote]);


    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => {
            note.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    }, [notes]);

    const filteredNotes = useMemo(() => {
        // Filter out lyrics in Notes section
        const relevantNotes = activeSection === 'notes' 
            ? notes.filter(n => n.type !== 'lyric')
            : notes.filter(n => n.type === 'lyric');

        const sortedNotes = [...relevantNotes].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return b.updatedAt - a.updatedAt;
        });

        if (searchTerm) {
            return sortedNotes.filter(note =>
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (activeSection === 'notes' && selectedCategoryId !== 'all') {
            return sortedNotes.filter(note => note.categoryId === selectedCategoryId);
        }
        if (activeSection === 'notes' && selectedTag) {
            return sortedNotes.filter(note => note.tags?.includes(selectedTag));
        }
        return sortedNotes;
    }, [notes, selectedCategoryId, searchTerm, selectedTag, activeSection]);
    
    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e: React.DragEvent, noteId: string) => {
        e.dataTransfer.setData('noteId', noteId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedNoteId(noteId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnCategory = (e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        const noteId = e.dataTransfer.getData('noteId');
        if (!noteId) return;

        setNotes(prev => prev.map(note => 
            note.id === noteId 
                ? { ...note, categoryId: categoryId === 'all' ? '' : categoryId, updatedAt: Date.now() } 
                : note
        ));
        
        setDraggedNoteId(null);
        setToast({ message: "Kategorie změněna", type: 'success' });
    };

    const handleDropOnNote = (e: React.DragEvent, targetNoteId: string) => {
        e.preventDefault();
        const droppedNoteId = e.dataTransfer.getData('noteId');
        
        if (!droppedNoteId || droppedNoteId === targetNoteId) return;
        
        const currentList = [...filteredNotes];
        const draggedIndex = currentList.findIndex(n => n.id === droppedNoteId);
        const targetIndex = currentList.findIndex(n => n.id === targetNoteId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentList.splice(draggedIndex, 1);
        currentList.splice(targetIndex, 0, draggedItem);
        
        const reorderedIds = new Set(currentList.map(n => n.id));
        
        setNotes(prev => {
            const otherNotes = prev.filter(n => !reorderedIds.has(n.id));
            const updatedCurrentList = currentList.map((n, index) => ({ ...n, order: index }));
            return [...updatedCurrentList, ...otherNotes];
        });

        setDraggedNoteId(null);
    };
    
    // --- EXISTING HANDLERS ---
    const handleSelectCategory = (categoryId: string) => {
        setSelectedTag(null);
        setSelectedCategoryId(categoryId);
    };

    const handleSelectTag = (tag: string) => {
        setSelectedCategoryId('all');
        setSelectedTag(tag);
    };

    const createNewNote = () => {
        const tempId = `new-${Date.now()}`;
        const newNote: Note = {
            id: tempId,
            title: "Nová poznámka",
            content: "# Nový nadpis\n\nZačněte psát zde...",
            categoryId: selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?.id || ''),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            history: [],
            tags: [],
            order: -1,
            type: 'text'
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedCategoryId(newNote.categoryId);
        handleSetSelectedNote(tempId);
        setIsEditing(true);
        setIsChatMode(false);
        setIsSongwriterMode(false);
    };
    
    // --- MUSIC / LYRICS HANDLERS ---
    const toggleMusicFolder = (folderName: string) => {
        setExpandedMusicFolders(prev => 
            prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]
        );
    };

    const handleSaveLyric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!lyricForm.title.trim() || !lyricForm.content.trim()) {
             setToast({ message: "Vyplňte alespoň název a text písně.", type: 'error' });
             return;
        }

        const newLyric: Note = {
            id: `lyric-${Date.now()}`,
            title: lyricForm.title.trim(),
            content: lyricForm.content,
            categoryId: '', // Lyrics don't strictly need categories from the general list
            createdAt: Date.now(),
            updatedAt: Date.now(),
            history: [],
            tags: [],
            type: 'lyric',
            userNotes: lyricForm.userNotes,
            musicDescription: lyricForm.musicDescription
        };

        setNotes(prev => [newLyric, ...prev]);
        setToast({ message: "Hudební text uložen.", type: 'success' });
        setShowLyricModal(false);
        setLyricForm({ title: '', userNotes: '', content: '', musicDescription: '' });
        
        // Auto-expand the folder for the new lyric
        setExpandedMusicFolders(prev => [...prev, newLyric.title]);
    };

    const handleAIProcess = async () => {
        if (!editingContent.trim()) {
            setError("Nelze zpracovat prázdnou poznámku.");
            return;
        }
        setIsLoadingAI(true);
        setError(null);
        try {
            const result = await processNoteWithAI(editingContent, categories);
            
            let category = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
            if (!category) {
                category = { id: `cat-${Date.now()}`, name: result.category };
                setCategories(prev => [...prev, category!]);
            }
            
            const finalId = `note-${Date.now()}`;

            if (selectedNote && selectedNote.id.startsWith('new-')) {
                 setNotes(prev => prev.map(n => n.id === selectedNote.id ? {
                    ...n,
                    id: finalId,
                    title: result.title,
                    content: result.formattedContent,
                    categoryId: category!.id,
                    tags: result.tags,
                    updatedAt: Date.now(),
                 } : n));
                 handleSetSelectedNote(finalId);
            } else {
                const newNote: Note = {
                    id: finalId,
                    title: result.title,
                    content: result.formattedContent,
                    categoryId: category.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    history: [],
                    tags: result.tags,
                    type: 'text'
                };
                setNotes(prev => [newNote, ...prev]);
                handleSetSelectedNote(newNote.id);
            }
            setIsEditing(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleAIAppend = async () => {
        if (!selectedNote || !textToAppend.trim()) {
            setError("Není co přidat.");
            return;
        }
        setIsAppendingAI(true);
        setError(null);
        try {
            const result = await formatAndAppendTextWithAI(textToAppend, selectedNote.content);
            
            setNotes(prev => {
                const noteToUpdate = prev.find(note => note.id === selectedNoteId);
                if (!noteToUpdate) return prev;
                
                const newHistory = [noteToUpdate.content, ...(noteToUpdate.history || [])].slice(0, 5);
                
                return prev.map(note =>
                    note.id === selectedNoteId
                        ? { ...note, content: `${note.content}\n\n${result.appendedContent}`, updatedAt: Date.now(), history: newHistory }
                        : note
                );
            });
            setTextToAppend('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsAppendingAI(false);
        }
    };

    const confirmDelete = async () => {
        if (!noteToDeleteId) return;

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
            autoSaveTimeoutRef.current = null;
        }

        const noteId = noteToDeleteId;

        try {
            await deleteNoteFromFirestore(noteId);
            
            setNotes(prev => prev.filter(note => note.id !== noteId));
            
            if (selectedNoteId === noteId) {
                setIsEditing(false);
                setTagInput('');
                setSelectedNoteId(null);
            }
            
            setToast({ message: "Položka byla smazána.", type: 'success' });
        } catch (error) {
            console.error("Failed to delete note:", error);
            setToast({ message: "Chyba při mazání.", type: 'error' });
        } finally {
            setNoteToDeleteId(null);
        }
    };


    const handleUndo = () => {
        if (!selectedNote || !selectedNote.history || selectedNote.history.length === 0) {
            return;
        }
        
        const previousContent = selectedNote.history[0];
        const remainingHistory = selectedNote.history.slice(1);

        setNotes(prev => prev.map(note =>
            note.id === selectedNoteId
                ? { ...note, content: previousContent, history: remainingHistory, updatedAt: Date.now() }
                : note
        ));

        if (isEditing) {
            setEditingContent(previousContent);
        }

        setToast({ message: "Poslední změna byla vrácena.", type: 'success' });
    };

     // --- AI QUICK ACTIONS ---
    const closeToolbar = useCallback(() => {
        setToolbarPosition(null);
        setSelection(null);
    }, []);
    
    const handleMouseUp = useCallback(() => {
        if (isAIActionLoading || aiActionResult || isChatMode || isSongwriterMode) return; 

        const currentSelection = window.getSelection();
        if (currentSelection && currentSelection.toString().trim().length > 0 && contentAreaRef.current) {
            const range = currentSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const contentRect = contentAreaRef.current.getBoundingClientRect();
            
            const scrollTop = contentAreaRef.current.scrollTop;
            const scrollLeft = contentAreaRef.current.scrollLeft;
    
            const spaceAbove = rect.top - contentRect.top;
            let topPosition;
    
            if (spaceAbove > TOOLBAR_HEIGHT) {
                topPosition = (rect.top - contentRect.top + scrollTop) - TOOLBAR_HEIGHT;
            } else {
                topPosition = (rect.bottom - contentRect.top + scrollTop) + 8;
            }
    
            setSelection({ text: currentSelection.toString(), range });
            setToolbarPosition({
                top: topPosition,
                left: (rect.left - contentRect.left + scrollLeft) + rect.width / 2,
            });
        } else {
            closeToolbar();
        }
    }, [isAIActionLoading, aiActionResult, closeToolbar, isChatMode, isSongwriterMode]);

    const handleCopyText = async () => {
        if (!selection) return;
        try {
            await navigator.clipboard.writeText(selection.text);
            setToast({ message: "Zkopírováno do schránky", type: 'success' });
            closeToolbar();
        } catch (err) {
            console.error('Failed to copy:', err);
            setToast({ message: "Kopírování se nezdařilo", type: 'error' });
        }
    };
    
    const handleAIAction = async (action: AIAction) => {
        if (!selection || !selectedNote) return;
        
        setIsAIActionLoading(true);
        setActiveAIAction(action);
        setError(null);

        try {
            const result = await performAIQuickAction(selection.text, selectedNote.content, action);
            setAiActionResult(result);
        } catch (e: any) {
            setToast({ message: e.message || 'Akce AI se nezdařila.', type: 'error' });
        } finally {
            setIsAIActionLoading(false);
            closeToolbar();
        }
    };
    
    const handleReplaceText = () => {
        if (!selectedNote || !selection || aiActionResult === null) return;
        
        const originalContent = isEditing ? editingContent : selectedNote.content;
        const newContent = originalContent.replace(selection.text, aiActionResult);

        setNotes(prev => {
            const noteToUpdate = prev.find(n => n.id === selectedNoteId);
            if (!noteToUpdate) return prev;
            const newHistory = [noteToUpdate.content, ...(noteToUpdate.history || [])].slice(0, 5);
            return prev.map(n => n.id === selectedNoteId ? { ...n, content: newContent, updatedAt: Date.now(), history: newHistory } : n);
        });

        if (isEditing) {
            setEditingContent(newContent);
        }

        setAiActionResult(null);
        setActiveAIAction(null);
        setToast({ message: "Text byl aktualizován.", type: 'success' });
    };

    // --- SMART LINKING ---
    const handleFindConnections = async () => {
        if(!selectedNoteId || !editingContent) return;
        setIsLinkingLoading(true);
        try {
            const suggestions = await findSmartConnections(selectedNoteId, editingContent, notes);
            if (suggestions.length === 0) {
                setToast({ message: "Nebyly nalezeny žádné zřejmé souvislosti.", type: 'success' });
            } else {
                setLinkSuggestions(suggestions);
                setShowLinkModal(true);
            }
        } catch (error) {
            setToast({ message: "Chyba při hledání souvislostí.", type: 'error' });
        } finally {
            setIsLinkingLoading(false);
        }
    };

    const handleApplyLink = (suggestion: LinkSuggestion) => {
        const linkMarkdown = `[${suggestion.originalText}](#${suggestion.targetNoteId})`;
        const newContent = editingContent.replace(suggestion.originalText, linkMarkdown);
        setEditingContent(newContent);
        setLinkSuggestions(prev => prev.filter(s => s !== suggestion));
        if(linkSuggestions.length <= 1) {
            setShowLinkModal(false);
        }
        setToast({ message: "Odkaz vytvořen.", type: 'success' });
    };

    // --- VOICE NOTES ---
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                setIsProcessingAudio(true);
                try {
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64String = (reader.result as string).split(',')[1];
                        const mimeType = (reader.result as string).split(',')[0].match(/:(.*?);/)?.[1] || 'audio/webm';
                        
                        try {
                            const result = await createNoteFromAudio(base64String, mimeType, categories);
                            let category = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
                            if (!category) {
                                category = { id: `cat-${Date.now()}`, name: result.category };
                                setCategories(prev => [...prev, category!]);
                            }

                            const newNote: Note = {
                                id: `note-${Date.now()}`,
                                title: result.title,
                                content: result.formattedContent,
                                categoryId: category.id,
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                                history: [],
                                tags: result.tags,
                                type: 'text'
                            };

                            setNotes(prev => [newNote, ...prev]);
                            handleSetSelectedNote(newNote.id);
                            setToast({ message: "Hlasová poznámka vytvořena!", type: 'success' });

                        } catch (e: any) {
                            setToast({ message: e.message || "Chyba při zpracování audia.", type: 'error' });
                        } finally {
                             setIsProcessingAudio(false);
                        }
                    };

                } catch (error) {
                    console.error(error);
                    setToast({ message: "Chyba při zpracování nahrávky.", type: 'error' });
                    setIsProcessingAudio(false);
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            setToast({ message: "Nelze získat přístup k mikrofonu.", type: 'error' });
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    // --- CHAT FUNCTIONS ---
    const toggleChatMode = () => {
        setIsChatMode(!isChatMode);
        setIsSongwriterMode(false);
    };

    const handleSendChatMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        const currentInput = chatInput;
        setChatInput('');
        setIsChatLoading(true);

        if (!chatSessionRef.current) {
            chatSessionRef.current = initializeChatWithNotes(notes);
        }

        try {
            const streamResult = await chatSessionRef.current.sendMessageStream({ message: currentInput });
            const modelMsgId = (Date.now() + 1).toString();
            setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);

            let accumulatedText = '';
            for await (const chunk of streamResult) {
                const c = chunk as GenerateContentResponse;
                const text = c.text;
                if (text) {
                    accumulatedText += text;
                    setChatMessages(prev => prev.map(msg => 
                        msg.id === modelMsgId ? { ...msg, text: accumulatedText } : msg
                    ));
                }
            }
             setChatMessages(prev => prev.map(msg => 
                msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
            ));

        } catch (error: any) {
            console.error("Chat error:", error);
            setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Omlouvám se, došlo k chybě při zpracování odpovědi." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // --- SONGWRITER FUNCTIONS ---
    const startSongwriterSession = () => {
        if (selectedSongwriterNotes.length === 0) {
            setToast({ message: "Vyberte alespoň jednu verzi textu.", type: 'error' });
            return;
        }
        setIsSongwriterMode(true);
        // Clear chat mode if active
        setIsChatMode(false);
        handleSetSelectedNote(null);
        setCompositionContent('');
    };
    
    const closeSongwriterMode = () => {
        setIsSongwriterMode(false);
        setSelectedSongwriterNotes([]);
        setCompositionContent('');
    };

    const toggleSongwriterNoteSelection = (noteId: string) => {
        setSelectedSongwriterNotes(prev => {
            if (prev.includes(noteId)) {
                return prev.filter(id => id !== noteId);
            }
            if (prev.length >= 4) {
                setToast({ message: "Můžete vybrat maximálně 4 verze.", type: 'error' });
                return prev;
            }
            return [...prev, noteId];
        });
    };

    const handleSyncScroll = (e: React.UIEvent<HTMLDivElement>, noteIndex: number) => {
        if (!syncScrollEnabled || isSyncingScroll.current) return;
        isSyncingScroll.current = true;

        const target = e.target as HTMLDivElement;
        let scrollPosition = 0;

        if (syncScrollMode === 'percentage') {
            scrollPosition = target.scrollTop / (target.scrollHeight - target.clientHeight);
            
            (Object.values(scrollSyncRefs.current) as (HTMLDivElement | null)[]).forEach((ref, idx) => {
                if (ref && ref !== target) {
                    ref.scrollTop = scrollPosition * (ref.scrollHeight - ref.clientHeight);
                }
            });
        } 
        else if (syncScrollMode === 'paragraph') {
            const paragraphs = target.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, br');
            let currentParagraphIndex = 0;
            
            for (let i = 0; i < paragraphs.length; i++) {
                const rect = paragraphs[i].getBoundingClientRect();
                const containerRect = target.getBoundingClientRect();
                if (rect.top >= containerRect.top) {
                    currentParagraphIndex = i;
                    break;
                }
            }

            (Object.values(scrollSyncRefs.current) as (HTMLDivElement | null)[]).forEach((ref) => {
                if (ref && ref !== target) {
                    const refParagraphs = ref.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, br');
                    if (refParagraphs[currentParagraphIndex]) {
                        refParagraphs[currentParagraphIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
                    }
                }
            });
        }
        else if (syncScrollMode === 'line') {
            const LINE_HEIGHT = 24;
            const currentLine = Math.floor(target.scrollTop / LINE_HEIGHT);

            (Object.values(scrollSyncRefs.current) as (HTMLDivElement | null)[]).forEach((ref) => {
                if (ref && ref !== target) {
                    ref.scrollTop = currentLine * LINE_HEIGHT;
                }
            });
        }

        setActiveScrollIndex(noteIndex);

        setTimeout(() => { 
            isSyncingScroll.current = false; 
            setTimeout(() => setActiveScrollIndex(null), 1000);
        }, 50);
    };

    const addTextToComposition = (text: string, noteId: string, colorIndex: number) => {
        const span = `<span class="${songwriterTextColors[colorIndex]} bg-gray-800/50 px-1 rounded mx-1 font-medium" contenteditable="false" data-source="${noteId}">${text}</span> `;
        setCompositionContent(prev => prev + span);
        
        const highlightSpan = `<span class="${songwriterBgSolid[colorIndex]} text-white px-1 rounded">${text}</span>`;
        const safeText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        setSourceNoteContents(prev => ({
            ...prev,
            [noteId]: (prev[noteId] || notes.find(n => n.id === noteId)?.content || '').replace(text, highlightSpan) 
        }));
        
        setToast({ message: "Text přidán do kompozice", type: 'success' });
    };

    // --- LOCALSTORAGE AUTO-SAVE FOR COMPOSITION ---
    const STORAGE_KEY = 'songwriter_composition_autosave';

    const saveCompositionToLocalStorage = useCallback(() => {
        if (isSongwriterMode && compositionContent) {
            const data = {
                content: compositionContent,
                selectedNotes: selectedSongwriterNotes,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }, [isSongwriterMode, compositionContent, selectedSongwriterNotes]);

    const loadCompositionFromLocalStorage = useCallback(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.content && data.selectedNotes) {
                    return data;
                }
            } catch (e) {
                console.error("Failed to load composition from localStorage", e);
            }
        }
        return null;
    }, []);

    const clearCompositionLocalStorage = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!isSongwriterMode) return;
        
        const interval = setInterval(() => {
            saveCompositionToLocalStorage();
            setToast({ message: "Kompozice uložena do LocalStorage", type: 'success' });
        }, 30000);

        return () => clearInterval(interval);
    }, [isSongwriterMode, saveCompositionToLocalStorage]);

    // Load composition when entering songwriter mode
    useEffect(() => {
        if (isSongwriterMode) {
            const saved = loadCompositionFromLocalStorage();
            if (saved && saved.content) {
                setCompositionContent(saved.content);
                setSelectedSongwriterNotes(saved.selectedNotes || []);
                setToast({ message: "Kompozice obnovena z automatického uložení", type: 'success' });
            }
        }
    }, [isSongwriterMode, loadCompositionFromLocalStorage]);

    // Clear storage when closing composer
    useEffect(() => {
        if (!isSongwriterMode) {
            clearCompositionLocalStorage();
        }
    }, [isSongwriterMode, clearCompositionLocalStorage]);

    // --- RHYME & METER ANALYZER ---
    const handleAnalyzeRhyme = async () => {
        if (selectedSongwriterNotes.length === 0) {
            setToast({ message: "Vyberte alespoň jednu verzi textu.", type: 'error' });
            return;
        }

        const combinedLyrics = selectedSongwriterNotes
            .map(noteId => notes.find(n => n.id === noteId)?.content || '')
            .join('\n\n---\n\n');

        if (!combinedLyrics.trim()) {
            setToast({ message: "Vybrané poznámky neobsahují žádný text.", type: 'error' });
            return;
        }

        setIsAnalyzingRhyme(true);
        setShowRhymeAnalyzer(true);
        setRhymeAnalysis(null);

        try {
            const result = await analyzeLyricsRhymeAndMeter(combinedLyrics);
            setRhymeAnalysis(result);
        } catch (error) {
            console.error("Rhyme analysis error:", error);
            setToast({ message: "Chyba analýzy. Zkuste to znovu.", type: 'error' });
        } finally {
            setIsAnalyzingRhyme(false);
        }
    };


    // --- CATEGORY MANAGEMENT ---
    const handleStartEditingCategory = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    const handleCancelEditingCategory = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const handleSaveCategoryRename = () => {
        if (!editingCategoryId) return;

        const trimmedName = editingCategoryName.trim();
        if (!trimmedName) {
            setToast({ message: "Název kategorie nemůže být prázdný.", type: 'error' });
            return;
        }

        const isDuplicate = categories.some(
            cat => cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.id !== editingCategoryId
        );

        if (isDuplicate) {
            setToast({ message: "Kategorie s tímto názvem již existuje.", type: 'error' });
            return;
        }

        setCategories(prev =>
            prev.map(cat => (cat.id === editingCategoryId ? { ...cat, name: trimmedName } : cat))
        );
        setToast({ message: "Kategorie byla přejmenována.", type: 'success' });
        handleCancelEditingCategory();
    };

    const handleDeleteCategory = (categoryId: string) => {
        const categoryName = categories.find(c => c.id === categoryId)?.name;
        if (!window.confirm(`Opravdu chcete smazat kategorii "${categoryName}"? Všechny poznámky v ní budou nezařazené.`)) {
            return;
        }
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setNotes(prev =>
            prev.map(note => (note.categoryId === categoryId ? { ...note, categoryId: '' } : note))
        );
        if (selectedCategoryId === categoryId) {
            setSelectedCategoryId('all');
        }
        setToast({ message: `Kategorie "${categoryName}" byla smazána.`, type: 'success' });
    };

    // --- TAG MANAGEMENT ---
    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
            if (newTag && !editingTags.includes(newTag)) {
                setEditingTags([...editingTags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeEditingTag = (tagToRemove: string) => {
        setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
    };

    const handleCancelEditing = () => {
        if (selectedNote) {
            setEditingContent(selectedNote.content);
            setEditingTitle(selectedNote.title);
            setEditingTags(selectedNote.tags || []);
        }
        setIsEditing(false);
    };


    const renderContent = () => {
        if (!isDataLoaded) {
             return (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <div className="w-16 h-16 border-4 border-t-cyan-400 border-gray-600 rounded-full animate-spin"></div>
                    <h2 className="text-2xl font-semibold mt-6">Načítám sdílená data...</h2>
                </div>
            );
        }

        // --- SONGWRITER STUDIO RENDER ---
        if (isSongwriterMode) {
             const isGridMode = selectedSongwriterNotes.length > 2;
             
              return (
                  <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
                      <header className="h-auto min-h-[56px] bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 py-2 flex-wrap gap-2">
                          <div className="flex items-center text-gray-200 font-bold">
                              <MusicIcon className="mr-2 text-purple-500" /> Studio Skladatele
                          </div>
                          
                          {/* Scroll Sync Controls */}
                          <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                                  <span className="text-xs text-gray-400">Sync:</span>
                                  <button 
                                      onClick={() => setSyncScrollEnabled(!syncScrollEnabled)}
                                      className={`text-xs px-2 py-0.5 rounded transition ${syncScrollEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                  >
                                      {syncScrollEnabled ? 'ON' : 'OFF'}
                                  </button>
                              </div>
                              
                              <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
                                  <span className="text-xs text-gray-400 mr-1">Režim:</span>
                                  <button 
                                      onClick={() => setSyncScrollMode('percentage')}
                                      className={`text-xs px-2 py-0.5 rounded transition ${syncScrollMode === 'percentage' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                      title="Synchronizace podle procenta délky"
                                  >
                                      %
                                  </button>
                                  <button 
                                      onClick={() => setSyncScrollMode('paragraph')}
                                      className={`text-xs px-2 py-0.5 rounded transition ${syncScrollMode === 'paragraph' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                      title="Synchronizace podle odstavce"
                                  >
                                      ¶
                                  </button>
                                  <button 
                                      onClick={() => setSyncScrollMode('line')}
                                      className={`text-xs px-2 py-0.5 rounded transition ${syncScrollMode === 'line' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                      title="Synchronizace podle řádku"
                                  >
                                      ≡
                                  </button>
                              </div>

                              <button 
                                  onClick={handleAnalyzeRhyme}
                                  disabled={isAnalyzingRhyme}
                                  className="text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-1.5 rounded transition flex items-center gap-1"
                              >
                                  {isAnalyzingRhyme ? (
                                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"/>
                                  ) : (
                                      <>
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                          Analýza
                                      </>
                                  )}
                              </button>
                          </div>
                          
                          <button onClick={closeSongwriterMode} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded transition">
                              <XIcon className="inline w-4 h-4 mr-1"/> Zavřít studio
                          </button>
                          </header>

                      {/* Rhyme Analyzer Panel */}
                      {showRhymeAnalyzer && (
                          <div className="bg-gray-800 border-b border-gray-700 p-4 max-h-[40vh] overflow-y-auto">
                              <div className="flex justify-between items-center mb-3">
                                  <h3 className="text-lg font-bold text-purple-400 flex items-center">
                                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                      </svg>
                                      Analýza rýmů a metriky
                                  </h3>
                                  <button 
                                      onClick={() => setShowRhymeAnalyzer(false)}
                                      className="text-gray-400 hover:text-white"
                                  >
                                      <XIcon className="w-5 h-5" />
                                  </button>
                              </div>

                              {isAnalyzingRhyme ? (
                                  <div className="flex items-center justify-center py-8">
                                      <div className="w-8 h-8 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin mr-3"></div>
                                      <span className="text-gray-400">Analyzuji text...</span>
                                  </div>
                              ) : rhymeAnalysis ? (
                                  <div className="space-y-4">
                                      {/* Stats */}
                                      <div className="grid grid-cols-3 gap-3">
                                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                                              <div className="text-2xl font-bold text-cyan-400">{rhymeAnalysis.stats.totalLines}</div>
                                              <div className="text-xs text-gray-400">Řádků</div>
                                          </div>
                                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                                              <div className="text-2xl font-bold text-green-400">{rhymeAnalysis.stats.rhymedLines}</div>
                                              <div className="text-xs text-gray-400">Zrymováno</div>
                                          </div>
                                          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                                              <div className="text-lg font-bold text-purple-400">{rhymeAnalysis.stats.rhymeScheme || 'N/A'}</div>
                                              <div className="text-xs text-gray-400">Schéma</div>
                                          </div>
                                      </div>

                                      {/* Meter */}
                                      <div className="bg-gray-700/30 rounded-lg p-3">
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="text-sm font-bold text-yellow-400">Metrika:</span>
                                              <span className="text-white">{rhymeAnalysis.meter.pattern || 'Neuvedeno'}</span>
                                          </div>
                                          {rhymeAnalysis.meter.syllables && rhymeAnalysis.meter.syllables.length > 0 && (
                                              <div className="text-xs text-gray-400 mb-2">
                                                  Slabiky: {rhymeAnalysis.meter.syllables.slice(0, 20).join(', ')}{rhymeAnalysis.meter.syllables.length > 20 ? '...' : ''}
                                              </div>
                                          )}
                                          {rhymeAnalysis.meter.suggestions && rhymeAnalysis.meter.suggestions.length > 0 && (
                                              <div className="mt-2">
                                                  <span className="text-xs text-gray-500 block mb-1">Návrhy:</span>
                                                  <ul className="text-sm text-gray-300 space-y-1">
                                                      {rhymeAnalysis.meter.suggestions.map((suggestion, i) => (
                                                          <li key={i} className="flex items-start gap-2">
                                                              <span className="text-cyan-400">•</span>
                                                              {suggestion}
                                                          </li>
                                                      ))}
                                                  </ul>
                                              </div>
                                          )}
                                      </div>

                                      {/* Rhymes */}
                                      {rhymeAnalysis.rhymes && rhymeAnalysis.rhymes.length > 0 && (
                                          <div className="bg-gray-700/30 rounded-lg p-3">
                                              <span className="text-sm font-bold text-pink-400 block mb-2">Rýmy:</span>
                                              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                                  {rhymeAnalysis.rhymes.slice(0, 10).map((rhyme, i) => (
                                                      <div key={i} className="flex items-center gap-2 text-sm">
                                                          <span className="text-white font-medium">řádek {rhyme.line}:</span>
                                                          <span className="text-pink-300">{rhyme.word}</span>
                                                          {rhyme.rhymeWith && rhyme.rhymeWith.length > 0 && (
                                                              <span className="text-gray-400">
                                                                  ↔ {rhyme.rhymeWith.map(r => `${r.word} (${r.type})`).join(', ')}
                                                              </span>
                                                          )}
                                                      </div>
                                                  ))}
                                                  {rhymeAnalysis.rhymes.length > 10 && (
                                                      <div className="text-xs text-gray-500">... a další ({rhymeAnalysis.rhymes.length - 10})</div>
                                                  )}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              ) : (
                                  <div className="text-center py-4 text-gray-500">
                                      Pro zobrazení analýzy klikněte na tlačítko "Analýza"
                                  </div>
                              )}
                          </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        <div className={`h-full ${isGridMode ? 'grid grid-cols-2 grid-rows-2 border-b md:border-b-0 md:border-r border-gray-800' : 'flex flex-col md:flex-row border-b md:border-b-0 md:border-r border-gray-800'}`}>
                             {selectedSongwriterNotes.map((noteId, index) => {
                                 const note = notes.find(n => n.id === noteId);
                                 if (!note) return null;
                                 
                                  return (
                                      <div key={noteId} className={`flex flex-col border-gray-800 overflow-hidden relative ${songwriterColors[index]} ${isGridMode ? 'border-b border-r' : 'flex-1 border-r min-w-[300px]'}`}>
                                          {/* Active Scroll Indicator */}
                                          {activeScrollIndex === index && (
                                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                                          )}
                                          <div 
                                              className="flex-1 overflow-y-auto p-4 custom-scrollbar relative group pb-10"
                                              onScroll={(e) => handleSyncScroll(e, index)}
                                              ref={(el) => { scrollSyncRefs.current[noteId] = el; }}
                                          >
                                             {/* Floating Action Button for Selection */}
                                             <SongwriterSourceToolbar 
                                                onAdd={() => {
                                                    const selection = window.getSelection();
                                                    if (selection) addTextToComposition(selection.toString(), noteId, index);
                                                }}
                                                onCopy={async () => {
                                                    const selection = window.getSelection();
                                                    if (selection) await navigator.clipboard.writeText(selection.toString());
                                                    setToast({ message: "Zkopírováno", type: 'success' });
                                                }}
                                             />
                                             <SimpleMarkdownRenderer content={sourceNoteContents[noteId] || note.content} />
                                         </div>
                                         <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2 text-xs flex justify-between items-center text-gray-400 border-t border-gray-700/30 backdrop-blur-sm">
                                             <span className="font-bold text-gray-200 truncate pr-2">{note.title}</span>
                                             <span className="whitespace-nowrap flex items-center"><ClockIcon className="mr-1 h-3 w-3"/> {formatDate(note.updatedAt)}</span>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                     </div>

                      {/* Composition Area */}
                      <div className="h-1/3 bg-gray-900 border-t-2 border-purple-900/50 flex flex-col shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                          {/* Toolbar */}
                          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-b border-gray-700">
                              <div className="flex items-center gap-4">
                                  <span className="font-bold text-purple-400">FINÁLNÍ KOMPOZICE</span>
                                  
                                  {/* Formatting Tools */}
                                  <div className="flex items-center gap-1">
                                      <span className="text-gray-500 mr-1">Nástroje:</span>
                                      <button 
                                          onClick={() => {
                                              const marker = autoNumbering ? `[SLOKA ${((compositionContent.match(/\[SLOKA /g) || []).length) + 1}]` : '[SLOKA]';
                                              setCompositionContent(prev => prev + '\n\n' + marker + '\n');
                                          }}
                                          className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600 text-blue-200 rounded text-xs transition"
                                          title="Přidat sloku"
                                      >
                                          Sloka
                                      </button>
                                      <button 
                                          onClick={() => {
                                              const marker = autoNumbering ? `[REFRÉN ${((compositionContent.match(/\[REFRÉN /g) || []).length) + 1}]` : '[REFRÉN]';
                                              setCompositionContent(prev => prev + '\n\n' + marker + '\n');
                                          }}
                                          className="px-2 py-1 bg-pink-600/50 hover:bg-pink-600 text-pink-200 rounded text-xs transition"
                                          title="Přidat refrén"
                                      >
                                          Refrén
                                      </button>
                                      <button 
                                          onClick={() => {
                                              const marker = '[MOST]';
                                              setCompositionContent(prev => prev + '\n\n' + marker + '\n');
                                          }}
                                          className="px-2 py-1 bg-yellow-600/50 hover:bg-yellow-600 text-yellow-200 rounded text-xs transition"
                                          title="Přidat most"
                                      >
                                          Most
                                      </button>
                                      <button 
                                          onClick={() => {
                                              setCompositionContent(prev => prev + '\n');
                                          }}
                                          className="px-2 py-1 bg-gray-600/50 hover:bg-gray-600 text-gray-200 rounded text-xs transition"
                                          title="Nový řádek"
                                      >
                                          ↩
                                      </button>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  {/* Auto-numbering toggle */}
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          checked={autoNumbering}
                                          onChange={(e) => setAutoNumbering(e.target.checked)}
                                          className="rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-400"
                                      />
                                      <span>Automatické číslování</span>
                                  </label>
                                  
                                  {/* Manual save button */}
                                  <button 
                                      onClick={saveCompositionToLocalStorage}
                                      className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded text-xs transition flex items-center gap-1"
                                      title="Uložit nyní"
                                  >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                      </svg>
                                      Uložit
                                  </button>
                              </div>
                          </div>
                          
                          {/* Editor */}
                          <div 
                             className="flex-1 p-4 overflow-y-auto focus:outline-none text-gray-200 font-mono text-sm leading-relaxed whitespace-pre-wrap"
                             contentEditable
                             suppressContentEditableWarning
                             onInput={(e) => setCompositionContent(e.currentTarget.textContent || '')}
                          >
                              {compositionContent}
                          </div>
                      </div>
                 </div>
             );
        }

        // --- MUSIC SECTION FOLDER VIEW ---
        if (activeSection === 'music' && !selectedNoteId && !isChatMode) {
            const lyricNotes = notes.filter(n => n.type === 'lyric');
            const groupedLyrics = groupNotesByTitle(lyricNotes);

            return (
                <div className="flex flex-col h-full bg-gray-900 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto w-full">
                         <div className="flex items-center justify-between mb-8">
                             <div>
                                 <h2 className="text-3xl font-bold text-white flex items-center">
                                     <MusicIcon className="mr-3 text-purple-400" /> Hudební Texty
                                 </h2>
                                 <p className="text-gray-400 mt-1">Ukládejte texty, akordy a poznámky k vaší hudbě.</p>
                             </div>
                             
                             <div className="flex gap-3">
                                 {selectedSongwriterNotes.length > 0 && (
                                     <button 
                                         onClick={startSongwriterSession}
                                         className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center animate-pulse"
                                     >
                                         <MusicIcon className="mr-2 h-5 w-5"/>
                                         Skladatel ({selectedSongwriterNotes.length})
                                     </button>
                                 )}
                                 <button 
                                     onClick={() => setShowLyricModal(true)}
                                     className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center"
                                 >
                                     <PlusIcon className="mr-2 h-5 w-5"/>
                                     Přidat hudební text
                                 </button>
                             </div>
                         </div>
                         
                         {groupedLyrics.length === 0 ? (
                             <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-2xl">
                                 <MusicIcon className="w-16 h-16 mx-auto text-gray-600 mb-4"/>
                                 <p className="text-gray-400 text-lg">Zatím zde nejsou žádné texty.</p>
                                 <button onClick={() => setShowLyricModal(true)} className="mt-4 text-cyan-400 hover:text-cyan-300">Vytvořit první text</button>
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 gap-6">
                                 {groupedLyrics.map(([title, groupNotes]) => (
                                     <div key={title} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                         <div 
                                             className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
                                             onClick={() => toggleMusicFolder(title)}
                                         >
                                             <div className="flex items-center">
                                                 <FolderIcon className={`w-6 h-6 mr-3 ${expandedMusicFolders.includes(title) ? 'text-purple-400' : 'text-gray-500'}`} />
                                                 <div>
                                                     <h3 className="font-bold text-lg text-gray-200">{title}</h3>
                                                     <p className="text-xs text-gray-500">{groupNotes.length} {groupNotes.length === 1 ? 'verze' : (groupNotes.length > 1 && groupNotes.length < 5 ? 'verze' : 'verzí')}</p>
                                                 </div>
                                             </div>
                                             <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedMusicFolders.includes(title) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                         </div>
                                         
                                         {expandedMusicFolders.includes(title) && (
                                             <div className="border-t border-gray-700 bg-gray-900/50 p-2 space-y-2">
                                                 {groupNotes.map(note => (
                                                     <div key={note.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700 group">
                                                         <div className="flex items-center flex-1 cursor-pointer" onClick={() => handleSetSelectedNote(note.id)}>
                                                             <div className="mr-3 p-2 bg-gray-800 rounded-lg text-purple-300">
                                                                 <DocumentTextIcon className="w-5 h-5"/>
                                                             </div>
                                                             <div className="flex-1 min-w-0">
                                                                 <div className="flex items-center gap-2">
                                                                     <h4 className="font-medium text-gray-200 truncate">Verze z {formatDate(note.createdAt)}</h4>
                                                                     {note.tags && note.tags.length > 0 && <span className="text-[10px] bg-gray-700 px-1.5 rounded text-gray-400">{note.tags[0]}</span>}
                                                                 </div>
                                                                 {note.userNotes && (
                                                                    <p className="text-sm text-gray-400 truncate mt-0.5">{note.userNotes}</p>
                                                                 )}
                                                                 {!note.userNotes && (
                                                                     <p className="text-sm text-gray-500 truncate mt-0.5 opacity-60">Bez poznámky...</p>
                                                                 )}
                                                             </div>
                                                         </div>
                                                         <div className="flex items-center gap-2">
                                                             <div onClick={(e) => e.stopPropagation()} className="flex items-center px-3 py-1 rounded bg-gray-800 border border-gray-700">
                                                                 <input 
                                                                     type="checkbox" 
                                                                     id={`cb-${note.id}`}
                                                                     checked={selectedSongwriterNotes.includes(note.id)}
                                                                     onChange={() => toggleSongwriterNoteSelection(note.id)}
                                                                     className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                                 />
                                                                 <label htmlFor={`cb-${note.id}`} className="ml-2 text-xs text-gray-400 cursor-pointer select-none">Vybrat pro Skladatele</label>
                                                             </div>
                                                             <button 
                                                                 onClick={(e) => { e.stopPropagation(); setNoteToDeleteId(note.id); }}
                                                                 className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                             >
                                                                 <TrashIcon className="w-4 h-4"/>
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                </div>
            );
        }

        // --- CHAT VIEW ---
        if (isChatMode) {
            return (
                <div className="flex flex-col h-full bg-gray-850">
                    <header className="p-4 border-b border-gray-700 bg-gray-800/80 flex justify-between items-center">
                        <div className="flex items-center">
                             <div className="p-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg mr-3 shadow-lg shadow-purple-500/20">
                                 <ChatIcon className="text-white w-6 h-6" />
                             </div>
                             <div>
                                 <h2 className="text-xl font-bold text-gray-100">AI Asistent</h2>
                                 <p className="text-xs text-gray-400">Zeptejte se na cokoliv ze svých {notes.length} poznámek</p>
                             </div>
                        </div>
                        <button onClick={toggleChatMode} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-cyan-600 text-white rounded-br-none' 
                                        : 'bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600'
                                }`}>
                                    <SimpleMarkdownRenderer content={msg.text} onLinkClick={handleInternalLinkClick} />
                                    {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle"></span>}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-700 bg-gray-800">
                        <form onSubmit={handleSendChatMessage} className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ptejte se na své poznámky..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                disabled={isChatLoading}
                            />
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || isChatLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
                            >
                                {isChatLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"/> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        // --- SINGLE NOTE/LYRIC VIEW ---
        if (selectedNote) {
            return (
                 <>
                    <header className="p-4 flex justify-between items-center border-b border-gray-700 bg-gray-800/50">
                        <div className="flex-grow min-w-0">
                           {isEditing ? (
                                <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={e => setEditingTitle(e.target.value)}
                                    className="text-2xl font-bold text-gray-100 bg-gray-700/50 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Zadejte název poznámky"
                                />
                           ) : (
                            <h2 className="text-2xl font-bold text-gray-100 truncate">{selectedNote.title}</h2>
                           )}
                           <div className="flex items-center mt-2 flex-wrap gap-x-4 gap-y-2">
                                <p className="text-sm text-gray-400">
                                    {selectedNote.type === 'lyric' 
                                        ? 'Hudební text' 
                                        : (categories.find(c => c.id === selectedNote.categoryId)?.name || 'Nezařazeno')
                                    }
                                </p>
                                <div className="flex items-center flex-wrap gap-2">
                                    {selectedNote.tags?.map(tag => (
                                        <div key={tag} className="flex items-center bg-gray-700 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                                            <span>{tag}</span>
                                        </div>
                                    ))}
                                </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 pl-4">
                            <div className="text-sm text-gray-400 mr-2 italic transition-opacity duration-300 hidden md:block">
                                {saveStatus === 'saving' && 'Ukládám...'}
                                {saveStatus === 'saved' && 'Uloženo ✓'}
                                {saveStatus === 'error' && 'Chyba ukládání!'}
                            </div>
                            <button onClick={toggleChatMode} className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 hover:opacity-90 transition shadow-lg shadow-cyan-500/20" title="Otevřít AI Asistenta">
                                <BrainIcon />
                            </button>
                            <div className="w-px h-8 bg-gray-700 mx-2"></div>
                            <button
                                onClick={handleUndo}
                                disabled={!selectedNote.history?.length}
                                className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Vrátit změnu"
                                title="Vrátit poslední změnu"
                            >
                                <UndoIcon />
                            </button>
                           {isEditing ? (
                                <>
                                    <button 
                                        onClick={handleFindConnections} 
                                        disabled={isLinkingLoading}
                                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50" 
                                        title="Najít souvislosti a prolinkovat"
                                    >
                                        {isLinkingLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <LinkIcon />}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition" title="Dokončit úpravy"><SaveIcon /></button>
                                    <button onClick={handleCancelEditing} className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition">Zrušit</button>
                                </>
                           ) : (
                                <button onClick={() => setIsEditing(true)} className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"><EditIcon /></button>
                           )}
                            <button onClick={(e) => { e.stopPropagation(); setNoteToDeleteId(selectedNote.id); }} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition"><TrashIcon /></button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 relative" ref={contentAreaRef} onMouseUp={handleMouseUp} onMouseDownCapture={e => { if(toolbarPosition && e.target === contentAreaRef.current) closeToolbar() }}>
                         {toolbarPosition && (
                            <div
                                className="absolute flex items-center space-x-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg p-1 z-10 shadow-lg"
                                style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px`, transform: 'translateX(-50%)' }}
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseUp={(e) => e.stopPropagation()}
                            >
                                <button 
                                    onClick={handleCopyText}
                                    title="Zkopírovat"
                                    className="p-2 rounded-md hover:bg-cyan-500/20 text-gray-300"
                                >
                                    <CopyIcon className="h-5 w-5" />
                                </button>
                                <div className="w-px h-4 bg-gray-600 mx-1"></div>
                                {[
                                    { action: 'summarize', icon: SummarizeIcon, title: 'Shrnout' },
                                    { action: 'fix_grammar', icon: GrammarIcon, title: 'Opravit gramatiku' },
                                    { action: 'translate_en', icon: TranslateIcon, title: 'Přeložit do EN' },
                                ].map(({ action, icon: Icon, title }) => (
                                    <button
                                        key={action}
                                        title={title}
                                        onClick={() => handleAIAction(action as AIAction)}
                                        disabled={isAIActionLoading}
                                        className="p-2 rounded-md hover:bg-cyan-500/20 text-gray-300 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {isAIActionLoading && activeAIAction === action ? <div className="h-5 w-5 border-2 border-t-cyan-400 border-gray-600 rounded-full animate-spin"></div> : <Icon className="h-5 w-5" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
                        
                        {/* Specific display for Lyric Fields if in Lyric Mode and NOT editing */}
                        {selectedNote.type === 'lyric' && !isEditing && (
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Poznámky autora</h4>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedNote.userNotes || "Bez poznámek"}</p>
                                </div>
                                <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Popis hudby</h4>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedNote.musicDescription || "Bez popisu hudby"}</p>
                                </div>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="h-full flex flex-col">
                                <textarea
                                    value={editingContent}
                                    onChange={e => setEditingContent(e.target.value)}
                                    className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm"
                                    placeholder={selectedNote.type === 'lyric' ? "Zadejte text písně..." : "Zadejte svůj text..."}
                                />
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Tagy</label>
                                    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-800 border border-gray-600 rounded-lg">
                                        {editingTags.map(tag => (
                                            <div key={tag} className="flex items-center bg-gray-600 text-gray-200 text-sm px-2 py-1 rounded-md">
                                                <span>{tag}</span>
                                                <button onClick={() => removeEditingTag(tag)} className="ml-2 text-gray-400 hover:text-white">
                                                    <XIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={handleTagInputChange}
                                            onKeyDown={handleTagInputKeyDown}
                                            placeholder={editingTags.length > 0 ? "Přidat další..." : "Přidat tagy (Enter pro potvrzení)..."}
                                            className="bg-transparent flex-grow p-1 focus:outline-none text-sm min-w-[150px]"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end items-center">
                                   <button 
                                        onClick={handleAIProcess}
                                        disabled={isLoadingAI}
                                        className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-purple-800 disabled:cursor-not-allowed"
                                    >
                                       <BrainIcon className={`h-5 w-5 mr-2 ${isLoadingAI ? 'animate-spin' : ''}`} />
                                       {isLoadingAI ? 'Zpracovávám...' : 'Uspořádat s AI'}
                                   </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <SimpleMarkdownRenderer content={selectedNote.content} onLinkClick={handleInternalLinkClick} />
                                <div className="mt-6 pt-6 border-t border-gray-700">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-300">Rychlé přidání obsahu</h3>
                                    <textarea
                                        value={textToAppend}
                                        onChange={e => setTextToAppend(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm"
                                        rows={5}
                                        placeholder="Vložte sem text, který chcete přidat k poznámce..."
                                    />
                                    <div className="mt-3 flex justify-end items-center">
                                        
                                        <button
                                            onClick={handleAIAppend}
                                            disabled={isAppendingAI || !textToAppend.trim()}
                                            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-teal-800 disabled:cursor-not-allowed"
                                        >
                                            <SparklesIcon className={`h-5 w-5 mr-2 ${isAppendingAI ? 'animate-pulse' : ''}`} />
                                            {isAppendingAI ? 'Přidávám...' : 'Přidat a formátovat s AI'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            );
        }
        
        // Default (Select Note Placeholder) - Only show if active section is notes and nothing is selected
        if (activeSection === 'notes') {
            return (
                 <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative">
                    <div className="absolute top-4 right-4">
                        <button onClick={toggleChatMode} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg shadow-lg hover:scale-105 transition">
                            <BrainIcon /> <span>Otevřít AI Asistenta</span>
                        </button>
                    </div>
                    <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <h2 className="text-2xl font-semibold">Vyberte poznámku</h2>
                    <p>... nebo vytvořte novou a nechte AI, aby ji uspořádala.</p>
                </div>
            );
        }
        
        // Fallback
        return null;
    };


    return (
        <div className="flex h-screen font-sans bg-gray-900 text-gray-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800/50 flex flex-col p-4 border-r border-gray-700 flex-shrink-0 hidden md:flex">
                <h1 className="text-2xl font-bold text-cyan-400 mb-6 tracking-tight">Chytrý Zápisník</h1>
                
                {/* Navigation Toggle */}
                <div className="flex mb-6 bg-gray-800 p-1 rounded-lg border border-gray-600">
                    <button 
                        onClick={() => { setActiveSection('notes'); handleSetSelectedNote(null); }}
                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition ${activeSection === 'notes' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Poznámky
                    </button>
                    <button 
                        onClick={() => { setActiveSection('music'); handleSetSelectedNote(null); }}
                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition ${activeSection === 'music' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Hudba/Texty
                    </button>
                </div>

                {activeSection === 'notes' ? (
                    <>
                        <button
                            onClick={createNewNote}
                            className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mb-4 shadow-md shadow-cyan-900/20"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Nová Poznámka
                        </button>
                        
                        <button
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            disabled={isProcessingAudio}
                            className={`flex items-center justify-center w-full font-bold py-2 px-4 rounded-lg transition duration-200 mb-6 shadow-md border ${
                                isRecording 
                                    ? 'bg-red-600 border-red-500 animate-pulse text-white' 
                                    : isProcessingAudio 
                                        ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-wait' 
                                        : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-cyan-300'
                            }`}
                        >
                            {isRecording ? (
                                <>
                                    <StopIcon className="h-5 w-5 mr-2" />
                                    Stop
                                </>
                            ) : isProcessingAudio ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin mr-2"></div>
                                    Zpracovávám
                                </>
                            ) : (
                                <>
                                    <MicIcon className="h-5 w-5 mr-2" />
                                    Hlasová p.
                                </>
                            )}
                        </button>

                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Kategorie</h2>
                        <nav className="flex-grow overflow-y-auto -mr-2 pr-2 custom-scrollbar">
                            <div
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnCategory(e, 'all')}
                                className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${selectedCategoryId === 'all' && !selectedTag ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-gray-700/50'}`}
                                onClick={(e) => { e.preventDefault(); handleSelectCategory('all'); }}
                            >
                                Všechny poznámky
                            </div>
                            {categories.map(cat => (
                                <div key={cat.id} className="relative group mt-1" onDragOver={handleDragOver} onDrop={(e) => handleDropOnCategory(e, cat.id)}>
                                    {editingCategoryId === cat.id ? (
                                        <div className="flex items-center w-full bg-gray-700 rounded-md">
                                            <input 
                                                type="text"
                                                value={editingCategoryName}
                                                onChange={e => setEditingCategoryName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveCategoryRename()}
                                                onBlur={handleCancelEditingCategory}
                                                className="flex-grow bg-transparent py-2 px-3 text-sm text-cyan-300 focus:outline-none"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveCategoryRename} className="p-2 text-green-400 hover:text-green-300"><SaveIcon className="h-4 w-4"/></button>
                                            <button onClick={handleCancelEditingCategory} className="p-2 text-gray-400 hover:text-gray-200"><XIcon className="h-4 w-4"/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <a
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handleSelectCategory(cat.id); }}
                                                className={`block w-full py-2 px-3 rounded-md text-sm font-medium truncate transition-colors ${selectedCategoryId === cat.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-gray-700/50'}`}
                                            >
                                                {cat.name}
                                            </a>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-gray-700/80 rounded-md">
                                                <button onClick={() => handleStartEditingCategory(cat)} className="p-1.5 text-gray-300 hover:text-cyan-300 transition-colors" title="Přejmenovat kategorii">
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors" title="Smazat kategorii">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                             <div className="mt-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tagy</h2>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleSelectTag(tag)}
                                            className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedTag === tag ? 'bg-cyan-500 text-white font-bold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </nav>
                    </>
                ) : (
                    // MUSIC SIDEBAR CONTENT
                    <div className="flex flex-col h-full text-center py-10">
                         <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-600/50 mb-4">
                             <MusicIcon className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                             <h3 className="text-lg font-bold text-purple-100">Hudební Sekce</h3>
                             <p className="text-sm text-gray-400 mt-2">
                                 Zde spravujete texty písní a hudební nápady. Použijte Skladatele pro porovnání verzí.
                             </p>
                         </div>
                         <button 
                             onClick={() => setShowLyricModal(true)}
                             className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center w-full"
                         >
                             <PlusIcon className="mr-2 h-5 w-5"/> Přidat text
                         </button>
                    </div>
                )}
            </aside>

            {/* Note List - Hidden on Mobile if Editing/Chatting/Songwriting OR if in Music Section (which has its own full view) */}
            {activeSection === 'notes' && (
                <section className={`w-96 bg-gray-800 flex flex-col border-r border-gray-700 flex-shrink-0 ${isChatMode || isSongwriterMode || (selectedNoteId && window.innerWidth < 768) ? 'hidden md:flex' : 'flex w-full md:w-96'}`}>
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Hledat..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                            />
                            <div className="flex bg-gray-700 rounded-lg p-0.5 border border-gray-600">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-600 text-cyan-300 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                    title="Seznam"
                                >
                                    <ListIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-600 text-cyan-300 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                    title="Karty"
                                >
                                    <GridIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={`flex-grow overflow-y-auto custom-scrollbar ${viewMode === 'card' ? 'p-3 space-y-3' : ''}`}>
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                draggable={viewMode === 'list' && !searchTerm && !selectedTag} // Allow dragging primarily in clean list view
                                onDragStart={(e) => handleDragStart(e, note.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnNote(e, note.id)}
                                onClick={() => handleSetSelectedNote(note.id)}
                                className={`cursor-pointer transition-all ${
                                    viewMode === 'card' 
                                        ? `rounded-lg p-4 border border-gray-700 shadow-sm hover:shadow-md hover:border-cyan-500/50 group ${selectedNoteId === note.id ? 'bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500/50' : 'bg-gray-800'}`
                                        : `p-4 border-b border-gray-700 hover:bg-gray-700/50 ${selectedNoteId === note.id ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : 'border-l-4 border-l-transparent'}`
                                } ${draggedNoteId === note.id ? 'opacity-50' : ''}`}
                            >
                                <h3 className={`font-bold text-gray-100 ${viewMode === 'card' ? 'text-lg mb-2' : 'truncate'}`}>{note.title}</h3>
                                <p className={`text-sm text-gray-400 ${viewMode === 'card' ? 'line-clamp-3 mb-3' : 'truncate mt-1'}`}>
                                    {note.content.substring(0, 150).replace(/[#*`]/g, '')}...
                                </p>
                                
                                <div className={`flex items-center justify-between mt-2 ${viewMode === 'card' ? 'pt-2 border-t border-gray-700/50' : ''}`}>
                                    <div className="flex gap-2 flex-wrap">
                                        {note.tags?.slice(0, viewMode === 'card' ? 4 : 2).map(t => (
                                            <span key={t} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 border border-gray-600">{t}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center text-[10px] text-gray-500 ml-2 whitespace-nowrap">
                                        <ClockIcon className="mr-1" />
                                        {formatDate(note.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Content */}
            <main className={`flex-1 flex flex-col bg-gray-900 ${
                activeSection === 'notes' 
                    ? (!selectedNoteId && !isChatMode && !isSongwriterMode ? 'hidden md:flex' : 'flex')
                    : 'flex' // Music section is always visible in main area
            }`}>
                {/* Mobile Back Button (Only visible on mobile when note selected in Notes mode) */}
                {activeSection === 'notes' && (selectedNoteId || isChatMode || isSongwriterMode) && (
                    <div className="md:hidden p-2 bg-gray-800 border-b border-gray-700 flex items-center">
                        <button onClick={() => { handleSetSelectedNote(null); setIsChatMode(false); setIsSongwriterMode(false); }} className="flex items-center text-gray-400 hover:text-white">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Zpět
                        </button>
                    </div>
                )}
               {renderContent()}
            </main>

            {/* Delete Confirmation Modal */}
            {noteToDeleteId && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] animate-fade-in-up" onClick={() => setNoteToDeleteId(null)}>
                    <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100/10 mb-4">
                                <TrashIcon className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-100">Smazat položku?</h3>
                            <p className="text-sm text-gray-400 mt-2">Opravdu chcete tuto položku nenávratně odstranit? Tuto akci nelze vzít zpět.</p>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setNoteToDeleteId(null)}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors font-medium"
                            >
                                Zrušit
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Smazat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lyric Modal */}
            {showLyricModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] animate-fade-in-up" onClick={() => setShowLyricModal(false)}>
                    <div className="bg-gray-800 border border-purple-500/50 rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white flex items-center">
                                <MusicIcon className="mr-2 text-purple-400"/> Přidat hudební text
                            </h3>
                            <button onClick={() => setShowLyricModal(false)} className="text-gray-400 hover:text-white"><XIcon/></button>
                        </div>
                        
                        <form onSubmit={handleSaveLyric} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Název písně</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    placeholder="např. Yesterday"
                                    value={lyricForm.title}
                                    onChange={e => setLyricForm({...lyricForm, title: e.target.value})}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Texty se stejným názvem budou v jedné složce.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Poznámky autora</label>
                                <textarea 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none h-20 resize-none"
                                    placeholder="Kontext, datum, verze..."
                                    value={lyricForm.userNotes}
                                    onChange={e => setLyricForm({...lyricForm, userNotes: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Text písně (Povinné)</label>
                                <textarea 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none h-40 font-mono"
                                    placeholder="Zadejte text písně..."
                                    value={lyricForm.content}
                                    onChange={e => setLyricForm({...lyricForm, content: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Popis hudby</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    placeholder="Tónina, tempo, nálada (např. C dur, 120bpm, smutné)"
                                    value={lyricForm.musicDescription}
                                    onChange={e => setLyricForm({...lyricForm, musicDescription: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowLyricModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                                >
                                    Zrušit
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-lg"
                                >
                                    Uložit text
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Action Result Modal */}
            {aiActionResult && selection && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-up" onClick={() => setAiActionResult(null)}>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Návrh od AI</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Původní text</h4>
                                <div className="bg-gray-900 p-3 rounded-md text-gray-300 text-sm whitespace-pre-wrap">{selection.text}</div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Návrh</h4>
                                <div className="bg-gray-900 p-3 rounded-md text-gray-300 text-sm whitespace-pre-wrap">{aiActionResult}</div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button 
                                onClick={() => { setAiActionResult(null); setActiveAIAction(null); }}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >Zrušit</button>
                            <button 
                                onClick={handleReplaceText}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >Nahradit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Linking Suggestions Modal */}
            {showLinkModal && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-up" onClick={() => setShowLinkModal(false)}>
                     <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
                         <h3 className="text-xl font-bold text-white mb-2">Inteligentní prolinkování</h3>
                         <p className="text-sm text-gray-400 mb-4">Nalezl jsem {linkSuggestions.length} možných souvislostí s ostatními poznámkami.</p>
                         
                         <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                             {linkSuggestions.map((suggestion, index) => (
                                 <div key={index} className="bg-gray-700/50 border border-gray-600 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                     <div className="flex-grow">
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className="font-mono text-sm bg-gray-800 px-2 py-0.5 rounded text-cyan-300">{suggestion.originalText}</span>
                                             <span className="text-gray-500">→</span>
                                             <span className="font-semibold text-white">{suggestion.targetNoteTitle}</span>
                                         </div>
                                         <p className="text-xs text-gray-400 italic">{suggestion.reason}</p>
                                     </div>
                                     <button
                                         onClick={() => handleApplyLink(suggestion)}
                                         className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition"
                                     >
                                         Vytvořit odkaz
                                     </button>
                                 </div>
                             ))}
                         </div>

                         <div className="mt-6 flex justify-end">
                             <button 
                                 onClick={() => setShowLinkModal(false)}
                                 className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                             >
                                 Zavřít
                             </button>
                         </div>
                     </div>
                 </div>
            )}
            
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <p><strong>{toast.type === 'success' ? 'Úspěch' : 'Chyba'}:</strong> {toast.message}</p>
                </div>
            )}
        </div>
    );
}

// --- SUB-COMPONENT FOR SONGWRITER TOOLBAR ---
const SongwriterSourceToolbar = ({ onAdd, onCopy }: { onAdd: () => void, onCopy: () => void }) => {
    const [position, setPosition] = useState<{top: number, left: number} | null>(null);

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setPosition({
                top: rect.top - 40,
                left: rect.left + (rect.width / 2)
            });
        } else {
            setPosition(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);
        return () => {
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('keyup', handleSelection);
        }
    }, [handleSelection]);

    if (!position) return null;

    return (
        <div 
            className="fixed z-50 flex items-center bg-gray-900 border border-purple-500 rounded-lg shadow-xl p-1 animate-fade-in-up"
            style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
            onMouseDown={e => e.preventDefault()}
        >
            <button onClick={onAdd} className="px-3 py-1 text-xs font-bold text-white hover:bg-purple-700 rounded transition flex items-center">
                <PlusIcon className="w-3 h-3 mr-1"/> Vložit
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            <button onClick={onCopy} className="px-3 py-1 text-xs text-gray-300 hover:bg-gray-800 rounded transition">
                Kopírovat
            </button>
        </div>
    );
};
