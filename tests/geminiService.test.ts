import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processNoteWithAI, performAIQuickAction } from '../services/geminiService';

describe('GeminiService', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should process note with AI and return structured data', async () => {
        const mockResponse = {
            message: {
                content: JSON.stringify({
                    title: 'Test Note',
                    category: 'Test Category',
                    formattedContent: 'Test Content',
                    tags: ['tag1'],
                    type: 'general'
                })
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await processNoteWithAI('Raw text', [{ id: '1', name: 'Existing' }]);
        
        expect(result.title).toBe('Test Note');
        expect(result.category).toBe('Test Category');
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/chat'), expect.any(Object));
    });

    it('should handle AI quick actions', async () => {
        const mockResponse = {
            message: {
                content: 'Tento text je opraven.'
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await performAIQuickAction('Chybný text', 'Full content', 'fix_grammar');
        
        expect(result).toBe('Tento text je opraven.');
        expect(fetch).toHaveBeenCalled();
    });
});
