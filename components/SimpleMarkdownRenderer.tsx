import React, { useMemo, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { PlusIcon } from './Icons';

// --- MARKDOWN RENDERER ---
interface SimpleMarkdownRendererProps {
    content: string;
    onLinkClick?: (id: string) => void;
}

export const SimpleMarkdownRenderer: React.FC<SimpleMarkdownRendererProps> = ({ content, onLinkClick }) => {
    
    // Pre-processing for [[id|Title]] syntax
    const processedContent = useMemo(() => {
        if (!content) return '';
        // Convert [[note-id|Note Title]] to [Note Title](#note-id)
        return content.replace(/\[\[(.*?)\|(.*?)\]\]/g, '[$2](#$1)');
    }, [content]);

    return (
        <div className="prose prose-invert max-w-none leading-relaxed text-gray-300">
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeRaw]}
                components={{
                    // Custom handler for links to support internal note switching
                    a: ({ node: _node, ...props }) => {
                        const isInternal = props.href?.startsWith('#');
                        if (isInternal && onLinkClick) {
                            return (
                                <a 
                                    {...props} 
                                    className="internal-link text-cyan-400 hover:underline cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onLinkClick(props.href!.substring(1));
                                    }}
                                >
                                    {props.children}
                                </a>
                            );
                        }
                        return <a {...props} className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer" />;
                    },
                    // Styling for other elements to match the app aesthetic
                    table: ({ node: _node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-gray-800">
                            <table {...props} className="min-w-full divide-y divide-gray-800" />
                        </div>
                    ),
                    th: ({ node: _node, ...props }) => <th {...props} className="px-4 py-3 bg-gray-900/50 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" />,
                    td: ({ node: _node, ...props }) => <td {...props} className="px-4 py-3 text-sm text-gray-400 border-t border-gray-800" />,
                    code: ({ node: _node, inline, ...props }: any) => (
                        inline 
                            ? <code {...props} className="bg-gray-800 text-pink-300 px-1.5 py-0.5 rounded text-xs font-mono" />
                            : <code {...props} className="block bg-gray-900/80 text-cyan-300 p-4 rounded-xl border border-gray-800 my-4 text-sm font-mono overflow-x-auto" />
                    ),
                    blockquote: ({ node: _node, ...props }) => (
                        <blockquote {...props} className="border-l-4 border-purple-500/50 bg-purple-500/5 px-6 py-4 my-6 italic text-gray-400 rounded-r-xl" />
                    )
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

// --- SUB-COMPONENT FOR SONGWRITER TOOLBAR ---
interface SongwriterSourceToolbarProps {
    onAdd: () => void;
    onCopy: () => void;
}

export const SongwriterSourceToolbar: React.FC<SongwriterSourceToolbarProps> = ({ onAdd, onCopy }) => {
    const [position, setPosition] = useState<{top: number, left: number} | null>(null);

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setPosition({
                top: rect.top - 40,
                left: rect.left + (rect.width / 2)
            });
        } else {
            setPosition(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);
        return () => {
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('keyup', handleSelection);
        }
    }, [handleSelection]);

    if (!position) return null;

    return (
        <div 
            className="fixed z-50 flex items-center bg-gray-900 border border-purple-500 rounded-lg shadow-xl p-1 animate-fade-in-up"
            style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
            onMouseDown={e => e.preventDefault()}
        >
            <button onClick={onAdd} className="px-3 py-1 text-xs font-bold text-white hover:bg-purple-700 rounded transition flex items-center">
                <PlusIcon className="w-3 h-3 mr-1"/> Vložit
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            <button onClick={onCopy} className="px-3 py-1 text-xs text-gray-300 hover:bg-gray-800 rounded transition">
                Kopírovat
            </button>
        </div>
    );
};
