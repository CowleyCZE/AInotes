#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="/data/data/com.termux/files/home/projects/AInotes"
# Zajistíme, že Termux binárky jsou v cestě
export PATH="/data/data/com.termux/files/usr/bin:$PATH"

cd "$PROJECT_DIR"

# Funkce pro úklid při ukončení
cleanup() {
    echo ""
    echo "Ukončuji Studio Notes..."
    # Zastavení spuštěných procesů
    if [ ! -z "$VITE_PID" ]; then kill $VITE_PID 2>/dev/null; fi
    exit
}

trap cleanup SIGINT SIGTERM

echo "--- 🎹 STUDIO NOTES (AI Creative Suite) ---"

# 1. Kontrola a spuštění Ollama (Lokální AI)
echo "[1/3] 🧠 Inicializace lokální AI (Ollama)..."
if ! pgrep ollama > /dev/null; then
    echo "      🚀 Spouštím Ollama na pozadí..."
    ollama serve > /data/data/com.termux/files/home/ollama.log 2>&1 &
    sleep 5
else
    echo "      ✅ Ollama je připravena."
fi

# 2. Spuštění Vite frontendu na pozadí
echo "[2/3] ⚡ Spouštím Studio Notes Engine (Vite)..."
# Použijeme node přímo s cestou k vite.js pro maximální spolehlivost
node ./node_modules/vite/bin/vite.js --host --port 3000 > /data/data/com.termux/files/home/npm_out.log 2>&1 &
VITE_PID=$!

# Počkáme 12 sekund, start na mobilu může být pomalý
echo "      ⏳ Čekám na start serveru (12s)..."
sleep 12

# 3. Otevření prohlížeče
echo "[3/3] 🌍 Otevírám kreativní prostředí..."
if command -v termux-open-url > /dev/null; then
    termux-open-url http://localhost:3000
else
    echo "      💡 Otevřete http://localhost:3000 ručně v prohlížeči."
fi

echo "-------------------------------------------"
echo "🎨 Studio Notes běží na http://localhost:3000"
echo "🎹 Připraveno pro vaši tvorbu."
echo "Pro ukončení stiskněte Ctrl+C"
echo "-------------------------------------------"

# Udržujeme skript běžící
wait $VITE_PID
