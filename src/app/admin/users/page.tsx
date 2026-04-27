"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatters";

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    _count: { orders: number };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) setUsers(data.data);
        setLoading(false);
    }

    // Cambiar rol del usuario
    async function handleRoleChange(userId: string, role: "ADMIN" | "CUSTOMER") {
        setUpdating(userId);
        try {
            const res = await fetch(`/api/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            const data = await res.json();
            if (data.success) fetchUsers();
            else alert(data.error);
        } finally {
            setUpdating(null);
        }
    }

    // Cambiar estado del usuario (activar/desactivar)
    async function handleStatusChange(userId: string, status: "ACTIVE" | "INACTIVE") {
        setUpdating(userId);
        try {
            const res = await fetch(`/api/users/${userId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) fetchUsers();
            else alert(data.error);
        } finally {
            setUpdating(null);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-5xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>

                {loading && <p className="text-gray-500">Cargando usuarios...</p>}

                {!loading && users.length === 0 && (
                    <Card>
                        <p className="text-center text-gray-500 py-8">No hay usuarios.</p>
                    </Card>
                )}

                <div className="space-y-3">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                {/* Info del usuario */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold">{user.name}</p>
                                        <Badge variant={user.role === "ADMIN" ? "blue" : "gray"}>
                                            {user.role}
                                        </Badge>
                                        <Badge variant={user.status === "ACTIVE" ? "green" : "red"}>
                                            {user.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Registrado: {formatDate(user.createdAt)} — {user._count.orders} órdenes
                                    </p>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Cambiar rol */}
                                    {user.role === "CUSTOMER" ? (
                                        <Button
                                            variant="secondary"
                                            loading={updating === user.id}
                                            onClick={() => handleRoleChange(user.id, "ADMIN")}
                                        >
                                            Hacer Admin
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            loading={updating === user.id}
                                            onClick={() => handleRoleChange(user.id, "CUSTOMER")}
                                        >
                                            Hacer Customer
                                        </Button>
                                    )}

                                    {/* Activar / Desactivar */}
                                    {user.status === "ACTIVE" ? (
                                        <Button
                                            variant="danger"
                                            loading={updating === user.id}
                                            onClick={() => handleStatusChange(user.id, "INACTIVE")}
                                        >
                                            Desactivar
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            loading={updating === user.id}
                                            onClick={() => handleStatusChange(user.id, "ACTIVE")}
                                        >
                                            Activar
                                        </Button>
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