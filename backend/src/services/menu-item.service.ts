import { CreateMenuItemDto, UpdateMenuItemDto } from '../dtos/menu-item.dto';
import { MenuItemEntity } from '../entity/menu-item.entity';
import { prisma } from '../config/prisma';

export class MenuItemService {
    async getAll(categoryId?: string): Promise<MenuItemEntity[]> {
        const whereCondition = categoryId ? { categoryId } : {};

        const items = await prisma.menuItem.findMany({
            where: whereCondition,
            include: {
                category: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return items.map(
            (item) =>
                new MenuItemEntity({
                    ...item,
                    price: Number(item.price),
                    imageUrl: item.imageUrl,
                    categoryName: item.category?.name,
                })
        );
    }

    async getById(id: string): Promise<MenuItemEntity | null> {
        const item = await prisma.menuItem.findUnique({
            where: { id },
            include: {
                category: {
                    select: { name: true },
                },
            },
        });

        if (!item) return null;

        return new MenuItemEntity({
            ...item,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            categoryName: item.category?.name,
        });
    }

    async create(data: CreateMenuItemDto): Promise<MenuItemEntity> {
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) {
            throw new Error('Danh mục không tồn tại');
        }

        // Hứng linh hoạt từ image hoặc imageUrl do DTO chuyển lên
        const imageValue = data.imageUrl || (data as any).image || null;

        const item = await prisma.menuItem.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                imageUrl: imageValue,
                isAvailable: data.isAvailable ?? true,
                categoryId: data.categoryId,
            },
            include: {
                category: {
                    select: { name: true },
                },
            },
        });

        return new MenuItemEntity({
            ...item,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            categoryName: item.category?.name,
        });
    }

    async update(id: string, data: UpdateMenuItemDto): Promise<MenuItemEntity> {
        const item = await prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            throw new Error('Không tìm thấy món ăn');
        }

        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new Error('Danh mục không tồn tại');
            }
        }

        // Hứng linh hoạt giá trị ảnh khi cập nhật
        const imageValue =
            data.imageUrl !== undefined
                ? data.imageUrl
                : ((data as any).image !== undefined ? (data as any).image : undefined);

        const updateData: any = {
            name: data.name,
            description: data.description,
            price: data.price,
            isAvailable: data.isAvailable,
            categoryId: data.categoryId,
        };

        if (imageValue !== undefined) {
            updateData.imageUrl = imageValue || null;
        }

        const updated = await prisma.menuItem.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: { name: true },
                },
            },
        });

        return new MenuItemEntity({
            ...updated,
            price: Number(updated.price),
            imageUrl: updated.imageUrl,
            categoryName: updated.category?.name,
        });
    }

    async delete(id: string): Promise<boolean> {
        const item = await prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            throw new Error('Không tìm thấy món ăn');
        }

        await prisma.menuItem.delete({ where: { id } });
        return true;
    }
}