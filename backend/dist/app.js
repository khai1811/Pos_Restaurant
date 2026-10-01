"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const routes_1 = require("./generated/routes");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true, // Cho phép mọi origin gửi request lên
    credentials: true
}));
// 🔥 MỞ RỘNG GIỚI HẠN NHẬN DỮ LIỆU LÊN 50MB ĐỂ CHỨA ẢNH BASE64
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
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
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
        swaggerOptions: {
            persistAuthorization: true // Giữ Token không bị mất khi F5
        }
    }));
}
catch (error) {
    console.log('Chưa generate swagger.json hoặc file bị lỗi. Hãy chạy lệnh build tsoa.');
}
// ---------------------------------------------------------
// 👉 MIDDLEWARE BẢO MẬT TOÀN CỤC CHO MỌI API /api/*
// ---------------------------------------------------------
app.use('/api', async (req, res, next) => {
    // Cho phép đi qua tự do nếu là login, register hoặc lấy danh sách user
    if (req.originalUrl.includes('/auth/login') ||
        req.originalUrl.includes('/auth/register') ||
        req.originalUrl.startsWith('/api/users') ||
        req.url.startsWith('/users')) {
        return next();
    }
    try {
        const user = await (0, auth_middleware_1.expressAuthentication)(req, 'bearerAuth');
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: err.message || 'Không tìm thấy Token xác thực'
        });
    }
});
// Đăng ký toàn bộ Routes được tsoa sinh ra
(0, routes_1.RegisterRoutes)(app);
// Global Error Handler
app.use((err, _req, res, _next) => {
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
exports.default = app;
