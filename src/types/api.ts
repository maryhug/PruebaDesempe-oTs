// Tipo genérico para todas las respuestas de la API
// Así siempre tienen el mismo formato

export interface ApiResponse<T = null> {
    success: boolean;
    data?: T;
    error?: string;
}