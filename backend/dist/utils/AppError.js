"use strict";
/**
 * =====================================================
 * CUSTOM APPLICATION ERROR
 * =====================================================
 *
 * Dùng để tạo lỗi có HTTP status.
 *
 * Ví dụ:
 *
 * throw new AppError(
 *   "Không tìm thấy nhân viên",
 *   404
 * );
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode =
            statusCode;
        /**
         * Đảm bảo prototype đúng
         * khi sử dụng class Error với TypeScript.
         */
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
