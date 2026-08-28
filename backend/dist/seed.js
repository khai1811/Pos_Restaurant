"use strict";
// =====================================================
// SEED DATABASE - POS RESTAURANT
// Prisma 7 + PostgreSQL + TypeScript
// =====================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL không tồn tại trong file .env");
}
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("");
    console.log("========================================");
    console.log("🌱 BẮT ĐẦU SEED DATABASE");
    console.log("========================================");
    const passwordHash = await bcrypt_1.default.hash("123456", 10);
    // ===================================================
    // TẠO USERS
    // ===================================================
    const users = [
        { username: "admin", fullName: "Quản trị viên", role: "ADMIN", email: "admin@pos.local", phone: "0900000001" },
        { username: "cashier", fullName: "Nhân viên thu ngân", role: "CASHIER", email: "cashier@pos.local", phone: "0900000002" },
        { username: "staff", fullName: "Nhân viên phục vụ", role: "STAFF", email: "staff@pos.local", phone: "0900000003" }
    ];
    for (const u of users) {
        await prisma.user.upsert({
            where: { username: u.username },
            update: { fullName: u.fullName, role: u.role },
            create: { ...u, password: passwordHash, isActive: true },
        });
    }
    console.log("✅ Đã tạo / cập nhật 3 users");
    // ===================================================
    // TẠO CATEGORY CHI TIẾT
    // ===================================================
    const categoriesData = [
        { name: "Lẩu", description: "Các món lẩu đặc biệt" },
        { name: "Nướng", description: "Các món nướng tại bàn" },
        { name: "Hấp", description: "Các món hấp giữ trọn vị tươi ngon" },
        { name: "Cơm & Mì", description: "Món ăn no chính" },
        { name: "Đồ uống", description: "Nước ngọt, trà, cà phê" },
        { name: "Tráng miệng", description: "Chè, kem, trái cây" },
    ];
    const categoriesMap = {};
    for (const cat of categoriesData) {
        categoriesMap[cat.name] = await prisma.category.upsert({
            where: { name: cat.name },
            update: { description: cat.description },
            create: cat,
        });
    }
    console.log("✅ Đã tạo / cập nhật 6 categories");
    // ===================================================
    // TẠO MENU ITEM
    // ===================================================
    const menuItems = [
        { name: "Lẩu Thái hải sản", description: "Lẩu chua cay chuẩn vị Thái", price: 250000, cat: "Lẩu" },
        { name: "Bò nướng đá", description: "Thịt bò mềm nướng trên đá nóng", price: 180000, cat: "Nướng" },
        { name: "Gà hấp xả", description: "Gà ta hấp lá chanh thơm lừng", price: 220000, cat: "Hấp" },
        { name: "Cơm chiên dương châu", description: "Cơm chiên thập cẩm truyền thống", price: 60000, cat: "Cơm & Mì" },
        { name: "Coca Cola", description: "Nước ngọt Coca Cola lạnh", price: 20000, cat: "Đồ uống" },
        { name: "Chè khúc bạch", description: "Chè khúc bạch thanh mát", price: 35000, cat: "Tráng miệng" },
        { name: "Kem flan", description: "Bánh flan mềm mịn béo ngậy", price: 25000, cat: "Tráng miệng" },
    ];
    for (const item of menuItems) {
        const catId = categoriesMap[item.cat].id;
        const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
        if (!existing) {
            await prisma.menuItem.create({
                data: { name: item.name, description: item.description, price: item.price, categoryId: catId, isAvailable: true }
            });
        }
        else {
            await prisma.menuItem.update({ where: { id: existing.id }, data: { price: item.price, categoryId: catId } });
        }
    }
    console.log(`✅ Đã tạo / cập nhật ${menuItems.length} menu items`);
    // ===================================================
    // TẠO 10 BÀN
    // ===================================================
    for (let i = 1; i <= 10; i++) {
        await prisma.restaurantTable.upsert({
            where: { tableNumber: i },
            update: { capacity: i <= 6 ? 4 : 6 },
            create: { tableNumber: i, capacity: i <= 6 ? 4 : 6, status: "AVAILABLE" },
        });
    }
    console.log("✅ Đã tạo / cập nhật 10 bàn");
    console.log("");
    console.log("🎉 SEED DATABASE THÀNH CÔNG");
    console.log("========================================");
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
