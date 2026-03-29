import React, { useState } from 'react';
import { Note } from '../types';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    notes: Note[];
    onSelectNote: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, notes, onSelectNote }) => {
    const [search, setSearch] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[999] flex justify-center pt-20">
            <div className="bg-gray-900 border border-purple-500 rounded-xl w-96 p-4">
                <input 
                    autoFocus
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Hledat poznámku..."
                    className="w-full bg-gray-800 p-2 text-white rounded outline-none"
                />
                <div className="mt-2 space-y-1">
                    {notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(n => (
                        <button key={n.id} onClick={() => { onSelectNote(n.id); onClose(); }} className="w-full text-left p-2 hover:bg-gray-800 text-gray-300">{n.title}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};
