import { SSEEvent } from "@/types/monitor";

const clients = new Set<(event: SSEEvent) => void>();

export function addClient(fn: (event: SSEEvent) => void) {
    clients.add(fn);
    console.log(`[SSE] Administrador entro a /monitor. Total: ${clients.size}`); // ← log
}

export function removeClient(fn: (event: SSEEvent) => void) {
    clients.delete(fn);
    console.log(`[SSE] Administrador salio de /monitor. Total: ${clients.size}`); // ← log
}

export function broadcastEvent(event: SSEEvent) {
    console.log(`[SSE] Broadcasting a ${clients.size} clientes:`, event.type); // ← log
    clients.forEach((fn) => fn(event));
}