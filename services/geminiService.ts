import { Note, Category, AIAction, LinkSuggestion } from '../types';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const PRIMARY_MODEL = 'qwen2.5:3b';
const FALLBACK_MODEL = 'gemma:2b';

// Pomocná funkce pro volání Ollama API s fallback mechanismem
async function callOllama(messages: any[], format: string | null = null, model: string = PRIMARY_MODEL): Promise<string> {
  const performRequest = async (modelToUse: string) => {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          stream: false,
          format: format, // 'json' nebo null
          options: {
              temperature: 0.7,
              num_ctx: 4096 
          }
        }),
      });

      if (!response.ok) {
          throw new Error(`Status ${response.status}`);
      }
      return await response.json();
  };

  try {
    const data = await performRequest(model);
    return data.message.content;
  } catch (error) {
    if (model === PRIMARY_MODEL) {
        console.warn(`Model ${PRIMARY_MODEL} selhal, zkouším zálohu ${FALLBACK_MODEL}...`, error);
        try {
            const data = await performRequest(FALLBACK_MODEL);
            return data.message.content;
        } catch (fallbackError) {
            throw new Error(`Selhal i záložní model. Ujistěte se, že Ollama běží. Error: ${fallbackError}`);
        }
    }
    throw error;
  }
}

// Rozhraní pro kompatibilitu s původním kódem
export interface ProcessedNote {
  title: string;
  category: string;
  formattedContent: string;
  tags: string[];
}

export interface AppendResult {
  appendedContent: string;
}

export const processNoteWithAI = async (rawText: string, existingCategories: Category[]): Promise<ProcessedNote> => {
  const categoryNames = existingCategories.map(c => c.name).join(', ');

  // Zjednodušený prompt pro menší model (3B)
  const systemPrompt = `Jsi asistent pro organizaci poznámek. Analyzuj text a vrať JSON.
Kategorie na výběr: [${categoryNames}].
Pokud žádná nesedí, vymysli novou.

Vrať POUZE tento JSON (nic jiného):
{
  "title": "Stručný název",
  "category": "Název kategorie",
  "formattedContent": "Obsah v Markdownu",
  "tags": ["tag1", "tag2"]
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: rawText }
  ];

  try {
    const responseText = await callOllama(messages, 'json');
    // Qwen občas přidá markdown bloky i do JSON módu, odstraníme je
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const processedData: ProcessedNote = JSON.parse(cleanJson);
    return processedData;
  } catch (error) {
    console.error("Error processing note with AI:", error);
    throw new Error("Chyba zpracování. Ujistěte se, že běží Ollama.");
  }
};


export const formatAndAppendTextWithAI = async (newText: string, existingContent: string): Promise<AppendResult> => {
  const systemPrompt = `Naformátuj NOVÝ text pomocí Markdown.
Vrať POUZE JSON: { "appendedContent": "markdown text" }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Kontext: ${existingContent.substring(0, 500)}...\n\nNOVÝ TEXT: ${newText}` }
  ];

  try {
    const responseText = await callOllama(messages, 'json');
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error formatting text with AI:", error);
    throw new Error("Chyba formátování.");
  }
};


export const performAIQuickAction = async (selectedText: string, fullNoteContent: string, action: AIAction): Promise<string> => {
    let prompt = '';
    let systemRole = 'Jsi asistent.';

    switch (action) {
        case 'summarize':
            systemRole = 'Jsi expert na sumarizaci.';
            prompt = `Shrň text do jedné věty:\n${selectedText}`;
            break;
        case 'fix_grammar':
            systemRole = 'Jsi korektor češtiny.';
            prompt = `Oprav chyby, zachovej formátování. Vrať jen opravený text:\n${selectedText}`;
            break;
        case 'translate_en':
            systemRole = 'Překladatel.';
            prompt = `Přelož do angličtiny:\n${selectedText}`;
            break;
    }

    const messages = [
        { role: 'system', content: systemRole },
        { role: 'user', content: prompt }
    ];

    return await callOllama(messages);
};

// Vylepšená třída pro streamování z Ollamy
class OllamaChatSession {
    private history: any[] = [];
    private model: string;

    constructor(systemInstruction: string, model: string = PRIMARY_MODEL) {
        this.model = model;
        this.history.push({ role: 'system', content: systemInstruction });
    }

    // Implementace streamování kompatibilní s App.tsx s fallbackem
    async *sendMessageStream(request: { message: string }) {
        this.history.push({ role: 'user', content: request.message });

        const performStreamRequest = async (modelToUse: string) => {
             return await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToUse,
                    messages: this.history,
                    stream: true,
                    options: { temperature: 0.7, num_ctx: 4096 }
                }),
            });
        };

        let response = await performStreamRequest(this.model);

        // Fallback logika pro stream
        if (!response.ok && this.model === PRIMARY_MODEL) {
             console.warn(`Stream selhal na ${PRIMARY_MODEL}, přepínám na ${FALLBACK_MODEL}`);
             response = await performStreamRequest(FALLBACK_MODEL);
        }

        if (!response.body) throw new Error("No response body");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.message && json.message.content) {
                        const text = json.message.content;
                        fullResponse += text;
                        // Simulujeme strukturu, kterou očekává App.tsx
                        yield { text }; 
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
        
        this.history.push({ role: 'assistant', content: fullResponse });
    }
}

export const initializeChatWithNotes = (allNotes: Note[]): any => {
    // Pro 3B model musíme šetřit kontextem. Vybereme jen relevantní části.
    const notesContext = allNotes.map(note => 
        `- ${note.title}: ${note.content.substring(0, 150).replace(/\n/g, ' ')}...`
    ).join('\n');

    const systemInstruction = `Jsi asistent se znalostí uživatelových poznámek.
Seznam poznámek:
${notesContext}

Odpovídej česky, stručně a jen na základě těchto poznámek.`;

    return new OllamaChatSession(systemInstruction);
};


export const findSmartConnections = async (currentNoteId: string, currentContent: string, allNotes: Note[]): Promise<LinkSuggestion[]> => {
    // Zjednodušení pro malý model
    return [];
};

export interface RhymeAnalysis {
    rhymes: {
        word: string;
        line: number;
        rhymeWith: { word: string; line: number; type: string }[];
    }[];
    meter: {
        pattern: string;
        syllables: number[];
        suggestions: string[];
    };
    stats: {
        totalLines: number;
        rhymedLines: number;
        rhymeScheme: string;
    };
}

export const analyzeLyricsRhymeAndMeter = async (lyrics: string): Promise<RhymeAnalysis> => {
    const systemPrompt = `Jsi expert na českou poezii a metriku.
Analyzuj text písně a vrať JSON s analýzou rýmů a metriky.

Vrať POUZE tento JSON (nic jiného):
{
    "rhymes": [
        {
            "word": "slovo",
            "line": číslo_řádku,
            "rhymeWith": [
                { "word": "slovo2", "line": číslo, "type": "typ_rýmu (perfect/approximate/none)" }
            ]
        }
    ],
    "meter": {
        "pattern": "metrický vzor (např. jamb, trochej, daktyl)",
        "syllables": [počet_slabik_na_řádek],
        "suggestions": ["návrhy na zlepšení metriky"]
    },
    "stats": {
        "totalLines": celkový_počet_řádků,
        "rhymedLines": počet_zrymovaných_řádků,
        "rhymeScheme": "schema rýmů (např. AABB, ABAB)"
    }
}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: lyrics }
    ];

    try {
        const responseText = await callOllama(messages, 'json');
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Error analyzing lyrics:", error);
        throw new Error("Chyba analýzy. Ujistěte se, že běží Ollama.");
    }
};
