"use client";

import { useEffect, useRef, useState } from "react";
import { SSEEvent } from "@/types/monitor";

export function useMonitor() {
    const [events, setEvents] = useState<SSEEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const sourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        console.log("useMonitor: conectando SSE..."); // ← log
        const source = new EventSource("/api/monitor/stream");
        sourceRef.current = source;

        source.onopen = () => {
            console.log("useMonitor: conexión abierta"); // ← log
            setConnected(true);
        };

        source.onmessage = (e) => {
            console.log("useMonitor: mensaje recibido", e.data); // ← log
            const event: SSEEvent = JSON.parse(e.data);
            if (event.type === "connected") return;
            setEvents((prev) => [event, ...prev].slice(0, 50));
        };

        source.onerror = (e) => {
            console.log("useMonitor: error", e); // ← log
            setConnected(false);
        };

        return () => {
            console.log("useMonitor: cerrando conexión"); // ← log
            source.close();
            setConnected(false);
        };
    }, []);

    function dismissEvent(index: number) {
        setEvents((prev) => prev.filter((_, i) => i !== index));
    }

    return { events, connected, dismissEvent };
}