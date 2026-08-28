import axiosClient from './axiosClient';
import type { Order, DashboardStats } from '../types';

export const orderApi = {
    getAll: async (): Promise<Order[]> => {
        const response = await axiosClient.get('/orders');
        return Array.isArray(response.data) ? response.data : [];
    },

    getByTable: async (tableId: string): Promise<Order | null> => {
        try {
            const response = await axiosClient.get('/orders');
            const orders: Order[] = Array.isArray(response.data) ? response.data : [];
            return orders.find(
                (order) =>
                    String(order.tableId) === String(tableId) &&
                    // Thêm BILL_REQUESTED để đảm bảo đơn không bị mất dấu khi đang chờ tính tiền
                    ['PENDING', 'PREPARING', 'SERVED', 'BILL_REQUESTED'].includes(order.status?.toUpperCase())
            ) || null;
        } catch (error) {
            return null;
        }
    },

    createOrder: async (data: {
        tableId: string;
        items: any[];
        note?: string;
    }) => {
        // Lấy thông tin user đang đăng nhập từ localStorage để gắn vào userId
        let userId = undefined;
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = user.id;
            }
        } catch (e) {
            console.error('Lỗi đọc user storage', e);
        }

        const payload = {
            tableId: String(data.tableId),
            userId: userId ? String(userId) : undefined, // Khớp schema CreateOrderDto
            note: data.note?.trim() || undefined,
            items: data.items.map((item) => ({
                menuItemId: String(item.menuItemId || item.id),
                quantity: Number(item.quantity),
                note: item.note?.trim() || undefined,
            })),
        };

        const response = await axiosClient.post('/orders', payload);
        return response.data;
    },

    payOrder: async (data: {
        orderId: string;
        totalAmount: number;
        paidAmount: number;
        changeAmount: number;
        method: string;
    }) => {
        // 🔥 Đã fix lỗi 404: Tận dụng API update status có sẵn của Backend
        // Thay vì gọi /payments, chúng ta gọi PUT /orders/{id}/status để chuyển thành PAID
        const response = await axiosClient.put(`/orders/${data.orderId}/status`, {
            status: 'PAID'
        });
        return response.data;
    },

    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await axiosClient.get('/dashboard/overview'); // Khớp với DashboardOverviewDto
        return response.data;
    },
};