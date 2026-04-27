// Tipos relacionados con órdenes

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: {
        id: string;
        name: string;
    };
}

export interface Order {
    id: string;
    userId: string;
    cartId: string;
    status: OrderStatus;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
    user: User; 
}