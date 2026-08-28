import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import { KitchenDisplay } from '../components/KitchenDisplay';
import { RefreshCw, ChefHat, Flame } from 'lucide-react';

export interface KitchenItem {
    id: string; name: string; quantity: number; price: number;
    status?: 'cooking' | 'served' | 'cancelled'; note?: string; selectedOptions?: string[];
}

export interface KitchenOrder {
    id: string; orderNumber: string; tableName: string; area: string;
    createdAt: string; status: string; items: KitchenItem[];
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
                if (['CANCELLED', 'COMPLETED', 'PAID', 'SERVED'].includes(status)) return;

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
                    id: o.id, orderNumber: `#${o.id.slice(-6).toUpperCase()}`,
                    tableName: o.table?.tableNumber ? `Bàn ${o.table.tableNumber}` : (o.tableNumber ? `Bàn ${o.tableNumber}` : 'Mang về'),
                    area: o.table?.area || o.areaName || 'Khu vực chính',
                    createdAt: o.createdAt,
                    status: o.status,
                    items: mappedItems
                };
            });

            setActiveOrders(ordersMap);
        } catch (error) { console.error('Lỗi tải dữ liệu màn hình bếp:', error); }
        finally { setLoading(false); setIsRefreshing(false); }
    }, []);

    useEffect(() => {
        fetchRealOrders(false);
        const interval = setInterval(() => fetchRealOrders(true), 10000);
        return () => clearInterval(interval);
    }, [fetchRealOrders]);

    const handleUpdateOrderItemStatus = async (orderId: string, itemId: string, status: 'cooking' | 'served') => {
        setActiveOrders(prev => {
            const order = prev[orderId]; if (!order) return prev;
            const updatedItems = order.items.map(it => it.id === itemId ? { ...it, status } : it);
            return { ...prev, [orderId]: { ...order, items: updatedItems } };
        });
        try {
            await axiosClient.patch(`/orders/items/${itemId}/status`, { status });
        }
        catch (error) { console.error('Lỗi cập nhật trạng thái món:', error); }
    };

    const handleCompleteAllItemsForOrder = async (orderId: string) => {
        try {
            await axiosClient.put(`/orders/${orderId}/status`, { status: 'SERVED' });
            setActiveOrders(prev => { const copy = { ...prev }; delete copy[orderId]; return copy; });
        } catch (error) {
            console.error('Lỗi hoàn tất đơn hàng:', error);
            setActiveOrders(prev => { const copy = { ...prev }; delete copy[orderId]; return copy; });
        }
    };

    const orderCount = Object.keys(activeOrders).length;

    return (
        <div className="flex h-screen bg-[#e2e8f0] text-slate-900 font-sans overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />

                {/* Header KDS Tối giản & Tập trung */}
                <div className="bg-slate-900 px-5 py-3 flex items-center justify-between shrink-0 shadow-md z-10 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-inner">
                            <ChefHat size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[16px] md:text-lg font-black tracking-wide flex items-center gap-2">
                                ĐIỀU PHỐI BẾP <span className="bg-white/20 text-amber-300 px-2 py-0.5 rounded text-xs font-bold">KDS</span>
                            </h2>
                            <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                                Đang chờ nấu: <strong className="text-white">{orderCount} phiếu</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchRealOrders(false)} disabled={isRefreshing}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-xl text-[13px] font-bold transition cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isRefreshing ? "animate-spin text-amber-400" : ""} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                </div>

                <main className="flex-1 p-4 md:p-6 overflow-hidden">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white/50 rounded-2xl border border-white">
                            <div className="w-12 h-12 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-4 shadow-sm"></div>
                            <span className="font-bold">Đang đồng bộ phiếu Order...</span>
                        </div>
                    ) : (
                        <KitchenDisplay
                            activeOrders={activeOrders}
                            onUpdateOrderItemStatus={handleUpdateOrderItemStatus}
                            onCompleteAllItemsForOrder={handleCompleteAllItemsForOrder}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}