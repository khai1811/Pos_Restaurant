export class CategoryEntity {
    id!: string;
    name!: string;
    description!: string | null;
    isAvailable!: boolean;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(partial: Partial<CategoryEntity>) {
        Object.assign(this, partial);
    }
}