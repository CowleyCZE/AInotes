import { Note, Category, AIAction, RhymeAnalysis, AnalysisResult, AiMode } from '../types';
import { GoogleGenAI } from "@google/genai";

const OLLAMA_BASE_URL = 'http://localhost:11434';
// Defaultní lehčí modely pro stabilitu v Termuxu
export const PRIMARY_OLLAMA_MODEL = 'qwen2.5-coder:0.5b'; // Pro JSON a logiku (rychlý)
export const CREATIVE_OLLAMA_MODEL = 'qwen2.5:1.5b';       // Pro text, chat a rýmy (chytrý)
const FALLBACK_OLLAMA_MODEL = 'qwen2.5:0.5b';

// Gemini configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const client = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const GEMINI_MODEL = "gemini-1.5-flash";

// Helper for Ollama
async function callOllama(messages: object[], format: string | null = null, model: string = PRIMARY_OLLAMA_MODEL): Promise<string> {
  const performRequest = async (modelToUse: string) => {
      console.log(`[Ollama] Volám model: ${modelToUse}`);
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          stream: false,
          format: format,
          options: { 
            temperature: 0.7, 
            num_ctx: 4096,
            num_predict: 2048,
            low_vram: true // Optimalizace pro málo RAM
          }
        }),
      });

      if (!response.ok) {
          const errorData = await response.text().catch(() => "Neznámá chyba");
          throw new Error(`Ollama error (${response.status}): ${errorData}`);
      }
      const data = await response.json();
      return data.message.content;
  };

  try {
    return await performRequest(model);
  } catch (error: unknown) {
    console.error(`Chyba modelu ${model}:`, error);
    if (model !== FALLBACK_OLLAMA_MODEL) {
        console.warn(`Model ${model} selhal, zkouším fallback ${FALLBACK_OLLAMA_MODEL}...`);
        return await performRequest(FALLBACK_OLLAMA_MODEL);
    }
    throw error;
  }
}

