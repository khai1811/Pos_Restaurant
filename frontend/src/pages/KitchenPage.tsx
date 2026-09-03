import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import { KitchenDisplay } from '../components/KitchenDisplay';
import { RefreshCw, ChefHat } from 'lucide-react';

export interface KitchenItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    status?: 'cooking' | 'served' | 'cancelled';
    note?: string;
    selectedOptions?: string[];
}

export interface KitchenOrder {
    id: string;
    orderNumber: string;
    tableName: string;
    area: string;
    createdAt: string;
    status: string;
    items: KitchenItem[];
}

export default function KitchenPage() {
    const [activeOrders, setActiveOrders] = useState<Record<string, KitchenOrder>>({});
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchRealOrders = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setIsRefreshing(true);

        try {
            const res = await axiosClient.get('/orders');
            const rawOrders = res.data || [];

            const ordersMap: Record<string, KitchenOrder> = {};

            rawOrders.forEach((o: any) => {
                const status = o.status?.toUpperCase();
                // Bỏ qua các đơn đã hoàn tất, đã hủy hoặc đã phục vụ
                if (status === 'CANCELLED' || status === 'COMPLETED' || status === 'PAID' || status === 'SERVED') {
                    return;
                }

                const mappedItems: KitchenItem[] = (o.orderItems || o.items || []).map((item: any) => {
                    const rawItemStatus = String(item.status || item.itemStatus || '').toUpperCase();
                    const normalizedStatus = (rawItemStatus === 'SERVED' || rawItemStatus === 'COMPLETED') ? 'served' : 'cooking';

                    return {
                        id: item.id || item.menuItemId,
                        name: item.menuItem?.name || item.menuItemName || item.name || 'Món ăn',
                        quantity: item.quantity,
                        price: Number(item.price || item.unitPrice || 0),
                        status: normalizedStatus as 'cooking' | 'served',
                        note: item.note || ''
                    };
                });

                ordersMap[o.id] = {
                    id: o.id,
                    orderNumber: `#${o.id.slice(-6).toUpperCase()}`,
                    tableName: o.table?.tableNumber ? `Bàn ${o.table.tableNumber}` : (o.tableNumber ? `Bàn ${o.tableNumber}` : 'Mang về'),
                    area: o.table?.area || o.areaName || 'Khu vực chính',
                    createdAt: o.createdAt,
                    status: o.status,
                    items: mappedItems
                };
            });

            setActiveOrders(ordersMap);
        } catch (error) {
            console.error('Lỗi tải dữ liệu màn hình bếp:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRealOrders(false);
        const interval = setInterval(() => fetchRealOrders(true), 10000);
        return () => clearInterval(interval);
    }, [fetchRealOrders]);

    const handleUpdateOrderItemStatus = async (orderId: string, itemId: string, status: 'cooking' | 'served') => {
        setActiveOrders(prev => {
            const order = prev[orderId];
            if (!order) return prev;
            const updatedItems = order.items.map(it => it.id === itemId ? { ...it, status } : it);
            return { ...prev, [orderId]: { ...order, items: updatedItems } };
        });

        try {
            await axiosClient.patch(`/orders/items/${itemId}/status`, { status });
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái món:', error);
        }
    };

    const handleCompleteAllItemsForOrder = async (orderId: string) => {
        try {
            await axiosClient.put(`/orders/${orderId}/status`, { status: 'SERVED' });

            setActiveOrders(prev => {
                const copy = { ...prev };
                delete copy[orderId];
                return copy;
            });
        } catch (error) {
            console.error('Lỗi hoàn tất đơn hàng:', error);
            setActiveOrders(prev => {
                const copy = { ...prev };
                delete copy[orderId];
                return copy;
            });
        }
    };

    const orderCount = Object.keys(activeOrders).length;

    return (
        /* VỎ APP TABLET BẤT TỬ: Cố định 100dvh, chặn vuốt nảy, chặn bôi đen */
        <div className="fixed inset-0 flex flex-col w-screen h-[100dvh] bg-[#e2e8f0] text-slate-900 font-sans overflow-hidden overscroll-none select-none print:hidden">

            {/* Navbar hệ thống */}
            <div className="shrink-0 z-20 shadow-sm border-b border-slate-200/60">
                <Navbar />
            </div>

            {/* Header KDS riêng biệt cho Bếp (Dark Theme để dễ nhìn từ xa) */}
            <div className="shrink-0 bg-slate-900 px-5 py-3 flex items-center justify-between shadow-md z-10 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-inner">
                        <ChefHat size={26} strokeWidth={2.5} />
                    </div>
                    <div className="leading-tight">
                        <h2 className="text-[16px] md:text-[18px] font-black tracking-wide flex items-center gap-2">
                            ĐIỀU PHỐI BẾP <span className="bg-white/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider">KDS System</span>
                        </h2>
                        <p className="text-[13px] text-slate-400 font-medium mt-0.5">
                            Đang chờ nấu: <strong className="text-amber-400 text-[14px]">{orderCount} phiếu</strong>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => fetchRealOrders(false)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isRefreshing ? "animate-spin text-amber-400" : ""} />
                    <span className="hidden sm:inline">Đồng bộ dữ liệu</span>
                </button>
            </div>

            {/* MAIN CONTENT: Component KitchenDisplay sẽ lo việc scroll ngang/dọc bên trong */}
            <main className="flex-1 w-full relative overflow-hidden p-4 md:p-5">
                {loading ? (
                    <div className="absolute inset-4 flex flex-col items-center justify-center text-slate-500 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-sm">
                        <div className="w-12 h-12 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-4 shadow-sm"></div>
                        <span className="font-bold text-[15px]">Đang lấy dữ liệu từ hệ thống...</span>
                    </div>
                ) : (
                    <div className="h-full w-full">
                        <KitchenDisplay
                            activeOrders={activeOrders}
                            onUpdateOrderItemStatus={handleUpdateOrderItemStatus}
                            onCompleteAllItemsForOrder={handleCompleteAllItemsForOrder}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}