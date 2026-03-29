---
description: Copilot instructions for AInotes AI-powered note-taking application
scope: workspace
appliesToLanguages: TypeScript, TSX, JavaScript
---

# AInotes Workspace Instructions

**AInotes** (Chytrý Zápisník AI) is a modern React 19 + TypeScript web application for managing notes with AI-powered features. It combines Markdown editing, contextual chat with note retrieval (RAG), smart linking, and a specialized songwriter studio mode.

## 🎯 Quick Start for AI Agents

### Essential Commands

```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server (port 3000)
npm test                       # Run tests in watch mode
npm test -- --run             # Single test run (CI mode)
npm run build                 # Production build
npm run lint                  # Check TypeScript & ESLint
```

### Environment Setup

Create a `.env.local` file with:
```env
VITE_GEMINI_API_KEY=<your-api-key>
VITE_FIREBASE_API_KEY=<firebase-config>
VITE_FIREBASE_AUTH_DOMAIN=<value>
VITE_FIREBASE_PROJECT_ID=<value>
VITE_FIREBASE_STORAGE_BUCKET=<value>
VITE_FIREBASE_MESSAGING_SENDER_ID=<value>
VITE_FIREBASE_APP_ID=<value>
VITE_FIREBASE_MEASUREMENT_ID=<value>
```

---

## 📐 Architecture & Key Patterns

### State Management: Multi-Hook Pattern

The app uses **custom React hooks** as the primary state management strategy (no Redux/Context):

| Hook | Location | Responsibility |
|------|----------|-----------------|
| **useNotes** | [hooks/useNotes.ts](hooks/useNotes.ts) | Note CRUD, undo/history, category management, auto-linking |
| **useChat** | [hooks/useChat.ts](hooks/useChat.ts) | Chat state, streaming responses, message history |
| **useMusicStudio** | [hooks/useMusicStudio.ts](hooks/useMusicStudio.ts) | Multi-pane editor for songwriter mode, sync scroll |
| **useUI** | [hooks/useUI.ts](hooks/useUI.ts) | Theme (dark/light), active section, focus mode |
| **useAudioRecorder** | [hooks/useAudioRecorder.ts](hooks/useAudioRecorder.ts) | Audio recording & transcription state |
| **useStatus** | [hooks/useStatus.ts](hooks/useStatus.ts) | Status messages & toast notifications |

**Key Pattern:** Each hook manages own state independently; [App.tsx](App.tsx) orchestrates all hooks and section switching.

### Component Architecture

```
App.tsx (root orchestrator)
├─ ChatView.tsx (chat section)
├─ NoteView.tsx (notes editor + preview)
├─ SongwriterStudio.tsx (music mode)
└─ UI Components:
    ├─ CategoryTree.tsx (hierarchy sidebar)
    ├─ MetaTagToolbar.tsx (metadata editor)
    ├─ CommandPalette.tsx (fuzzy search)
    ├─ SimpleMarkdownRenderer.tsx (content display)
    └─ Icons.tsx (SVG icons)
```

---

## 🔌 AI Integration & Dual-Model Strategy

### Primary AI: Google Gemini API
- **Model:** `gemini-1.5-flash` via `@google/genai`
- **Service:** [services/geminiService.ts](services/geminiService.ts)
- **Usage:** Feature analysis, smart linking, chat, transcription, music analysis

### Fallback: Local Ollama
- **Primary model:** `qwen2.5-coder:0.5b` (JSON/logic tasks)
- **Creative model:** `qwen2.5:1.5b` (text/rhyme analysis)
- **Endpoint:** `http://localhost:11434`
- **Activation:** Automatic when Gemini fails or API unavailable

