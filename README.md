# Chytrý Zápisník AI

**Chytrý Zápisník AI** je moderní webová aplikace pro správu poznámek, která využívá sílu umělé inteligence (Google Gemini) k automatizaci organizace, formátování a propojování myšlenek.

Aplikace je navržena pro tvůrce, vývojáře a spisovatele, kteří potřebují rychle zachytit myšlenky a nechtějí ztrácet čas manuálním tříděním. Součástí je unikátní režim pro skladatele písní a pokročilý chat s kontextem celé vaší znalostní báze.

## Hlavní vlastnosti

*   **AI Zpracování:** Automatické formátování do Markdownu, generování názvů, kategorizace a tagování.
*   **Chytré Propojování:** AI analyzuje obsah a navrhuje relevantní odkazy mezi poznámkami.
*   **Rychlé Akce:** Shrnutí textu, oprava gramatiky a překlad do angličtiny jedním kliknutím.
*   **Chat s Poznámkami:** "RAG" (Retrieval-Augmented Generation) chat, který odpovídá na otázky na základě obsahu vašich poznámek.
*   **Režim Skladatele:** Specializované rozhraní pro porovnávání verzí textů a skládání finální kompozice.
*   **Hlasové Poznámky:** Nahrávání audia s následným přepisem a strukturováním pomocí AI.
*   **Cloudová Synchronizace:** Data jsou ukládána v reálném čase do Firebase Firestore.

## Použité Technologie

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI:** Google Gemini API (`@google/genai`)
*   **Backend / Databáze:** Firebase Firestore
*   **Build:** Vite (nebo kompatibilní bundler)

## Instalace a Spuštění

1.  Ujistěte se, že máte nastavený `API_KEY` pro Google Gemini v prostředí aplikace.
2.  Nainstalujte závislosti:
    ```bash
    npm install
    ```
3.  Spusťte vývojový server:
    ```bash
    npm start
    ```

## Struktura Dat

Aplikace ukládá data do dvou hlavních kolekcí v Firebase:
*   `notes`: Obsahuje samotné poznámky, jejich historii a metadata.
*   `categories`: Seznam kategorií pro organizaci.

---
*Vytvořeno pro demonstraci síly Gemini API v kombinaci s moderním Reactem.*