# Funkce bez AI a Návrhy na Vylepšení

Tento dokument se zaměřuje na technické jádro aplikace, které nezávisí na umělé inteligenci, a navrhuje možnosti, jak aplikaci posunout dál, případně jak nahradit AI funkce konvenčními metodami.

## 1. Detailní popis funkcí bez AI

Tyto funkce tvoří "kostru" aplikace a fungují deterministicky (vždy stejný vstup = stejný výstup).

### Správa stavu (React State Management)
*   Aplikace využívá `useState` a `useReducer` (implikovaně přes složité settery) pro správu lokálního stavu.
*   **Filtrování:** Logika filtrování (podle kategorie, tagu, vyhledávání) probíhá čistě na klientovi v JavaScriptu (`useMemo`), což zajišťuje okamžitou odezvu bez čekání na server.

### Markdown Rendering
*   Využívá vlastní komponentu `SimpleMarkdownRenderer`.
*   Nejedná se o AI – jde o sadu regulárních výrazů (RegEx), které převádějí syntaxi jako `**text**` na `<strong>text</strong>` nebo `# Nadpis` na `<h1>Nadpis</h1>`.
*   Zahrnuje i ochranu bloků kódu (Code Blocks), aby se v nich neinterpretoval Markdown.

### Synchronizace a Persistence (Firebase)
*   **Firestore:** Slouží jako "hloupé" úložiště JSON objektů.
*   **Debounce logika:** Aby se neodesílal požadavek na server s každým úhozem klávesy, využívá se `setTimeout` a `clearTimeout` (ref `autoSaveTimeoutRef`). Ukládání proběhne až 1.5 sekundy po dopsání.

### Logika Skladatele (Songwriter Logic)
*   **Sync Scroll:** Matematický výpočet procentuální pozice scrollu (`scrollTop / scrollHeight`) a aplikace tohoto procenta na ostatní referencované DOM elementy.
*   **Výběr:** Pole ID vybraných poznámek. Logika omezuje výběr na max. 4 položky.

### Nahrávání zvuku (MediaRecorder API)
*   Využívá nativní prohlížečové API `navigator.mediaDevices.getUserMedia`.
*   Samotné nahrání, vytvoření Blobu a převod do Base64 probíhá čistě v prohlížeči bez AI.

---

## 2. Návrhy na vylepšení aplikace

Zde jsou konkrétní návrhy, jak aplikaci vylepšit po stránce UX, výkonu nebo funkcionality.

### A. Technická vylepšení (Code & Performance)
1.  **Virtuální scrollování:** Pokud bude mít uživatel stovky poznámek, renderování seznamu může být pomalé. Použití `react-window` nebo `react-virtuoso` by zrychlilo načítání.
2.  **Lepší Markdown parser:** Nahradit vlastní RegEx parser knihovnou `react-markdown`. Přidalo by to podporu pro tabulky, obrázky, úkoly (checkboxy) a bezpečnější HTML sanitizaci.
3.  **Offline režim (PWA):** Implementovat Service Workers a lokální databázi (IndexedDB přes Dexie.js). Uživatel by mohl pracovat bez internetu a data by se synchronizovala po připojení.

### B. Uživatelská vylepšení (UX)
1.  **Složky a Podkategorie:** Současný systém je "plochý" (jen jedna úroveň kategorií). Hierarchická struktura by pomohla lepší organizaci.
2.  **Full-text search engine:** Nahradit prosté `includes()` hledání knihovnou jako **FlexSearch** nebo **Fuse.js**. Umožnilo by to "fuzzy" vyhledávání (najde i při překlepu) a skórování relevance.
3.  **Drag & Drop:** Možnost přetahovat poznámky do kategorií myší.

---

## 3. Návrhy na nahrazení AI funkcí (Fallbacky)

Pokud by AI služba nebyla dostupná (nebo pro úsporu nákladů), lze některé funkce nahradit konvenčními algoritmy:

| AI Funkce | Možná "hloupá" náhrada (Bez AI) | Výhody / Nevýhody |
| :--- | :--- | :--- |
| **Oprava gramatiky** | Integrace API **LanguageTool** nebo využití nativní kontroly pravopisu v prohlížeči (`spellcheck="true"`). | + Levnější/Zdarma<br>- Méně kontextuální, neumí přeformulovat věty. |
| **Hlasové poznámky** | **Web Speech API** (`SpeechRecognition`). Je vestavěné v Chrome/Edge. | + Funguje v prohlížeči zdarma<br>- Nižší přesnost, nepodporuje interpunkci tak dobře, neumí strukturovat text. |
| **Kategorizace** | **Analýza klíčových slov.** Pokud text obsahuje slovo "recept", zařadit do "Vaření". | + Rychlé<br>- Velmi nepřesné, vyžaduje manuální údržbu seznamu klíčových slov. |
| **Tagování** | **Extrakce nejčastějších slov** (TF-IDF algoritmus) po odstranění spojek a předložek (stop-words). | + Deterministické<br>- Tagy často nedávají smysl (např. vybere slovo "kdyby"). |
| **Chat s poznámkami** | **Klasické vyhledávání.** Uživatel zadá klíčová slova a aplikace vypíše seznam poznámek, kde se vyskytují. | + Spolehlivě najde přesnou shodu<br>- Neodpovídá na otázky, neumí syntetizovat informace z více zdrojů. |
| **Chytré propojování** | **RegEx vyhledávání názvů.** Projít názvy všech poznámek a hledat jejich výskyt v aktuálním textu. | + Jednoduché na implementaci<br>- Najde jen přesné shody názvů, nepochopí synonyma nebo kontext. |