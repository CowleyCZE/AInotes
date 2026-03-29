
// FIX: Changed Firebase imports from named to namespace imports to resolve a module resolution issue where 'initializeApp' was not found as a named export.
// Importování funkcí pro inicializaci aplikace a pro jednotlivé služby
import * as firebaseApp from "firebase/app";
import * as firestore from "firebase/firestore";

// Vaše konfigurace webové aplikace z Firebase konzole.
// Ujistěte se, že tyto hodnoty odpovídají vašemu projektu.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
