"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
/**
 * =====================================================
 * CREATE ORDER
 * =====================================================
 *
 * Frontend chỉ cần gửi:
 *
 * {
 *   "tableId": "...",
 *   "items": [
 *     {
 *       "menuItemId": "...",
 *       "quantity": 2
 *     }
 *   ]
 * }
 *
 * Backend sẽ tự:
 *
 * - lấy staffId từ JWT
 * - lấy price từ MenuItem
 * - tính subtotal
 * - tính totalAmount
 */
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        /**
         * ID của bàn.
         */
        tableId: zod_1.z
            .string()
            .uuid("tableId không hợp lệ"),
        /**
         * Danh sách món.
         */
        items: zod_1.z
            .array(zod_1.z.object({
            menuItemId: zod_1.z
                .string()
                .uuid("menuItemId không hợp lệ"),
            quantity: zod_1.z
                .number()
                .int()
                .positive("Số lượng phải lớn hơn 0"),
        }))
            .min(1, "Đơn hàng phải có ít nhất 1 món"),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * UPDATE ORDER STATUS
 * =====================================================
 */
exports.updateOrderStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([
            "PENDING",
            "PREPARING",
            "SERVED",
            "PAID",
            "CANCELLED",
        ]),
    }),
    params: zod_1.z.object({
        id: zod_1.z
            .string()
            .uuid("ID order không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
/**
 * =====================================================
 * GET ORDER BY ID
 * =====================================================
 */
exports.getOrderSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({
        id: zod_1.z
            .string()
            .uuid("ID order không hợp lệ"),
    }),
    query: zod_1.z.object({}),
});
