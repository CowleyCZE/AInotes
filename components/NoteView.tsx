import React, { useState } from 'react';
import { Note, Category, AIAction } from '../src/types';
import { 
    BrainIcon, UndoIcon, LinkIcon, SaveIcon, EditIcon, 
    TrashIcon, CopyIcon, SummarizeIcon, GrammarIcon, 
    TranslateIcon, SparklesIcon, XIcon, MusicIcon, ActivityIcon, PlusIcon
} from './Icons';
import { SimpleMarkdownRenderer } from './SimpleMarkdownRenderer';
import { deepLyricScan } from '../services/geminiService';

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
    contentAreaRef: React.RefObject<HTMLDivElement | null>;
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
    selectedNote, isEditing, editingTitle, setEditingTitle,
    editingContent, setEditingContent, editingTags, removeEditingTag,
    tagInput, handleTagInputChange, handleTagInputKeyDown,
    setIsEditing, handleCancelEditing, handleUndo, handleFindConnections,
    isLinkingLoading, setNoteToDeleteId, toggleChatMode, saveStatus,
    error, contentAreaRef, handleMouseUp, toolbarPosition,
    handleCopyText, handleAIAction, isAIActionLoading, handleAIProcess,
    isLoadingAI, textToAppend, setTextToAppend, handleAIAppend,
    isAppendingAI, categories, onInternalLinkClick
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleDeepScan = async () => {
        setIsAnalyzing(true);
        try {
            const result = await deepLyricScan(editingContent);
            console.log("Deep Scan Result:", result);
            alert("AI analýza rytmu a rýmů dokončena. Podrobnosti v konzoli.");
        } catch (e) {
            alert("Analýza selhala.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const categoryName = categories.find(c => c.id === selectedNote.categoryId)?.name || 'Bez kategorie';

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950/40 relative">
            {/* Note Toolbar */}
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/20 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${selectedNote.type === 'music' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                        {selectedNote.type === 'music' ? 'Music Project' : 'General Note'}
                    </span>
                    <span className="text-gray-600 text-xs hidden sm:inline">|</span>
                    <span className="text-gray-400 text-xs italic truncate hidden sm:inline">{categoryName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-gray-500 mr-2 italic transition-opacity duration-300 hidden lg:block">
                        {saveStatus === 'saving' && <span className="text-purple-400 animate-pulse">Synchronizace...</span>}
                        {saveStatus === 'saved' && <span className="text-green-500">Uloženo ✓</span>}
                    </div>
                    
                    <button onClick={handleUndo} disabled={!selectedNote.history?.length} className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30" title="Zpět (Undo)"><UndoIcon className="h-4 w-4" /></button>
                    <button onClick={handleFindConnections} disabled={isLinkingLoading} className={`p-2 transition-colors ${isLinkingLoading ? 'text-purple-500 animate-spin' : 'text-gray-400 hover:text-cyan-400'}`} title="Hledat souvislosti"><LinkIcon className="h-4 w-4" /></button>
                    <button onClick={toggleChatMode} className="p-2 text-gray-400 hover:text-purple-400 transition-colors" title="Chat s poznámkami"><BrainIcon className="h-4 w-4" /></button>
                    
                    <div className="w-[1px] h-4 bg-gray-800 mx-1"></div>
                    
                    {!isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"><EditIcon className="h-4 w-4" /> <span className="hidden sm:inline">Upravit</span></button>
                            <button onClick={() => setNoteToDeleteId(selectedNote.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={handleCancelEditing} className="p-2 text-gray-400 hover:text-white transition-colors"><XIcon className="h-4 w-4" /></button>
                            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all"><SaveIcon className="h-4 w-4" /> <span className="hidden sm:inline">Hotovo</span></button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Editor/Viewer Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-8 max-w-4xl mx-auto w-full h-full flex flex-col overflow-y-auto custom-scrollbar" onMouseUp={handleMouseUp} ref={contentAreaRef}>
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={editingTitle} 
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="text-4xl font-bold bg-transparent border-none outline-none text-white mb-6 placeholder-gray-800"
                                placeholder="Titul projektu..."
                            />
                        ) : (
                            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">{selectedNote.title || 'Bez názvu'}</h1>
                        )}

                        <div className="flex flex-wrap gap-2 mb-8">
                            {isEditing ? (
                                <>
                                    {editingTags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 text-[11px]">
                                            #{tag}
                                            <button onClick={() => removeEditingTag(tag)} className="hover:text-white transition-colors"><XIcon className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                    <input 
                                        type="text"
                                        value={tagInput}
                                        onChange={handleTagInputChange}
                                        onKeyDown={handleTagInputKeyDown}
                                        placeholder="+ tag..."
                                        className="bg-transparent border-none outline-none text-[11px] text-gray-500 w-20 focus:text-gray-300"
                                    />
                                </>
                            ) : (
                                selectedNote.tags?.map(tag => (
                                    <span key={tag} className="text-purple-400/60 text-[11px] font-medium mr-2">#{tag}</span>
                                ))
                            )}
                        </div>

                        {error && <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"><XIcon className="h-4 w-4" /> {error}</div>}

                        {isEditing ? (
                            <textarea 
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-gray-300 text-lg leading-relaxed resize-none placeholder-gray-800 font-mono"
                                placeholder="Zde začněte psát svůj příběh nebo song..."
                            />
                        ) : (
                            <div className="flex-1 prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-gray-300">
                                <SimpleMarkdownRenderer content={selectedNote.content} onInternalLinkClick={onInternalLinkClick} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Dynamic AI Tools */}
                <aside className="w-80 border-l border-gray-800 bg-gray-900/30 backdrop-blur-sm p-6 overflow-y-auto hidden lg:flex flex-col gap-8">
                    {selectedNote.type === 'music' ? (
                        <>
                            <section>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <MusicIcon className="h-3 w-3" /> Lyric Architecture
                                </h4>
                                <div className="space-y-3">
                                    <button 
                                        onClick={handleDeepScan}
                                        disabled={isAnalyzing}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm font-medium transition-all hover:bg-purple-600/20 group ${isAnalyzing ? 'animate-pulse' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ActivityIcon className="h-4 w-4 text-purple-400" />
                                            <span>Deep Lyric Scan</span>
                                        </div>
                                        <SparklesIcon className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </button>
                                    
                                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 flex justify-between items-center group">
                                        <div>
                                            <div className="text-[9px] text-gray-500 mb-1 uppercase font-bold">Tempo (BPM)</div>
                                            <div className="text-2xl font-mono text-white group-hover:text-purple-400 transition-colors">128</div>
                                        </div>
                                        <div className="text-[9px] text-green-500 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20">AI SYNC</div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Meta Tags Editor</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {['[Intro]', '[Verse]', '[Pre-Chorus]', '[Chorus]', '[Hook]', '[Bridge]', '[Drop]', '[Outro]'].map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => setEditingContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + tag + '\n')}
                                            className="px-2 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 hover:border-purple-500/50 border border-gray-700 text-gray-400 text-[10px] transition-all font-mono"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </>
                    ) : (
                        <section>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <SparklesIcon className="h-3 w-3 text-cyan-400" /> Intelligence
                            </h4>
                            <div className="space-y-6">
                                <button 
                                    onClick={handleAIProcess}
                                    disabled={isLoadingAI}
                                    className="w-full flex items-center justify-center gap-3 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-900/5"
                                >
                                    <BrainIcon className={`h-4 w-4 ${isLoadingAI ? 'animate-pulse' : ''}`} />
                                    {isLoadingAI ? 'Zpracovávám...' : 'AI Reorganizace'}
                                </button>
                                
                                <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <PlusIcon className="h-12 w-12 text-white" />
                                    </div>
                                    <div className="relative">
                                        <div className="text-[9px] text-gray-500 mb-3 uppercase font-black tracking-widest">Smart Append</div>
                                        <textarea 
                                            value={textToAppend}
                                            onChange={(e) => setTextToAppend(e.target.value)}
                                            placeholder="Vložte surová data k formátování..."
                                            className="w-full bg-transparent border-none outline-none text-xs text-gray-400 h-28 resize-none mb-3 placeholder-gray-700 leading-relaxed"
                                        />
                                        <button 
                                            onClick={handleAIAppend}
                                            disabled={isAppendingAI || !textToAppend.trim()}
                                            className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 border border-gray-600/50"
                                        >
                                            <PlusIcon className="h-3 w-3" />
                                            {isAppendingAI ? 'Formátuji...' : 'Přidat k poznámce'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </aside>
            </div>

            {/* Selection Toolbar (Floating) */}
            {toolbarPosition && (
                <div 
                    className="fixed z-50 flex items-center gap-0.5 bg-gray-900 border border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-xl p-1 animate-in zoom-in-95 duration-200 backdrop-blur-xl"
                    style={{ top: toolbarPosition.top, left: toolbarPosition.left, transform: 'translateX(-50%)' }}
                >
                    <button onClick={() => handleAIAction('summarize')} disabled={isAIActionLoading} className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title="Shrnout"><SummarizeIcon className="h-4 w-4" /></button>
                    <button onClick={() => handleAIAction('fix_grammar')} disabled={isAIActionLoading} className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all" title="Opravit gramatiku"><GrammarIcon className="h-4 w-4" /></button>
                    <button onClick={() => handleAIAction('translate_en')} disabled={isAIActionLoading} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Přeložit do AJ"><TranslateIcon className="h-4 w-4" /></button>
                    <div className="w-[1px] h-4 bg-gray-800 mx-1"></div>
                    <button onClick={handleCopyText} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"><CopyIcon className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
};

export default NoteView;