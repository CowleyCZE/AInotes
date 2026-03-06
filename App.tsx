import React, { useMemo } from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { ChatView } from './components/ChatView';
import { SongwriterStudio } from './components/SongwriterStudio';
import { NoteView } from './components/NoteView';
import { PlusIcon, MusicIcon, BrainIcon } from './components/Icons';

export default function App() {
    const logic = useAppLogic();
    const { 
        notes, categories, selectedCategoryId, setSelectedCategoryId,
        selectedTag, setSelectedTag, selectedNoteId, handleSetSelectedNote, searchTerm, setSearchTerm,
        isLoadingAI, isEditing, setIsEditing, editingContent, setEditingContent,
        editingTitle, setEditingTitle, editingTags, setEditingTags, tagInput, setTagInput,
        textToAppend, setTextToAppend, toast, isDataLoaded, saveStatus, 
        activeSection, setActiveSection,
        isChatMode, setIsChatMode,
        chatMessages, chatInput, setChatInput, isChatLoading,
        noteToDeleteId, setNoteToDeleteId,
        isSongwriterMode, setIsSongwriterMode, selectedSongwriterNotes, setSelectedSongwriterNotes,
        compositionContent, setCompositionContent, sourceNoteContents,
        scrollSyncRefs, syncScrollEnabled, setSyncScrollEnabled, syncScrollMode, setSyncScrollMode,
        activeScrollIndex, showRhymeAnalyzer, setShowRhymeAnalyzer, rhymeAnalysis,
        isAnalyzingRhyme, autoNumbering, setAutoNumbering, showLyricModal, setShowLyricModal,
        lyricForm, setLyricForm, selectedNote,
        handleAIProcess, handleSendChatMessage, handleSyncScroll, addTextToComposition, createNewNote
    } = logic;

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => note.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    }, [notes]);

    const filteredNotes = useMemo(() => {
        const relevantNotes = activeSection === 'notes' ? notes.filter(n => n.type !== 'music') : notes.filter(n => n.type === 'music');
        let filtered = [...relevantNotes].sort((a, b) => b.updatedAt - a.updatedAt);
        if (searchTerm) {
            filtered = filtered.filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()) || note.content.toLowerCase().includes(searchTerm.toLowerCase()));
        } else if (activeSection === 'notes') {
            if (selectedTag) filtered = filtered.filter(note => note.tags?.includes(selectedTag));
            else if (selectedCategoryId !== 'all') filtered = filtered.filter(note => note.categoryId === selectedCategoryId);
        }
        return filtered;
    }, [notes, selectedCategoryId, searchTerm, selectedTag, activeSection]);

    if (!isDataLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-500">
                <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen font-sans bg-gray-950 text-gray-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900/80 flex flex-col p-4 border-r border-gray-800 hidden md:flex">
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg">
                        <MusicIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Studio Notes</h1>
                </div>

                <div className="flex mb-6 bg-gray-800/50 p-1 rounded-xl border border-gray-700">
                    <button 
                        onClick={() => setActiveSection('notes')} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'notes' ? 'bg-gray-700 text-cyan-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Poznámky
                    </button>
                    <button 
                        onClick={() => setActiveSection('music')} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'music' ? 'bg-purple-600/20 text-purple-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Studio
                    </button>
                </div>

                {activeSection === 'notes' ? (
                    <>
                        <button onClick={createNewNote} className="flex items-center justify-center w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-bold py-2.5 rounded-xl mb-6 transition-all">
                            <PlusIcon className="h-5 w-5 mr-2" /> Nová Poznámka
                        </button>
                        <nav className="flex-grow overflow-y-auto space-y-1">
                            <div onClick={() => setSelectedCategoryId('all')} className={`py-2 px-3 rounded-lg cursor-pointer transition-colors ${selectedCategoryId === 'all' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'text-gray-400 hover:bg-gray-800'}`}>Všechny</div>
                            {categories.map(cat => (
                                <div key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`py-2 px-3 rounded-lg cursor-pointer transition-colors ${selectedCategoryId === cat.id ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'text-gray-400 hover:bg-gray-800'}`}>{cat.name}</div>
                            ))}
                        </nav>
                        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-800">
                            {allTags.map(tag => (
                                <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={`px-2.5 py-1 text-xs rounded-full border transition-all ${selectedTag === tag ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>#{tag}</button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <button onClick={createNewNote} className="flex items-center justify-center w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 font-bold py-2.5 rounded-xl transition-all">
                            <PlusIcon className="h-5 w-5 mr-2" /> Nový Song
                        </button>
                        <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 text-center">
                            <BrainIcon className="w-10 h-10 mx-auto text-purple-400/50 mb-2" />
                            <p className="text-xs text-gray-500">AI asistent je připraven analyzovat vaši tvorbu.</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* Note List */}
            <section className={`w-80 bg-gray-900/50 flex flex-col border-r border-gray-800 transition-all ${isChatMode || (selectedNoteId && window.innerWidth < 768) ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-800 bg-gray-900/30">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Hledat v archivech..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all pl-10" 
                        />
                        <div className="absolute left-3 top-3 text-gray-500">
                            <BrainIcon className="h-4 w-4" />
                        </div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {filteredNotes.length > 0 ? filteredNotes.map(note => (
                        <div 
                            key={note.id} 
                            onClick={() => handleSetSelectedNote(note.id)} 
                            className={`p-4 border-b border-gray-800/50 cursor-pointer transition-all hover:bg-gray-800/30 ${selectedNoteId === note.id ? 'bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-l-purple-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold truncate ${selectedNoteId === note.id ? 'text-white' : 'text-gray-300'}`}>{note.title || 'Bez názvu'}</h3>
                                {note.type === 'music' && <MusicIcon className="h-3 w-3 text-purple-400 flex-shrink-0 ml-2" />}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                {note.content.replace(/[#*`]/g, '').substring(0, 80)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                                {note.tags?.slice(0, 2).map(t => (
                                    <span key={t} className="text-[10px] text-purple-400/70">#{t}</span>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-600 px-6 text-center">
                            <p className="text-sm">Žádné záznamy v této sekci.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-gray-900">
                {isChatMode ? (
                    <ChatView 
                        chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput}
                        isChatLoading={isChatLoading} onSendMessage={handleSendChatMessage}
                        onToggleChat={() => setIsChatMode(false)} onInternalLinkClick={handleSetSelectedNote}
                        notesCount={notes.length}
                    />
                ) : isSongwriterMode ? (
                    <SongwriterStudio 
                        selectedSongwriterNotes={selectedSongwriterNotes} notes={notes}
                        syncScrollEnabled={syncScrollEnabled} setSyncScrollEnabled={setSyncScrollEnabled}
                        syncScrollMode={syncScrollMode} setSyncScrollMode={setSyncScrollMode}
                        isAnalyzingRhyme={isAnalyzingRhyme} onAnalyzeRhyme={handleAnalyzeRhyme}
                        onClose={() => setIsSongwriterMode(false)} showRhymeAnalyzer={showRhymeAnalyzer}
                        setShowRhymeAnalyzer={setShowRhymeAnalyzer} rhymeAnalysis={rhymeAnalysis}
                        activeScrollIndex={activeScrollIndex} handleSyncScroll={handleSyncScroll}
                        scrollSyncRefs={scrollSyncRefs} sourceNoteContents={sourceNoteContents}
                        addTextToComposition={addTextToComposition} autoNumbering={autoNumbering}
                        setAutoNumbering={setAutoNumbering} compositionContent={compositionContent}
                        setCompositionContent={setCompositionContent} 
                        saveCompositionToLocalStorage={() => saveCompositionToLocalStorage(compositionContent)}
                    />
                ) : selectedNote ? (
                    <NoteView 
                        selectedNote={selectedNote} isEditing={isEditing}
                        editingTitle={editingTitle} setEditingTitle={setEditingTitle}
                        editingContent={editingContent} setEditingContent={setEditingContent}
                        editingTags={editingTags} removeEditingTag={removeEditingTag}
                        tagInput={tagInput} handleTagInputChange={handleTagInputChange} handleTagInputKeyDown={handleTagInputKeyDown}
                        setIsEditing={setIsEditing} handleCancelEditing={handleCancelEditing}
                        handleUndo={handleUndo} handleFindConnections={handleFindConnections}
                        isLinkingLoading={isLinkingLoading} setNoteToDeleteId={setNoteToDeleteId}
                        toggleChatMode={() => setIsChatMode(true)} saveStatus={saveStatus}
                        error={error}
                        contentAreaRef={contentAreaRef} handleMouseUp={handleMouseUp}
                        toolbarPosition={toolbarPosition} handleCopyText={handleCopyText}
                        handleAIAction={handleAIAction} isAIActionLoading={isAIActionLoading}
                        handleAIProcess={handleAIProcess}
                        isLoadingAI={isLoadingAI} textToAppend={textToAppend}
                        setTextToAppend={setTextToAppend} handleAIAppend={handleAIAppend}
                        isAppendingAI={isAppendingAI}
                        categories={categories}
                        onInternalLinkClick={handleSetSelectedNote}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <BrainIcon className="w-24 h-24 mb-4 opacity-20" />
                        <h2 className="text-2xl font-semibold">Vyberte poznámku</h2>
                    </div>
                )}
            </main>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
