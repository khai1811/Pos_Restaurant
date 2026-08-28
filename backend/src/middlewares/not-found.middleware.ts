import {
    Request,
    Response,
    NextFunction,
} from "express";

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
export function notFoundMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {

    /**
     * Tạo Error.
     */
    const error =
        new Error(
            `Route không tồn tại: ${req.method} ${req.originalUrl}`
        ) as Error & {
            statusCode?: number;
        };


    /**
     * Gán HTTP status 404.
     */
    error.statusCode = 404;


    /**
     * Chuyển lỗi xuống errorMiddleware.
     */
    next(error);
}