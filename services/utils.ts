import { Note } from '../types';

export const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

export const normalizeTitle = (title: string) => {
    return title.toLowerCase()
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '')
        .replace(/verze\s*\d+/g, '')
        .replace(/v\.\s*\d+/g, '')
        .replace(/v\d+/g, '')
        .replace(/draft/g, '')
        .replace(/\d{1,2}\.\d{1,2}\.\d{2,4}/g, '') // dates
        .trim();
};

export const groupNotesByTitle = (notes: Note[]) => {
    const groups: { [key: string]: Note[] } = {};
    notes.forEach(note => {
        // Use exact title matching for the folder system as requested
        const key = note.title.trim() || "Bez názvu";
        if (!groups[key]) groups[key] = [];
        groups[key].push(note);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
};
