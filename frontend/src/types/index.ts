export type PaymentMethod = 'vietqr' | 'cash' | 'card' | 'momo' | 'split' | string;

export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'CASHIER' | 'STAFF';
}

export interface Category {
    id: string;
    name: string;
}

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    description?: string;
    isAvailable?: boolean;
    categoryId?: string;
    category?: Category;
    imageUrl?: string;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'RESERVED' | string;

export interface TableReservation {
    customerName: string;
    time: string;
    note?: string;
}

export interface Table {
    id: string;
    name?: string;
    tableNumber?: string;
    status: TableStatus;
    seats?: number;
    capacity?: number;
    area?: string;
    activeOrderId?: string;
    reservationInfo?: TableReservation;
}

export interface OrderItem {
    id?: string;
    menuItemId?: string;
    menuItemName?: string;
    name?: string; // Alias tương thích giao diện
    quantity: number;
    unitPrice?: number;
    price?: number; // Alias tương thích giao diện
    note?: string;
}

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | string;

export interface Order {
    id: string;
    orderNumber: string;
    tableId?: string;
    tableName?: string; // Hiển thị tên bàn trên Modal
    table?: Table;
    status: OrderStatus;
    totalAmount?: number;
    total: number; // Tổng tiền phục vụ Modal
    subtotal: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    guestCount?: number;
    items: OrderItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentPayload {
    orderId: string;
    totalAmount: number;
    paidAmount: number;
    changeAmount: number;
    method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | PaymentMethod;
}

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    activeTables: number;
    totalMenuItems: number;
    recentOrders: Order[];
}