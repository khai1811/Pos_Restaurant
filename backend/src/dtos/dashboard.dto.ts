export class TopSellingItemDto {
    menuItemId!: string;
    name!: string;
    totalSold!: number;
}

export class DashboardOverviewDto {
    totalRevenue!: number;
    totalOrders!: number;
    occupiedTables!: number;
    availableTables!: number;
    topSellingItems!: TopSellingItemDto[];
}