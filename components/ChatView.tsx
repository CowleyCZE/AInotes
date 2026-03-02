import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { ChatIcon, XIcon, SendIcon } from './Icons';
import { SimpleMarkdownRenderer } from './SimpleMarkdownRenderer';

interface ChatViewProps {
    chatMessages: ChatMessage[];
    chatInput: string;
    setChatInput: (val: string) => void;
    isChatLoading: boolean;
    onSendMessage: (e?: React.FormEvent) => void;
    onToggleChat: () => void;
    onInternalLinkClick: (noteId: string) => void;
    notesCount: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
    chatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    onSendMessage,
    onToggleChat,
    onInternalLinkClick,
    notesCount
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    return (
        <div className="flex flex-col h-full bg-gray-850">
            <header className="p-4 border-b border-gray-700 bg-gray-800/80 flex justify-between items-center">
                <div className="flex items-center">
                     <div className="p-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg mr-3 shadow-lg shadow-purple-500/20">
                         <ChatIcon className="text-white w-6 h-6" />
                     </div>
                     <div>
                         <h2 className="text-xl font-bold text-gray-100">AI Asistent</h2>
                         <p className="text-xs text-gray-400">Zeptejte se na cokoliv ze svých {notesCount} poznámek</p>
                     </div>
                </div>
                <button onClick={onToggleChat} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                    <XIcon className="w-6 h-6"/>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-cyan-600 text-white rounded-br-none' 
                                : 'bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600'
                        }`}>
                            <SimpleMarkdownRenderer content={msg.text} onLinkClick={onInternalLinkClick} />
                            {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle"></span>}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={onSendMessage} className="relative">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ptejte se na své poznámky..."
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        disabled={isChatLoading}
                    />
                    <button 
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
                    >
                        {isChatLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"/> : <SendIcon className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};
