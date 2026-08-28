import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
/**
 * Hàm khởi động server.
 *
 * Chúng ta kiểm tra database trước.
 * Nếu PostgreSQL không kết nối được,
 * backend sẽ không chạy tiếp.
 */


const startServer = async (): Promise<void> => {
    try {
        // Kiểm tra kết nối PostgreSQL
        await prisma.$connect();

        console.log("✅ PostgreSQL connected");

        // Khởi động Express
        app.listen(env.PORT, () => {
            console.log(
                `🚀 POS Backend running at http://localhost:${env.PORT}`
            );
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);

        // Đóng Prisma connection nếu server khởi động thất bại
        await prisma.$disconnect();

        process.exit(1);
    }
};

startServer();