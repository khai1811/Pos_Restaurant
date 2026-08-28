export class RevenueByDateDto {
    date!: string;
    revenue!: number;
    ordersCount!: number;
}

export class RevenueReportResponseDto {
    fromDate!: string;
    toDate!: string;
    totalRevenue!: number;
    totalOrders!: number;
    details!: RevenueByDateDto[];
}