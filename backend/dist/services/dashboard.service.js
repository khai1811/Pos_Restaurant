"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class DashboardService {
    async getOverview() {
        const revenueAggregate = await prisma_1.prisma.order.aggregate({
            where: { status: client_1.OrderStatus.PAID },
            _sum: { totalAmount: true },
            _count: { id: true },
        });
        const occupiedTables = await prisma_1.prisma.restaurantTable.count({
            where: { status: client_1.TableStatus.OCCUPIED },
        });
        const availableTables = await prisma_1.prisma.restaurantTable.count({
            where: { status: client_1.TableStatus.AVAILABLE },
        });
        const topItemsGroup = await prisma_1.prisma.orderItem.groupBy({
            by: ['menuItemId'],
            _sum: { quantity: true },
            orderBy: {
                _sum: { quantity: 'desc' },
            },
            take: 5,
        });
        const topSellingItems = await Promise.all(topItemsGroup.map(async (item) => {
            const menuItem = await prisma_1.prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
            });
            return {
                menuItemId: item.menuItemId,
                name: menuItem?.name || 'N/A',
                totalSold: item._sum.quantity || 0,
            };
        }));
        return {
            totalRevenue: Number(revenueAggregate._sum.totalAmount || 0),
            totalOrders: revenueAggregate._count.id || 0,
            occupiedTables,
            availableTables,
            topSellingItems,
        };
    }
}
exports.DashboardService = DashboardService;
