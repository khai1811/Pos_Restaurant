"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
/**
 * =====================================================
 * 404 NOT FOUND
 * =====================================================
 *
 * Middleware này chạy khi người dùng gọi API
 * không tồn tại.
 *
 * Ví dụ:
 *
 * GET /api/abcxyz
 *
 * trong khi backend không có route /api/abcxyz.
 */
function notFoundMiddleware(req, res, next) {
    /**
     * Tạo Error.
     */
    const error = new Error(`Route không tồn tại: ${req.method} ${req.originalUrl}`);
    /**
     * Gán HTTP status 404.
     */
    error.statusCode = 404;
    /**
     * Chuyển lỗi xuống errorMiddleware.
     */
    next(error);
}
