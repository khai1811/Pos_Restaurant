import { Request } from 'express';
import { AuthService } from '../services/auth.service';

export async function expressAuthentication(
    request: Request,
    securityName: string,
    scopes?: string[]
): Promise<any> {
    // Thêm 'bearerAuth' vào để khớp với @Security('bearerAuth') trong các Controller
    if (securityName === 'jwt' || securityName === 'bearerAuth') {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Không tìm thấy Token xác thực');
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = AuthService.verifyToken(token);

            // Phân quyền theo Role (Scope) nếu có yêu cầu
            if (scopes && scopes.length > 0) {
                if (!scopes.includes(decoded.role)) {
                    throw new Error('Bạn không có quyền truy cập tài nguyên này');
                }
            }

            return decoded;
        } catch (err: any) {
            throw new Error(err.message || 'Token không hợp lệ hoặc đã hết hạn');
        }
    }

    throw new Error(`Unsupported security name: ${securityName}`);
}