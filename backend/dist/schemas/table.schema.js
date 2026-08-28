"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTableSchema = exports.createTableSchema = void 0;
const zod_1 = require("zod");
/**
 * =====================================================
 * CREATE TABLE
 * =====================================================
 */
exports.createTableSchema = zod_1.z.object({
    body: zod_1.z.object({
        /**
         * Số bàn phải là số nguyên.
         */
        tableNumber: zod_1.z.number()
            .int()
            .positive("Số bàn phải lớn hơn 0"),
        /**
         * Sức chứa tối thiểu 1 người.
         */
        capacity: zod_1.z.number()
            .int()
            .positive("Sức chứa phải lớn hơn 0"),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * UPDATE TABLE
 * =====================================================
 */
exports.updateTableSchema = zod_1.z.object({
    body: zod_1.z.object({
        tableNumber: zod_1.z.number()
            .int()
            .positive()
            .optional(),
        capacity: zod_1.z.number()
            .int()
            .positive()
            .optional(),
        /**
         * Trạng thái bàn.
         */
        status: zod_1.z.enum([
            "AVAILABLE",
            "OCCUPIED",
            "RESERVED",
            "CLEANING",
        ])
            .optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string()
            .uuid("ID bàn không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
