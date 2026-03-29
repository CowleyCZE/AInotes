import React from 'react';

const COMMON_TAGS = [
    { label: 'Verse', value: '[Verse]' },
    { label: 'Chorus', value: '[Chorus]' },
    { label: 'Bridge', value: '[Bridge]' },
    { label: 'Intro', value: '[Intro]' },
    { label: 'Outro', value: '[Outro]' },
    { label: 'Pre-Chorus', value: '[Pre-Chorus]' },
    { label: 'Solo', value: '[Solo]' },
    { label: 'Hook', value: '[Hook]' },
];

const STYLE_TAGS = [
    { label: 'Atmospheric', value: '[Style: Atmospheric]' },
    { label: 'Energetic', value: '[Style: Energetic]' },
    { label: 'Melancholic', value: '[Style: Melancholic]' },
    { label: 'Acoustic', value: '[Style: Acoustic]' },
];

interface MetaTagToolbarProps {
    onInsert: (tag: string) => void;
}

export const MetaTagToolbar: React.FC<MetaTagToolbarProps> = ({ onInsert }) => {
    return (
        <div className="flex flex-col gap-4 p-4 bg-gray-900/50 border-l border-gray-800 w-48 overflow-y-auto custom-scrollbar">
            <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Struktura</h3>
                <div className="grid grid-cols-1 gap-1.5">
                    {COMMON_TAGS.map(tag => (
                        <button
                            key={tag.label}
                            onClick={() => onInsert(tag.value)}
                            className="text-left px-3 py-1.5 text-xs bg-gray-800 hover:bg-purple-600/30 hover:text-purple-300 text-gray-400 rounded-lg border border-gray-700 transition-all"
                        >
                            {tag.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Styl (Suno/Udio)</h3>
                <div className="grid grid-cols-1 gap-1.5">
                    {STYLE_TAGS.map(tag => (
                        <button
                            key={tag.label}
                            onClick={() => onInsert(tag.value)}
                            className="text-left px-3 py-1.5 text-xs bg-gray-800 hover:bg-cyan-600/30 hover:text-cyan-300 text-gray-400 rounded-lg border border-gray-700 transition-all"
                        >
                            {tag.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
