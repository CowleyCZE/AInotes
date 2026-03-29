import { useState, useEffect } from 'react';

export function useStatus() {
    const [ollamaStatus, setOllamaStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    useEffect(() => {
        const checkOllama = async () => {
            try {
                const res = await fetch('http://localhost:11434/api/tags');
                setOllamaStatus(res.ok ? 'online' : 'offline');
            } catch (_e) {
                setOllamaStatus('offline');
            }
        };
        checkOllama();
    }, []);

    return { ollamaStatus };
}
