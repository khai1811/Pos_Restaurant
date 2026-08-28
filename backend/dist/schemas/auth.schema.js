"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const zod_1 = require("zod");
/**
 * =====================================================
 * LOGIN VALIDATION
 * =====================================================
 */
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        /**
         * Username bắt buộc.
         */
        username: zod_1.z.string()
            .trim()
            .min(1, "Username không được để trống"),
        /**
         * Password bắt buộc.
         */
        password: zod_1.z.string()
            .min(1, "Password không được để trống"),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
