import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleMarkdownRenderer } from '../components/SimpleMarkdownRenderer';
import React from 'react';

describe('SimpleMarkdownRenderer Component', () => {
    it('should render standard markdown correctly', () => {
        const content = '# Nadpis\n**Tučný text**\n- Bod 1';
        render(<SimpleMarkdownRenderer content={content} />);
        
        expect(screen.getByText('Nadpis')).toBeDefined();
        expect(screen.getByText('Tučný text')).toBeDefined();
        expect(screen.getByText('Bod 1')).toBeDefined();
    });

    it('should render tables (GFM)', () => {
        const content = '| Hlava | Popis |\n| :--- | :--- |\n| Data | Info |';
        render(<SimpleMarkdownRenderer content={content} />);
        
        expect(screen.getByRole('table')).toBeDefined();
        expect(screen.getByText('Hlava')).toBeDefined();
        expect(screen.getByText('Data')).toBeDefined();
    });

    it('should handle internal note links [[id|Title]]', () => {
        const onLinkClick = vi.fn();
        const content = 'Viz [[note123|Moje Poznámka]]';
        render(<SimpleMarkdownRenderer content={content} onLinkClick={onLinkClick} />);
        
        const link = screen.getByText('Moje Poznámka');
        expect(link).toBeDefined();
        
        fireEvent.click(link);
        expect(onLinkClick).toHaveBeenCalledWith('note123');
    });
});
