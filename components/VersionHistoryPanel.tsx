import React from 'react';
import { formatDate } from '../services/utils';
import { ClockIcon, XIcon, UndoIcon } from './Icons';

interface VersionHistoryPanelProps {
    history: string[];
    onRestore: (index: number) => void;
    onClose: () => void;
    currentContent: string;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ history, onRestore, onClose, currentContent }) => {
    return (
        <div className="absolute inset-y-0 right-0 w-80 bg-gray-900 border-l border-purple-500/30 shadow-2xl z-50 flex flex-col animate-slide-in-right">
            <header className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historie verzí</h3>
                </div>
                <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
                    <XIcon className="h-5 w-5" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Aktuální verze</div>
                    <div className="text-xs text-gray-400 line-clamp-3 italic">
                        {currentContent.substring(0, 150)}...
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] font-bold text-gray-500 uppercase px-1 mb-2">Předchozí uložení</div>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-600 text-xs italic">
                            Žádné starší verze k dispozici
                        </div>
                    ) : (
                        history.map((content, index) => (
                            <div 
                                key={index}
                                className="group p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 rounded-lg cursor-pointer transition-all"
                                onClick={() => onRestore(index)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-gray-500 group-hover:text-purple-400 transition-colors">
                                        Verze před {index + 1} změnami
                                    </span>
                                    <UndoIcon className="h-3 w-3 text-gray-600 group-hover:text-purple-400" />
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-gray-300 line-clamp-2 transition-colors">
                                    {content.substring(0, 100)}...
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <footer className="p-4 border-t border-gray-800 bg-gray-950 text-[10px] text-gray-600 italic">
                Aplikace automaticky uchovává posledních 10 verzí každé poznámky.
            </footer>
        </div>
    );
};
