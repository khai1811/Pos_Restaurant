import dotenv from "dotenv";

// Load các biến môi trường từ file .env
dotenv.config();

/**
 * Kiểm tra biến môi trường có tồn tại hay không.
 *
 * Nếu thiếu biến quan trọng thì backend sẽ báo lỗi ngay
 * thay vì chạy rồi phát sinh lỗi khó tìm về sau.
 */
const requiredEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
};

export const env = {
    // Port mà Express sẽ chạy
    PORT: Number(process.env.PORT) || 5000,

    // URL kết nối PostgreSQL
    DATABASE_URL: requiredEnv("DATABASE_URL"),

    // Secret dùng để ký JWT
    JWT_SECRET: requiredEnv("JWT_SECRET"),

    // Thời gian hết hạn JWT
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d"
};