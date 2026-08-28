"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./config/env.js");
const prisma_js_1 = require("./config/prisma.js");
/**
 * Hàm khởi động server.
 *
 * Chúng ta kiểm tra database trước.
 * Nếu PostgreSQL không kết nối được,
 * backend sẽ không chạy tiếp.
 */
const startServer = async () => {
    try {
        // Kiểm tra kết nối PostgreSQL
        await prisma_js_1.prisma.$connect();
        console.log("✅ PostgreSQL connected");
        // Khởi động Express
        app_js_1.default.listen(env_js_1.env.PORT, () => {
            console.log(`🚀 POS Backend running at http://localhost:${env_js_1.env.PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        // Đóng Prisma connection nếu server khởi động thất bại
        await prisma_js_1.prisma.$disconnect();
        process.exit(1);
    }
};
startServer();
