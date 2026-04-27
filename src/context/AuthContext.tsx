"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { UserPayload } from "@/types/auth";

interface AuthContextType {
    user: UserPayload | null;
    loading: boolean;
    setUser: (user: UserPayload | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserPayload | null>(null);
    const [loading, setLoading] = useState(true);

    // Al cargar la app, verificar sesión activa
    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        try {
            // 1. Intentar obtener usuario con el access token actual
            let res = await fetch("/api/auth/me");

            // 2. Si el access token expiró (401), intentar renovarlo
            if (res.status === 401) {
                const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });

                if (refreshRes.ok) {
                    // Refresh exitoso — reintentar con el nuevo access token
                    res = await fetch("/api/auth/me");
                } else {
                    // Refresh también falló — sesión expirada, no hay usuario
                    setLoading(false);
                    return;
                }
            }

            const data = await res.json();
            if (data.success) setUser(data.data);
        } catch {
            // Error de red u otro — no hay sesión
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}