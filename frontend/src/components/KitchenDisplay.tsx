import React from 'react';
import { ChefHat, CheckCircle2, Clock } from 'lucide-react';
import { formatTimeOnly, sound } from '../utils/formatters';

// Định nghĩa kiểu mở rộng độc lập để tránh phụ thuộc vào thiếu sót của types chung
export interface ExtendedOrderItem {
    id: string;
    name: string;
    quantity: number;
    status?: string;
    selectedOptions?: string[];
    note?: string;
}

export interface ExtendedOrder {
    id: string;
    orderNumber: string;
    tableName: string;
    area?: string;
    createdAt: string;
    status?: string;
    items: ExtendedOrderItem[];
}

interface KitchenDisplayProps {
    activeOrders: Record<string, any>;
    onUpdateOrderItemStatus: (orderId: string, itemId: string, status: 'cooking' | 'served') => void;
    onCompleteAllItemsForOrder: (orderId: string) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
    activeOrders,
    onUpdateOrderItemStatus,
    onCompleteAllItemsForOrder,
}) => {
    const ordersList: ExtendedOrder[] = (Object.values(activeOrders) as ExtendedOrder[]).filter((o) =>
        o.items && o.items.some((it) => it.status !== 'served' && it.status !== 'cancelled')
    );

    const getElapsedTime = (isoDate?: string) => {
        if (!isoDate) return 1;
        const elapsedMinutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
        return Math.max(1, elapsedMinutes);
    };

    return (
        <div className="space-y-4">
            {/* Top Status */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                            Màn hình Bếp & Bar (Kitchen Display System - KDS)
                        </h2>
                        <p className="text-xs text-slate-400">
                            Theo dõi và chế biến món theo thứ tự gọi món
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-400 block">Đang chờ nấu:</span>
                    <span className="text-xl font-bold text-amber-400">
                        {ordersList.length} phiếu order
                    </span>
                </div>
            </div>

            {/* Orders Grid */}
            {ordersList.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="font-bold text-base text-slate-700">Tất cả món đã hoàn thành!</h3>
                    <p className="text-xs text-slate-400">
                        Hiện không có phiếu order nào đang chờ chế biến.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ordersList.map((order) => {
                        const elapsed = getElapsedTime(order.createdAt);
                        const isLate = elapsed > 15;

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xs ${isLate ? 'border-rose-400 ring-1 ring-rose-400/40' : 'border-slate-200'
                                    }`}
                            >
                                {/* Header */}
                                <div
                                    className={`p-3 text-white flex items-center justify-between ${isLate ? 'bg-rose-700' : 'bg-slate-900'
                                        }`}
                                >
                                    <div>
                                        <h3 className="font-bold text-base text-amber-300">{order.tableName}</h3>
                                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                                            <span className="font-mono">{order.orderNumber}</span>
                                            <span>•</span>
                                            <span>{order.area || 'Khu vực chính'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isLate
                                                ? 'bg-rose-900 text-white animate-pulse'
                                                : 'bg-slate-800 text-amber-300'
                                                }`}
                                        >
                                            <Clock className="w-3 h-3" />
                                            {elapsed} phút
                                        </span>
                                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                            {order.createdAt ? formatTimeOnly(order.createdAt) : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-3 space-y-2 flex-1 divide-y divide-slate-100">
                                    {order.items?.map((item) => {
                                        const isDone = item.status === 'served';

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    sound.play('click');
                                                    onUpdateOrderItemStatus(
                                                        order.id,
                                                        item.id,
                                                        isDone ? 'cooking' : 'served'
                                                    );
                                                }}
                                                className={`pt-2 first:pt-0 flex items-start justify-between gap-2 cursor-pointer p-1.5 rounded-lg transition ${isDone
                                                    ? 'opacity-40 line-through bg-slate-50'
                                                    : 'hover:bg-amber-50/60'
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-black text-amber-600 text-sm">
                                                            x{item.quantity}
                                                        </span>
                                                        <span className="font-bold text-xs text-slate-900">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                        <p className="text-[10px] text-slate-500 font-medium ml-5">
                                                            {item.selectedOptions.join(', ')}
                                                        </p>
                                                    )}
                                                    {item.note && (
                                                        <p className="text-[10px] text-rose-600 font-bold ml-5">
                                                            ⚠️ Ghi chú: {item.note}
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${isDone
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600'
                                                        }`}
                                                >
                                                    {isDone ? '✓' : 'Nấu'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer Complete Button */}
                                <div className="p-3 bg-slate-50 border-t border-slate-200">
                                    <button
                                        onClick={() => {
                                            sound.play('bell');
                                            onCompleteAllItemsForOrder(order.id);
                                        }}
                                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Hoàn tất tất cả món bàn này</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};