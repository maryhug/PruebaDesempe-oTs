"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types/order";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/orders")
            .then((res) => res.json())
            .then((data) => { if (data.success) setOrders(data.data); })
            .finally(() => setLoading(false));
    }, []);

    // Color del badge según estado
    function statusColor(status: string) {
        if (status === "CONFIRMED") return "green";
        if (status === "CANCELLED") return "red";
        return "yellow";
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Mis Órdenes</h1>

                {loading && <p className="text-gray-500">Cargando órdenes...</p>}

                {!loading && orders.length === 0 && (
                    <Card>
                        <p className="text-center text-gray-500 py-8">No tienes órdenes aún.</p>
                    </Card>
                )}

                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-sm text-gray-400">
                                        Orden #{order.id.slice(0, 8)}
                                    </p>
                                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                </div>
                                <Badge variant={statusColor(order.status) as "green" | "red" | "yellow"}>
                                    {order.status}
                                </Badge>
                            </div>

                            {/* Items de la orden */}
                            <div className="space-y-1 mb-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.product.name} × {item.quantity}</span>
                                        <span className="text-gray-500">{formatCurrency(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-3 flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}