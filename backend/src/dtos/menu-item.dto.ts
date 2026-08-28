export interface CreateMenuItemDto {
    name: string;
    description?: string;
    price: number;
    image?: string;
    imageUrl?: string;
    isAvailable?: boolean;
    categoryId: string;
}

export interface UpdateMenuItemDto {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    imageUrl?: string;
    isAvailable?: boolean;
    categoryId?: string;
}

export interface MenuItemResponseDto {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    categoryId: string;
    categoryName?: string;
    createdAt: Date;
    updatedAt: Date;
}