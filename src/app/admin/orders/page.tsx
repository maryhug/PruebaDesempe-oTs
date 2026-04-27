"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types/order";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success) setOrders(data.data);
        setLoading(false);
    }

    async function handleStatusChange(orderId: string, status: string) {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) fetchOrders();
            else alert(data.error);
        } finally {
            setUpdating(null);
        }
    }

    function statusColor(status: string) {
        if (status === "CONFIRMED") return "green";
        if (status === "CANCELLED") return "red";
        return "yellow";
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Gestión de Órdenes</h1>

                {loading && <p className="text-gray-500">Cargando órdenes...</p>}

                {!loading && orders.length === 0 && (
                    <Card>
                        <p className="text-center text-gray-500 py-8">No hay órdenes.</p>
                    </Card>
                )}

                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            {/* Header de la orden */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-sm text-gray-400">
                                        Orden #{order.id.slice(0, 8)}
                                    </p>
                                    <p className="font-semibold">{order.user.name}</p>
                                    <p className="text-sm text-gray-500">{order.user.email}</p>
                                    <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                                </div>
                                <Badge variant={statusColor(order.status) as "green" | "red" | "yellow"}>
                                    {order.status}
                                </Badge>
                            </div>

                            {/* Items */}
                            <div className="space-y-1 mb-3 border-t pt-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.product.name} × {item.quantity}</span>
                                        <span className="text-gray-500">{formatCurrency(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total y acciones */}
                            <div className="flex justify-between items-center border-t pt-3">
                <span className="font-bold text-blue-600">
                  Total: {formatCurrency(order.totalAmount)}
                </span>

                                {/* Botones de cambio de estado */}
                                <div className="flex gap-2">
                                    {order.status === "PENDING" && (
                                        <>
                                            <Button
                                                variant="primary"
                                                loading={updating === order.id}
                                                onClick={() => handleStatusChange(order.id, "CONFIRMED")}
                                            >
                                                Confirmar
                                            </Button>
                                            <Button
                                                variant="danger"
                                                loading={updating === order.id}
                                                onClick={() => handleStatusChange(order.id, "CANCELLED")}
                                            >
                                                Cancelar
                                            </Button>
                                        </>
                                    )}
                                    {order.status === "CONFIRMED" && (
                                        <Button
                                            variant="danger"
                                            loading={updating === order.id}
                                            onClick={() => handleStatusChange(order.id, "CANCELLED")}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                    {order.status === "CANCELLED" && (
                                        <span className="text-sm text-gray-400">Orden cancelada</span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}