"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
/**
 * Global Error Handler
 */
function errorMiddleware(err, req, res, next) {
    /**
     * Log lỗi ở terminal.
     *
     * Khi deploy production sau này,
     * có thể thay bằng logger như Winston/Pino.
     */
    console.error("❌ ERROR:", err);
    /**
     * Nếu lỗi đã có statusCode
     * thì sử dụng nó.
     *
     * Nếu không có thì mặc định 500.
     */
    const statusCode = err.statusCode ?? 500;
    /**
     * Message trả về frontend.
     */
    const message = err.message ||
        "Internal Server Error";
    return res.status(statusCode).json({
        success: false,
        message,
        /**
         * Chỉ nên trả stack khi development.
         *
         * Production không nên trả stack
         * vì có thể làm lộ thông tin server.
         */
        ...(process.env.NODE_ENV ===
            "development" && {
            stack: err.stack,
        }),
    });
}
