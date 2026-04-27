// Tipos para el panel de monitoreo SSE

export type SSEEventType =
    | "connected"
    | "cart:item_added"
    | "cart:item_removed"
    | "cart:abandoned"
    | "cart:checkout";

export interface SSEEvent {
    type: SSEEventType;
    payload: Record<string, unknown>;
    timestamp: string;
}

export interface MonitorSnapshot {
    activeCartsCount: number;
    activeCarts: {
        userId: string;
        userName: string;
        itemCount: number;
        updatedAt: string;
    }[];
}