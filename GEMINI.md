# Chytrý Zápisník AI - Kontext pro Gemini

Tento projekt je moderní webová aplikace pro inteligentní správu poznámek a tvorbu textů, postavená na technologiích React, Firebase a Google Gemini AI.

## Přehled projektu
- **Hlavní účel:** Automatizace organizace poznámek, jejich formátování pomocí AI a pokročilá podpora pro autory textů (skladatele).
- **Klíčové technologie:**
    - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
    - **AI:** Google Gemini API (model `@google/genai`) - využívá se pro RAG (Retrieval-Augmented Generation), formátování, kategorizaci a extrakci metadat.
    - **Backend/Databáze:** Firebase Firestore (synchronizace v reálném čase).

## Architektura a struktura kódu
- `App.tsx`: Centrální komponenta spravující globální stav přes hook `useAppLogic`.
- `hooks/useAppLogic.ts`: Jádro aplikace obsahující veškerou logiku:
    - **Synchronizace dat:** Prioritní načítání z `localStorage`, následná synchronizace s Firestore.
    - **AI Handlery:** `handleAIProcess`, `handleAIAction`, `handleAIAppend`, `handleAnalyzeRhyme`.
    - **Stav editoru:** Správa titulu, obsahu, tagů a historie (Undo).
    - **Songwriter Studio:** Logika pro synchronizované scrollování a kompozici.
- `services/geminiService.ts`: Zapouzdření veškeré komunikace s AI.
    - Obsahuje fallback na **Ollama** (lokální LLM).
    - Funkce pro analýzu rýmů, sémantické propojování a streaming chatu.

## Klíčové funkce
1. **AI Reorganizace:** Inteligentní transformace textu na Markdown s kategorizací.
2. **Režim Skladatele:** Synchronizace více verzí textu, analýza rýmů a metriky.
3. **Kontextový Chat:** RAG systém nad poznámkami se streamovanými odpověďmi.
4. **Smart Linking:** Automatické vytváření interních vazeb mezi poznámkami.
5. **Robustní Ukládání:** Kombinace `localStorage` pro rychlost a Firestore pro cloudovou zálohu.

## Vývojové pokyny
- **Data Persistence:** Všechny změny v `notes` a `categories` se automaticky ukládají (debounce 1.5s).
- **AI Fallback:** Pokud selže Gemini API, systém se automaticky přepne na Ollama.
- **Typová bezpečnost:** Vždy dodržuj interfacy definované v `types.ts`.

## Poznámky k implementaci AI
- Aplikace očekává Gemini API klíč nastavený v prostředí.
- Promptování v `geminiService.ts` je optimalizováno pro češtinu a Markdown formátování.
