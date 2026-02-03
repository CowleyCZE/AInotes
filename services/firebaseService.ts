
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Note, Category } from '../types';

export const saveDataToFirestore = async (notes: Note[], categories: Category[]): Promise<void> => {
    const batch = writeBatch(db);
    
    // Ukládání do sdílené, veřejné kolekce
    const notesCollectionRef = collection(db, 'public', 'shared', 'notes');
    notes.forEach(note => {
        const noteDocRef = doc(notesCollectionRef, note.id);
        batch.set(noteDocRef, note);
    });

    const categoriesCollectionRef = collection(db, 'public', 'shared', 'categories');
    categories.forEach(category => {
        const categoryDocRef = doc(categoriesCollectionRef, category.id);
        batch.set(categoryDocRef, category);
    });

    await batch.commit();
};

export const loadDataFromFirestore = async (): Promise<{ notes: Note[], categories: Category[] }> => {
    // Načítání ze sdílené, veřejné kolekce
    const notesCollectionRef = collection(db, 'public', 'shared', 'notes');
    const notesQuerySnapshot = await getDocs(notesCollectionRef);
    const notes = notesQuerySnapshot.docs.map(doc => doc.data() as Note);

    const categoriesCollectionRef = collection(db, 'public', 'shared', 'categories');
    const categoriesQuerySnapshot = await getDocs(categoriesCollectionRef);
    const categories = categoriesQuerySnapshot.docs.map(doc => doc.data() as Category);
    
    return { notes, categories };
};

export const deleteNoteFromFirestore = async (noteId: string): Promise<void> => {
    const noteDocRef = doc(db, 'public', 'shared', 'notes', noteId);
    await deleteDoc(noteDocRef);
};
