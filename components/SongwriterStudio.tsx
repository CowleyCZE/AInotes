import React from 'react';
import { Note, RhymeAnalysis } from '../types';
import { MusicIcon, XIcon, PlusIcon, ClockIcon } from './Icons';
import { SimpleMarkdownRenderer, SongwriterSourceToolbar } from './SimpleMarkdownRenderer';
import { formatDate } from '../services/utils';

interface SongwriterStudioProps {
    selectedSongwriterNotes: string[];
    notes: Note[];
    syncScrollEnabled: boolean;
    setSyncScrollEnabled: (val: boolean) => void;
    syncScrollMode: 'percentage' | 'paragraph' | 'line';
    setSyncScrollMode: (val: 'percentage' | 'paragraph' | 'line') => void;
    isAnalyzingRhyme: boolean;
    onAnalyzeRhyme: () => void;
    onClose: () => void;
    showRhymeAnalyzer: boolean;
    setShowRhymeAnalyzer: (val: boolean) => void;
    rhymeAnalysis: RhymeAnalysis | null;
    activeScrollIndex: number | null;
    handleSyncScroll: (e: React.UIEvent<HTMLDivElement>, noteIndex: number) => void;
    scrollSyncRefs: React.MutableRefObject<{[key: string]: HTMLDivElement | null}>;
    sourceNoteContents: {[key:string]: string};
    addTextToComposition: (text: string, noteId: string, colorIndex: number) => void;
    autoNumbering: boolean;
    setAutoNumbering: (val: boolean) => void;
    compositionContent: string;
    setCompositionContent: (val: string) => void;
    saveCompositionToLocalStorage: () => void;
}

const songwriterColors = ['bg-purple-900/40 border-purple-500', 'bg-teal-900/40 border-teal-500', 'bg-green-900/40 border-green-500', 'bg-orange-900/40 border-orange-500'];
const songwriterTextColors = ['text-purple-300', 'text-teal-300', 'text-green-300', 'text-orange-300'];

export const SongwriterStudio: React.FC<SongwriterStudioProps> = ({
    selectedSongwriterNotes,
    notes,
    syncScrollEnabled,
    setSyncScrollEnabled,
    syncScrollMode,
    setSyncScrollMode,
    isAnalyzingRhyme,
    onAnalyzeRhyme,
    onClose,
    showRhymeAnalyzer,
    setShowRhymeAnalyzer,
    rhymeAnalysis,
    activeScrollIndex,
    handleSyncScroll,
    scrollSyncRefs,
    sourceNoteContents,
    addTextToComposition,
    autoNumbering,
    setAutoNumbering,
    compositionContent,
    setCompositionContent,
    saveCompositionToLocalStorage
}) => {
    const isGridMode = selectedSongwriterNotes.length > 2;

    return (
        <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
            <header className="h-auto min-h-[56px] bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 py-2 flex-wrap gap-2">
                <div className="flex items-center text-gray-200 font-bold">
                    <MusicIcon className="mr-2 text-purple-500" /> Studio Skladatele
                </div>
                
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
                        onClick={onAnalyzeRhyme}
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
                
                <button onClick={onClose} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded transition">
                    <XIcon className="inline w-4 h-4 mr-1"/> Zavřít studio
                </button>
            </header>

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
                                {activeScrollIndex === index && (
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                                )}
                                <div 
                                    className="flex-1 overflow-y-auto p-4 custom-scrollbar relative group pb-10"
                                    onScroll={(e) => handleSyncScroll(e, index)}
                                    ref={(el) => { scrollSyncRefs.current[noteId] = el; }}
                                >
                                   <SongwriterSourceToolbar 
                                      onAdd={() => {
                                          const selection = window.getSelection();
                                          if (selection) addTextToComposition(selection.toString(), noteId, index);
                                      }}
                                      onCopy={async () => {
                                          const selection = window.getSelection();
                                          if (selection) await navigator.clipboard.writeText(selection.toString());
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

            <div className="h-1/3 bg-gray-900 border-t-2 border-purple-900/50 flex flex-col shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-b border-gray-700">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-purple-400">FINÁLNÍ KOMPOZICE</span>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500 mr-1">Nástroje:</span>
                            <button 
                                onClick={() => {
                                    const marker = autoNumbering ? `[SLOKA ${((compositionContent.match(/\[SLOKA /g) || []).length) + 1}]` : '[SLOKA]';
                                    setCompositionContent(compositionContent + '\n\n' + marker + '\n');
                                }}
                                className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600 text-blue-200 rounded text-xs transition"
                            >
                                Sloka
                            </button>
                            <button 
                                onClick={() => {
                                    const marker = autoNumbering ? `[REFRÉN ${((compositionContent.match(/\[REFRÉN /g) || []).length) + 1}]` : '[REFRÉN]';
                                    setCompositionContent(compositionContent + '\n\n' + marker + '\n');
                                }}
                                className="px-2 py-1 bg-pink-600/50 hover:bg-pink-600 text-pink-200 rounded text-xs transition"
                            >
                                Refrén
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoNumbering}
                                onChange={(e) => setAutoNumbering(e.target.checked)}
                                className="rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-400"
                            />
                            <span>Automatické číslování</span>
                        </label>
                        <button 
                            onClick={saveCompositionToLocalStorage}
                            className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded text-xs transition flex items-center gap-1"
                        >
                            Uložit
                        </button>
                    </div>
                </div>
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
};
