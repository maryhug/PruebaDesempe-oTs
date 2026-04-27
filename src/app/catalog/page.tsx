"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";

export default function CatalogPage() {
    const { user } = useAuth();
    const { addItem } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState<string | null>(null); // id del producto que se está agregando

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setProducts(data.data);
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleAddToCart(productId: string) {
        setAdding(productId);
        try {
            await addItem(productId, 1);
            alert("Producto agregado al carrito ✓");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Error al agregar");
        } finally {
            setAdding(null);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-6xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>

                {loading && (
                    <p className="text-gray-500">Cargando productos...</p>
                )}

                {!loading && products.length === 0 && (
                    <p className="text-gray-500">No hay productos disponibles.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <Card key={product.id}>
                            {/* Imagen o placeholder */}
                            <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-4">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="h-full object-contain rounded-lg" />
                                ) : (
                                    <span className="text-4xl">📦</span>
                                )}
                            </div>

                            <h2 className="font-semibold text-lg">{product.name}</h2>
                            {product.description && (
                                <p className="text-gray-500 text-sm mt-1">{product.description}</p>
                            )}

                            <div className="flex items-center justify-between mt-4">
                <span className="text-blue-600 font-bold text-lg">
                  {formatCurrency(product.price)}
                </span>
                                <span className="text-gray-400 text-sm">Stock: {product.stock}</span>
                            </div>

                            {/* Solo customers pueden agregar al carrito */}
                            {user?.role === "CUSTOMER" && (
                                <Button
                                    className="w-full mt-4"
                                    loading={adding === product.id}
                                    onClick={() => handleAddToCart(product.id)}
                                >
                                    Agregar al carrito
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}