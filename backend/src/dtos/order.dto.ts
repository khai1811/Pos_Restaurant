import { OrderStatus } from '@prisma/client';

export interface CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    note?: string;
}

export interface CreateOrderDto {
    tableId: string;
    userId: string;
    note?: string;
    items: CreateOrderItemDto[];
}

export interface UpdateOrderStatusDto {
    status: OrderStatus;
}

export interface OrderItemResponseDto {
    id: string;
    menuItemId: string;
    menuItemName?: string;
    quantity: number;
    unitPrice: number;
    note: string | null;
}

export interface OrderResponseDto {
    id: string;
    orderNumber: number;
    tableId: string;
    tableNumber?: number;
    userId: string;
    userName?: string;
    status: OrderStatus;
    totalAmount: number;
    note: string | null;
    items: OrderItemResponseDto[];
    createdAt: Date;
    updatedAt: Date;
}