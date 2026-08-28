import { prisma } from '../config/prisma';
import { RevenueReportResponseDto, RevenueByDateDto } from '../dtos/report.dto';
import { OrderStatus } from '@prisma/client';

export class ReportService {
    async getRevenueReport(startDate?: string, endDate?: string): Promise<RevenueReportResponseDto> {
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().setDate(end.getDate() - 30));

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PAID,
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        const revenueByDateMap = new Map<string, { revenue: number; ordersCount: number }>();

        let totalRevenue = 0;

        for (const order of orders) {
            const dateStr = order.createdAt.toISOString().split('T')[0];
            const amount = Number(order.totalAmount);
            totalRevenue += amount;

            const current = revenueByDateMap.get(dateStr) || { revenue: 0, ordersCount: 0 };
            revenueByDateMap.set(dateStr, {
                revenue: current.revenue + amount,
                ordersCount: current.ordersCount + 1,
            });
        }

        const details: RevenueByDateDto[] = Array.from(revenueByDateMap.entries()).map(
            ([date, value]) => ({
                date,
                revenue: value.revenue,
                ordersCount: value.ordersCount,
            })
        );

        return {
            fromDate: start.toISOString().split('T')[0],
            toDate: end.toISOString().split('T')[0],
            totalRevenue,
            totalOrders: orders.length,
            details,
        };
    }
}