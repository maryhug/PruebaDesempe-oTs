import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";

// Respuesta exitosa
export function successResponse<T>(data: T, status = 200) {
    const body: ApiResponse<T> = { success: true, data };
    return NextResponse.json(body, { status });
}

// Respuesta de error
export function errorResponse(error: string, status = 400) {
    const body: ApiResponse = { success: false, error };
    return NextResponse.json(body, { status });
}