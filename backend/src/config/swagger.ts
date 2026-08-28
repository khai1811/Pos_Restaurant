import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';

export const setupSwagger = (app: Express): void => {
    let swaggerDocument: any = {};
    const possiblePaths = [
        path.join(__dirname, '../swagger/swagger.json'),
        path.join(__dirname, '../generated/swagger.json'),
        path.join(process.cwd(), 'src/swagger/swagger.json'),
        path.join(process.cwd(), 'src/generated/swagger.json'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                swaggerDocument = JSON.parse(fs.readFileSync(p, 'utf8'));
                break;
            } catch (e) {
                console.error('Lỗi đọc file swagger.json:', e);
            }
        }
    }

    // 1. Đảm bảo cấu trúc components tồn tại
    swaggerDocument.components = swaggerDocument.components || {};

    // 2. Ép trực tiếp cấu hình 'jwt' (tên khớp chính xác với API của bạn trong swagger.json)
    swaggerDocument.components.securitySchemes = {
        jwt: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Nhập JWT Token của bạn'
        },
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
        }
    };

    // 3. Render Swagger UI gốc (không dùng CDN ngoài)
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};