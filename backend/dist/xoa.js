"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    try {
        console.log('Đang tiến hành xóa OrderItem...');
        await prisma.orderItem.deleteMany();
        console.log('Đang tiến hành xóa Order...');
        await prisma.order.deleteMany();
        console.log('Đang tiến hành xóa các User phụ (trừ ADMIN)...');
        await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });
        console.log('Đã dọn sạch dữ liệu đơn hàng và user thành công!');
    }
    catch (error) {
        console.error('Lỗi khi xóa dữ liệu:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
run();
