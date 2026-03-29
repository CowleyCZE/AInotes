import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { XIcon, BrainIcon, SendIcon, UserIcon, SparklesIcon } from './Icons';
import { SimpleMarkdownRenderer } from './SimpleMarkdownRenderer';

interface ChatViewProps {
    chatMessages: ChatMessage[];
    chatInput: string;
    setChatInput: (val: string) => void;
    isChatLoading: boolean;
    onSendMessage: (e?: React.FormEvent) => void;
    onToggleChat: () => void;
    onInternalLinkClick: (id: string) => void;
    notesCount: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
    chatMessages, chatInput, setChatInput, isChatLoading,
    onSendMessage, onToggleChat, onInternalLinkClick, notesCount
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-950/20 backdrop-blur-xl relative">
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/30">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-600/20 p-1.5 rounded-lg border border-purple-500/20 shadow-lg shadow-purple-500/10">
                        <BrainIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-100">Studio Context Chat</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Indexováno {notesCount} poznámek</p>
                    </div>
                </div>
                <button 
                    onClick={onToggleChat} 
                    className="p-2 text-gray-500 hover:text-white transition-colors hover:bg-gray-800 rounded-lg"
                >
                    <XIcon className="h-4 w-4" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-40">
                        <div className="relative mb-6">
                            <BrainIcon className="w-16 h-16 text-purple-500/50" />
                            <SparklesIcon className="w-6 h-6 text-purple-400 absolute -top-2 -right-2 animate-glow" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-300 mb-2">Jak vám mohu pomoci?</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Můžete se mě ptát na souvislosti mezi vašimi poznámkami, nechat si napsat text písně nebo provést analýzu vašich myšlenek.
                        </p>
                    </div>
                ) : (
                    chatMessages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border shadow-md ${
                                    msg.role === 'user' 
                                        ? 'bg-gray-800 border-gray-700' 
                                        : 'bg-gradient-to-br from-purple-600 to-blue-600 border-purple-500'
                                }`}>
                                    {msg.role === 'user' ? <UserIcon className="h-4 w-4 text-gray-400" /> : <BrainIcon className="h-4 w-4 text-white" />}
                                </div>
                                
                                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-gray-800 text-gray-200 rounded-tr-none border border-gray-700' 
                                        : 'bg-gray-900/50 text-gray-200 rounded-tl-none border border-purple-500/10 backdrop-blur-sm prose prose-invert prose-sm max-w-none'
                                }`}>
                                    {msg.role === 'model' ? (
                                        <SimpleMarkdownRenderer content={msg.text} onLinkClick={onInternalLinkClick} />
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                    {msg.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500/50 animate-pulse align-middle" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-gray-900/40 border-t border-gray-800">
                <form 
                    onSubmit={onSendMessage}
                    className="relative max-w-4xl mx-auto group"
                >
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Napište zprávu nebo se zeptejte na své poznámky..."
                        className="w-full bg-gray-800/80 border border-gray-700/50 rounded-2xl px-6 py-4 pr-14 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all placeholder-gray-600 shadow-inner"
                        disabled={isChatLoading}
                    />
                    <button 
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className="absolute right-3 top-2.5 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white rounded-xl transition-all shadow-lg shadow-purple-600/20 group-focus-within:scale-105 active:scale-95"
                    >
                        {isChatLoading ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        ) : (
                            <SendIcon className="h-5 w-5" />
                        )}
                    </button>
                </form>
                <p className="text-[10px] text-gray-600 text-center mt-3 uppercase tracking-tighter">AI může dělat chyby. Ověřujte důležité informace.</p>
            </div>
        </div>
    );
};

export default ChatView;