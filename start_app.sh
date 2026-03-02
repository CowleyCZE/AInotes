#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="/data/data/com.termux/files/home/projects/AInotes"
cd "$PROJECT_DIR"

# Funkce pro úklid při ukončení
cleanup() {
    echo ""
    echo "Ukončuji aplikaci..."
    # Zde můžeme přidat specifické ukončení procesů pokud je to nutné
    exit
}

trap cleanup SIGINT SIGTERM

echo "--- Chytrý Zápisník AI (Termux Edition) ---"

# 1. Kontrola a spuštění Ollama
echo "[1/3] Kontrola Ollama..."
if ! pgrep ollama > /dev/null; then
    echo "      Spouštím Ollama na pozadí..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
else
    echo "      Ollama již běží."
fi

# 2. Spuštění Vite frontendu na pozadí
echo "[2/3] Spouštím frontend (Vite)..."
# Použijeme port 3000, který je v vite.config.ts
npm run dev -- --host > /dev/null 2>&1 &
VITE_PID=$!

# Počkáme chvíli na nastartování serveru
sleep 5

# 3. Otevření prohlížeče
echo "[3/3] Otevírám prohlížeč..."
if command -v termux-open-url > /dev/null; then
    termux-open-url http://localhost:3000
else
    echo "      Varování: termux-open-url nenalezen. Otevřete http://localhost:3000 ručně."
fi

echo "-------------------------------------------"
echo "Aplikace běží na http://localhost:3000"
echo "Pro ukončení stiskněte Ctrl+C"
echo "-------------------------------------------"

# Udržujeme skript běžící dokud běží Vite
wait $VITE_PID
