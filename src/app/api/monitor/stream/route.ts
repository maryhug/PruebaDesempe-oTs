import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { addClient, removeClient } from "@/lib/sse-store";
import { SSEEvent } from "@/types/monitor";

// GET /api/monitor/stream — conexión SSE para admins
// El navegador se conecta aquí y recibe eventos en tiempo real
export async function GET(req: NextRequest) {
    // Solo admins pueden conectarse
    const user = requireAdmin(req);
    if (!user) {
        return new Response("Acceso denegado", { status: 403 });
    }

    // Crear un stream de lectura que mantiene la conexión abierta
    const stream = new ReadableStream({
        start(controller) {
            // Función que envía un evento al cliente
            const sendEvent = (event: SSEEvent) => {
                // Formato SSE: "data: {...}\n\n"
                const data = `data: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
            };

            // Registrar este cliente en el store global
            addClient(sendEvent);

            // Enviar un ping inicial para confirmar conexión
            const ping = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`;
            controller.enqueue(new TextEncoder().encode(ping));

            // Cuando el cliente se desconecta, removerlo del store
            req.signal.addEventListener("abort", () => {
                removeClient(sendEvent);
            });
        },
    });

    // Responder con headers SSE obligatorios
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}