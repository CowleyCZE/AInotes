import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    processNoteWithAI, 
    performAIQuickAction, 
    formatAndAppendTextWithAI,
    deepLyricScan,
    findSmartConnections,
    analyzeLyricsRhymeAndMeter,
    initializeChatWithNotes
} from '../services/geminiService';

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

    it('should format and append text with AI', async () => {
        const mockResponse = {
            message: {
                content: JSON.stringify({
                    appendedContent: '## Nový obsah\nFormátovaný markdown text'
                })
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await formatAndAppendTextWithAI('Nový text', 'Existující obsah');
        
        expect(result.appendedContent).toBe('## Nový obsah\nFormátovaný markdown text');
        expect(fetch).toHaveBeenCalled();
    });

    it('should perform deep lyric scan', async () => {
        const mockResponse = {
            message: {
                content: JSON.stringify({
                    segments: [
                        {
                            id: '1',
                            originalText: 'Běží čas',
                            isProblematic: false,
                            issueDescription: '',
                            variants: [],
                            selectedVariantId: null,
                            smartSuggestions: []
                        }
                    ],
                    mode: 'AUTO'
                })
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await deepLyricScan('Běží čas');
        
        expect(result.segments).toHaveLength(1);
        expect(result.segments[0].originalText).toBe('Běží čas');
        expect(result.mode).toBe('AUTO');
    });

    it('should find smart connections between notes', async () => {
        const mockResponse = {
            message: {
                content: JSON.stringify([
                    {
                        originalText: 'music',
                        targetNoteId: 'note-123',
                        targetNoteTitle: 'Hudební nástroje',
                        reason: 'Sdělení tématu hudby'
                    }
                ])
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const mockNotes = [
            { 
                id: 'note-123', 
                title: 'Hudební nástroje', 
                content: 'Kytara, klavír',
                tags: [],
                type: 'note' as const,
                createdAt: 0,
                updatedAt: 0,
                history: []
            }
        ];

        const result = await findSmartConnections('current', 'Hudba je krásná', mockNotes);
        
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0].targetNoteId).toBe('note-123');
        }
    });

    it('should analyze lyrics for rhyme and meter', async () => {
        const mockResponse = {
            message: {
                content: JSON.stringify({
                    rhymeScheme: 'AABB',
                    rhymedLines: 4,
                    meterAnalysis: 'Převážně iambický tetrametr',
                    suggestionCount: 0,
                    statistics: {
                        totalLines: 4,
                        rhymePairs: 2,
                        coverage: '100%'
                    }
                })
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await analyzeLyricsRhymeAndMeter('Běží čas, plynou údaje\nRáno vstane jasan v krajích');
        
        expect(result.rhymeScheme).toBe('AABB');
        expect(result.meterAnalysis).toContain('tetrametr');
    });

    it.skip('should initialize chat session with notes', () => {
        // Note: This test is skipped because AISession constructor requires Gemini client
        // which cannot be easily mocked in the test environment
        const mockNotes = [
            { 
                id: 'note-1', 
                title: 'First Note', 
                content: 'Content',
                tags: [],
                type: 'note' as const,
                createdAt: 0,
                updatedAt: 0,
                history: []
            }
        ];

        const session = initializeChatWithNotes(mockNotes, 'qwen2.5:1.5b');
        
        expect(session).toBeDefined();
    });

    it('should handle AI summarize action', async () => {
        const mockResponse = {
            message: {
                content: 'Stručný výtah textu.'
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await performAIQuickAction('Dlouhý text s mnoha detaily', 'Full content', 'summarize');
        
        expect(result).toBe('Stručný výtah textu.');
    });

    it('should handle AI translate action', async () => {
        const mockResponse = {
            message: {
                content: 'This is a test text.'
            }
        };

        (vi.mocked(fetch) as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await performAIQuickAction('Toto je testovací text.', 'Full content', 'translate_en');
        
        expect(result).toBe('This is a test text.');
    });
});
