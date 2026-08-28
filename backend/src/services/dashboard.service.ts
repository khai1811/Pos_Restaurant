import { prisma } from '../config/prisma';
import { DashboardOverviewDto } from '../dtos/dashboard.dto';
import { OrderStatus, TableStatus } from '@prisma/client';

export class DashboardService {
    async getOverview(): Promise<DashboardOverviewDto> {
        const revenueAggregate = await prisma.order.aggregate({
            where: { status: OrderStatus.PAID },
            _sum: { totalAmount: true },
            _count: { id: true },
        });

        const occupiedTables = await prisma.restaurantTable.count({
            where: { status: TableStatus.OCCUPIED },
        });

        const availableTables = await prisma.restaurantTable.count({
            where: { status: TableStatus.AVAILABLE },
        });

        const topItemsGroup = await prisma.orderItem.groupBy({
            by: ['menuItemId'],
            _sum: { quantity: true },
            orderBy: {
                _sum: { quantity: 'desc' },
            },
            take: 5,
        });

        const topSellingItems = await Promise.all(
            topItemsGroup.map(async (item) => {
                const menuItem = await prisma.menuItem.findUnique({
                    where: { id: item.menuItemId },
                });
                return {
                    menuItemId: item.menuItemId,
                    name: menuItem?.name || 'N/A',
                    totalSold: item._sum.quantity || 0,
                };
            })
        );

        return {
            totalRevenue: Number(revenueAggregate._sum.totalAmount || 0),
            totalOrders: revenueAggregate._count.id || 0,
            occupiedTables,
            availableTables,
            topSellingItems,
        };
    }
}