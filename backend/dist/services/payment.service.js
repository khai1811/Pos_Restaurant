"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class PaymentService {
    async getAll() {
        const payments = await prisma_1.prisma.payment.findMany({
            orderBy: { id: 'desc' },
        });
        return payments.map((p) => ({
            ...p,
            totalAmount: Number(p.totalAmount),
            paidAmount: Number(p.paidAmount),
            changeAmount: Number(p.changeAmount),
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
        };
    }
    async create(data) {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: data.orderId },
        });
        if (!order)
            throw new Error('Không tìm thấy đơn hàng');
        if (order.status === client_1.OrderStatus.PAID) {
            throw new Error('Đơn hàng này đã được thanh toán trước đó');
        }
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new Error('Không thể thanh toán đơn hàng đã bị hủy');
        }
        const createdPayment = await prisma_1.prisma.$transaction(async (tx) => {
            const paymentData = {
                orderId: data.orderId,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount,
                changeAmount: data.changeAmount,
                method: data.method,
            };
            const payment = await tx.payment.create({
                data: paymentData,
            });
            await tx.order.update({
                where: { id: data.orderId },
                data: { status: client_1.OrderStatus.PAID },
            });
            await tx.restaurantTable.update({
                where: { id: order.tableId },
                data: { status: client_1.TableStatus.AVAILABLE },
            });
            return payment;
        });
        return {
            ...createdPayment,
            totalAmount: Number(createdPayment.totalAmount),
            paidAmount: Number(createdPayment.paidAmount),
            changeAmount: Number(createdPayment.changeAmount),
        };
    }
}
exports.PaymentService = PaymentService;
