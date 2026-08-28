"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMenuItemSchema = exports.createMenuItemSchema = void 0;
const zod_1 = require("zod");
/**
 * =====================================================
 * CREATE MENU ITEM
 * =====================================================
 */
exports.createMenuItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .trim()
            .min(1, "Tên món không được để trống")
            .max(150),
        description: zod_1.z
            .string()
            .trim()
            .max(500)
            .optional(),
        /**
         * Giá món phải > 0.
         */
        price: zod_1.z
            .number()
            .positive("Giá món phải lớn hơn 0"),
        image: zod_1.z
            .string()
            .url("URL hình ảnh không hợp lệ")
            .optional(),
        isAvailable: zod_1.z.boolean()
            .optional(),
        /**
         * Category bắt buộc.
         */
        categoryId: zod_1.z.string().uuid("categoryId không hợp lệ"),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * UPDATE MENU ITEM
 * =====================================================
 */
exports.updateMenuItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string()
            .trim()
            .min(1)
            .max(150)
            .optional(),
        description: zod_1.z.string()
            .trim()
            .max(500)
            .optional(),
        price: zod_1.z.number()
            .positive()
            .optional(),
        image: zod_1.z.string()
            .url()
            .optional(),
        isAvailable: zod_1.z.boolean()
            .optional(),
        categoryId: zod_1.z.string()
            .uuid()
            .optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string()
            .uuid("ID món ăn không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
