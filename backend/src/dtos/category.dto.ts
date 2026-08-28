export interface CreateCategoryDto {
    name: string;
    description?: string;
    isAvailable?: boolean;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    isAvailable?: boolean;
}

export interface CategoryResponseDto {
    id: string;
    name: string;
    description: string | null;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}