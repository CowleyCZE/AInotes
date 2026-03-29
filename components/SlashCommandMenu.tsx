import React from 'react';

interface SlashCommandMenuProps {
    onSelect: (command: string) => void;
    position: { top: number; left: number };
    onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ onSelect, position, onClose }) => {
    const commands = [
        { name: 'Sloka', value: '[SLOKA]\n' },
        { name: 'Refrén', value: '[REFRÉN]\n' },
        { name: 'Bridge', value: '[BRIDGE]\n' },
        { name: 'Intro', value: '[INTRO]\n' },
        { name: 'Outro', value: '[OUTRO]\n' },
    ];

    return (
        <div 
            className="fixed z-[100] bg-gray-900 border border-purple-500/50 rounded-lg shadow-2xl w-40 overflow-hidden"
            style={{ top: position.top + 20, left: position.left }}
        >
            {commands.map(cmd => (
                <button
                    key={cmd.name}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-900/50 hover:text-white transition-colors"
                    onClick={() => { onSelect(cmd.value); onClose(); }}
                >
                    {cmd.name}
                </button>
            ))}
        </div>
    );
};
