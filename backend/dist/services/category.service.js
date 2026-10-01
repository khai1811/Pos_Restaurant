"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const prisma_1 = require("../config/prisma");
const category_entity_1 = require("../entity/category.entity");
class CategoryService {
    async getAll() {
        const categories = await prisma_1.prisma.category.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return categories.map((cat) => new category_entity_1.CategoryEntity(cat));
    }
    async getById(id) {
        const category = await prisma_1.prisma.category.findUnique({
            where: { id },
        });
        if (!category)
            return null;
        return new category_entity_1.CategoryEntity(category);
    }
    async create(data) {
        const existing = await prisma_1.prisma.category.findUnique({
            where: { name: data.name },
        });
        if (existing) {
            throw new Error('Tên danh mục đã tồn tại');
        }
        // Bỏ isAvailable, chỉ truyền name và description
        const category = await prisma_1.prisma.category.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });
        return new category_entity_1.CategoryEntity(category);
    }
    async update(id, data) {
        const category = await prisma_1.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new Error('Không tìm thấy danh mục');
        }
        if (data.name && data.name !== category.name) {
            const existing = await prisma_1.prisma.category.findUnique({
                where: { name: data.name },
            });
            if (existing) {
                throw new Error('Tên danh mục mới đã tồn tại');
            }
        }
        // Lọc bỏ isAvailable nếu nó vô tình bị kẹt trong UpdateCategoryDto
        const updatePayload = {};
        if (data.name !== undefined)
            updatePayload.name = data.name;
        if (data.description !== undefined)
            updatePayload.description = data.description;
        const updated = await prisma_1.prisma.category.update({
            where: { id },
            data: updatePayload,
        });
        return new category_entity_1.CategoryEntity(updated);
    }
    async delete(id) {
        const category = await prisma_1.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new Error('Không tìm thấy danh mục');
        }
        await prisma_1.prisma.category.delete({ where: { id } });
        return true;
    }
}
exports.CategoryService = CategoryService;
