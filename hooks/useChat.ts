import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Note } from '../types';
import { initializeChatWithNotes, AISession } from '../services/geminiService';

export function useChat() {
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const aiSessionRef = useRef<AISession | null>(null);

    useEffect(() => {
        const storedChat = localStorage.getItem('ainotes_chat');
        if (storedChat) setChatMessages(JSON.parse(storedChat));
    }, []);

    useEffect(() => {
        localStorage.setItem('ainotes_chat', JSON.stringify(chatMessages));
    }, [chatMessages]);

    const handleSendChatMessage = async (allNotes: Note[], e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        const currentInput = chatInput;
        setChatInput('');
        setIsChatLoading(true);

        // Inicializace session pokud neexistuje
        if (!aiSessionRef.current) {
            aiSessionRef.current = initializeChatWithNotes(allNotes);
        }

        const assistantMsgId = (Date.now() + 1).toString();
        let assistantText = "";

        try {
            const stream = aiSessionRef.current.sendMessageStream(currentInput);
            
            // Přidáme prázdnou zprávu asistenta, kterou budeme plnit
            setChatMessages(prev => [...prev, { id: assistantMsgId, role: 'model', text: "" }]);

            for await (const chunk of stream) {
                assistantText += chunk.text;
                setChatMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId ? { ...msg, text: assistantText } : msg
                ));
            }
        } catch (error) {
            console.error("Chat error:", error);
            setChatMessages(prev => [...prev, { 
                id: (Date.now() + 2).toString(), 
                role: 'model', 
                text: "Omlouvám se, ale došlo k chybě při komunikaci s AI." 
            }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return {
        isChatMode, setIsChatMode, chatMessages, setChatMessages, 
        chatInput, setChatInput, isChatLoading, setIsChatLoading, handleSendChatMessage
    };
}
