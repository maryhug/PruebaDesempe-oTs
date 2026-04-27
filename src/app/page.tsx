"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (user.role === "ADMIN") router.push("/monitor");
    else router.push("/catalog");
  }, [user, loading]);

  return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Redirigiendo...</p>
      </div>
  );
}