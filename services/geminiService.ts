import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Category, AIAction, Note, LinkSuggestion } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const noteProcessingSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Stručný a popisný název poznámky, maximálně 10 slov.',
    },
    category: {
      type: Type.STRING,
      description: 'Navrhovaný název kategorie pro poznámku.',
    },
    formattedContent: {
      type: Type.STRING,
      description: 'Původní text, naformátovaný pomocí Markdown pro lepší čitelnost (např. nadpisy, seznamy, bloky kódu).',
    },
    tags: {
        type: Type.ARRAY,
        items: {
            type: Type.STRING,
        },
        description: 'Seznam 1-5 relevantních tagů (klíčových slov) pro poznámku, malými písmeny, bez diakritiky a bez symbolu #.',
    },
  },
  required: ['title', 'category', 'formattedContent', 'tags'],
};

const appendContentSchema = {
  type: Type.OBJECT,
  properties: {
    appendedContent: {
      type: Type.STRING,
      description: 'Nový text, naformátovaný pomocí Markdown, připravený k připojení ke stávající poznámce.',
    },
  },
  required: ['appendedContent'],
};

const smartLinkingSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    originalText: { type: Type.STRING, description: "Přesná fráze nebo slovo z aktuálního textu, které bude nahrazeno odkazem." },
                    targetNoteId: { type: Type.STRING, description: "ID cílové poznámky ze poskytnutého seznamu." },
                    targetNoteTitle: { type: Type.STRING, description: "Název cílové poznámky." },
                    reason: { type: Type.STRING, description: "Krátké vysvětlení souvislosti (např. 'Zmínka o projektu')." }
                },
                required: ['originalText', 'targetNoteId', 'targetNoteTitle', 'reason']
            }
        }
    },
    required: ['suggestions']
};


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

  const prompt = `
    Jsi expert na organizaci a sémantickou analýzu textu. Tvým úkolem je zpracovat poznámku od uživatele a inteligentně ji zařadit.

    Postupuj následovně:
    1.  **Analyzuj obsah:** Přečti si text a identifikuj hlavní téma, projekt nebo účel poznámky (např. AI prompt, poznámky k vývoji v Godot, text písně).
    2.  **Zkontroluj existující kategorie:** Zde je seznam již existujících kategorií: [${categoryNames}].
    3.  **Rozhodni o kategorii:**
        *   **Prioritizuj existující:** Pokud se poznámka TĚSNĚ shoduje s tématem některé z existujících kategorií, POUŽIJ JI. Cílem je konzistence.
        *   **Vytvoř novou smysluplnou kategorii:** Pokud žádná kategorie nevyhovuje, vytvoř novou. Název by měl být krátký, ale výstižný, aby mohl být použit pro další podobné poznámky. Například, pro AI prompt definující postavu jménem 'Promptyna' je skvělá kategorie "Promptyna ROLE". Pro poznámky k projektu 'Zloděj' v Godotu je ideální "Godot - Zloděj". Vyhni se příliš obecným ("Poznámka") nebo příliš specifickým názvům.
    4.  **Vytvoř název poznámky:** Vytvoř krátký, úderný název, který shrnuje obsah poznámky (max 10 slov).
    5.  **Naformátuj obsah:** Převeď původní text do Markdownu pro lepší čitelnost.
    6.  **Navrhni tagy:** Vytvoř seznam 1 až 5 relevantních klíčových slov (tagů), která popisují obsah. Tagy piš malými písmeny, bez diakritiky a bez mřížky (#). Například: 'javascript', 'recept', 'inspirace'.

    Vrať odpověď POUZE v zadaném formátu JSON.

    --- TEXT UŽIVATELE ---
    ${rawText}
    --- KONEC TEXTU UŽIVATELE ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: noteProcessingSchema,
      },
    });
    
    const processedData: ProcessedNote = JSON.parse(response.text.trim());
    return processedData;
  } catch (error) {
    console.error("Error processing note with AI:", error);
    throw new Error("Nepodařilo se zpracovat poznámku pomocí AI. Zkuste to prosím znovu.");
  }
};


export const formatAndAppendTextWithAI = async (newText: string, existingContent: string): Promise<AppendResult> => {
      const prompt = `
        Jsi inteligentní asistent pro organizaci poznámek. Uživatel chce přidat nový text ke své stávající poznámce. Tvým úkolem je naformátovat POUZE tento NOVÝ TEXT pomocí Markdown pro lepší čitelnost a plynule ho navázat na existující obsah. Neupravuj stávající obsah.

        --- STÁVAJÍCÍ OBSAH POZNÁMKY (pro kontext) ---
        ${existingContent}
        --- KONEC STÁVAJÍCÍHO OBSAHU ---

        --- NOVÝ TEXT K PŘIDÁNÍ A FORMÁTOVÁNÍ ---
        ${newText}
        --- KONEC NOVÉHO TEXTU ---

        Vrať odpověď POUZE v zadaném formátu JSON. Naformátuj pouze nový text.
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: appendContentSchema,
          },
        });
        
        const processedData: AppendResult = JSON.parse(response.text.trim());
        return processedData;
      } catch (error) {
        console.error("Error formatting and appending text with AI:", error);
        throw new Error("Nepodařilo se zpracovat a přidat text pomocí AI.");
      }
    };


