# Studio Notes - AI-Powered Note-Taking & Music Production Suite

Studio Notes is a hybrid application that combines advanced AI note-taking with a specialized music production studio. It allows users to manage general notes while providing deep analysis and architectural tools for songwriters and music producers.

## 🚀 Key Features

### 📝 Smart Note-Taking (Legacy AInotes)
- **AI Organization:** Automatically categorizes, titles, and tags notes using Gemini/Ollama.
- **Contextual Chat:** RAG (Retrieval-Augmented Generation) system to chat with your entire note library.
- **Smart Linking:** Automatically discovers and creates semantic connections between notes using `[[note-id|Title]]` syntax.
- **Quick AI Actions:** Summarize, fix grammar, and translate selected text instantly.

### 🎵 Songwriter Studio (Legacy Producer-ai)
- **Deep Lyric Scan:** Analyzes rhythm (prosody), detects weak rhymes, and suggests flow improvements.
- **Rhyme & Meter Analysis:** Specialized tools for Czech poetry and lyrics.
- **Meta Tags Editor:** Prepare lyrics for AI music generators (Suno, Udio) with structured tags like `[Verse]`, `[Chorus]`.
- **Sync Scroll & Composition:** Multi-view editor for combining fragments from different notes into a final song.

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **AI Engine:** Dual-mode Google Gemini API (Flash 1.5) and local Ollama (Qwen 2.5 series).
- **Backend:** Firebase Firestore (real-time sync) with LocalStorage fallback.

## 📂 Project Structure
- `App.tsx`: Main entry point with section switching (Notes vs. Music).
- `hooks/useAppLogic.ts`: Centralized state management and AI integration.
- `services/geminiService.ts`: Unified AI service for both general and musical tasks.
- `components/`:
    - `NoteView.tsx`: Standard Markdown editor with AI toolbar.
    - `SongwriterStudio.tsx`: Advanced multi-pane editor for music projects.
    - `ChatView.tsx`: Streaming chat interface for interacting with notes.

## 🔧 Building and Running
- `npm install`: Install dependencies.
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm test`: Run tests (Vitest).

## 🧬 Development Conventions
- **Types:** Always use definitions from `src/types.ts`.
- **AI Models:** Use `PRIMARY_OLLAMA_MODEL` (1.5b) for logic/JSON and `CREATIVE_OLLAMA_MODEL` (3b) for text/creative tasks.
- **Styling:** Tailwind CSS utility classes. Prefer dark mode aesthetics.
- **Persistence:** Ensure all note changes are debounced and synced to both LocalStorage and Firestore.
