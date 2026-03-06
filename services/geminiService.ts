import { Note, Category, AIAction, RhymeAnalysis, AnalysisResult, AiMode } from '../src/types';
import { GoogleGenAI } from "@google/genai";

const OLLAMA_BASE_URL = 'http://localhost:11434';
const PRIMARY_OLLAMA_MODEL = 'qwen2.5-coder:1.5b'; // Pro JSON a logiku (rychlý)
const CREATIVE_OLLAMA_MODEL = 'qwen2.5:3b';       // Pro text, chat a rýmy (chytrý)
const FALLBACK_OLLAMA_MODEL = 'qwen2.5:3b';

// Gemini configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const client = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const GEMINI_MODEL = "gemini-1.5-flash";

// Helper for Ollama
async function callOllama(messages: object[], format: string | null = null, model: string = PRIMARY_OLLAMA_MODEL): Promise<string> {
  const performRequest = async (modelToUse: string) => {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          stream: false,
          format: format,
          options: { temperature: 0.7, num_ctx: 4096 }
        }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
      const data = await response.json();
      return data.message.content;
  };

  try {
    return await performRequest(model);
  } catch (error) {
    if (model !== FALLBACK_OLLAMA_MODEL) {
        console.warn(`Model ${model} failed, trying fallback ${FALLBACK_OLLAMA_MODEL}...`);
        return await performRequest(FALLBACK_OLLAMA_MODEL);
    }
    throw error;
  }
}

// Main AI call with fallback logic
async function callAI(systemPrompt: string, userPrompt: string, isJson: boolean = false, model: string = PRIMARY_OLLAMA_MODEL): Promise<string> {
    if (client) {
        try {
            const response = await client.models.generateContent({
                model: GEMINI_MODEL,
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: isJson ? 'application/json' : 'text/plain'
                }
            });
            const text = response.text || '';
            return isJson ? text.replace(/```json/g, '').replace(/```/g, '').trim() : text;
        } catch (error) {
            console.error("Gemini API failed, falling back to Ollama:", error);
        }
    }

    // Fallback to Ollama
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];
    const response = await callOllama(messages, isJson ? 'json' : null, model);
    return isJson ? response.replace(/```json/g, '').replace(/```/g, '').trim() : response;
}

export interface ProcessedNote {
  title: string;
  category: string;
  formattedContent: string;
  tags: string[];
  type: 'general' | 'music';
}

export interface AppendResult {
  appendedContent: string;
}

export const processNoteWithAI = async (rawText: string, existingCategories: Category[]): Promise<ProcessedNote> => {
  const categoryNames = existingCategories.map(c => c.name).join(', ');
  const systemPrompt = `Jsi asistent pro organizaci poznámek. Analyzuj text a vrať JSON.
Urči, zda jde o běžnou poznámku ("general") nebo hudební text/nápad ("music").
Kategorie na výběr: [${categoryNames}]. Pokud žádná nesedí, vymysli novou.
Vrať POUZE tento JSON:
{
  "title": "Stručný název",
  "category": "Název kategorie",
  "formattedContent": "Obsah v Markdownu",
  "tags": ["tag1", "tag2"],
  "type": "general" | "music"
}`;

  const response = await callAI(systemPrompt, rawText, true, PRIMARY_OLLAMA_MODEL);
  return JSON.parse(response);
};

export const formatAndAppendTextWithAI = async (newText: string, existingContent: string): Promise<AppendResult> => {
  const systemPrompt = `Naformátuj NOVÝ text pomocí Markdown v kontextu existující poznámky.
Vrať POUZE JSON: { "appendedContent": "markdown text" }`;
  const userPrompt = `EXISTUJÍCÍ OBSAH (prvních 500 znaků): ${existingContent.substring(0, 500)}...\n\nNOVÝ TEXT K PŘIDÁNÍ: ${newText}`;

  const response = await callAI(systemPrompt, userPrompt, true, PRIMARY_OLLAMA_MODEL);
  return JSON.parse(response);
};

export const performAIQuickAction = async (selectedText: string, fullNoteContent: string, action: AIAction): Promise<string> => {
    let systemRole = 'Jsi asistent.';
    let prompt = '';

    switch (action) {
        case 'summarize':
            systemRole = 'Jsi expert na sumarizaci.';
            prompt = `Shrň tento vybraný text do jedné výstižné věty:\n${selectedText}`;
            break;
        case 'fix_grammar':
            systemRole = 'Jsi korektor češtiny.';
            prompt = `Oprav gramatické a stylistické chyby v tomto textu. Zachovej formátování a vrať jen opravený text:\n${selectedText}`;
            break;
        case 'translate_en':
            systemRole = 'Jsi profesionální překladatel.';
            prompt = `Přelož tento text do angličtiny:\n${selectedText}`;
            break;
    }

    // Quick Actions use Creative Model for better language flow
    return await callAI(systemRole, prompt, false, CREATIVE_OLLAMA_MODEL);
};

