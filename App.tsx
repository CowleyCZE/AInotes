import React, { useMemo, useEffect, useState } from 'react';
import { useNotes } from './hooks/useNotes';
import { useChat } from './hooks/useChat';
import { useMusicStudio } from './hooks/useMusicStudio';
import { useUI } from './hooks/useUI';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { ChatView } from './components/ChatView';
import { SongwriterStudio } from './components/SongwriterStudio';
import { NoteView } from './components/NoteView';
import { CategoryTree } from './components/CategoryTree';
import { createNoteFromAudio } from './services/geminiService';
import Fuse from 'fuse.js';
import { 
    PlusIcon, MusicIcon, BrainIcon, XIcon 
} from './components/Icons';

export default function App() {
    const notesHook = useNotes();
    const chatHook = useChat();
    const musicHook = useMusicStudio();
    const uiHook = useUI();
    const audioHook = useAudioRecorder();
    const [isTranscribing, setIsTranscribing] = useState(false);

    useEffect(() => {
        const processAudio = async () => {
            if (audioHook.audioBase64) {
                setIsTranscribing(true);
                try {
                    const result = await createNoteFromAudio(audioHook.audioBase64, audioHook.mimeType, notesHook.categories);
                    notesHook.handleAudioTranscription(result);
                } catch (err) {
                    console.error("Transcription failed:", err);
                    notesHook.setToast({ message: "Přepis audia selhal", type: 'error' });
                } finally {
                    setIsTranscribing(false);
                    audioHook.resetAudio();
                }
            }
        };
        processAudio();
    }, [audioHook.audioBase64, audioHook.mimeType, notesHook, audioHook]);

    const allTags = useMemo(() => {
        if (!Array.isArray(notesHook.notes)) return [];
        const tagSet = new Set<string>();
        notesHook.notes.forEach(note => {
            if (note && Array.isArray(note.tags)) {
                note.tags.forEach(tag => tagSet.add(tag));
            }
        });
        return Array.from(tagSet);
    }, [notesHook.notes]);

    const filteredNotes = useMemo(() => {
        if (!Array.isArray(notesHook.notes)) return [];
        const isMusic = uiHook.activeSection === 'music';
        const relevantNotes = notesHook.notes.filter(n => n && (isMusic ? n.type === 'lyric' : n.type !== 'lyric'));
        let filtered = [...relevantNotes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        
        if (notesHook.searchTerm.trim()) {
            const fuse = new Fuse(filtered, {
                keys: ['title', 'content', 'tags'],
                threshold: 0.35,
                distance: 100,
                ignoreLocation: true
            });
            filtered = fuse.search(notesHook.searchTerm).map(result => result.item);
        } else if (!isMusic) {
            if (notesHook.selectedTag) {
                filtered = filtered.filter(note => note.tags?.includes(notesHook.selectedTag!));
            } else if (notesHook.selectedCategoryId !== 'all') {
                filtered = filtered.filter(note => note.categoryId === notesHook.selectedCategoryId);
            }
        }
        return filtered;
    }, [notesHook.notes, notesHook.selectedCategoryId, notesHook.searchTerm, notesHook.selectedTag, uiHook.activeSection]);

    if (!notesHook.isDataLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-500">
                <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen font-sans bg-gray-950 text-gray-200 overflow-hidden select-none">
            {/* Sidebar - Hidden on small screens, shown on desktop */}
            <aside className={`w-64 bg-gray-900/80 flex flex-col p-4 border-r border-gray-800 ${uiHook.isFocusMode ? 'hidden' : 'hidden lg:flex'}`}>
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg">
                        <MusicIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Studio Notes</h1>
                </div>

                <div className="flex mb-6 bg-gray-800/50 p-1 rounded-xl border border-gray-700">
                    <button 
                        onClick={() => uiHook.setActiveSection('notes')} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${uiHook.activeSection === 'notes' ? 'bg-gray-700 text-cyan-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Poznámky
                    </button>
                    <button 
                        onClick={() => uiHook.setActiveSection('music')} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${uiHook.activeSection === 'music' ? 'bg-purple-600/20 text-purple-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Studio
                    </button>
                </div>

                {uiHook.activeSection === 'notes' ? (
                    <>
                        <div className="flex flex-col gap-2 mb-6">
                            <button onClick={() => notesHook.createNewNote(notesHook.selectedCategoryId === "all" ? notesHook.categories[0]?.id || "default" : notesHook.selectedCategoryId, uiHook.activeSection === 'music' ? 'lyric' : 'text')} className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02]">
                                <PlusIcon className="h-5 w-5 mr-2" /> Nová Poznámka
                            </button>
                            
                            <button 
                                onClick={audioHook.isRecording ? audioHook.stopRecording : audioHook.startRecording} 
                                disabled={isTranscribing}
                                className={`flex items-center justify-center w-full font-bold py-3 rounded-xl transition-all hover:scale-[1.02] border-2 ${audioHook.isRecording ? 'bg-red-600/20 border-red-500 text-red-500 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'} ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isTranscribing ? (
                                    <><div className="w-4 h-4 border-2 border-t-purple-500 border-gray-600 rounded-full animate-spin mr-2"></div> Přepisování...</>
                                ) : audioHook.isRecording ? (
                                    <><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div> {audioHook.formatTime(audioHook.recordingTime)} Stop</>
                                ) : (
                                    <><span className="mr-2">🎤</span> Hlasová poznámka</>
                                )}
                            </button>
                        </div>
                        <nav className="flex-grow overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                            <div 
                                onClick={() => notesHook.setSelectedCategoryId('all')} 
                                className={`py-1.5 px-3 mb-2 rounded-lg cursor-pointer transition-colors ${notesHook.selectedCategoryId === 'all' ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}
                            >
                                <span className="text-xs">Všechny poznámky</span>
                            </div>
                            
                            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 px-3">Kategorie</div>
                            <CategoryTree 
                                categories={notesHook.categories}
                                selectedId={notesHook.selectedCategoryId}
                                onSelect={notesHook.setSelectedCategoryId}
                            />

                            <div className="pt-6 flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button key={tag} onClick={() => notesHook.setSelectedTag(tag)} className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${notesHook.selectedTag === tag ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>{tag}</button>
                                ))}
                            </div>
                        </nav>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                            <MusicIcon className="h-8 w-8 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-300 mb-2">Songwriter Studio</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Zde uvidíte zdroje pro aktuální projekt.
                        </p>
                    </div>
                )}
            </aside>

            {/* Note List */}
            <section className={`w-80 border-r border-gray-800 flex flex-col bg-gray-950/50 ${notesHook.selectedNoteId && 'hidden lg:flex'} ${uiHook.isFocusMode ? 'hidden' : ''}`}>
                <div className="p-4 border-b border-gray-800">
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Rychlé hledání..." 
                            value={notesHook.searchTerm}
                            onChange={(e) => notesHook.setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 group-hover:border-gray-700 focus:border-cyan-500/50 rounded-xl py-2.5 pl-4 pr-10 text-sm outline-none transition-all placeholder-gray-600"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                            {notesHook.searchTerm ? (
                                <button onClick={() => notesHook.setSearchTerm('')}><XIcon className="h-4 w-4 hover:text-gray-400" /></button>
                            ) : (
                                <BrainIcon className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredNotes.map(note => (
                        <div 
                            key={note.id} 
                            onClick={() => notesHook.setSelectedNoteId(note.id)}
                            className={`p-4 cursor-pointer border-b border-gray-900 transition-all ${notesHook.selectedNoteId === note.id ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : 'hover:bg-gray-900/50'}`}
                        >
                            <h3 className={`text-sm font-bold mb-1 truncate ${notesHook.selectedNoteId === note.id ? 'text-cyan-400' : 'text-gray-300'}`}>{note.title || 'Bez názvu'}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{note.content}</p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[10px] text-gray-600">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                {note.tags && note.tags.length > 0 && (
                                    <div className="flex gap-1">
                                        {note.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px]">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-600 text-center p-6">
                            <BrainIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-xs italic">Žádné poznámky neodpovídají hledání.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Main Editor */}
            <main className="flex-1 flex flex-col bg-gray-950 relative">
                {chatHook.isChatMode ? (
                    <ChatView 
                        chatMessages={chatHook.chatMessages} chatInput={chatHook.chatInput} setChatInput={chatHook.setChatInput}
                        isChatLoading={chatHook.isChatLoading} onSendMessage={(e) => chatHook.handleSendChatMessage(notesHook.notes, e)}
                        onToggleChat={() => chatHook.setIsChatMode(false)} onInternalLinkClick={notesHook.setSelectedNoteId}
                        notesCount={notesHook.notes.length}
                    />
                ) : musicHook.isSongwriterMode ? (
                    <SongwriterStudio 
                        selectedSongwriterNotes={musicHook.selectedSongwriterNotes}
                        notes={notesHook.notes}
                        syncScrollEnabled={musicHook.syncScrollEnabled}
                        setSyncScrollEnabled={musicHook.setSyncScrollEnabled}
                        syncScrollMode={musicHook.syncScrollMode}
                        setSyncScrollMode={musicHook.setSyncScrollMode}
                        isAnalyzingRhyme={musicHook.isAnalyzingRhyme}
                        onAnalyzeRhyme={musicHook.handleAnalyzeRhyme}
                        onClose={() => musicHook.setIsSongwriterMode(false)}
                        showRhymeAnalyzer={musicHook.showRhymeAnalyzer}
                        setShowRhymeAnalyzer={musicHook.setShowRhymeAnalyzer}
                        rhymeAnalysis={musicHook.rhymeAnalysis}
                        activeScrollIndex={musicHook.activeScrollIndex}
                        handleSyncScroll={musicHook.handleSyncScroll}
                        scrollSyncRefs={musicHook.scrollSyncRefs}
                        sourceNoteContents={musicHook.sourceNoteContents}
                        addTextToComposition={musicHook.addTextToComposition}
                        autoNumbering={musicHook.autoNumbering}
                        setAutoNumbering={musicHook.setAutoNumbering}
                        compositionContent={musicHook.compositionContent}
                        setCompositionContent={musicHook.setCompositionContent}
                        saveCompositionToLocalStorage={musicHook.saveCompositionToLocalStorage}
                        creativeModel={localStorage.getItem('ainotes_creative_model') || ""}
                        setCreativeModel={() => {}}
                    />
                ) : notesHook.selectedNote ? (
                    <NoteView 
                        selectedNote={notesHook.selectedNote} isEditing={notesHook.isEditing}
                        editingTitle={notesHook.editingTitle} setEditingTitle={notesHook.setEditingTitle}
                        editingContent={notesHook.editingContent} setEditingContent={notesHook.setEditingContent}
                        editingTags={notesHook.editingTags} removeEditingTag={(tag) => notesHook.setEditingTags(prev => prev.filter(t => t !== tag))}
                        tagInput={notesHook.tagInput} handleTagInputChange={notesHook.handleTagInputChange} handleTagInputKeyDown={notesHook.handleTagInputKeyDown}
                        setIsEditing={notesHook.setIsEditing} handleCancelEditing={() => {
                            if (notesHook.selectedNote) {
                                notesHook.setEditingContent(notesHook.selectedNote.content);
                                notesHook.setEditingTitle(notesHook.selectedNote.title);
                                notesHook.setEditingTags(notesHook.selectedNote.tags || []);
                            }
                            notesHook.setIsEditing(false);
                        }}
                        handleSaveNote={notesHook.handleSaveNote}
                        setIsFocusMode={uiHook.setIsFocusMode}
                        autoTitle={notesHook.handleAutoTitle}
                        handleUndo={() => notesHook.restoreVersion(0)}
                        handleFindConnections={notesHook.handleFindConnections}
                        isLinkingLoading={notesHook.isLinkingLoading} setNoteToDeleteId={notesHook.setNoteToDeleteId}
                        toggleChatMode={() => chatHook.setIsChatMode(true)} saveStatus={notesHook.saveStatus}
                        error={null}
                        contentAreaRef={React.createRef()} handleMouseUp={() => {}}
                        toolbarPosition={uiHook.toolbarPosition} handleCopyText={async () => {}}
                        handleAIAction={async () => {}} isAIActionLoading={false}
                        handleAIProcess={async () => {}} isLoadingAI={false}
                        textToAppend="" setTextToAppend={() => {}} handleAIAppend={async () => {}}
                        isAppendingAI={false} categories={notesHook.categories}
                        onInternalLinkClick={notesHook.setSelectedNoteId}
                        onClose={() => notesHook.setSelectedNoteId(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent">
                        <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-pulse">
                            <BrainIcon className="h-10 w-10 text-cyan-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Vítejte v chytrém zápisníku</h2>
                        <p className="text-gray-500 max-w-md leading-relaxed">Vyberte poznámku ze seznamu nebo vytvořte novou v levém panelu</p>
                    </div>
                )}
            </main>
        </div>
    );
}
