"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
/**
 * =====================================================
 * CREATE CATEGORY
 * =====================================================
 */
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        /**
         * Tên category bắt buộc.
         */
        name: zod_1.z
            .string()
            .trim()
            .min(1, "Tên danh mục không được để trống")
            .max(100, "Tên danh mục tối đa 100 ký tự"),
        /**
         * Description không bắt buộc.
         */
        description: zod_1.z
            .string()
            .trim()
            .max(500, "Mô tả tối đa 500 ký tự")
            .optional(),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * UPDATE CATEGORY
 * =====================================================
 *
 * Partial nghĩa là tất cả field đều không bắt buộc.
 */
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .trim()
            .min(1, "Tên danh mục không được để trống")
            .max(100)
            .optional(),
        description: zod_1.z
            .string()
            .trim()
            .max(500)
            .optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z
            .string()
            .uuid("ID danh mục không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
