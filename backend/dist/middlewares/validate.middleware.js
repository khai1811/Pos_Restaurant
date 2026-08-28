"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
/**
 * =====================================================
 * VALIDATE MIDDLEWARE
 * =====================================================
 *
 * Middleware này nhận một Zod schema.
 *
 * Ví dụ:
 *
 * router.post(
 *   "/",
 *   validate(createCategorySchema),
 *   createCategory
 * );
 *
 * Request body sẽ được kiểm tra trước khi
 * chạy vào controller.
 */
function validate(schema) {
    return (req, res, next) => {
        /**
         * Kiểm tra toàn bộ request.
         *
         * Có thể validate:
         *
         * body
         * params
         * query
         */
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        /**
         * Nếu dữ liệu không hợp lệ.
         */
        if (!result.success) {
            /**
             * Chuyển lỗi Zod thành
             * format dễ đọc.
             */
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors,
            });
        }
        /**
         * Nếu hợp lệ thì cho request
         * đi tiếp tới controller.
         */
        next();
    };
}
