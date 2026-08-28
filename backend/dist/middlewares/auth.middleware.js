"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressAuthentication = expressAuthentication;
const auth_service_1 = require("../services/auth.service");
async function expressAuthentication(request, securityName, scopes) {
    // Thêm 'bearerAuth' vào để khớp với @Security('bearerAuth') trong các Controller
    if (securityName === 'jwt' || securityName === 'bearerAuth') {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Không tìm thấy Token xác thực');
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = auth_service_1.AuthService.verifyToken(token);
            // Phân quyền theo Role (Scope) nếu có yêu cầu
            if (scopes && scopes.length > 0) {
                if (!scopes.includes(decoded.role)) {
                    throw new Error('Bạn không có quyền truy cập tài nguyên này');
                }
            }
            return decoded;
        }
        catch (err) {
            throw new Error(err.message || 'Token không hợp lệ hoặc đã hết hạn');
        }
    }
    throw new Error(`Unsupported security name: ${securityName}`);
}
