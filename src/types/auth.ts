// Tipos relacionados con autenticación y usuarios

export type UserRole = "ADMIN" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "INACTIVE";

// Lo que devolvemos al cliente sobre un usuario (sin passwordHash)
export interface UserPayload {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

// Lo que guardamos dentro del JWT
export interface JwtPayload {
    userId: string;
    role: UserRole;
}

// Body del login
export interface LoginBody {
    email: string;
    password: string;
}

// Body del registro
export interface RegisterBody {
    name: string;
    email: string;
    password: string;
}