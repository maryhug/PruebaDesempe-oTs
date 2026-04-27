"use client";

import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const { cart, loading, removeItem, checkout } = useCart();
    const [checkingOut, setCheckingOut] = useState(false);
    const router = useRouter();

    // Calcular total
    const total = cart?.items.reduce(
        (acc, item) => acc + item.unitPrice * item.quantity, 0
    ) ?? 0;

    async function handleCheckout() {
        setCheckingOut(true);
        try {
            await checkout();
            alert("¡Orden confirmada! 🎉");
            router.push("/orders");
        } catch (err: unknown) {
            console.error("Error checkout:", err);
            alert(err instanceof Error ? err.message : "Error al confirmar");
        } finally {
            setCheckingOut(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Mi Carrito</h1>

                {loading && <p className="text-gray-500">Cargando carrito...</p>}

                {!loading && (!cart || cart.items.length === 0) && (
                    <Card>
                        <p className="text-center text-gray-500 py-8">
                            Tu carrito está vacío 🛒
                        </p>
                        <Button
                            variant="secondary"
                            className="w-full mt-2"
                            onClick={() => router.push("/catalog")}
                        >
                            Ver catálogo
                        </Button>
                    </Card>
                )}

                {cart && cart.items.length > 0 && (
                    <div className="space-y-4">
                        {/* Lista de items */}
                        {cart.items.map((item) => (
                            <Card key={item.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{item.product.name}</p>
                                    <p className="text-gray-500 text-sm">
                                        {formatCurrency(item.unitPrice)} × {item.quantity}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-600">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                                    <Button
                                        variant="danger"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {/* Resumen y checkout */}
                        <Card className="bg-blue-50 border-blue-200">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-semibold">Total</span>
                                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(total)}
                </span>
                            </div>
                            <Button
                                className="w-full"
                                loading={checkingOut}
                                onClick={handleCheckout}
                            >
                                Confirmar Orden
                            </Button>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}