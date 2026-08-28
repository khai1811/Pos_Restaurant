import { UserRole } from '@prisma/client';

export interface CreateUserDto {
    username: string;
    email?: string;
    password: string;
    fullName: string;
    role?: UserRole;
    isActive?: boolean;
    phone?: string;
    pin?: string;
    avatar?: string;
    permissions?: any;
}

export interface UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
    fullName?: string;
    role?: UserRole;
    isActive?: boolean;
    phone?: string;
    pin?: string;
    avatar?: string;
    permissions?: any;
}

export interface UserResponseDto {
    id: string;
    username: string;
    email: string | null;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    phone: string | null;
    pin: string | null;
    avatar: string | null;
    permissions: any | null;
    createdAt: Date;
    updatedAt: Date;
}