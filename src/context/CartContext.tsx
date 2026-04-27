"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Cart } from "@/types/cart";
import { useAuth } from "@/context/AuthContext";

interface CartContextType {
    cart: Cart | null;
    loading: boolean;
    fetchCart: () => Promise<void>;
    addItem: (productId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    checkout: () => Promise<void>;
    itemCount: number; // total de items para el badge del navbar
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(false);

    // Solo cargar carrito si es CUSTOMER
    useEffect(() => {
        if (user?.role === "CUSTOMER") fetchCart();
    }, [user]);

    async function fetchCart() {
        setLoading(true);
        try {
            const res = await fetch("/api/cart");
            const data = await res.json();
            if (data.success) setCart(data.data);
        } finally {
            setLoading(false);
        }
    }

    async function addItem(productId: string, quantity: number) {
        const res = await fetch("/api/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
        });
        const data = await res.json();
        if (data.success) setCart(data.data);
        else throw new Error(data.error);
    }

    async function removeItem(itemId: string) {
        const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) fetchCart();
        else throw new Error(data.error);
    }

    async function checkout() {
        const res = await fetch("/api/cart/checkout", { method: "POST" });
        const data = await res.json();
        if (data.success) setCart(null);
        else throw new Error(data.error);
    }

    // Contar total de items para el badge
    const itemCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

    return (
        <CartContext.Provider value={{ cart, loading, fetchCart, addItem, removeItem, checkout, itemCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
    return ctx;
}