"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const routes_1 = require("./generated/routes");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true
}));
app.use(express_1.default.json());
// --- TÍCH HỢP SWAGGER UI CHUẨN ---
try {
    const rawSwagger = require('./swagger/swagger.json');
    // Khai báo chuẩn OpenAPI 3 securitySchemes (khóa 'jwt' khớp với swagger.json)
    const swaggerDocument = {
        ...rawSwagger,
        components: {
            ...rawSwagger.components,
            securitySchemes: {
                jwt: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập chuỗi JWT Token vào đây'
                }
            }
        }
    };
    // Dùng middleware chuẩn của swagger-ui-express thay vì generateHTML thủ công
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
        swaggerOptions: {
            persistAuthorization: true // Giữ Token không bị mất khi F5
        }
    }));
}
catch (error) {
    console.log('Chưa generate swagger.json hoặc file bị lỗi. Hãy chạy lệnh build tsoa.');
}
// Đăng ký toàn bộ Routes được tsoa sinh ra
(0, routes_1.RegisterRoutes)(app);
// Global Error Handler
app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
exports.default = app;
