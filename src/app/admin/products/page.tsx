"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/utils/formatters";

// Formulario vacío por defecto
const emptyForm = {
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: "",
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null); // null = creando
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Cargar todos los productos (incluso inactivos)
    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const res = await fetch("/api/products/admin");
        const data = await res.json();
        if (data.success) setProducts(data.data);
        setLoading(false);
    }

    // Abrir modal para crear
    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setModalOpen(true);
    }

    // Abrir modal para editar
    function openEdit(product: Product) {
        setEditing(product);
        setForm({
            name: product.name,
            description: product.description ?? "",
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl ?? "",
        });
        setError("");
        setModalOpen(true);
    }

    // Guardar (crear o editar)
    async function handleSave() {
        setSaving(true);
        setError("");

        try {
            const url = editing
                ? `/api/products/${editing.id}`
                : "/api/products/admin";

            const method = editing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    stock: Number(form.stock),
                }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error);
                return;
            }

            setModalOpen(false);
            fetchProducts(); // recargar lista
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    // Eliminar o desactivar producto
    async function handleDelete(product: Product) {
        if (!confirm(`¿Eliminar "${product.name}"?`)) return;

        const res = await fetch(`/api/products/${product.id}`, {
            method: "DELETE",
        });

        const data = await res.json();
        if (data.success) fetchProducts();
        else alert(data.error);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-6xl mx-auto p-6">

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Gestión de Productos</h1>
                    <Button onClick={openCreate}>+ Nuevo Producto</Button>
                </div>

                {loading && <p className="text-gray-500">Cargando...</p>}

                {!loading && products.length === 0 && (
                    <Card>
                        <p className="text-center text-gray-500 py-8">No hay productos.</p>
                    </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <Card key={product.id} className={!product.isActive ? "opacity-50" : ""}>
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="font-semibold">{product.name}</h2>
                                <Badge variant={product.isActive ? "green" : "gray"}>
                                    {product.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                            </div>

                            {product.description && (
                                <p className="text-gray-500 text-sm mb-2">{product.description}</p>
                            )}

                            <div className="flex justify-between text-sm mb-4">
                <span className="font-bold text-blue-600">
                  {formatCurrency(product.price)}
                </span>
                                <span className="text-gray-400">Stock: {product.stock}</span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => openEdit(product)}
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    className="flex-1"
                                    onClick={() => handleDelete(product)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Modal crear/editar */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? "Editar Producto" : "Nuevo Producto"}
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio
                            </label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock
                            </label>
                            <input
                                type="number"
                                value={form.stock}
                                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL de imagen (opcional)
                        </label>
                        <input
                            type="text"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1"
                            loading={saving}
                            onClick={handleSave}
                        >
                            {editing ? "Guardar Cambios" : "Crear Producto"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}