# Detailní popis funkcí aplikace Chytrý Zápisník AI

Tento dokument slouží jako kompletní přehled všech funkcí dostupných v aplikaci, rozdělených podle toho, zda využívají umělou inteligenci, nebo se jedná o standardní funkcionalitu.

## 1. Funkce využívající Umělou Inteligenci (AI)

Jádrem aplikace je integrace s modelem **Google Gemini 1.5 Flash**. AI není jen doplněk, ale aktivní nástroj pro správu obsahu s automatickým fallbackem na lokální model **Ollama**, pokud není dostupné internetové připojení nebo API klíč.

### A. Automatické zpracování poznámky ("Uspořádat s AI")
Když uživatel napíše hrubý text a klikne na tlačítko zpracování, AI provede následující:
*   **Analýza obsahu:** Pochopí kontext textu (zda jde o recept, kód, báseň nebo pracovní úkol).
*   **Kategorizace:** Přiřadí poznámku do existující kategorie nebo vytvoří novou, pokud žádná nevyhovuje.
*   **Generování názvu:** Vytvoří stručný a výstižný název.
*   **Formátování:** Převede prostý text do Markdownu (nadpisy, seznamy, bloky kódu).
*   **Tagování:** Navrhne relevantní klíčová slova (tagy).
*   **Aktualizace:** Pokud zpracováváte stávající poznámku, její ID zůstane zachováno a historie se aktualizuje.

### B. Inteligentní připojení textu ("Přidat a formátovat s AI")
Umožňuje připsat nový text k již existující poznámce.
*   AI vezme v úvahu kontext stávající poznámky.
*   Nový text naformátuje tak, aby vizuálně a stylisticky navazoval na předchozí obsah.
*   Původní obsah zůstává zachován, je pouze rozšířen o nový, inteligentně naformátovaný blok.

### C. AI Floating Toolbar (Rychlé akce)
Po označení textu (min. 3 znaky) v prohlížeči se objeví plovoucí menu s AI nástroji:
1.  **Kopírovat:** Rychlé zkopírování výběru do schránky.
2.  **Shrnout:** Vygeneruje stručný výtah z označeného textu.
3.  **Opravit gramatiku:** Opraví pravopis a stylistiku v češtině. V editačním módu text přímo nahradí.
4.  **Přeložit do EN:** Přeloží vybranou pasáž do angličtiny.

### D. Chytré propojování (Smart Connections)
Funkce analyzuje aktuální poznámku a prohledává celou databázi ostatních poznámek.
*   Hledá sémantické souvislosti mezi textem a názvy jiných poznámek.
*   Automaticky vytváří interní odkazy ve formátu `[[id|text]]`.
*   Umožňuje budovat osobní znalostní bázi (Zettelkasten styl).

### E. AI Chat s kontextem (RAG)
Osobní asistent, který "zná" obsah všech vašich poznámek.
*   Umožňuje dotazování nad celou databází.
*   Odpovědi jsou streamované v reálném čase.
*   Využívá multimodální schopnosti Gemini pro pochopení kontextu.

### F. Analýza rýmů a metriky (v režimu Skladatele)
Specializovaný nástroj pro autory textů:
*   **Detekce rýmů:** Identifikuje rýmující se slova a určuje rýmové schéma (např. AABB, ABAB).
*   **Metrika:** Analyzuje rytmus, počty slabik v řádcích a navrhuje vylepšení metriky.
*   **Statistiky:** Přehled o počtu zrýmovaných řádků a celkové struktuře textu.

---

## 2. Standardní funkce a uživatelské rozhraní

### A. Lokální úložiště a Offline režim (LocalStorage)
*   **Okamžitý start:** Data se načítají prioritně z `localStorage`, což zajišťuje bleskový start aplikace bez čekání na cloud.
*   **Auto-Save:** Každá změna je okamžitě uložena lokálně a následně (s 1.5s debounce) synchronizována do Firebase Firestore.
*   **Práce bez internetu:** Pokud je uživatel offline, může v aplikaci plně pracovat. Data se synchronizují, jakmile se spojení obnoví.

### B. Historie úprav (Undo)
*   Aplikace uchovává historii posledních **10 verzí** obsahu pro každou poznámku.
*   Uživatel se může kdykoliv vrátit k předchozí verzi stisknutím tlačítka "Zpět" v záhlaví poznámky.

### C. Režim Skladatele (Songwriter Studio)
*   **Synchronizované scrollování:** Porovnávání více verzí textu vedle sebe se synchronizovaným posunem (podle procent, odstavců nebo řádků).
*   **Finální kompozice:** Spodní editační panel pro skládání výsledného textu z různých zdrojů.
*   **Ukládání kompozice:** Rozpracovaná skladba se automaticky ukládá do lokálního úložiště prohlížeče.
*   **Nástroje struktury:** Tlačítka pro rychlé vkládání značek jako [SLOKA], [REFRÉN] s automatickým číslováním.

### D. Organizace a Tagování
*   **Kategorie:** Přehledné řazení do kategorií s možností AI automatizace.
*   **Tagy:** Pokročilá správa tagů (přidávání pomocí Enter, snadné mazání).
*   **Filtrování:** Rychlé filtrování podle kategorií, tagů nebo fulltextového vyhledávání.
