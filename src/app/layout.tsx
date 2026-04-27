import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CartHub",
    description: "Plataforma de e-commerce",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
        <body className={geist.className}>
        {/* AuthProvider va primero porque CartProvider depende de useAuth */}
        <AuthProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </AuthProvider>
        </body>
        </html>
    );
}