export class MenuItemEntity {
    id!: string;
    name!: string;
    description!: string | null;
    price!: number;
    imageUrl!: string | null; // 🌟 Dùng imageUrl[cite: 7]
    isAvailable!: boolean;
    popular?: boolean;
    categoryId!: string;
    categoryName?: string;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(partial: Partial<MenuItemEntity>) {
        Object.assign(this, partial);
    }
}