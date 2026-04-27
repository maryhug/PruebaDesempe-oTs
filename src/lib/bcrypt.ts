import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // entre más alto, más seguro pero más lento

// Convierte la contraseña en texto plano a un hash seguro
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Compara la contraseña ingresada con el hash guardado en BD
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}