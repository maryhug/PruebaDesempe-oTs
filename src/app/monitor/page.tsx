"use client";

import { useEffect, useState, useCallback } from "react";
import { useMonitor } from "@/hooks/useMonitor";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCurrency } from "@/utils/formatters";

interface ActiveCart {
    cartId: string;
    userId: string;
    userName: string;
    userEmail: string;
    itemCount: number;
    items: string[];
    updatedAt: string;
}

interface Snapshot {
    activeCartsCount: number;
    ordersToday: number;
    totalUsers: number;
    activeCarts: ActiveCart[];
}

export default function MonitorPage() {
    const { events, connected, dismissEvent } = useMonitor();
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSnapshot = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch("/api/monitor/snapshot");
            const data = await res.json();
            if (data.success) setSnapshot(data.data);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Cargar datos iniciales
    useEffect(() => {
        fetchSnapshot();
    }, [fetchSnapshot]);

    // Refrescar snapshot cuando llega cualquier evento
    useEffect(() => {
        if (events.length > 0) fetchSnapshot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-6xl mx-auto p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Panel de Monitoreo</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant={connected ? "green" : "red"}>
                            {connected ? "🟢 Conectado" : "🔴 Desconectado"}
                        </Badge>
                        <Button
                            variant="secondary"
                            loading={refreshing}
                            onClick={fetchSnapshot}
                        >
                            🗘
                        </Button>
                    </div>
                </div>

                {/* Contadores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <Card className="text-center">
                        <p className="text-4xl font-bold text-blue-600">
                            {snapshot?.activeCartsCount ?? 0}
                        </p>
                        <p className="text-gray-500 mt-1">Carritos Activos</p>
                    </Card>
                    <Card className="text-center">
                        <p className="text-4xl font-bold text-green-600">
                            {snapshot?.ordersToday ?? 0}
                        </p>
                        <p className="text-gray-500 mt-1">Órdenes Hoy</p>
                    </Card>
                    <Card className="text-center">
                        <p className="text-4xl font-bold text-purple-600">
                            {snapshot?.totalUsers ?? 0}
                        </p>
                        <p className="text-gray-500 mt-1">Clientes Registrados</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Notificaciones en tiempo real */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">Notificaciones en Tiempo Real</h2>
                            {events.length > 0 && (
                                <Badge variant="blue">{events.length}</Badge>
                            )}
                        </div>

                        {events.length === 0 && (
                            <Card>
                                <p className="text-gray-400 text-center py-4">
                                    Esperando eventos...
                                </p>
                            </Card>
                        )}

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {events.map((event, i) => (
                                <Card key={i} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={event.type === "cart:checkout" ? "green" : "blue"}>
                                                    {event.type}
                                                </Badge>
                                                <span className="text-xs text-gray-400">
            {formatDate(event.timestamp)}
          </span>
                                            </div>

                                            {/* Nombre del usuario */}
                                            <p className="text-sm font-semibold text-gray-700">
                                                👤 {(event.payload as { userName?: string }).userName ?? "Usuario"}
                                                <span className="font-normal text-gray-400 ml-1">
            {(event.payload as { userEmail?: string }).userEmail}
          </span>
                                            </p>

                                            {/* Descripción del evento */}
                                            {event.type === "cart:checkout" && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Confirmó una orden — Total:{" "}
                                                    {formatCurrency((event.payload as { totalAmount: number }).totalAmount)}
                                                </p>
                                            )}
                                            {event.type === "cart:item_added" && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Agregó <strong>{(event.payload as { productName?: string }).productName}</strong> al carrito
                                                    (x{(event.payload as { quantity?: number }).quantity})
                                                </p>
                                            )}
                                            {event.type === "cart:item_removed" && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Eliminó un item del carrito
                                                </p>
                                            )}
                                            {event.type === "cart:abandoned" && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Abandonó su carrito
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => dismissEvent(i)}
                                            className="text-gray-400 hover:text-gray-600 ml-2 text-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Carritos activos */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Carritos Activos</h2>

                        {snapshot?.activeCarts.length === 0 && (
                            <Card>
                                <p className="text-gray-400 text-center py-4">
                                    No hay carritos activos.
                                </p>
                            </Card>
                        )}

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {snapshot?.activeCarts.map((cart) => (
                                <Card key={cart.cartId} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{cart.userName}</p>
                                            <p className="text-sm text-gray-500">{cart.userEmail}</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {cart.itemCount} item(s):{" "}
                                                {cart.items.length > 0 ? cart.items.join(", ") : "sin items"}
                                            </p>
                                        </div>
                                        <Badge variant={cart.itemCount > 0 ? "blue" : "gray"}>
                                            {cart.itemCount} items
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Última actividad: {formatDate(cart.updatedAt)}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}