# Chytrý Zápisník AI - Kontext pro Gemini

Tento projekt je moderní webová aplikace pro inteligentní správu poznámek a tvorbu textů, postavená na technologiích React, Firebase a Google Gemini AI.

## Přehled projektu
- **Hlavní účel:** Automatizace organizace poznámek, jejich formátování pomocí AI a pokročilá podpora pro autory textů (skladatele).
- **Klíčové technologie:**
    - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
    - **AI:** Google Gemini API (model `@google/genai`) - využívá se pro RAG (Retrieval-Augmented Generation), formátování, kategorizaci a extrakci metadat.
    - **Backend/Databáze:** Firebase Firestore (synchronizace v reálném čase).

## Architektura a struktura kódu
- `App.tsx`: Centrální komponenta spravující globální stav, UI režimy (Poznámky, Hudba, Chat, Skladatel) a hlavní interakční logiku.
- `services/geminiService.ts`: Zapouzdření veškeré komunikace s Gemini API. Obsahuje funkce pro:
    - `processNoteWithAI`: Automatické formátování a kategorizace.
    - `initializeChatWithNotes`: RAG systém pro dotazování nad znalostní bází.
    - `findSmartConnections`: Návrhy na propojování souvisejících poznámek.
    - `createNoteFromAudio`: Přepis a strukturování hlasových poznámek.
- `services/firebaseService.ts`: CRUD operace pro Firestore (`notes`, `categories`).
- `types.ts`: Sdílené TypeScriptové interfacy (`Note`, `Category`, `ChatMessage`, atd.).
- `firebaseConfig.ts`: Konfigurace spojení s Firebase.

## Klíčové funkce
1. **AI Reorganizace:** Převádí syrový text na strukturovaný Markdown, navrhuje názvy, tagy a kategorie.
2. **Režim Skladatele:** Unikátní rozhraní pro práci s verzemi textů písní. Umožňuje synchronizovaný posuv (scroll sync) více verzí a skládání finální kompozice pomocí drag-and-drop/výběru.
3. **Kontextový Chat:** Uživatel může chatovat se svou "druhou pamětí" (všemi poznámkami v databázi).
4. **Hlasové Poznámky:** Integrovaný přepis mluveného slova přímo do strukturované poznámky.

## Vývojové pokyny
- **Spuštění:** `npm run dev`
- **Build:** `npm run build`
- **Konvence:**
    - Používej striktní TypeScript.
    - UI komponenty jsou v `App.tsx` (většinou inline SVG ikony a sub-komponenty).
    - Pro AI funkce vždy využívej `geminiService.ts`.
    - Data se ukládají automaticky (autosave) s debounce 1.5s v `App.tsx`.

## Poznámky k implementaci AI
- Aplikace očekává Gemini API klíč nastavený v prostředí.
- Promptování v `geminiService.ts` je optimalizováno pro češtinu a Markdown formátování.
