import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 BẮT ĐẦU SEED DATABASE...");

    const passwordHash = await bcrypt.hash("123456", 10);

    // 1. TẠO USERS
    const users = [
        { username: "admin", fullName: "Quản trị viên", role: "ADMIN" as const, email: "admin@pos.local", phone: "0900000001" },
        { username: "cashier", fullName: "Nhân viên thu ngân", role: "CASHIER" as const, email: "cashier@pos.local", phone: "0900000002" },
        { username: "staff", fullName: "Nhân viên phục vụ", role: "STAFF" as const, email: "staff@pos.local", phone: "0900000003" }
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { username: u.username },
            update: { fullName: u.fullName, role: u.role },
            create: { ...u, password: passwordHash, isActive: true },
        });
    }
    console.log("✅ Đã tạo / cập nhật 3 users");

    // 2. TẠO CATEGORIES
    const categoriesData = [
        { name: "Lẩu", description: "Các món lẩu đặc biệt" },
        { name: "Nướng", description: "Các món nướng tại bàn" },
        { name: "Hấp", description: "Các món hấp giữ trọn vị tươi ngon" },
        { name: "Cơm & Mì", description: "Món ăn no chính" },
        { name: "Đồ uống", description: "Nước ngọt, trà, cà phê" },
        { name: "Tráng miệng", description: "Chè, kem, trái cây" },
    ];

    const categoriesMap: Record<string, any> = {};
    for (const cat of categoriesData) {
        categoriesMap[cat.name] = await prisma.category.upsert({
            where: { name: cat.name },
            update: { description: cat.description },
            create: cat,
        });
    }
    console.log("✅ Đã tạo / cập nhật 6 categories");

    // 3. TẠO MENU ITEMS
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
        } else {
            await prisma.menuItem.update({ where: { id: existing.id }, data: { price: item.price, categoryId: catId } });
        }
    }
    console.log(`✅ Đã tạo / cập nhật ${menuItems.length} menu items`);

    // 4. TẠO BÀN (BỎ QUA BÀN 2 VÀ XÓA BÀN 2 CŨ NẾU CÓ)
    await prisma.restaurantTable.deleteMany({
        where: { tableNumber: 2 },
    });

    for (let i = 1; i <= 10; i++) {
        if (i === 2) continue;

        await prisma.restaurantTable.upsert({
            where: { tableNumber: i },
            update: { capacity: i <= 6 ? 4 : 6, status: "AVAILABLE" },
            create: { tableNumber: i, capacity: i <= 6 ? 4 : 6, status: "AVAILABLE" },
        });
    }
    console.log("✅ Đã tạo danh sách bàn: 1, 3, 4, 5, 6, 7, 8, 9, 10");
    console.log("🎉 SEED DATABASE THÀNH CÔNG");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });