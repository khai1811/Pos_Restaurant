"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemService = void 0;
const menu_item_entity_1 = require("../entity/menu-item.entity");
const prisma_1 = require("../config/prisma");
class MenuItemService {
    async getAll(categoryId) {
        const whereCondition = categoryId ? { categoryId } : {};
        const items = await prisma_1.prisma.menuItem.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                // 🔥 NẾU TỐC ĐỘ VẪN CHẬM, HÃY THÊM DẤU // VÀO TRƯỚC DÒNG BÊN DƯỚI ĐỂ TẮT TẢI ẢNH (Base64)
                imageUrl: true,
                isAvailable: true,
                popular: true,
                categoryId: true,
                createdAt: true,
                category: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((item) => new menu_item_entity_1.MenuItemEntity({
            ...item,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            popular: item.popular,
            categoryName: item.category?.name,
        }));
    }
    async getById(id) {
        const item = await prisma_1.prisma.menuItem.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                isAvailable: true,
                popular: true,
                categoryId: true,
                createdAt: true,
                category: {
                    select: { name: true },
                },
            },
        });
        if (!item)
            return null;
        return new menu_item_entity_1.MenuItemEntity({
            ...item,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            popular: item.popular,
            categoryName: item.category?.name,
        });
    }
    async create(data) {
        const category = await prisma_1.prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) {
            throw new Error('Danh mục không tồn tại');
        }
        const imageValue = data.imageUrl || data.image || null;
        const item = await prisma_1.prisma.menuItem.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                imageUrl: imageValue,
                isAvailable: data.isAvailable ?? true,
                popular: data.popular ?? false,
                categoryId: data.categoryId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                isAvailable: true,
                popular: true,
                categoryId: true,
                createdAt: true,
                category: {
                    select: { name: true },
                },
            },
        });
        return new menu_item_entity_1.MenuItemEntity({
            ...item,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            popular: item.popular,
            categoryName: item.category?.name,
        });
    }
    async update(id, data) {
        const item = await prisma_1.prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            throw new Error('Không tìm thấy món ăn');
        }
        if (data.categoryId) {
            const category = await prisma_1.prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new Error('Danh mục không tồn tại');
            }
        }
        const imageValue = data.imageUrl !== undefined
            ? data.imageUrl
            : (data.image !== undefined ? data.image : undefined);
        const updateData = {
            name: data.name,
            description: data.description,
            price: data.price,
            isAvailable: data.isAvailable,
            popular: data.popular,
            categoryId: data.categoryId,
        };
        if (imageValue !== undefined) {
            updateData.imageUrl = imageValue || null;
        }
        const updated = await prisma_1.prisma.menuItem.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                isAvailable: true,
                popular: true,
                categoryId: true,
                createdAt: true,
                category: {
                    select: { name: true },
                },
            },
        });
        return new menu_item_entity_1.MenuItemEntity({
            ...updated,
            price: Number(updated.price),
            imageUrl: updated.imageUrl,
            popular: updated.popular,
            categoryName: updated.category?.name,
        });
    }
    async delete(id) {
        const item = await prisma_1.prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            throw new Error('Không tìm thấy món ăn');
        }
        await prisma_1.prisma.menuItem.delete({ where: { id } });
        return true;
    }
}
exports.MenuItemService = MenuItemService;
