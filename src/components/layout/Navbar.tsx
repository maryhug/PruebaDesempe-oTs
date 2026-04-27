"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function Navbar() {
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const router = useRouter();

    async function handleLogout() {
        await logout();
        router.push("/login");
    }

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold text-blue-600">
                    CartHub
                </Link>

                {/* Links según rol */}
                <div className="flex items-center gap-4">
                    {user?.role === "CUSTOMER" && (
                        <>
                            <Link href="/catalog" className="text-gray-600 hover:text-gray-900">
                                Catálogo
                            </Link>
                            <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
                                🛒 Carrito
                                {/* Badge con cantidad de items */}
                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                                )}
                            </Link>
                            <Link href="/orders" className="text-gray-600 hover:text-gray-900">
                                Mis Órdenes
                            </Link>
                        </>
                    )}

                    {user?.role === "ADMIN" && (
                        <>
                            <Link href="/admin/products" className="text-gray-600 hover:text-gray-900">
                                Productos
                            </Link>
                            <Link href="/monitor" className="text-gray-600 hover:text-gray-900">
                                Monitor
                            </Link>
                        </>
                    )}

                    {user && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{user.name}</span>
                            <Button variant="secondary" onClick={handleLogout}>
                                Salir
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}