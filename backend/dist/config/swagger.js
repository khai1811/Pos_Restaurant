"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const setupSwagger = (app) => {
    let swaggerDocument = {};
    const possiblePaths = [
        path_1.default.join(__dirname, '../swagger/swagger.json'),
        path_1.default.join(__dirname, '../generated/swagger.json'),
        path_1.default.join(process.cwd(), 'src/swagger/swagger.json'),
        path_1.default.join(process.cwd(), 'src/generated/swagger.json'),
    ];
    for (const p of possiblePaths) {
        if (fs_1.default.existsSync(p)) {
            try {
                swaggerDocument = JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
                break;
            }
            catch (e) {
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
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
};
exports.setupSwagger = setupSwagger;
