import { UserRole } from '@prisma/client';

export interface LoginDto {
    username: string;
    password: string;
}

export interface RegisterDto {
    username: string;
    email?: string;
    password: string;
    fullName: string;
    role?: UserRole;
}

export interface AuthResponseDto {
    token: string;
    user: {
        id: string;
        username: string;
        email: string | null;
        fullName: string;
        role: UserRole;
    };
}

export interface JwtPayload {
    id: string;
    username: string;
    role: UserRole;
}
export interface PinLoginDto {
    userId: string;
    pin: string;
}