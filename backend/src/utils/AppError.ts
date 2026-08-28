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

export class AppError
    extends Error {

    statusCode: number;

    constructor(
        message: string,
        statusCode: number
    ) {

        super(message);

        this.statusCode =
            statusCode;


        /**
         * Đảm bảo prototype đúng
         * khi sử dụng class Error với TypeScript.
         */
        Object.setPrototypeOf(
            this,
            AppError.prototype
        );
    }
}