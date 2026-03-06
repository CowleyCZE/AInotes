export interface Variant {
  id: string;
  text: string;
  type: string;
  confidence?: number;
}

export interface SmartSuggestion {
  id: string;
  type: 'enhancement' | 'alternative' | 'rhyme' | 'flow' | 'mood';
  text: string;
  description: string;
  confidence: number;
}

export interface LyricSegment {
  id: string;
  originalText: string;
  isProblematic: boolean;
  issueDescription?: string;
  variants: Variant[];
  selectedVariantId: string | null;
  smartSuggestions?: SmartSuggestion[];
  metaTags?: string[];
}

export interface AnalysisResult {
  segments: LyricSegment[];
  mode: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown content / Lyrics
  categoryId: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  history?: string[];
  
  // Mode-specific fields
  type: 'general' | 'music';
  
  // Music-specific metadata
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  metaTags?: string[];
  segments?: LyricSegment[]; // Analyzed lyrics
  analysisResult?: AnalysisResult;
  musicDescription?: string;
  userNotes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export type AIAction = 'summarize' | 'fix_grammar' | 'translate_en' | 'analyze_lyrics' | 'suggest_rhymes';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isStreaming?: boolean;
}

export enum AiMode {
  AUTO = 'AUTO',
  MODE_1 = 'MODE_1',
  MODE_2 = 'MODE_2',
  MODE_3 = 'MODE_3',
  MODE_4 = 'MODE_4',
  MODE_5 = 'MODE_5',
  MODE_6 = 'MODE_6',
}

export interface RhymeAnalysis {
    rhymes: { word: string; line: number; rhymeWith: { word: string; line: number; type: string }[] }[];
    meter: { pattern: string; syllables: number[]; suggestions: string[] };
    stats: { totalLines: number; rhymedLines: number; rhymeScheme: string };
}
