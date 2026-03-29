import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveNoteToFirestore, deleteNoteFromFirestore } from '../services/firebaseService';
import * as firestore from 'firebase/firestore';

// Mockování firebaseConfig a firebase/firestore
vi.mock('../firebaseConfig', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn(),
    writeBatch: vi.fn(),
    getDocs: vi.fn()
}));

describe('FirebaseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call setDoc with correct parameters when saving a note', async () => {
        const mockNote = { id: 'note123', title: 'Test', content: 'Obsah', categoryId: 'cat1', type: 'text' as const, createdAt: 0, updatedAt: 0, tags: [] };
        const mockDocRef = { id: 'note123' };
        
        (firestore.doc as any).mockReturnValue(mockDocRef);
        (firestore.setDoc as any).mockResolvedValue(undefined);

        await saveNoteToFirestore(mockNote);

        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'public', 'shared', 'notes', 'note123');
        expect(firestore.setDoc).toHaveBeenCalledWith(mockDocRef, mockNote);
    });

    it('should call deleteDoc when deleting a note', async () => {
        const mockDocRef = { id: 'note123' };
        (firestore.doc as any).mockReturnValue(mockDocRef);
        (firestore.deleteDoc as any).mockResolvedValue(undefined);

        await deleteNoteFromFirestore('note123');

        expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'public', 'shared', 'notes', 'note123');
        expect(firestore.deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });
});
