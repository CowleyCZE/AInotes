import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTree } from '../components/CategoryTree';
import React from 'react';

const mockCategories = [
    { id: '1', name: 'Parent' },
    { id: '2', name: 'Child', parentId: '1' },
    { id: '3', name: 'Other' }
];

describe('CategoryTree Component', () => {
    it('should render top-level categories', () => {
        render(
            <CategoryTree 
                categories={mockCategories} 
                selectedId="3" 
                onSelect={() => {}} 
            />
        );
        expect(screen.getByText('Parent')).toBeDefined();
        expect(screen.getByText('Other')).toBeDefined();
        expect(screen.queryByText('Child')).toBeNull(); // Shoud be hidden initially
    });

    it('should expand category and show children on toggle click', () => {
        render(
            <CategoryTree 
                categories={mockCategories} 
                selectedId="all" 
                onSelect={() => {}} 
            />
        );
        const toggle = screen.getByText('▶');
        fireEvent.click(toggle);
        expect(screen.getByText('Child')).toBeDefined();
    });

    it('should call onSelect when a category is clicked', () => {
        const onSelect = vi.fn();
        render(
            <CategoryTree 
                categories={mockCategories} 
                selectedId="all" 
                onSelect={onSelect} 
            />
        );
        fireEvent.click(screen.getByText('Other'));
        expect(onSelect).toHaveBeenCalledWith('3');
    });
});