**Pattern:** Always implement Gemini→Ollama fallback in new AI features. See [geminiService.ts](services/geminiService.ts#L33-L51) for example.

---

## 🌐 Model Context Protocol (MCP) Servers

### Playwright MCP Server
- **Location:** `../playwright/` (sibling directory to AInotes)
- **Purpose:** Browser automation & testing for AI agents
- **Configuration:** [cline_mcp_config.json](cline_mcp_config.json)
- **Tools Available:**
  - `browser_navigate` — Navigate to URLs
  - `browser_snapshot` — Get page HTML
  - `browser_click` — Click elements
  - `browser_type` — Type text into fields
  - `browser_close` — Close browser
- **Use Cases:** Automated web testing, scraping, content analysis
- **Documentation:** See [../playwright/README.md](../playwright/README.md)

**Starting the MCP Server:**
```bash
cd ../playwright
npm start
```

---

## 📋 File Organization & Naming Conventions

```
/components     → React components (mostly stateless, receive props from App)
/hooks          → Custom React hooks (state + logic, paired with .test.ts)
/services       → External APIs (Gemini, Firebase, Ollama integration)
/tests          → Integration tests for services & utilities
├─ types.ts     → Central TypeScript type definitions
├─ App.tsx      → Root component
├─ index.tsx    → React entry point
├─ firebaseConfig.ts → Firebase initialization
├─ setupTests.ts → Test environment setup
└─ vite.config.ts → Build configuration
```

### Naming Conventions
- **Components:** PascalCase → `NoteView.tsx`, `ChatView.tsx`
- **Hooks:** camelCase + `use` prefix → `useNotes.ts`, `useChat.ts`
- **Services:** camelCase + `Service` suffix → `geminiService.ts`, `firebaseService.ts`
- **Types:** PascalCase, centralized in [types.ts](types.ts) → `Note`, `Category`, `ChatMessage`
- **Test files:** Same name as source + `.test.ts(x)` → `useNotes.test.ts`

---

## 🧪 Testing Standards

**Testing Framework:** Vitest with React Testing Library

### Test File Location & Structure
```
/hooks          → Hook unit tests (useNotes.test.ts, useChat.test.ts, etc.)
/tests          → Service & component integration tests
```

### Test Setup
- **Environment:** jsdom (browser-like DOM)
- **Setup file:** [setupTests.ts](setupTests.ts) (localStorage mock)
- **Before each test:** Call `window.localStorage.clear()` if testing hooks
- **Async state updates:** Use `await act(async () => {...})`

### Running Tests
```bash
npm test                    # Watch mode
npm test -- --run          # Single run
npm test -- useNotes       # Run specific test file
npm test -- --ui           # Browser UI for visualization
```

### Key Testing Patterns
```typescript
// Hook test template
import { renderHook, act } from '@testing-library/react';
import { useNotes } from './useNotes';

beforeEach(() => {
  window.localStorage.clear();
});

test('should add a note', async () => {
  const { result } = renderHook(() => useNotes());
  
  await act(async () => {
    result.current.addNote('Test note');
  });
  
  expect(result.current.notes).toHaveLength(1);
});
```

See [DOKUMENTACE_TESTU.md](DOKUMENTACE_TESTU.md) for detailed testing philosophy.

---

## 🚨 Critical Gotchas & Workarounds

### 1. **Firebase Long-Polling Workaround** ⚠️
```typescript
// In firebaseConfig.ts
experimentalForceLongPolling: true
```
**Issue:** "Could not reach Cloud Firestore backend" in certain networks
**Impact:** WebSocket replaced with polling (slower but more reliable)
**Do not remove** unless testing cloud connectivity specifically.

### 2. **Environment Variables in Vite**
```typescript
// vite.config.ts defines both patterns for compatibility:
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```
**Key Point:** Only `VITE_*` prefixed vars are available in browser; use `.env.local` for local development.

### 3. **LocalStorage Sync Debouncing**
- Auto-save debounced at **1.5 seconds** (prevents spam)
- History limited to **10 versions** per note
- Firebase sync is asynchronous; never await on completion in UI

### 4. **Markdown Rendering Limits**
- [SimpleMarkdownRenderer.tsx](components/SimpleMarkdownRenderer.tsx) uses regex parsing, not a full parser
- Internal links use `[[noteId|Title]]` format
- Code blocks protected from interpretation
- If HTML in markdown doesn't render, ensure `rehype-raw` is imported

### 5. **Note Internal Links Pattern**
```markdown
[[${noteId}|${title}]]  ← Correct format
```
- Auto-linking uses negative lookahead regex to avoid double-linking
- Max 1 link per unique note per content block

### 6. **Firebase Security: No Auth**
- **Important:** No authentication implemented
- Writes to `public/shared/notes` and `public/shared/categories`
- Anyone with access can read/write
- **For production:** Implement Firestore security rules

### 7. **React Markdown Dependencies**
Must import all three:
```typescript
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
```
Missing imports cause HTML in markdown to not render.

### 8. **Music Mode Type Filtering**
Only notes with `type: 'lyric'` appear in Music section:
```typescript
const lyricsNotes = notes.filter(n => n.type === 'lyric');
```

---

## 🎯 Common Development Tasks

### Adding a New AI Feature
1. Implement in [services/geminiService.ts](services/geminiService.ts) with Gemini→Ollama fallback
2. Wire into appropriate hook (useNotes, useMusicStudio, useChat)
3. Add UI button/trigger in relevant component
4. Show feedback via `useStatus` toast notifications
5. Write test in `tests/geminiService.test.ts`
6. Document in [DOKUMENTACE_FUNKCI.md](DOKUMENTACE_FUNKCI.md)

### Adding a Note Property
1. Update `Note` interface in [types.ts](types.ts)
2. Add to state initialization in [useNotes.ts](hooks/useNotes.ts)
3. Include in `saveNote()` and `loadNote()` logic
4. Update both localStorage and Firebase sync
5. Add test coverage in `useNotes.test.ts`

### Styling (Tailwind CSS)
- **Utility-first approach:** `className="bg-gray-950 text-white dark:bg-black"`
- **Dark mode preferred:** App defaults to dark theme with gray-950 background
- **Responsive:** Use `hidden md:block` for mobile responsiveness
- **Icons:** Import SVG components from [Icons.tsx](components/Icons.tsx)

### Updating Type Definitions
All types centralized in [types.ts](types.ts):
```typescript
export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  type?: 'note' | 'lyric';
  createdAt: number;
  updatedAt: number;
  history: NoteVersion[];
}
```

---

## 📚 Related Documentation

Instead of repeating detailed specifications, consult these files:

| File | Purpose |
|------|---------|
| [README.md](README.md) | High-level feature overview, tech stack, installation |
| [GEMINI.md](GEMINI.md) | Feature descriptions, AI models, development conventions |
| [DOKUMENTACE_FUNKCI.md](DOKUMENTACE_FUNKCI.md) | Detailed feature specs (AI + non-AI) |
| [DOKUMENTACE_TESTU.md](DOKUMENTACE_TESTU.md) | Testing philosophy, test structure, test patterns |
| [BEZ_AI_A_NAVRHY.md](BEZ_AI_A_NAVRHY.md) | Non-AI features, improvement proposals, fallback strategies |

---

## 🔧 TypeScript & Linting Configuration

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",              // React 19+ (no React import needed)
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./*"] },     // @ alias support
    "noEmit": true,                  // Vite handles emission
    "skipLibCheck": true             // Speed up checks
  }
}
```

### ESLint (eslint.config.js)
- **Format:** Flat config (ESLint v9)
- **Rules:** typescript-eslint + eslint-plugin-react
- **Relaxed rules for pragmatism:** `@typescript-eslint/no-explicit-any: off` (API responses)
- **Run:** `npm run lint`

---

## 🚀 Build & Deployment

### Production Build
```bash
npm run build       # Creates dist/ folder
npm run preview     # Local preview of production build
```

### Build Output
- **Target:** `dist/index.html` + JavaScript/CSS bundles
- **Optimization:** Tree-shaking enabled (ESNext modules)
- **Bundler:** Vite (fast, modern)

---

## 💡 Development Philosophy

1. **Offline-First:** localStorage is primary, Firebase is backup sync
2. **AI-Augmented, Not AI-Required:** All features degrade gracefully without AI
3. **Pragmatic:** Accept `any` types for API responses; prefer working software over type perfection
4. **User-Focused:** Streaming responses, toast feedback, debounced saves
5. **Modern React:** React 19, hooks, no class components

---

## 🤝 Contributing Workflow

1. **Create a branch** for your feature
2. **Run tests** before committing: `npm test -- --run`
3. **Follow naming conventions** (see File Organization section)
4. **Add/update tests** for new functionality
5. **Lint before commit:** `npm run lint`
6. **Update relevant documentation** (GEMINI.md, DOKUMENTACE_FUNKCI.md, etc.)
7. **Reference existing patterns** in similar files

---

## ❓ Common Questions

**Q: How do I test changes locally without Gemini API?**  
A: Run Ollama locally with `qwen2.5-coder:0.5b` and `qwen2.5:1.5b` models. The app will automatically fallback to Ollama if Gemini is unavailable.

**Q: How do I add a new note type beyond 'note' and 'lyric'?**  
A: Update the `type` field in `types.ts`, add filtering logic in appropriate hook, and update [SongwriterStudio.tsx](components/SongwriterStudio.tsx) if music-mode filtering is needed.

**Q: How do I understand the current state of the app?**  
A: All hooks accept initial state from App.tsx. Check [App.tsx](App.tsx) to see what state each hook receives, then inspect the hook itself for state management logic.

**Q: Why is my note not syncing to Firebase?**  
A: Check (1) Environment variables are set correctly, (2) No network errors (check DevTools), (3) Firebase rules allow writes to `public/shared/*`, (4) App tab is active (sync is debounced and may delay on inactive tabs).

---

**Last updated:** March 2026  
**Language:** TypeScript + React 19  
**Testing:** Vitest + React Testing Library  
**AI Models:** Gemini 1.5 Flash + Ollama (local fallback)
