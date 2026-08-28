import { OrderStatus } from '@prisma/client';

export class OrderItemEntity {
    id!: string;
    orderId!: string;
    menuItemId!: string;
    menuItemName?: string;
    quantity!: number;
    unitPrice!: number;
    note!: string | null;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(partial: Partial<OrderItemEntity>) {
        Object.assign(this, partial);
    }
}

export class OrderEntity {
    id!: string;
    orderNumber!: number;
    tableId!: string;
    tableNumber?: number;
    userId!: string;
    userName?: string;
    status!: OrderStatus;
    totalAmount!: number;
    note!: string | null;
    items!: OrderItemEntity[]; // Đã sửa: Bắt buộc là mảng OrderItemEntity[]
    createdAt!: Date;
    updatedAt!: Date;

    constructor(partial: Partial<OrderEntity>) {
        Object.assign(this, partial);
        this.items = partial.items || []; // Khởi tạo mảng rỗng nếu undefined
    }
}