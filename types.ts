
export interface Note {
  id: string;
  title: string;
  content: string; // Raw content (Markdown) - Used for Lyrics in music mode
  categoryId: string;
  createdAt: number;
  updatedAt: number;
  history?: string[]; // For undo functionality
  tags?: string[];
  order?: number; // For manual reordering in list view
  
  // New fields for Music/Lyrics mode
  type?: 'text' | 'lyric'; // Distinguishes standard notes from music lyrics
  userNotes?: string; // "Poznámky" field for lyrics
  musicDescription?: string; // "Popis hudby" field
}

export interface Category {
  id: string;
  name: string;
}

export type AIAction = 'summarize' | 'fix_grammar' | 'translate_en';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface LinkSuggestion {
  originalText: string;
  targetNoteId: string;
  targetNoteTitle: string;
  reason: string; // Why AI thinks this is a connection
}
