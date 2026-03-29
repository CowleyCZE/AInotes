import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';
import * as geminiService from '../services/geminiService';

describe('useChat hook', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
        
        // Mock AISession
        const mockSession = {
            sendMessageStream: async function* () {
                yield { text: "Odpověď od AI..." };
            }
        };
        vi.spyOn(geminiService, 'initializeChatWithNotes').mockReturnValue(mockSession as any);
    });

    it('should initialize with empty messages', () => {
        const { result } = renderHook(() => useChat());
        expect(result.current.chatMessages).toEqual([]);
        expect(result.current.isChatMode).toBe(false);
    });

    it('should send a message and add to history', async () => {
        const { result } = renderHook(() => useChat());
        
        act(() => {
            result.current.setChatInput('Ahoj AI');
        });

        await act(async () => {
            await result.current.handleSendChatMessage([]);
        });

        expect(result.current.chatMessages).toHaveLength(2); // User + AI reply
        expect(result.current.chatMessages[0].text).toBe('Ahoj AI');
        expect(result.current.chatMessages[1].text).toBe('Odpověď od AI...');
        expect(result.current.chatInput).toBe('');
    });

    it('should load chat history from localStorage', () => {
        const mockHistory = [{ id: '1', role: 'user', text: 'Stará zpráva' }];
        window.localStorage.setItem('ainotes_chat', JSON.stringify(mockHistory));

        const { result } = renderHook(() => useChat());
        expect(result.current.chatMessages).toEqual(mockHistory);
    });

    it('should toggle chat mode', () => {
        const { result } = renderHook(() => useChat());
        act(() => {
            result.current.setIsChatMode(true);
        });
        expect(result.current.isChatMode).toBe(true);
    });
});
