import {
    Request,
    Response,
    NextFunction,
} from "express";

/**
 * =====================================================
 * GLOBAL ERROR HANDLER
 * =====================================================
 *
 * Middleware này xử lý những lỗi không được xử lý
 * ở controller/service.
 *
 * Ví dụ:
 *
 * Controller:
 *   throw new Error("Something went wrong");
 *
 * Lỗi sẽ chạy xuống đây.
 */


/**
 * Interface lỗi custom.
 *
 * Giúp TypeScript hiểu rằng Error có thể có thêm
 * statusCode và code.
 */
interface AppError extends Error {
    statusCode?: number;
    code?: string;
}


/**
 * Global Error Handler
 */
export function errorMiddleware(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) {

    /**
     * Log lỗi ở terminal.
     *
     * Khi deploy production sau này,
     * có thể thay bằng logger như Winston/Pino.
     */
    console.error(
        "❌ ERROR:",
        err
    );


    /**
     * Nếu lỗi đã có statusCode
     * thì sử dụng nó.
     *
     * Nếu không có thì mặc định 500.
     */
    const statusCode =
        err.statusCode ?? 500;


    /**
     * Message trả về frontend.
     */
    const message =
        err.message ||
        "Internal Server Error";


    return res.status(
        statusCode
    ).json({

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