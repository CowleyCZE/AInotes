
// FIX: Changed Firebase imports from named to namespace imports to resolve a module resolution issue where 'initializeApp' was not found as a named export.
// Importování funkcí pro inicializaci aplikace a pro jednotlivé služby
import * as firebaseApp from "firebase/app";
import * as firestore from "firebase/firestore";

// Vaše konfigurace webové aplikace z Firebase konzole.
// Ujistěte se, že tyto hodnoty odpovídají vašemu projektu.
const firebaseConfig = {
    apiKey: "AIzaSyBfp6tuNrfvohzKeqQy9ORoh9O50VAXmsY",
    authDomain: "chytryzapisnikai.firebaseapp.com",
    projectId: "chytryzapisnikai",
    storageBucket: "chytryzapisnikai.firebasestorage.app",
    messagingSenderId: "810839343258",
    appId: "1:810839343258:web:ee78ed76deaa8531bb5f23",
    // Measurement ID je pro Google Analytics, všiml jsem si, že jsi ho tam měl.
    // Pro správné fungování Analytics bys měl také importovat `getAnalytics` a inicializovat ji.
    measurementId: "G-JK4XKOHZOR"
};

// Inicializace Firebase aplikace
const app = firebaseApp.initializeApp(firebaseConfig);

// Inicializace Firebase služeb
// Používáme initializeFirestore místo getFirestore, abychom mohli vynutit long polling.
// To často řeší problémy s připojením "Could not reach Cloud Firestore backend" v určitých prostředích (např. za proxy nebo v sandboxu).
const db = firestore.initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Export služeb pro použití v celé aplikaci
export { app, db };
