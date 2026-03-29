# Dokumentace testů projektu AInotes

Tento projekt používá **Vitest** a **React Testing Library** pro zajištění stability a správné funkčnosti klíčových modulů.

## Struktura testů

Testy jsou rozděleny do dvou hlavních kategorií:
1.  **Unit testy služeb (`services/`)**: Testují čistou logiku a integraci s API (pomocí mocků).
2.  **Hook testy (`hooks/`)**: Testují stavovou logiku Reactu a persistenci v `localStorage`.

### Seznam testovacích souborů

| Soubor | Co testuje |
| :--- | :--- |
| `AInotes/tests/utils.test.ts` | Formátování dat, normalizace názvů, seskupování poznámek. |
| `AInotes/hooks/useNotes.test.ts` | Správa poznámek (vytváření, mazání, úpravy), ukládání do localStorage. |
| `AInotes/hooks/useChat.test.ts` | Chatovací rozhraní, historie zpráv, AI odpovědi. |
| `AInotes/hooks/useMusicStudio.test.ts` | Skládání textů, propojování zdrojů, režim skladatele. |
| `AInotes/hooks/useUI.test.ts` | Přepínání sekcí (Notes/Music), tmavý/světlý režim, focus mode. |
| `AInotes/tests/geminiService.test.ts` | AI operace (zpracování poznámek, rychlé akce) pomocí mockovaného fetch. |
| `AInotes/tests/firebaseService.test.ts` | Interakce s Firestore (ukládání, mazání) pomocí mocků. |

## Jak spouštět testy

Všechny příkazy spouštěj z adresáře `AInotes/`.

### Vývojový režim (Watch mode)
Testy se automaticky spustí při každé změně kódu:
```bash
npm test
```

### Jednorázové spuštění (CI/Report)
```bash
npm test -- --run
```

### UI Rozhraní pro testy (pokud je dostupné v prohlížeči)
```bash
npx vitest --ui
```

## Důležité poznámky pro vývoj
*   **Mockování:** Pro testování služeb, které vyžadují externí API (Firebase, Ollama, Gemini), vždy používej `vi.mock` nebo `vi.stubGlobal('fetch', ...)`. Nikdy nespouštěj testy proti reálné databázi v rámci unit testů.
*   **Cleanup:** Před každým testem v hooks je důležité vyčistit `localStorage` pomocí `window.localStorage.clear()`.
*   **Async/Act:** Při testování hooků, které provádějí asynchronní operace (např. `handleSaveNote`), používej `await act(async () => { ... })`.
