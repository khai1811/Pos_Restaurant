import { prisma } from '../config/prisma';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { CategoryEntity } from '../entity/category.entity';

export class CategoryService {
    async getAll(): Promise<CategoryEntity[]> {
        const categories = await prisma.category.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return categories.map((cat) => new CategoryEntity(cat));
    }

    async getById(id: string): Promise<CategoryEntity | null> {
        const category = await prisma.category.findUnique({
            where: { id },
        });
        if (!category) return null;
        return new CategoryEntity(category);
    }

    async create(data: CreateCategoryDto): Promise<CategoryEntity> {
        const existing = await prisma.category.findUnique({
            where: { name: data.name },
        });
        if (existing) {
            throw new Error('Tên danh mục đã tồn tại');
        }

        // Bỏ isAvailable, chỉ truyền name và description
        const category = await prisma.category.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });
        return new CategoryEntity(category);
    }

    async update(id: string, data: UpdateCategoryDto): Promise<CategoryEntity> {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new Error('Không tìm thấy danh mục');
        }

        if (data.name && data.name !== category.name) {
            const existing = await prisma.category.findUnique({
                where: { name: data.name },
            });
            if (existing) {
                throw new Error('Tên danh mục mới đã tồn tại');
            }
        }

        // Lọc bỏ isAvailable nếu nó vô tình bị kẹt trong UpdateCategoryDto
        const updatePayload: any = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.description !== undefined) updatePayload.description = data.description;

        const updated = await prisma.category.update({
            where: { id },
            data: updatePayload,
        });
        return new CategoryEntity(updated);
    }

    async delete(id: string): Promise<boolean> {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new Error('Không tìm thấy danh mục');
        }

        await prisma.category.delete({ where: { id } });
        return true;
    }
}