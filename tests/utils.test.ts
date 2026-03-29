import { describe, it, expect } from 'vitest';
import { normalizeTitle, groupNotesByTitle, formatDate } from '../services/utils';
import { Note } from '../types';

describe('Utils', () => {
    describe('formatDate', () => {
        it('should format timestamps correctly in cs-CZ locale', () => {
            const timestamp = new Date('2026-03-23T10:00:00').getTime();
            const formatted = formatDate(timestamp);
            // Example: "23. 3. 2026 10:00" - exact format depends on environment but should contain these parts
            expect(formatted).toContain('23.');
            expect(formatted).toContain('3.');
            expect(formatted).toContain('2026');
            expect(formatted).toContain('10:00');
        });
    });

    describe('normalizeTitle', () => {
        it('should remove versioning and drafts', () => {
            expect(normalizeTitle('Moje poznámka (verze 1)')).toBe('moje poznámka');
            expect(normalizeTitle('Píseň [draft]')).toBe('píseň');
            expect(normalizeTitle('Píseň v1')).toBe('píseň');
            expect(normalizeTitle('Song v. 2')).toBe('song');
        });

        it('should remove dates', () => {
            expect(normalizeTitle('Dnešní zápis 23.3.2026')).toBe('dnešní zápis');
            expect(normalizeTitle('Zápis 1.1.25')).toBe('zápis');
        });

        it('should handle brackets and trim', () => {
            expect(normalizeTitle('  (Info) Důležité  ')).toBe('důležité');
        });
    });

    describe('groupNotesByTitle', () => {
        it('should group notes by their trimmed title', () => {
            const mockNotes: Partial<Note>[] = [
                { id: '1', title: 'A', content: 'c1' },
                { id: '2', title: 'A ', content: 'c2' },
                { id: '3', title: 'B', content: 'c3' },
                { id: '4', title: '', content: 'c4' }
            ];

            const result = groupNotesByTitle(mockNotes as Note[]);
            
            expect(result).toHaveLength(3); // 'A', 'B', 'Bez názvu'
            expect(result.find(r => r[0] === 'A')![1]).toHaveLength(2);
            expect(result.find(r => r[0] === 'B')![1]).toHaveLength(1);
            expect(result.find(r => r[0] === 'Bez názvu')![1]).toHaveLength(1);
        });

        it('should sort groups alphabetically', () => {
             const mockNotes: Partial<Note>[] = [
                { id: '1', title: 'C', content: 'c1' },
                { id: '2', title: 'A', content: 'c2' },
                { id: '3', title: 'B', content: 'c3' }
            ];
            const result = groupNotesByTitle(mockNotes as Note[]);
            expect(result[0][0]).toBe('A');
            expect(result[1][0]).toBe('B');
            expect(result[2][0]).toBe('C');
        });
    });
});
