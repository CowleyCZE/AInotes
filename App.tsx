import React, { useMemo } from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { ChatView } from './components/ChatView';
import { SongwriterStudio } from './components/SongwriterStudio';
import { NoteView } from './components/NoteView';
import { 
    PlusIcon, MicIcon, StopIcon, ListIcon, GridIcon, ClockIcon, MusicIcon, 
    EditIcon, TrashIcon, SaveIcon, XIcon, BrainIcon 
} from './components/Icons';
import { formatDate, groupNotesByTitle } from './services/utils';

export default function App() {
    const logic = useAppLogic();
    const { 
        notes, categories, selectedCategoryId, setSelectedCategoryId,
        selectedTag, setSelectedTag, selectedNoteId, handleSetSelectedNote, searchTerm, setSearchTerm,
        isLoadingAI, isAppendingAI, error, isEditing, setIsEditing, editingContent, setEditingContent,
        editingTitle, setEditingTitle, editingTags, setEditingTags, tagInput, setTagInput,
        textToAppend, setTextToAppend, toast, isDataLoaded, saveStatus, viewMode, setViewMode,
        activeSection, setActiveSection, editingCategoryId, setEditingCategoryId,
        editingCategoryName, setEditingCategoryName, toolbarPosition,
        activeAIAction, isAIActionLoading, isChatMode, setIsChatMode,
        chatMessages, chatInput, setChatInput, isChatLoading,
        isLinkingLoading, noteToDeleteId, setNoteToDeleteId,
        isSongwriterMode, setIsSongwriterMode, selectedSongwriterNotes, setSelectedSongwriterNotes,
        compositionContent, setCompositionContent, sourceNoteContents,
        scrollSyncRefs, syncScrollEnabled, setSyncScrollEnabled, syncScrollMode, setSyncScrollMode,
        activeScrollIndex, showRhymeAnalyzer, setShowRhymeAnalyzer, rhymeAnalysis,
        isAnalyzingRhyme, autoNumbering, setAutoNumbering, showLyricModal, setShowLyricModal,
        lyricForm, setLyricForm, expandedMusicFolders, setExpandedMusicFolders, selectedNote,
        handleAIProcess, handleSendChatMessage, handleSyncScroll, addTextToComposition, createNewNote
    } = logic;

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => note.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    }, [notes]);

    const filteredNotes = useMemo(() => {
        const relevantNotes = activeSection === 'notes' ? notes.filter(n => n.type !== 'lyric') : notes.filter(n => n.type === 'lyric');
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
            <div className="flex h-screen items-center justify-center bg-gray-900 text-gray-500">
                <div className="w-16 h-16 border-4 border-t-cyan-400 border-gray-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen font-sans bg-gray-900 text-gray-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800/50 flex flex-col p-4 border-r border-gray-700 hidden md:flex">
                <h1 className="text-2xl font-bold text-cyan-400 mb-6">Chytrý Zápisník</h1>
                <div className="flex mb-6 bg-gray-800 p-1 rounded-lg border border-gray-600">
                    <button onClick={() => setActiveSection('notes')} className={`flex-1 py-1.5 rounded-md text-sm font-bold ${activeSection === 'notes' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Poznámky</button>
                    <button onClick={() => setActiveSection('music')} className={`flex-1 py-1.5 rounded-md text-sm font-bold ${activeSection === 'music' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Hudba</button>
                </div>

                {activeSection === 'notes' ? (
                    <>
                        <button onClick={createNewNote} className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg mb-4"><PlusIcon className="h-5 w-5 mr-2" /> Nová Poznámka</button>
                        <nav className="flex-grow overflow-y-auto">
                            <div onClick={() => setSelectedCategoryId('all')} className={`py-2 px-3 rounded-md cursor-pointer ${selectedCategoryId === 'all' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300'}`}>Všechny</div>
                            {categories.map(cat => (
                                <div key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`py-2 px-3 rounded-md cursor-pointer mt-1 ${selectedCategoryId === cat.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300'}`}>{cat.name}</div>
                            ))}
                            <div className="mt-6 flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-2 py-1 text-xs rounded-full ${selectedTag === tag ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{tag}</button>
                                ))}
                            </div>
                        </nav>
                    </>
                ) : (
                    <div className="text-center py-10">
                        <MusicIcon className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                        <button onClick={() => setShowLyricModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg w-full">Přidat text</button>
                    </div>
                )}
            </aside>

            {/* Note List */}
            {activeSection === 'notes' && (
                <section className={`w-96 bg-gray-800 flex flex-col border-r border-gray-700 ${isChatMode || (selectedNoteId && window.innerWidth < 768) ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-700">
                        <input type="text" placeholder="Hledat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {filteredNotes.map(note => (
                            <div key={note.id} onClick={() => handleSetSelectedNote(note.id)} className={`p-4 border-b border-gray-700 cursor-pointer ${selectedNoteId === note.id ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''}`}>
                                <h3 className="font-bold text-gray-100 truncate">{note.title}</h3>
                                <p className="text-sm text-gray-400 truncate mt-1">{note.content.substring(0, 100)}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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
                        isAnalyzingRhyme={isAnalyzingRhyme} onAnalyzeRhyme={() => {}}
                        onClose={() => setIsSongwriterMode(false)} showRhymeAnalyzer={showRhymeAnalyzer}
                        setShowRhymeAnalyzer={setShowRhymeAnalyzer} rhymeAnalysis={rhymeAnalysis}
                        activeScrollIndex={activeScrollIndex} handleSyncScroll={handleSyncScroll}
                        scrollSyncRefs={scrollSyncRefs} sourceNoteContents={sourceNoteContents}
                        addTextToComposition={addTextToComposition} autoNumbering={autoNumbering}
                        setAutoNumbering={setAutoNumbering} compositionContent={compositionContent}
                        setCompositionContent={setCompositionContent} saveCompositionToLocalStorage={() => {}}
                    />
                ) : selectedNote ? (
                    <NoteView 
                        selectedNote={selectedNote} isEditing={isEditing}
                        editingTitle={editingTitle} setEditingTitle={setEditingTitle}
                        editingContent={editingContent} setEditingContent={setEditingContent}
                        editingTags={editingTags} removeEditingTag={() => {}}
                        tagInput={tagInput} handleTagInputChange={() => {}} handleTagInputKeyDown={() => {}}
                        setIsEditing={setIsEditing} handleCancelEditing={() => setIsEditing(false)}
                        handleUndo={() => {}} handleFindConnections={() => {}}
                        isLinkingLoading={false} setNoteToDeleteId={setNoteToDeleteId}
                        toggleChatMode={() => setIsChatMode(true)} saveStatus={saveStatus}
                        error={error} contentAreaRef={null} handleMouseUp={() => {}}
                        toolbarPosition={null} handleCopyText={() => {}}
                        handleAIAction={() => {}} isAIActionLoading={false}
                        activeAIAction={null} handleAIProcess={handleAIProcess}
                        isLoadingAI={isLoadingAI} textToAppend={textToAppend}
                        setTextToAppend={setTextToAppend} handleAIAppend={() => {}}
                        isAppendingAI={isAppendingAI} categories={categories}
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
