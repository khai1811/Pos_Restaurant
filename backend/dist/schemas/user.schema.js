"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserStatusSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
/**
 * =====================================================
 * CREATE USER
 * =====================================================
 */
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string()
            .trim()
            .min(2, "Họ tên tối thiểu 2 ký tự")
            .max(100),
        username: zod_1.z.string()
            .trim()
            .min(3, "Username tối thiểu 3 ký tự")
            .max(50)
            .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ được chứa chữ, số và _"),
        email: zod_1.z.string()
            .email("Email không hợp lệ")
            .optional(),
        password: zod_1.z.string()
            .min(6, "Password tối thiểu 6 ký tự"),
        phone: zod_1.z.string()
            .trim()
            .max(20)
            .optional(),
        role: zod_1.z.enum([
            "ADMIN",
            "CASHIER",
            "STAFF",
        ])
            .optional(),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * UPDATE USER
 * =====================================================
 */
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string()
            .trim()
            .min(2)
            .max(100)
            .optional(),
        username: zod_1.z.string()
            .trim()
            .min(3)
            .max(50)
            .regex(/^[a-zA-Z0-9_]+$/)
            .optional(),
        email: zod_1.z.string()
            .email()
            .optional(),
        password: zod_1.z.string()
            .min(6)
            .optional(),
        phone: zod_1.z.string()
            .trim()
            .max(20)
            .optional(),
        role: zod_1.z.enum([
            "ADMIN",
            "CASHIER",
            "STAFF",
        ])
            .optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string()
            .uuid("ID nhân viên không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * USER STATUS
 * =====================================================
 */
exports.updateUserStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        isActive: zod_1.z.boolean(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string()
            .uuid("ID nhân viên không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
