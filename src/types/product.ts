// Tipos relacionados con productos

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    imageUrl?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Body para crear un producto
export interface CreateProductBody {
    name: string;
    description?: string;
    price: number;
    stock: number;
    imageUrl?: string;
}

// Body para editar (todos opcionales)
export interface UpdateProductBody {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
    isActive?: boolean;
}