// Main AI call with fallback logic
async function callAI(systemPrompt: string, userPrompt: string, isJson: boolean = false, model: string = PRIMARY_OLLAMA_MODEL): Promise<string> {
    if (client) {
        try {
            console.log(`[Gemini] Používám API: ${GEMINI_MODEL}`);
            const response = await client.getGenerativeModel({ 
                model: GEMINI_MODEL,
                systemInstruction: systemPrompt 
            }).generateContent(userPrompt);
            const text = response.response.text();
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

export const processNoteWithAI = async (rawText: string, existingCategories: Category[], model: string = PRIMARY_OLLAMA_MODEL): Promise<ProcessedNote> => {
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

  const response = await callAI(systemPrompt, rawText, true, model);
  return JSON.parse(response);
};

export const formatAndAppendTextWithAI = async (newText: string, existingContent: string, model: string = PRIMARY_OLLAMA_MODEL): Promise<AppendResult> => {
  const systemPrompt = `Naformátuj NOVÝ text pomocí Markdown v kontextu existující poznámky.
Vrať POUZE JSON: { "appendedContent": "markdown text" }`;
  const userPrompt = `EXISTUJÍCÍ OBSAH (prvních 500 znaků): ${existingContent.substring(0, 500)}...\n\nNOVÝ TEXT K PŘIDÁNÍ: ${newText}`;

  const response = await callAI(systemPrompt, userPrompt, true, model);
  return JSON.parse(response);
};

export const performAIQuickAction = async (selectedText: string, fullNoteContent: string, action: AIAction, model: string = CREATIVE_OLLAMA_MODEL): Promise<string> => {
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
    return await callAI(systemRole, prompt, false, model);
};

export const deepLyricScan = async (lyrics: string, mode: AiMode = AiMode.AUTO, model: string = CREATIVE_OLLAMA_MODEL): Promise<AnalysisResult> => {
    const systemPrompt = `Jsi "Lyric Architect". Analyzuj text a rozděl ho na segmenty.
Detekuj rytmické chyby, slabé rýmy a navrhni 3 varianty pro každý segment.
Vrať POUZE JSON typu AnalysisResult.
Struktura: { "segments": [{ "id": "1", "originalText": "...", "isProblematic": true, "issueDescription": "...", "variants": [{ "id": "1a", "text": "...", "type": "..." }], "selectedVariantId": null, "smartSuggestions": [] }], "mode": "${mode}" }`;
    
    const response = await callAI(systemPrompt, lyrics, true, model);
    return JSON.parse(response);
};

// Helper for finding relevant notes (Simple RAG)
const findRelevantNotes = (query: string, notes: Note[], limit: number = 5): Note[] => {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (searchTerms.length === 0) return notes.slice(0, limit);

    const scoredNotes = notes.map(note => {
        let score = 0;
        const content = (note.title + " " + note.content + " " + (note.tags?.join(" ") || "")).toLowerCase();
        
        searchTerms.forEach(term => {
            if (content.includes(term)) {
                score += 1;
                // Bonus for title match
                if (note.title.toLowerCase().includes(term)) score += 2;
            }
        });
        return { note, score };
    });

    return scoredNotes
        .filter(sn => sn.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(sn => sn.note);
};

// Streaming Chat Session
export class AISession {
    private chat: any = null;
    private ollamaHistory: { role: string; content: string }[] = [];
    private systemInstruction: string;
    private model: string;
    private allNotes: Note[];

    constructor(allNotes: Note[], model: string = CREATIVE_OLLAMA_MODEL) {
        this.allNotes = allNotes;
        this.model = model;
        this.systemInstruction = `Jsi osobní AI asistent pro správu poznámek. 
Odpovídej česky, buď stručný, ale nápomocný. 
Pokud se uživatel ptá na něco, co má v poznámkách, použij poskytnutý kontext.
Pokud v poznámkách odpověď není, řekni to, ale zkus odpovědět obecně.`;
        
        if (client) {
            this.chat = client.getGenerativeModel({ 
                model: GEMINI_MODEL
            }).startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 2048,
                }
            });
        }
        this.ollamaHistory.push({ role: 'system', content: this.systemInstruction });
    }

    async *sendMessageStream(message: string) {
        // RAG: Najít relevantní poznámky pro tento konkrétní dotaz
        const relevantNotes = findRelevantNotes(message, this.allNotes);
        const context = relevantNotes.length > 0 
            ? "\n\nRELEVANTNÍ POZNÁMKY PRO KONTEXT:\n" + relevantNotes.map(n => `--- ${n.title} ---\n${n.content}`).join("\n\n")
            : "\n\n(Žádné relevantní poznámky nebyly nalezeny.)";

        const augmentedMessage = `UŽIVATELŮV DOTAZ: ${message}${context}`;

        if (this.chat) {
            try {
                const result = await this.chat.sendMessageStream(augmentedMessage);
                for await (const chunk of result.stream) {
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
        this.ollamaHistory.push({ role: 'user', content: augmentedMessage });
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: this.ollamaHistory,
                stream: true,
                options: { temperature: 0.7, num_ctx: 4096, low_vram: true }
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
                } catch (_e) {}
            }
        }
        this.ollamaHistory.push({ role: 'assistant', content: fullContent });
    }
}

export const initializeChatWithNotes = (allNotes: Note[], model: string = CREATIVE_OLLAMA_MODEL): AISession => {
    return new AISession(allNotes, model);
};

export const findSmartConnections = async (currentNoteId: string, currentContent: string, allNotes: Note[], model: string = PRIMARY_OLLAMA_MODEL): Promise<any[]> => {
    const otherNotes = allNotes.filter(n => n.id !== currentNoteId);
    if (otherNotes.length === 0) return [];

    const notesSummary = otherNotes.map(n => `ID: ${n.id}, TITUL: ${n.title}`).join('\n');
    const systemPrompt = `Jsi expert na propojování informací. Analyzuj text poznámky a najdi v něm klíčová slova nebo témata, která se shodují s názvy jiných poznámek.
Vrať JSON pole objektů LinkSuggestion.
LinkSuggestion: { "originalText": "text v aktuální poznámce", "targetNoteId": "ID cílové poznámky", "targetNoteTitle": "Titul cílové poznámky", "reason": "stručný důvod propojení" }
Vrať POUZE JSON pole. Pokud nic nenajdeš, vrať [].`;

    const userPrompt = `AKTUÁLNÍ POZNÁMKA:\n${currentContent}\n\nDOSTUPNÉ POZNÁMKY K PROPOJENÍ:\n${notesSummary}`;

    try {
        const response = await callAI(systemPrompt, userPrompt, true, model);
        return JSON.parse(response);
    } catch (_e) {
        return [];
    }
};

export const createNoteFromAudio = async (base64Audio: string, mimeType: string, _existingCategories: Category[]): Promise<ProcessedNote> => {
    if (!client) throw new Error("Hlasové poznámky vyžadují Gemini API klíč.");
    
    const prompt = "Přepiš toto audio do strukturované poznámky v češtině. Vrať JSON: { title, category, formattedContent, tags }";
    
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const response = await model.generateContent([
        prompt,
        { inlineData: { data: base64Audio, mimeType } }
    ]);
    
    const text = response.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
};

export const analyzeLyricsRhymeAndMeter = async (lyrics: string, model: string = CREATIVE_OLLAMA_MODEL): Promise<RhymeAnalysis> => {
    const systemPrompt = `Jsi expert na českou poezii...`;
    
    const response = await callAI(systemPrompt, lyrics, true, model);
    try {
        return JSON.parse(response);
    } catch (__) {
        throw new Error("AI vrátilo neplatný formát analýzy.");
    }
};
