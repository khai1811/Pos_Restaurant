import express, { Express, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './generated/routes';
import { expressAuthentication } from './middlewares/auth.middleware';
import cors from 'cors';

const app: Express = express();

app.use(cors({
    origin: true, // Cho phép mọi origin gửi request lên
    credentials: true
}));

// 🔥 MỞ RỘNG GIỚI HẠN NHẬN DỮ LIỆU LÊN 50MB ĐỂ CHỨA ẢNH BASE64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- TÍCH HỢP SWAGGER UI CHUẨN ---
try {
    const rawSwagger = require('./generated/swagger.json');

    // Đồng bộ hóa khóa 'bearerAuth' cho cả swaggerDocument và securitySchemes
    const swaggerDocument = {
        ...rawSwagger,
        security: [
            {
                bearerAuth: []
            }
        ],
        components: {
            ...rawSwagger.components,
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập chuỗi JWT Token vào đây'
                }
            }
        }
    };

    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            swaggerOptions: {
                persistAuthorization: true // Giữ Token không bị mất khi F5
            }
        })
    );
} catch (error) {
    console.log('Chưa generate swagger.json hoặc file bị lỗi. Hãy chạy lệnh build tsoa.');
}

// ---------------------------------------------------------
// 👉 MIDDLEWARE BẢO MẬT TOÀN CỤC CHO MỌI API /api/*
// ---------------------------------------------------------
app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
    // Sử dụng originalUrl để bắt chính xác các route công khai không cần token
    if (req.originalUrl.includes('/auth/login') || req.originalUrl.includes('/auth/register')) {
        return next();
    }

    try {
        // Gọi xác thực với securityName là 'bearerAuth' để khớp hoàn toàn với middleware
        const user = await expressAuthentication(req, 'bearerAuth');
        (req as any).user = user;
        next();
    } catch (err: any) {
        return res.status(401).json({
            success: false,
            message: err.message || 'Không tìm thấy Token xác thực'
        });
    }
});

// Đăng ký toàn bộ Routes được tsoa sinh ra
RegisterRoutes(app);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Nếu lỗi là do payload quá lớn từ thư viện body-parser
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh dung lượng thấp hơn.'
        });
    }

    const status = err.status || 500;
    res.status(status).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

export default app;