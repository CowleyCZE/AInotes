import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { PlusIcon } from './Icons';

// --- MARKDOWN RENDERER ---
interface SimpleMarkdownRendererProps {
    content: string;
    onLinkClick?: (id: string) => void;
}

export const SimpleMarkdownRenderer: React.FC<SimpleMarkdownRendererProps> = ({ content, onLinkClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const htmlContent = useMemo(() => {
        if (!content) return '';
        let processedContent = content;
        
        // 1. Protect Code Blocks
        const codeBlocks: string[] = [];
        processedContent = processedContent.replace(/```([\s\S]*?)```/g, (match, p1) => {
            const code = p1.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            codeBlocks.push(`<pre class="bg-gray-800 p-4 rounded-md my-4 overflow-x-auto"><code class="text-sm text-cyan-300">${code}</code></pre>`);
            return `___CODEBLOCK_${codeBlocks.length - 1}___`;
        });

        // 2. Process standard Markdown
        processedContent = processedContent
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b border-gray-600 pb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 border-b-2 border-gray-500 pb-2">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-700 text-red-300 px-1 py-0.5 rounded-sm">$1</code>')
            .replace(/^\s*[-*] (.*$)/gim, '<li>$1</li>')
            .replace(/(\<li\>[\s\S]*?\<\/li\>)/g, '<ul>$1</ul>')
            .replace(/\<\/ul\>\s*\<ul\>/g, '')
            .replace(/\n/g, '<br />')
            .replace(/(\<br \/\>){2,}/g, '<br />')
            .replace(/\<ul\>\<br \/\>/g, '<ul>')
            .replace(/\<\/li\>\<br \/\>/g, '</li>');
        
        // 3. Process Links: [Title](#note-id) or [Title](note-id)
        processedContent = processedContent.replace(/\[(.*?)\]\(#(.*?)\)/g, '<a href="#$2" class="internal-link text-cyan-400 hover:underline cursor-pointer" data-note-id="$2">$1</a>');
        
        // 4. Restore Code Blocks
        codeBlocks.forEach((block, index) => {
            processedContent = processedContent.replace(`___CODEBLOCK_${index}___`, block);
        });

        return processedContent;

    }, [content]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !onLinkClick) return;

        const handleInternalLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.classList.contains('internal-link')) {
                e.preventDefault();
                const noteId = target.getAttribute('data-note-id');
                if (noteId) {
                    onLinkClick(noteId);
                }
            }
        };

        container.addEventListener('click', handleInternalLinkClick);
        return () => {
            container.removeEventListener('click', handleInternalLinkClick);
        };
    }, [htmlContent, onLinkClick]);

    return <div ref={containerRef} className="prose prose-invert max-w-none leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
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
