import React, { useState } from 'react';
import { Category } from '../types';

interface CategoryTreeProps {
    categories: Category[];
    selectedId: string;
    onSelect: (id: string) => void;
    parentId?: string;
    level?: number;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({ 
    categories, selectedId, onSelect, parentId, level = 0 
}) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedIds(newExpanded);
    };

    const currentLevelCategories = categories.filter(c => c.parentId === parentId);

    if (currentLevelCategories.length === 0) return null;

    return (
        <div className={`space-y-1 ${level > 0 ? 'ml-3 mt-1 border-l border-gray-800' : ''}`}>
            {currentLevelCategories.map(cat => {
                const hasChildren = categories.some(c => c.parentId === cat.id);
                const isExpanded = expandedIds.has(cat.id);
                const isSelected = selectedId === cat.id;

                return (
                    <div key={cat.id}>
                        <div 
                            onClick={() => onSelect(cat.id)}
                            className={`group flex items-center py-1.5 px-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'}`}
                        >
                            {hasChildren && (
                                <button 
                                    onClick={(e) => toggleExpand(cat.id, e)}
                                    className="mr-1.5 p-0.5 hover:bg-gray-700 rounded transition-colors"
                                >
                                    <span className={`block w-3 h-3 flex items-center justify-center text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                </button>
                            )}
                            {!hasChildren && level > 0 && <span className="w-4.5 mr-1.5" />}
                            <span className="text-xs truncate">{cat.name}</span>
                        </div>
                        
                        {isExpanded && hasChildren && (
                            <CategoryTree 
                                categories={categories}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                parentId={cat.id}
                                level={level + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
