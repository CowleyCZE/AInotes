# Detailní popis funkcí aplikace Chytrý Zápisník AI

Tento dokument slouží jako kompletní přehled všech funkcí dostupných v aplikaci, rozdělených podle toho, zda využívají umělou inteligenci, nebo se jedná o standardní funkcionalitu.

## 1. Funkce využívající Umělou Inteligenci (AI)

Jádrem aplikace je integrace s modelem **Google Gemini 2.5 Flash**. AI není jen doplněk, ale aktivní nástroj pro správu obsahu.

### A. Automatické zpracování poznámky ("Uspořádat s AI")
Když uživatel napíše hrubý text a klikne na tlačítko zpracování, AI provede následující:
*   **Analýza obsahu:** Pochopí kontext textu (zda jde o recept, kód, báseň nebo pracovní úkol).
*   **Kategorizace:** Přiřadí poznámku do existující kategorie nebo vytvoří novou, pokud žádná nevyhovuje.
*   **Generování názvu:** Vytvoří stručný a výstižný název (max. 10 slov).
*   **Formátování:** Převede prostý text do Markdownu (nadpisy, seznamy, bloky kódu).
*   **Tagování:** Navrhne 1-5 relevantních klíčových slov (tagů).

### B. Inteligentní připojení textu ("Přidat a formátovat s AI")
Umožňuje připsat nový text k již existující poznámce.
*   AI vezme v úvahu kontext stávající poznámky.
*   Nový text naformátuje tak, aby vizuálně a stylisticky navazoval na předchozí obsah.
*   **Nedochází** k přepsání původního obsahu, pouze k jeho rozšíření.

### C. Rychlé akce v editoru
Po označení textu myší se objeví plovoucí menu s AI nástroji:
1.  **Shrnout:** Vygeneruje stručný výtah z označeného textu s přihlédnutím ke kontextu celé poznámky.
2.  **Opravit gramatiku:** Opraví pravopis a stylistiku v češtině, přičemž zachová Markdown formátování.
3.  **Přeložit do EN:** Přeloží vybranou pasáž do angličtiny.
4.  **Nahradit:** Uživatel může jedním kliknutím nahradit původní text výsledkem od AI.

### D. Chytré propojování (Smart Linking)
Funkce analyzuje aktuální poznámku a prohledává celou databázi ostatních poznámek.
*   Hledá sémantické souvislosti (např. zmínka o "Projektu X" v deníku vs. technická specifikace "Projektu X").
*   Navrhne vytvoření interního odkazu (`[text](#id-poznámky)`).
*   Uživatel vidí důvod, proč AI navrhla spojení, a může jej potvrdit nebo zamítnout.

### E. AI Chat s kontextem (RAG)
Osobní asistent, který "zná" obsah všech vašich poznámek.
*   Do promptu jsou vloženy obsahy všech poznámek jako kontext.
*   Uživatel se může ptát přirozeným jazykem (např. "Co jsem psal minulý týden o Reactu?" nebo "Jaké ingredience potřebuji na ten koláč?").
*   Odpovědi jsou generovány výhradně na základě uložených dat.

### F. Hlasové poznámky (Audio-to-Note)
*   Nahrání zvuku přes mikrofon prohlížeče.
*   Odeslání dat do Gemini (multimodální vstup).
*   AI provede transkripci (přepis) a rovnou text strukturuje (nevznikne jen "blok textu", ale formátovaný zápis s nadpisem a tagy).

---

## 2. Standardní funkce a uživatelské rozhraní

Aplikace nabízí robustní sadu nástrojů pro manuální správu, které fungují i bez zásahu AI.

### A. Správa poznámek (CRUD)
*   **Vytvoření:** Tlačítko pro novou prázdnou poznámku.
*   **Editace:** Plnohodnotný textový editor s podporou Markdown syntaxe.
*   **Mazání:** Odstranění poznámky s potvrzovacím dialogem (proti nechtěnému smazání).
*   **Zobrazení:** Dva režimy pohledu na seznam poznámek:
    *   *Seznam:* Kompaktní zobrazení pro rychlou orientaci.
    *   *Karty:* Mřížka s náhledem obsahu a tagy.

### B. Organizace a Vyhledávání
*   **Kategorie:** Možnost filtrovat poznámky podle kategorií v postranním panelu. Kategorie lze přejmenovat nebo smazat.
*   **Tagy:** Filtrování kliknutím na tag.
*   **Fulltextové vyhledávání:** Okamžité filtrování podle názvu nebo obsahu poznámky.

### C. Režim Skladatele (Songwriter Mode)
Unikátní nástroj pro práci s více verzemi textu.
*   **Výběr verzí:** Uživatel může vybrat až 4 poznámky (verze).
*   **Split-screen:** Zobrazení vybraných poznámek vedle sebe v sloupcích.
*   **Synchronizované scrollování:** Při posunu v jednom sloupci se posouvají i ostatní (ideální pro porovnávání řádků).
*   **Kompozice:** Spodní panel "Finální kompozice", kam lze přetahovat nebo kopírovat části textů z jednotlivých verzí.
*   **Vizuální odlišení:** Každá verze má svou barvu pro lepší orientaci.

### D. Technické funkce
*   **Automatické ukládání:** Změny se ukládají do Firebase Firestore po 1.5 sekundě nečinnosti (debounce).
*   **Historie úprav (Undo):** Lokální historie změn (až 5 kroků zpět) pro případ chyby při editaci.
*   **Dark Mode:** Aplikace je plně designována v tmavém režimu pro šetrnost k očím.
*   **Responzivita:** Přizpůsobení rozložení pro mobilní telefony (skrytí sidebaru, hamburger menu).