import { UserRole } from '@prisma/client';

export class UserEntity {
    id!: string;
    username!: string;
    email!: string | null;
    fullName!: string;
    role!: UserRole;
    isActive!: boolean;
    phone!: string | null;
    pin!: string | null;
    avatar!: string | null;
    permissions!: any | null;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }
}