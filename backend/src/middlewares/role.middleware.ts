import {
    Request,
    Response,
    NextFunction,
} from "express";


/**
 * =====================================================
 * ROLE MIDDLEWARE
 * =====================================================
 *
 * Dùng để giới hạn quyền truy cập API.
 *
 * Ví dụ:
 *
 * requireRole("ADMIN")
 *
 * chỉ ADMIN được gọi.
 *
 * Hoặc:
 *
 * requireRole("ADMIN", "CASHIER")
 *
 * ADMIN và CASHIER được gọi.
 */
export function requireRole(
    ...allowedRoles: Array<
        "ADMIN" |
        "CASHIER" |
        "STAFF"
    >
) {

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        /**
         * authMiddleware phải chạy trước.
         */
        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Bạn chưa đăng nhập",

            });
        }


        /**
         * Kiểm tra role.
         */
        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Bạn không có quyền thực hiện thao tác này",

            });
        }


        next();
    };
}