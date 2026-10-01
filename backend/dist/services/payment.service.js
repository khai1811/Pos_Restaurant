"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class PaymentService {
    async getAll() {
        const payments = await prisma_1.prisma.payment.findMany({
            take: 100, // Giới hạn 100 giao dịch gần nhất để chống chậm hệ thống
            orderBy: { id: 'desc' },
        });
        return payments.map((p) => ({
            ...p,
            totalAmount: Number(p.totalAmount),
            paidAmount: Number(p.paidAmount),
            changeAmount: Number(p.changeAmount),
            cashAmount: p.cashAmount ? Number(p.cashAmount) : 0,
            transferAmount: p.transferAmount ? Number(p.transferAmount) : 0,
        }));
    }
    async getById(id) {
        const payment = await prisma_1.prisma.payment.findUnique({
            where: { id },
        });
        if (!payment)
            return null;
        return {
            ...payment,
            totalAmount: Number(payment.totalAmount),
            paidAmount: Number(payment.paidAmount),
            changeAmount: Number(payment.changeAmount),
            cashAmount: payment.cashAmount ? Number(payment.cashAmount) : 0,
            transferAmount: payment.transferAmount ? Number(payment.transferAmount) : 0,
        };
    }
    async create(data) {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: data.orderId },
        });
        if (!order)
            throw new Error('Không tìm thấy đơn hàng');
        if (order.status === client_1.OrderStatus.PAID)
            throw new Error('Đơn hàng này đã được thanh toán trước đó');
        if (order.status === client_1.OrderStatus.CANCELLED)
            throw new Error('Không thể thanh toán đơn hàng đã bị hủy');
        const createdPayment = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Tạo lịch sử thanh toán
            const paymentData = {
                orderId: data.orderId,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount,
                changeAmount: data.changeAmount,
                method: data.method,
                cashAmount: data.method === 'SPLIT' ? (data.cashAmount || 0) : (data.method === 'CASH' ? data.paidAmount : 0),
                transferAmount: data.method === 'SPLIT' ? (data.transferAmount || 0) : (data.method !== 'CASH' ? data.totalAmount : 0),
            };
            const payment = await tx.payment.create({ data: paymentData });
            // 2. Cập nhật trạng thái và TỔNG TIỀN CUỐI CÙNG (đã trừ thẻ/thuế) vào hóa đơn
            await tx.order.update({
                where: { id: data.orderId },
                data: {
                    status: client_1.OrderStatus.PAID,
                    totalAmount: data.totalAmount,
                },
            });
            // 3. Giải phóng bàn
            if (order.tableId) {
                await tx.restaurantTable.update({
                    where: { id: order.tableId },
                    data: { status: client_1.TableStatus.AVAILABLE },
                });
            }
            return payment;
        });
        return {
            ...createdPayment,
            totalAmount: Number(createdPayment.totalAmount),
            paidAmount: Number(createdPayment.paidAmount),
            changeAmount: Number(createdPayment.changeAmount),
            cashAmount: createdPayment.cashAmount ? Number(createdPayment.cashAmount) : 0,
            transferAmount: createdPayment.transferAmount ? Number(createdPayment.transferAmount) : 0,
        };
    }
}
exports.PaymentService = PaymentService;
