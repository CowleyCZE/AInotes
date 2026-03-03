import React from 'react';
import { Note, Category, AIAction } from '../types';
import { BrainIcon, UndoIcon, LinkIcon, SaveIcon, EditIcon, TrashIcon, CopyIcon, SummarizeIcon, GrammarIcon, TranslateIcon, SparklesIcon, XIcon } from './Icons';
import { SimpleMarkdownRenderer } from './SimpleMarkdownRenderer';

interface NoteViewProps {
    selectedNote: Note;
    isEditing: boolean;
    editingTitle: string;
    setEditingTitle: (val: string) => void;
    editingContent: string;
    setEditingContent: (val: string) => void;
    editingTags: string[];
    removeEditingTag: (tag: string) => void;
    tagInput: string;
    handleTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    setIsEditing: (val: boolean) => void;
    handleCancelEditing: () => void;
    handleUndo: () => void;
    handleFindConnections: () => void;
    isLinkingLoading: boolean;
    setNoteToDeleteId: (id: string) => void;
    toggleChatMode: () => void;
    saveStatus: string;
    error: string | null;
    contentAreaRef: React.RefObject<HTMLDivElement>;
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
    toolbarPosition: { top: number; left: number } | null;
    handleCopyText: () => void;
    handleAIAction: (action: AIAction) => void;
    isAIActionLoading: boolean;
    handleAIProcess: () => void;
    isLoadingAI: boolean;
    textToAppend: string;
    setTextToAppend: (val: string) => void;
    handleAIAppend: () => void;
    isAppendingAI: boolean;
    categories: Category[];
    onInternalLinkClick: (id: string) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
    selectedNote,
    isEditing,
    editingTitle,
    setEditingTitle,
    editingContent,
    setEditingContent,
    editingTags,
    removeEditingTag,
    tagInput,
    handleTagInputChange,
    handleTagInputKeyDown,
    setIsEditing,
    handleCancelEditing,
    handleUndo,
    handleFindConnections,
    isLinkingLoading,
    setNoteToDeleteId,
    toggleChatMode,
    saveStatus,
    error,
    contentAreaRef,
    handleMouseUp,
    toolbarPosition,
    handleCopyText,
    handleAIAction,
    isAIActionLoading,
    handleAIProcess,
    isLoadingAI,
    textToAppend,
    setTextToAppend,
    handleAIAppend,
    isAppendingAI,
    categories,
    onInternalLinkClick
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-gray-900 overflow-hidden">
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
                    <button onClick={() => setNoteToDeleteId(selectedNote.id)} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition"><TrashIcon /></button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 relative" ref={contentAreaRef} onMouseUp={handleMouseUp}>
                 {toolbarPosition && (
                    <div
                        className="absolute flex items-center space-x-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg p-1 z-10 shadow-lg"
                        style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px`, transform: 'translateX(-50%)' }}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <button onClick={handleCopyText} className="p-2 rounded-md hover:bg-cyan-500/20 text-gray-300"><CopyIcon className="h-5 w-5" /></button>
                        <div className="w-px h-4 bg-gray-600 mx-1"></div>
                        <button onClick={() => handleAIAction('summarize')} disabled={isAIActionLoading} className="p-2 rounded-md hover:bg-cyan-500/20 text-gray-300"><SummarizeIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleAIAction('fix_grammar')} disabled={isAIActionLoading} className="p-2 rounded-md hover:bg-cyan-500/20 text-gray-300"><GrammarIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleAIAction('translate_en')} disabled={isAIActionLoading} className="p-2 rounded-md hover:bg-cyan-500/20 text-gray-300"><TranslateIcon className="h-5 w-5" /></button>
                    </div>
                )}

                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
                
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
                            placeholder="Zadejte svůj text..."
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
                                    placeholder="Přidat tagy..."
                                    className="bg-transparent flex-grow p-1 focus:outline-none text-sm min-w-[150px]"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                           <button 
                                onClick={handleAIProcess}
                                disabled={isLoadingAI}
                                className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                               <BrainIcon className={`h-5 w-5 mr-2 ${isLoadingAI ? 'animate-spin' : ''}`} />
                               Uspořádat s AI
                           </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <SimpleMarkdownRenderer content={selectedNote.content} onLinkClick={onInternalLinkClick} />
                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-gray-300">Rychlé přidání obsahu</h3>
                            <textarea
                                value={textToAppend}
                                onChange={e => setTextToAppend(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm"
                                rows={5}
                                placeholder="Vložit text..."
                            />
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={handleAIAppend}
                                    disabled={isAppendingAI || !textToAppend.trim()}
                                    className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition"
                                >
                                    <SparklesIcon className={`h-5 w-5 mr-2 ${isAppendingAI ? 'animate-pulse' : ''}`} />
                                    Přidat a formátovat s AI
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
