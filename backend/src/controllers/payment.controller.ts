import { prisma } from '../config/prisma';
import { CreatePaymentDto, PaymentResponseDto } from '../dtos/payment.dto';
import { OrderStatus, TableStatus } from '@prisma/client';

export class PaymentService {
    async getAll(): Promise<PaymentResponseDto[]> {
        const payments = await prisma.payment.findMany({
            orderBy: { id: 'desc' },
        });

        return payments.map((p: any) => ({
            ...p,
            totalAmount: Number(p.totalAmount),
            paidAmount: Number(p.paidAmount),
            changeAmount: Number(p.changeAmount),
            cashAmount: p.cashAmount ? Number(p.cashAmount) : 0,
            transferAmount: p.transferAmount ? Number(p.transferAmount) : 0,
        }));
    }

    async getById(id: string): Promise<PaymentResponseDto | null> {
        const payment: any = await prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) return null;

        return {
            ...payment,
            totalAmount: Number(payment.totalAmount),
            paidAmount: Number(payment.paidAmount),
            changeAmount: Number(payment.changeAmount),
            cashAmount: payment.cashAmount ? Number(payment.cashAmount) : 0,
            transferAmount: payment.transferAmount ? Number(payment.transferAmount) : 0,
        };
    }

    async create(data: CreatePaymentDto & { cashAmount?: number; transferAmount?: number }): Promise<PaymentResponseDto> {
        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
        });

        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.status === OrderStatus.PAID) throw new Error('Đơn hàng này đã được thanh toán trước đó');
        if (order.status === OrderStatus.CANCELLED) throw new Error('Không thể thanh toán đơn hàng đã bị hủy');

        const createdPayment: any = await prisma.$transaction(async (tx: any) => {
            const paymentData: any = {
                orderId: data.orderId,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount,
                changeAmount: data.changeAmount,
                method: data.method,
                cashAmount: data.method === 'SPLIT' ? (data.cashAmount || 0) : (data.method === 'CASH' ? data.paidAmount : 0),
                transferAmount: data.method === 'SPLIT' ? (data.transferAmount || 0) : (data.method !== 'CASH' ? data.totalAmount : 0),
            };

            const payment = await tx.payment.create({ data: paymentData });

            await tx.order.update({
                where: { id: data.orderId },
                data: {
                    status: OrderStatus.PAID,
                    totalAmount: data.totalAmount,
                },
            });

            if (order.tableId) {
                await tx.restaurantTable.update({
                    where: { id: order.tableId },
                    data: { status: TableStatus.AVAILABLE },
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