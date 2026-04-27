"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { UserPayload } from "@/types/auth";

interface AuthContextType {
    user: UserPayload | null;        // usuario autenticado o null
    loading: boolean;                // está cargando?
    setUser: (user: UserPayload | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserPayload | null>(null);
    const [loading, setLoading] = useState(true);

    // Al cargar la app, verificar si hay sesión activa
    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setUser(data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

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

// Hook para usar el contexto fácilmente
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}