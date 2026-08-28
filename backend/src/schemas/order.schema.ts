import { z } from "zod";

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
export const createOrderSchema = z.object({
    body: z.object({
        /**
         * ID của bàn.
         */
        tableId: z
            .string()
            .uuid("tableId không hợp lệ"),

        /**
         * Danh sách món.
         */
        items: z
            .array(
                z.object({
                    menuItemId: z
                        .string()
                        .uuid("menuItemId không hợp lệ"),

                    quantity: z
                        .number()
                        .int()
                        .positive("Số lượng phải lớn hơn 0"),
                })
            )
            .min(1, "Đơn hàng phải có ít nhất 1 món"),
    }),

    params: z.object({}),

    query: z.object({}),
});


/**
 * =====================================================
 * UPDATE ORDER STATUS
 * =====================================================
 */
export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum([
            "PENDING",
            "PREPARING",
            "SERVED",
            "PAID",
            "CANCELLED",
        ]),
    }),

    params: z.object({
        id: z
            .string()
            .uuid("ID order không hợp lệ"),
    }),

    query: z.object({}),
});


/**
 * =====================================================
 * GET ORDER BY ID
 * =====================================================
 */
export const getOrderSchema = z.object({
    body: z.object({}),

    params: z.object({
        id: z
            .string()
            .uuid("ID order không hợp lệ"),
    }),

    query: z.object({}),
});