export const performAIQuickAction = async (selectedText: string, fullNoteContent: string, action: AIAction): Promise<string> => {
    let prompt = '';

    switch (action) {
        case 'summarize':
            prompt = `Shrň následující text co nejvýstižněji. Vrať POUZE samotné shrnutí.
            --- KONTEXT CELÉ POZNÁMKY ---
            ${fullNoteContent}
            --- TEXT K SHRNUTÍ ---
            ${selectedText}`;
            break;
        case 'fix_grammar':
            prompt = `Oprav veškeré pravopisné a gramatické chyby v následujícím textu. Zachovej původní význam i formátování (Markdown). Vrať POUZE opravený text.
            --- TEXT K OPRAVĚ ---
            ${selectedText}`;
            break;
        case 'translate_en':
            prompt = `Přelož následující text do angličtiny. Vrať POUZE samotný překlad.
            --- TEXT K PŘEKLADU ---
            ${selectedText}`;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error performing AI action '${action}':`, error);
        throw new Error(`Akce "${action}" se nezdařila.`);
    }
};

/**
 * Initializes a chat session with all user notes as context.
 */
export const initializeChatWithNotes = (allNotes: Note[]): Chat => {
    // Prepare context from all notes
    const notesContext = allNotes.map(note => 
        `ID: ${note.id}\nNÁZEV: ${note.title}\nKATEGORIE ID: ${note.categoryId}\nTAGY: ${note.tags?.join(', ')}\nOBSAH:\n${note.content}\n----------------`
    ).join('\n');

    const systemInstruction = `
        Jsi 'Osobní Znalostní Asistent'. Tvým úkolem je odpovídat na otázky uživatele výhradně na základě obsahu jeho poznámek, které ti poskytuji níže.
        
        PRAVIDLA:
        1. Odpovídej česky, stručně a k věci.
        2. Pokud odpověď v poznámkách není, řekni to narovinu (např. "V tvých poznámkách jsem o tom nic nenašel"). Nevymýšlej si fakta.
        3. Pokud se uživatel ptá na shrnutí, vytáhni klíčové body.
        4. Můžeš citovat přesné názvy poznámek.
        5. Buď nápomocný a inteligentní.
        
        ZDE JSOU UŽIVATELOVY POZNÁMKY (DATA):
        ${notesContext}
    `;

    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: systemInstruction,
        }
    });
};

/**
 * Finds semantic connections between the current note and other notes.
 */
export const findSmartConnections = async (currentNoteId: string, currentContent: string, allNotes: Note[]): Promise<LinkSuggestion[]> => {
    // Filter out the current note and send minimal data to save context window
    const potentialTargets = allNotes.filter(n => n.id !== currentNoteId).map(n => ({
        id: n.id,
        title: n.title,
        tags: n.tags
    }));

    if (potentialTargets.length === 0) return [];

    const targetsJson = JSON.stringify(potentialTargets);

    const prompt = `
        Analyzuj text "Aktuální poznámky" a databázi "Ostatní poznámky".
        
        Tvým úkolem je najít v "Aktuální poznámce" klíčová slova, jména projektů nebo témata, která logicky souvisí s "Ostatními poznámkami".
        Pokud najdeš spojitost, navrhni vytvoření odkazu.
        
        Pravidla:
        1. Hledej PŘESNOU frázi v aktuálním textu, kterou lze nahradit odkazem. Neměň slova v "originalText", musí se přesně shodovat s textem v poznámce.
        2. Navrhni odkaz, pouze pokud je souvislost silná a relevantní.
        3. Ignoruj obecná slova (např. "poznámka", "projekt", "text", "aplikace"), hledej specifické názvy, jména osob, unikátní technologie.
        4. Pokud aktuální text již obsahuje odkaz na danou poznámku, nenavrhuj ho znovu.

        --- DATABÁZE OSTATNÍCH POZNÁMEK ---
        ${targetsJson}
        --- KONEC DATABÁZE ---

        --- AKTUÁLNÍ POZNÁMKA ---
        ${currentContent}
        --- KONEC POZNÁMKY ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: smartLinkingSchema,
            },
        });

        const result = JSON.parse(response.text.trim());
        return result.suggestions || [];

    } catch (error) {
        console.error("Error finding smart connections:", error);
        return [];
    }
};

/**
 * Transcribes and structures an audio note using Gemini multimodal capabilities.
 */
export const createNoteFromAudio = async (audioBase64: string, mimeType: string, existingCategories: Category[]): Promise<ProcessedNote> => {
    const categoryNames = existingCategories.map(c => c.name).join(', ');

    const prompt = `
        Uživatel nahrál hlasovou poznámku. Tvým úkolem je:
        1. Přepsat audio do textu (česky).
        2. Pochopit kontext a vytvořit strukturovaný zápis (ne doslovný přepis "hm, eh", ale čistý text).
        3. Vymyslet výstižný název.
        4. Zařadit poznámku do jedné z existujících kategorií: [${categoryNames}], nebo navrhnout novou.
        5. Přidat tagy.
        
        Formátuj obsah pomocí Markdownu (odrážky, tučné písmo pro klíčové body).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: audioBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: noteProcessingSchema,
            },
        });

        const processedData: ProcessedNote = JSON.parse(response.text.trim());
        return processedData;
    } catch (error) {
        console.error("Error processing audio note:", error);
        throw new Error("Nepodařilo se zpracovat hlasovou poznámku.");
    }
};