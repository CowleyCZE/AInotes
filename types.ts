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
  parentId?: string; // ID nadřazené kategorie pro hierarchii
}

export type AIAction = 'summarize' | 'fix_grammar' | 'translate_en';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface RhymeAnalysis {
  rhymes: { word: string; line: number; rhymeWith: { word: string; line: number; type: string }[] }[];
  meter: { pattern: string; syllables: number[]; suggestions: string[] };
  stats: { totalLines: number; rhymedLines: number; rhymeScheme: string };
}

export enum AiMode {
  AUTO = 'auto',
  CREATIVE = 'creative',
  TECHNICAL = 'technical'
}

export interface SmartSuggestion {
  id: string;
  type: 'enhancement' | 'alternative' | 'rhyme' | 'flow' | 'mood';
  text: string;
  description: string;
  confidence: number;
}

export interface Variant {
  id: string;
  text: string;
  type: string;
}

export interface LyricSegment {
  id: string;
  originalText: string;
  isProblematic: boolean;
  issueDescription?: string;
  variants: Variant[];
  selectedVariantId: string | null;
  smartSuggestions: SmartSuggestion[];
}

export interface AnalysisResult {
  segments: LyricSegment[];
  mode: AiMode;
}
