import http from 'http';
import { exec } from 'child_process';

const PORT = 3005;

const server = http.createServer((req, res) => {
    // Povolit CORS, aby webová aplikace mohla volat tento server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/shutdown' && req.method === 'POST') {
        console.log('Received shutdown command...');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Vypínám systémy...' }));

        // Po krátké prodlevě (aby se stihla odeslat odpověď) provedeme příkazy
        setTimeout(() => {
            console.log('Zastavuji Ollama a Vite...');
            
            // 1. Zastavit Ollama server
            exec('pkill -f "ollama serve"', (err) => {
                if (err) console.error('Chyba při zastavování Ollama:', err);
                else console.log('Ollama zastavena.');
            });

            // 2. Zastavit Vite (samotnou aplikaci)
            // Použijeme pkill -f vite, což najde proces node běžící vite
            exec('pkill -f vite', (err) => {
                 if (err) console.error('Chyba při zastavování aplikace:', err);
            });

            // 3. Ukončit tento bridge server
            setTimeout(() => {
                process.exit(0);
            }, 500);
            
        }, 100);
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Bridge server běží na portu ${PORT}`);
});