export const deepLyricScan = async (lyrics: string, mode: AiMode = AiMode.AUTO): Promise<AnalysisResult> => {
    const systemPrompt = `Jsi "Lyric Architect". Analyzuj text a rozděl ho na segmenty.
Detekuj rytmické chyby, slabé rýmy a navrhni 3 varianty pro každý segment.
Vrať POUZE JSON typu AnalysisResult.
Struktura: { segments: [{ id, originalText, isProblematic, issueDescription, variants: [{id, text, type}], selectedVariantId: null, smartSuggestions: [{id, type, text, description, confidence}] }], mode: "${mode}" }`;
    
    const response = await callAI(systemPrompt, lyrics, true, CREATIVE_OLLAMA_MODEL);
    return JSON.parse(response);
};


// Streaming Chat Session
class AISession {
    private chat: any = null;
    private ollamaHistory: any[] = [];
    private systemInstruction: string;

    constructor(systemInstruction: string) {
        this.systemInstruction = systemInstruction;
        if (client) {
            this.chat = client.chats.create({
                model: GEMINI_MODEL,
                config: { systemInstruction: systemInstruction }
            });
        }
        this.ollamaHistory.push({ role: 'system', content: systemInstruction });
    }
async *sendMessageStream(request: { message: string }) {
    if (this.chat) {
        try {
            const responseStream = await this.chat.sendMessageStream(request.message);
            for await (const chunk of responseStream) {
                const text = chunk.text();
                yield { text };
            }
            return;
        } catch (error) {
            console.error("Gemini stream failed, falling back to Ollama:", error);
            this.chat = null; 
        }
    }

        // Ollama Fallback
        this.ollamaHistory.push({ role: 'user', content: request.message });
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CREATIVE_OLLAMA_MODEL,
                messages: this.ollamaHistory,
                stream: true,
                options: { temperature: 0.7, num_ctx: 4096 }
            }),
        });

        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    const text = json.message.content;
                    fullContent += text;
                    yield { text };
                } catch (e) {}
            }
        }
        this.ollamaHistory.push({ role: 'assistant', content: fullContent });
    }
}

export const initializeChatWithNotes = (allNotes: Note[]): any => {
    const notesContext = allNotes.map(note => `- ${note.title}: ${note.content.substring(0, 200)}...`).join('\n');
    const systemInstruction = `Jsi osobní AI asistent. Máš přístup k uživatelovým poznámkám:
${notesContext}
Odpovídej česky, buď nápomocný a věcný.`;

    return new AISession(systemInstruction);
};

export const findSmartConnections = async (currentNoteId: string, currentContent: string, allNotes: Note[]): Promise<any[]> => {
    const otherNotes = allNotes.filter(n => n.id !== currentNoteId);
    if (otherNotes.length === 0) return [];

    const notesSummary = otherNotes.map(n => `ID: ${n.id}, TITUL: ${n.title}`).join('\n');
    const systemPrompt = `Jsi expert na propojování informací. Analyzuj text poznámky a najdi v něm klíčová slova nebo témata, která se shodují s názvy jiných poznámek.
Vrať JSON pole objektů LinkSuggestion.
LinkSuggestion: { "originalText": "text v aktuální poznámce", "targetNoteId": "ID cílové poznámky", "targetNoteTitle": "Titul cílové poznámky", "reason": "stručný důvod propojení" }
Vrať POUZE JSON pole. Pokud nic nenajdeš, vrať [].`;

    const userPrompt = `AKTUÁLNÍ POZNÁMKA:\n${currentContent}\n\nDOSTUPNÉ POZNÁMKY K PROPOJENÍ:\n${notesSummary}`;

    try {
        const response = await callAI(systemPrompt, userPrompt, true, PRIMARY_OLLAMA_MODEL);
        return JSON.parse(response);
    } catch (e) {
        return [];
    }
};

export const createNoteFromAudio = async (base64Audio: string, mimeType: string, existingCategories: Category[]): Promise<ProcessedNote> => {
    if (!client) throw new Error("Hlasové poznámky vyžadují Gemini API klíč.");
    
    const prompt = "Přepiš toto audio do strukturované poznámky v češtině. Vrať JSON: { title, category, formattedContent, tags }";
    
    const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { data: base64Audio, mimeType } }
                ]
            }
        ],
        config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
};

export interface RhymeAnalysis {
    rhymes: { word: string; line: number; rhymeWith: { word: string; line: number; type: string }[] }[];
    meter: { pattern: string; syllables: number[]; suggestions: string[] };
    stats: { totalLines: number; rhymedLines: number; rhymeScheme: string };
}

export const analyzeLyricsRhymeAndMeter = async (lyrics: string): Promise<RhymeAnalysis> => {
    const systemPrompt = `Jsi expert na českou poezii. Analyzuj text a vrať JSON s analýzou rýmů a metriky.
Struktura: { rhymes: [{word, line, rhymeWith: [{word, line, type}]}], meter: {pattern, syllables: [], suggestions: []}, stats: {totalLines, rhymedLines, rhymeScheme} }`;
    
    const response = await callAI(systemPrompt, lyrics, true, CREATIVE_OLLAMA_MODEL);
    return JSON.parse(response);
};
