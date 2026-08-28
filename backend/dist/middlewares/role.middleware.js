"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
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
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        /**
         * authMiddleware phải chạy trước.
         */
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }
        /**
         * Kiểm tra role.
         */
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện thao tác này",
            });
        }
        next();
    };
}
