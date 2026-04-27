// Tipos relacionados con el carrito

export type CartStatus = "ACTIVE" | "ORDERED" | "ABANDONED";

export interface CartItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product: {
        id: string;
        name: string;
        imageUrl?: string | null;
    };
}

export interface Cart {
    id: string;
    userId: string;
    status: CartStatus;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}

// Body para agregar item al carrito
export interface AddCartItemBody {
    productId: string;
    quantity: number;
}

// Body para actualizar cantidad
export interface UpdateCartItemBody {
    quantity: number;
}