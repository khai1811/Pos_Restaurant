import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { tableApi } from '../api/tableApi';
import { orderApi } from '../api/orderApi';
import axiosClient from '../api/axiosClient';
import type { Table, Order } from '../types';
import { formatVND } from '../utils/formatters';
import {
    Plus, ArrowRightLeft, ShoppingBag, X, ShoppingCart,
    DollarSign, QrCode, CreditCard, Layers, Printer, CheckCircle, Wallet, Utensils, Lock
} from 'lucide-react';

export default function TablesPage() {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = currentUser?.role?.toUpperCase() || 'STAFF';
    const canCheckout = userRole === 'ADMIN' || userRole === 'CASHIER';

    const [tables, setTables] = useState<Table[]>([]);
    const [activeOrders, setActiveOrders] = useState<Record<string, Order>>({});
    const [takeawayOrders, setTakeawayOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedArea, setSelectedArea] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferSourceId, setTransferSourceId] = useState<string>('');
    const [transferTargetId, setTransferTargetId] = useState<string>('');
    const [transferType, setTransferType] = useState<'move' | 'merge'>('move');
    const [isTransferring, setIsTransferring] = useState(false);

    const [showActionModal, setShowActionModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);

    const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [vatEnabled, setVatEnabled] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | 'CARD' | 'MOMO' | 'SPLIT'>('CASH');

    const [cashGiven, setCashGiven] = useState<number | ''>('');
    const [splitCash, setSplitCash] = useState<number>(0);
    const [splitTransfer, setSplitTransfer] = useState<number>(0);

    const fetchTablesAndOrders = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const tablesRes: any = await tableApi.getAll().catch(() => ({ data: [] }));
            const ordersRes = await axiosClient.get('/orders').catch(() => ({ data: [] }));

            const rawTables = Array.isArray(tablesRes?.data) ? tablesRes.data : (tablesRes?.data?.data || []);
            const rawOrders = Array.isArray(ordersRes?.data) ? ordersRes.data : (ordersRes?.data?.data || []);

            const formattedTables: Table[] = rawTables
                .filter((t: any) => t !== null && t !== undefined)
                .map((t: any) => {
                    let areaName = 'Sảnh chính';
                    if (typeof t.area === 'string') areaName = t.area;
                    else if (typeof t.area === 'object' && t.area !== null) areaName = t.area.name || 'Sảnh chính';
                    return {
                        ...t,
                        id: String(t.id || t._id || t.M_ID || Math.random()),
                        tableNumber: t.tableNumber || t.name || '?',
                        capacity: t.capacity || t.seats || 4,
                        status: String(t.status || t.STATUS || 'AVAILABLE').toUpperCase(),
                        area: areaName
                    };
                })
                .filter((t: Table) => t.id !== '');

            formattedTables.sort((a, b) => {
                const numA = parseInt(String(a.tableNumber).replace(/\D/g, '')) || 0;
                const numB = parseInt(String(b.tableNumber).replace(/\D/g, '')) || 0;
                return numA - numB;
            });

            const allActiveOrders = rawOrders.filter((o: any) =>
                !['COMPLETED', 'PAID', 'CANCELLED'].includes(String(o.status || '').toUpperCase())
            );

            const activeTakeaways = allActiveOrders.filter((o: any) => !o.tableId && !o.table);
            setTakeawayOrders(activeTakeaways);

            const ordersMap: Record<string, Order> = {};
            formattedTables.forEach(table => {
                const orderForTable = allActiveOrders.find((o: any) => String(o.tableId) === String(table.id));
                if (orderForTable) {
                    ordersMap[table.id] = orderForTable;

                    const items = orderForTable.orderItems || orderForTable.items || [];
                    const activeItems = items.filter((it: any) => {
                        const st = String(it.status || it.itemStatus || '').toUpperCase();
                        return st !== 'CANCELLED' && st !== 'DELETED';
                    });

                    const hasItems = activeItems.length > 0;
                    const isAllItemsServed = hasItems && activeItems.every((it: any) => {
                        const itemStatus = String(it.status || it.itemStatus || 'PENDING').toUpperCase();
                        return ['SERVED', 'COMPLETED', 'DONE'].includes(itemStatus);
                    });

                    const orderStatus = String(orderForTable.status || '').toUpperCase();
                    if (['SERVED', 'BILL_REQUESTED'].includes(orderStatus) || isAllItemsServed) {
                        table.status = 'BILL_REQUESTED';
                    } else {
                        table.status = 'OCCUPIED';
                    }
                } else {
                    if (table.status !== 'RESERVED') {
                        table.status = 'AVAILABLE';
                    }
                }
            });
            setActiveOrders(ordersMap);
            setTables(formattedTables);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bàn:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTablesAndOrders(false);
        const intervalId = setInterval(() => fetchTablesAndOrders(true), 5000);
        return () => clearInterval(intervalId);
    }, [fetchTablesAndOrders]);

    const subtotal = activeOrder?.totalAmount || activeOrder?.total || 0;
    const discountAmount = discountType === 'PERCENT' ? (subtotal * discountValue) / 100 : Math.min(discountValue, subtotal);
    const vatAmount = vatEnabled ? (subtotal - discountAmount) * 0.08 : 0;
    const finalTotal = subtotal - discountAmount + vatAmount;
    const changeAmount = Math.max(0, Number(cashGiven || 0) - finalTotal);

    const quickCashList = useMemo(() => {
        if (finalTotal === 0) return [];
        const suggestions = [finalTotal];
        const rounds = [50000, 100000, 500000];
        rounds.forEach(r => {
            const val = Math.ceil(finalTotal / r) * r;
            if (val > finalTotal && !suggestions.includes(val)) suggestions.push(val);
        });
        if (!suggestions.includes(500000) && finalTotal < 500000) suggestions.push(500000);
        return suggestions.slice(0, 4);
    }, [finalTotal]);

    const areas = ['all', ...Array.from(new Set(tables.map(t => (t as any).area || 'Sảnh chính')))];

    const handleTableClick = async (table: Table) => {
        if (!table.id) return alert("Bàn này không có ID hợp lệ.");
        const safeId = encodeURIComponent(String(table.id).trim());

        if (table.status === 'AVAILABLE') {
            navigate(`/order/${safeId}`);
        } else {
            const orderData = activeOrders[table.id];
            if (orderData) {
                setActiveOrder(orderData);
                setSelectedTable(table);
                const totalVal = orderData.totalAmount || orderData.total || 0;
                setCashGiven(totalVal);
                setSplitCash(Math.round(totalVal / 2));
                setSplitTransfer(totalVal - Math.round(totalVal / 2));
                setShowActionModal(true);
            } else {
                navigate(`/order/${safeId}`);
            }
        }
    };

    const handleTakeawayClick = (order: any) => {
        setActiveOrder(order);
        setSelectedTable({
            id: 'takeaway',
            name: `Mang về #${String(order.id || '').slice(-6).toUpperCase()}`,
            tableNumber: `Mang về`,
            status: order.status,
            area: 'Đơn chờ'
        } as any);

        const totalVal = order.totalAmount || order.total || 0;
        setCashGiven(totalVal);
        setSplitCash(Math.round(totalVal / 2));
        setSplitTransfer(totalVal - Math.round(totalVal / 2));
        setShowActionModal(true);
    };

    const handleCheckout = async () => {
        if (!activeOrder || !selectedTable) return;
        if (paymentMethod === 'CASH' && Number(cashGiven) < finalTotal) return alert('Số tiền khách đưa chưa đủ!');
        if (paymentMethod === 'SPLIT' && splitCash + splitTransfer !== finalTotal) return alert('Tổng tiền chia chưa khớp với hóa đơn!');

        try {
            await orderApi.payOrder({
                orderId: String(activeOrder.id || (activeOrder as any)._id),
                totalAmount: finalTotal,
                paidAmount: paymentMethod === 'CASH' ? Number(cashGiven) : finalTotal,
                changeAmount: paymentMethod === 'CASH' ? changeAmount : 0,
                method: paymentMethod
            });

            await axiosClient.put(`/orders/${activeOrder.id}/status`, { status: 'PAID' }).catch(() => { });
            if (selectedTable.id !== 'takeaway') {
                await axiosClient.patch(`/tables/${selectedTable.id}/status`, { status: 'AVAILABLE' })
                    .catch(() => axiosClient.put(`/tables/${selectedTable.id}`, { status: 'AVAILABLE' }))
                    .catch(() => { });
            }

            alert(`Thanh toán thành công ${finalTotal.toLocaleString('vi-VN')} đ!`);
            setShowPaymentModal(false); setSelectedTable(null); setActiveOrder(null); setDiscountValue(0);
            fetchTablesAndOrders(false);
        } catch (error: any) { alert(error.response?.data?.message || 'Thanh toán thất bại'); }
    };

    const handleExecuteTransfer = async () => {
        if (!transferSourceId || !transferTargetId) {
            alert('Vui lòng chọn đầy đủ Bàn Nguồn và Bàn Đích!');
            return;
        }

        if (transferSourceId === transferTargetId) {
            alert('Lỗi: Bàn nguồn và bàn đích không được trùng nhau!');
            return;
        }

        setIsTransferring(true);
        try {
            await axiosClient.post('/tables/transfer', {
                sourceTableId: transferSourceId,
                targetTableId: transferTargetId,
                actionType: transferType
            });

            alert(`Đã thực hiện ${transferType === 'move' ? 'chuyển' : 'gộp'} bàn thành công!`);

            setShowTransferModal(false);
            setTransferSourceId('');
            setTransferTargetId('');
            fetchTablesAndOrders(false);
        } catch (error: any) {
            console.error('Lỗi chuyển/gộp bàn:', error);
            alert(error.response?.data?.message || `Hệ thống lỗi khi thực hiện ${transferType === 'move' ? 'chuyển' : 'gộp'} bàn!`);
        } finally {
            setIsTransferring(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return { label: 'Bàn trống', bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' };
            case 'OCCUPIED': return { label: 'Có khách', bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', dot: 'bg-amber-500 animate-pulse' };
            case 'BILL_REQUESTED': return { label: 'Chờ TT', bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 animate-pulse', dot: 'bg-rose-500' };
            case 'RESERVED': return { label: 'Đặt trước', bg: 'bg-blue-50 dark:bg-blue-500/10 text-[#1890ff] dark:text-[#3ba0ff] border-blue-200 dark:border-blue-500/20', dot: 'bg-[#1890ff]' };
            default: return { label: 'Trống', bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' };
        }
    };

    const filteredTables = tables.filter(t => (selectedArea === 'all' || (t as any).area === selectedArea) && (statusFilter === 'all' || t.status === statusFilter));

    const handlePrintBill = () => {
        setTimeout(() => { window.print(); }, 100);
    };

    return (
        <>
            <style type="text/css" media="print">
                {`
                    @page { margin: 0; size: 80mm auto; }
                    body { margin: 0; background: #fff; color: #000; -webkit-print-color-adjust: exact; }
                    .print-receipt { width: 80mm; padding: 5mm; margin: 0 auto; font-family: monospace; font-size: 13px; line-height: 1.4; }
                    .dashed-line { border-top: 1px dashed #000; margin: 6px 0; }
                `}
            </style>

            <div className="fixed inset-0 flex flex-col w-screen h-[100dvh] bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:hidden font-sans box-border overflow-hidden overscroll-none select-none transition-colors duration-300">

                <div className="shrink-0 z-20 shadow-sm border-b border-slate-200/60 dark:border-slate-800/60">
                    <Navbar occupiedTablesCount={tables.filter(t => t.status === 'OCCUPIED' || t.status === 'BILL_REQUESTED').length} />
                </div>

                <main className="flex-1 w-full relative overflow-hidden">
                    <div className="absolute inset-0 overflow-y-auto scrollbar-none overscroll-contain">
                        <div className="max-w-[1400px] mx-auto w-full min-h-full p-4 flex flex-col space-y-4">

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 w-full overflow-x-auto scrollbar-none transition-colors duration-300">
                                <div className="flex flex-nowrap items-center justify-between min-w-max gap-6 px-1">
                                    <div className="flex flex-nowrap items-center gap-2 text-[13px] font-bold">
                                        <button onClick={() => setStatusFilter('all')} className={`shrink-0 px-5 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'all' ? 'bg-[#1890ff] text-white border-[#1890ff] shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-[#1890ff]/10 hover:text-[#1890ff] dark:hover:text-[#1890ff]'}`}>
                                            Tất cả ({tables.length})
                                        </button>
                                        <button onClick={() => setStatusFilter('AVAILABLE')} className={`shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'}`}>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Trống ({tables.filter(t => t.status === 'AVAILABLE').length})
                                        </button>
                                        <button onClick={() => setStatusFilter('OCCUPIED')} className={`shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'OCCUPIED' ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-sm' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20'}`}>
                                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Có khách ({tables.filter(t => t.status === 'OCCUPIED').length})
                                        </button>
                                        <button onClick={() => setStatusFilter('BILL_REQUESTED')} className={`shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'BILL_REQUESTED' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'}`}>
                                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Chờ TT ({tables.filter(t => t.status === 'BILL_REQUESTED').length})
                                        </button>
                                    </div>

                                    <div className="flex flex-nowrap items-center gap-2 shrink-0">
                                        <button onClick={() => setShowTransferModal(true)} className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#1890ff] dark:hover:text-[#1890ff] hover:border-[#1890ff] dark:hover:border-[#1890ff] hover:bg-blue-50 dark:hover:bg-[#1890ff]/10 text-[13px] font-bold transition cursor-pointer shrink-0">
                                            <ArrowRightLeft className="w-4 h-4" /> Chuyển/Gộp
                                        </button>
                                        <button onClick={() => navigate('/order/new-takeaway')} className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1890ff] hover:bg-blue-600 text-white font-bold text-[13px] shadow-sm transition cursor-pointer shrink-0">
                                            <ShoppingBag className="w-4 h-4" /> + Đơn Mang Về
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-none w-full">
                                {areas.map(area => (
                                    <button key={area} onClick={() => setSelectedArea(area)} className={`shrink-0 px-5 py-2.5 rounded-lg text-[13px] font-bold transition whitespace-nowrap cursor-pointer ${selectedArea === area ? 'bg-slate-800 dark:bg-[#1890ff] text-white shadow-sm border border-slate-800 dark:border-[#1890ff]' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1890ff] dark:hover:text-white border border-slate-200 dark:border-slate-800'}`}>
                                        {area === 'all' ? 'Tất cả khu vực' : area}
                                    </button>
                                ))}
                            </div>

                            {loading ? (
                                <div className="text-center text-slate-500 dark:text-slate-400 py-16 flex flex-col items-center">
                                    <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <span className="font-medium text-sm">Đang tải danh sách bàn...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto scrollbar-none w-full">
                                        <div className="grid grid-cols-5 gap-6 pt-2 pb-4 min-w-[1000px]">
                                            {filteredTables.map(table => {
                                                const badge = getStatusBadge(table.status);
                                                const order = activeOrders[table.id];
                                                const capacity = Number((table as any).capacity || (table as any).seats) || 4;

                                                const tableColor = table.status === 'OCCUPIED' ? 'bg-[#fdf6ec] dark:bg-amber-900/20 border-[#f99d1c] dark:border-amber-600/50 shadow-[0_4px_15px_rgba(249,157,28,0.15)] dark:shadow-none'
                                                    : table.status === 'BILL_REQUESTED' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-400 dark:border-rose-500/50 shadow-[0_4px_15px_rgba(244,63,94,0.15)] dark:shadow-none'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#1890ff] dark:hover:border-[#1890ff] hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm';

                                                const chairColor = table.status === 'OCCUPIED' ? 'bg-[#f99d1c] dark:bg-amber-600'
                                                    : table.status === 'BILL_REQUESTED' ? 'bg-rose-400 dark:bg-rose-500 animate-pulse'
                                                        : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-[#1890ff]';

                                                return (
                                                    <div key={table.id} onClick={() => handleTableClick(table)} className="flex flex-col items-center justify-center cursor-pointer group relative pt-8 pb-2 mt-1">
                                                        <div className="absolute top-0 text-[12px] font-bold text-slate-400 dark:text-slate-500 truncate w-full text-center px-1">
                                                            {(table as any).area}
                                                        </div>

                                                        <div className="relative flex items-center justify-center w-[110px] h-[110px] mb-3">
                                                            <div className="absolute -top-3 flex justify-center w-full gap-3">
                                                                <div className={`w-8 h-3 rounded-t-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                                {capacity > 2 && <div className={`w-8 h-3 rounded-t-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>}
                                                            </div>
                                                            <div className="absolute -bottom-3 flex justify-center w-full gap-3">
                                                                <div className={`w-8 h-3 rounded-b-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                                {capacity > 2 && <div className={`w-8 h-3 rounded-b-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>}
                                                            </div>
                                                            {capacity > 4 && (
                                                                <>
                                                                    <div className="absolute -left-3 flex flex-col justify-center h-full gap-3">
                                                                        <div className={`w-3 h-8 rounded-l-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                                    </div>
                                                                    <div className="absolute -right-3 flex flex-col justify-center h-full gap-3">
                                                                        <div className={`w-3 h-8 rounded-r-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                                    </div>
                                                                </>
                                                            )}

                                                            <div className={`relative z-10 w-full h-full rounded-[1.5rem] border-[3px] flex flex-col items-center justify-center transition-all duration-300 ${tableColor}`}>
                                                                <span className={`font-black text-[16px] ${table.status === 'AVAILABLE' ? 'text-slate-500 dark:text-slate-400 group-hover:text-[#1890ff] dark:group-hover:text-white' : 'text-slate-900 dark:text-white'}`}>
                                                                    Bàn {(table as any).tableNumber || (table as any).name}
                                                                </span>
                                                                {order ? (
                                                                    <div className="flex flex-col items-center mt-1">
                                                                        <span className={`text-[13px] font-black ${table.status === 'BILL_REQUESTED' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                                            {formatVND((order as any).totalAmount || (order as any).total || 0)}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 opacity-90">{(order as any).items?.length || (order as any).orderItems?.length || 0} món</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center mt-1.5 text-slate-300 dark:text-slate-600 group-hover:text-[#1890ff] dark:group-hover:text-white transition-colors"><Plus size={20} strokeWidth={3} /></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm transition-transform group-hover:scale-105 ${badge.bg}`}>
                                                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />{badge.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {takeawayOrders.length > 0 && (
                                        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-6 pb-12 w-full">
                                            <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                                                <ShoppingBag className="text-[#1890ff]" size={20} /> Khách Chờ Mang Về ({takeawayOrders.length})
                                            </h3>
                                            <div className="overflow-x-auto scrollbar-none w-full">
                                                <div className="grid grid-cols-5 gap-6 min-w-[1000px]">
                                                    {takeawayOrders.map(order => {
                                                        const isServed = order.status?.toUpperCase() === 'SERVED' || order.status?.toUpperCase() === 'BILL_REQUESTED';
                                                        const cardBg = isServed ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-500/50 shadow-[0_4px_15px_rgba(16,185,129,0.15)] dark:shadow-none' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500/50 shadow-[0_4px_15px_rgba(24,144,255,0.15)] dark:shadow-none';
                                                        const badgeBg = isServed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-blue-100 dark:bg-blue-500/20 text-[#1890ff] dark:text-[#3ba0ff] border-blue-200 dark:border-blue-500/30';
                                                        const dotColor = isServed ? 'bg-emerald-500' : 'bg-[#1890ff] animate-pulse';

                                                        return (
                                                            <div key={order.id as string} onClick={() => handleTakeawayClick(order)} className="flex flex-col items-center justify-center cursor-pointer group relative pt-8 pb-2 mt-1">
                                                                <div className="absolute top-0 text-[12px] font-bold text-slate-400 dark:text-slate-500 truncate w-full text-center px-1">
                                                                    Đơn Mang Về
                                                                </div>
                                                                <div className="relative flex items-center justify-center w-[110px] h-[110px] mb-3">
                                                                    <div className={`relative z-10 w-full h-full rounded-[1.5rem] border-[3px] flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${cardBg} group-hover:scale-105`}>
                                                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 text-[#1890ff] dark:text-[#3ba0ff] flex items-center justify-center shadow-sm mb-1">
                                                                            <ShoppingBag size={16} strokeWidth={2.5} />
                                                                        </div>
                                                                        <span className="font-black text-[14px] text-slate-900 dark:text-white">
                                                                            #{String(order.id || '').slice(-6).toUpperCase()}
                                                                        </span>
                                                                        <div className="flex flex-col items-center mt-1">
                                                                            <span className="text-[13px] font-black text-amber-700 dark:text-amber-400">{formatVND((order as any).totalAmount || 0)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${badgeBg}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />{isServed ? 'Xong' : 'Chờ bếp'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* CÁC MODALS (Action, Transfer, Payment) */}
            {showActionModal && selectedTable && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-sm w-full p-6 shadow-2xl space-y-5 text-center animate-fade-in border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-[#1890ff] dark:text-[#3ba0ff] rounded-2xl flex items-center justify-center mx-auto font-black text-2xl border-2 border-blue-100 dark:border-slate-700">
                            {selectedTable.id === 'takeaway' ? <ShoppingBag size={28} /> : ((selectedTable as any).tableNumber || (selectedTable as any).name)}
                        </div>
                        <div>
                            <h3 className="font-bold text-[18px] text-slate-900 dark:text-white">{selectedTable.id === 'takeaway' ? (selectedTable as any).name : `Bàn ${(selectedTable as any).tableNumber || (selectedTable as any).name} đang phục vụ`}</h3>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Vui lòng chọn thao tác nghiệp vụ:</p>
                        </div>
                        <div className="space-y-3 pt-2">
                            {selectedTable.id !== 'takeaway' && (
                                <button onClick={() => { setShowActionModal(false); navigate(`/order/${encodeURIComponent(selectedTable.id)}`); }} className="w-full py-3.5 bg-blue-50 dark:bg-slate-800 hover:bg-[#1890ff] dark:hover:bg-[#1890ff] text-[#1890ff] dark:text-[#3ba0ff] hover:text-white font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-blue-200 dark:border-slate-700">
                                    <Utensils size={18} /> Xem / Gọi Thêm Món
                                </button>
                            )}
                            <button onClick={handlePrintBill} className="w-full py-3.5 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-emerald-200 dark:border-slate-700">
                                <Printer size={18} /> In Phiếu Tạm Tính
                            </button>
                            {canCheckout ? (
                                <button onClick={() => { setShowActionModal(false); setShowPaymentModal(true); }} className="w-full py-3.5 bg-[#1890ff] hover:bg-blue-600 text-white font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-[#1890ff] dark:border-transparent">
                                    <ShoppingCart size={18} /> Thanh Toán Hóa Đơn
                                </button>
                            ) : (
                                <div className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                                    <Lock size={16} /> Phục vụ không có quyền thu tiền
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowActionModal(false)} className="w-full py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-[13px] transition cursor-pointer border border-slate-200 dark:border-slate-700">Đóng</button>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-md w-full p-6 shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-800 dark:text-white">
                            <ArrowRightLeft className="text-[#1890ff]" size={18} /> Chuyển / Gộp bàn
                        </h3>
                        <div className="space-y-4 text-[13px]">
                            <div className="flex gap-2">
                                <button onClick={() => setTransferType('move')} className={`flex-1 py-2.5 rounded-lg border transition cursor-pointer font-bold ${transferType === 'move' ? 'bg-blue-50 dark:bg-[#1890ff]/20 text-[#1890ff] dark:text-[#3ba0ff] border-[#1890ff] dark:border-[#1890ff]' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Chuyển Bàn</button>
                                <button onClick={() => setTransferType('merge')} className={`flex-1 py-2.5 rounded-lg border transition cursor-pointer font-bold ${transferType === 'merge' ? 'bg-blue-50 dark:bg-[#1890ff]/20 text-[#1890ff] dark:text-[#3ba0ff] border-[#1890ff] dark:border-[#1890ff]' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Gộp Bàn</button>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bàn Nguồn (Đang có khách)</label>
                                <select value={transferSourceId} onChange={(e) => setTransferSourceId(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#1890ff] focus:outline-none cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                                    <option value="">Chọn bàn nguồn...</option>
                                    {tables.filter(t => t.status === 'OCCUPIED' || t.status === 'BILL_REQUESTED').map(t => <option key={t.id} value={t.id}>Bàn {(t as any).tableNumber || (t as any).name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{transferType === 'move' ? 'Bàn Đích (Bàn Trống)' : 'Bàn Đích (Bàn muốn gộp vào)'}</label>
                                <select value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#1890ff] focus:outline-none cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                                    <option value="">Chọn bàn đích...</option>
                                    {tables.filter(t => transferType === 'move' ? t.status === 'AVAILABLE' : (t.status === 'OCCUPIED' && t.id !== transferSourceId)).map(t => <option key={t.id} value={t.id}>Bàn {(t as any).tableNumber || (t as any).name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                                <button onClick={() => { setShowTransferModal(false); setTransferSourceId(''); setTransferTargetId(''); }} className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer" disabled={isTransferring}>
                                    Hủy
                                </button>
                                <button disabled={!transferSourceId || !transferTargetId || isTransferring} onClick={handleExecuteTransfer} className="w-2/3 py-3 bg-[#1890ff] hover:bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide">
                                    {isTransferring ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Xử lý...</> : 'Xác Nhận'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && selectedTable && activeOrder && (
                <div className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[150] print:hidden font-sans select-none">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-800">

                        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            <div>
                                <h3 className="text-[16px] font-black flex items-center gap-2 text-slate-800 dark:text-white">
                                    <ShoppingCart size={20} className="text-[#1890ff]" /> Thanh Toán {(selectedTable as any).name || `Bàn ${(selectedTable as any).tableNumber}`}
                                </h3>
                                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Mã đơn: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded font-bold">#{String(activeOrder.id || (activeOrder as any)._id || '').slice(-6).toUpperCase()}</span> • {(activeOrder as any).items?.length || (activeOrder as any).orderItems?.length || 0} món</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 p-2 rounded-full transition cursor-pointer"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900 scrollbar-none">
                            <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Chiết khấu / Giảm giá</label>
                                    <div className="flex gap-0 border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden focus-within:border-[#1890ff] focus-within:ring-1 focus-within:ring-[#1890ff]">
                                        <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-full p-2.5 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white outline-none text-[13px]" placeholder="0" />
                                        <select value={discountType} onChange={(e: any) => setDiscountType(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-l border-slate-300 dark:border-slate-600 px-3 font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer text-[12px]">
                                            <option value="PERCENT">%</option>
                                            <option value="AMOUNT">VNĐ</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6 px-4">
                                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Thuế VAT (8%)</span>
                                    <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="w-5 h-5 accent-[#1890ff] cursor-pointer rounded" />
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-slate-800 dark:text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
                                <div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">TỔNG CẦN THU</span>
                                    <span className="text-3xl sm:text-4xl font-black text-[#1890ff] dark:text-[#3ba0ff] tracking-tight">{formatVND(finalTotal)}</span>
                                </div>
                                <div className="text-right text-[12px] text-slate-500 dark:text-slate-400 space-y-1 font-medium">
                                    <div>Tạm tính: <span className="font-bold text-slate-700 dark:text-slate-300">{formatVND(subtotal)}</span></div>
                                    {discountAmount > 0 && <div className="text-rose-500 dark:text-rose-400 font-bold">Giảm: -{formatVND(discountAmount)}</div>}
                                    {vatAmount > 0 && <div className="font-bold">VAT 8%: +{formatVND(vatAmount)}</div>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">HÌNH THỨC THANH TOÁN</label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                                    {[
                                        { id: 'CASH', label: 'Tiền mặt', icon: DollarSign },
                                        { id: 'QR', label: 'VietQR', icon: QrCode },
                                        { id: 'CARD', label: 'Thẻ POS', icon: CreditCard },
                                        { id: 'MOMO', label: 'Ví MoMo', icon: Wallet },
                                        { id: 'SPLIT', label: 'Tách kênh', icon: Layers },
                                    ].map(m => {
                                        const Icon = m.icon;
                                        const isActive = paymentMethod === m.id;
                                        return (
                                            <button key={m.id} onClick={() => setPaymentMethod(m.id as any)} className={`py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isActive ? 'bg-white dark:bg-slate-800 border-[#1890ff] dark:border-[#1890ff] text-[#1890ff] dark:text-[#3ba0ff] shadow-sm ring-1 ring-[#1890ff]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                                <Icon size={20} />
                                                <span className="text-[11px] font-bold">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-1">
                                {paymentMethod === 'CASH' && (
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                        <div>
                                            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 block mb-2">Khách đưa (VNĐ):</label>
                                            <input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-[16px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">Gợi ý nhanh:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {quickCashList.map(amt => (
                                                    <button key={amt} onClick={() => setCashGiven(amt)} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:border-[#1890ff] dark:hover:border-[#1890ff] hover:text-[#1890ff] dark:hover:text-[#3ba0ff] transition cursor-pointer">
                                                        {formatVND(amt)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                                            <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400">Tiền thối lại:</span>
                                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatVND(changeAmount)}</span>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'SPLIT' && (
                                    <div className="space-y-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 block mb-2">Tiền mặt</label>
                                                <input type="number" value={splitCash || ''} onChange={(e) => { const v = Number(e.target.value); setSplitCash(v); setSplitTransfer(Math.max(0, finalTotal - v)); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-bold text-[14px] text-slate-900 dark:text-white outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 block mb-2">Chuyển khoản</label>
                                                <input type="number" value={splitTransfer || ''} onChange={(e) => { const v = Number(e.target.value); setSplitTransfer(v); setSplitCash(Math.max(0, finalTotal - v)); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-bold text-[14px] text-slate-900 dark:text-white outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all" />
                                            </div>
                                        </div>
                                        <div className="text-center text-[12px] text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                            Tổng chia: <strong className={splitCash + splitTransfer === finalTotal ? 'text-emerald-600 dark:text-emerald-400 text-[14px]' : 'text-rose-600 dark:text-rose-400 text-[14px]'}>{formatVND(splitCash + splitTransfer)}</strong> / {formatVND(finalTotal)}
                                        </div>
                                    </div>
                                )}

                                {(paymentMethod === 'QR' || paymentMethod === 'MOMO') && (
                                    <div className="flex flex-col sm:flex-row items-center justify-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 gap-5 sm:gap-6 shadow-sm">
                                        <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex items-center justify-center p-2">
                                            <img src={`https://img.vietqr.io/image/970422-0123456789-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent('ThanhToan_' + ((selectedTable as any).tableNumber || 'Ban'))}`} alt="VietQR" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                        </div>
                                        <div className="space-y-1 text-center sm:text-left">
                                            <p className="text-[15px] font-black text-slate-800 dark:text-white">Quét mã {paymentMethod === 'MOMO' ? 'MoMo' : 'VietQR'}</p>
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Mở ứng dụng Ngân hàng để quét.</p>
                                            <div className="mt-3 inline-block bg-blue-50 dark:bg-[#1890ff]/20 text-[#1890ff] dark:text-[#3ba0ff] px-4 py-2 rounded-xl text-[15px] font-black border border-blue-200 dark:border-[#1890ff] tracking-tight">
                                                {formatVND(finalTotal)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'CARD' && (
                                    <div className="py-10 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                                        <CreditCard className="w-14 h-14 text-[#1890ff] mx-auto mb-3" strokeWidth={1.5} />
                                        <p className="font-bold text-slate-800 dark:text-white text-[16px]">Quẹt thẻ trên máy POS</p>
                                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Hỗ trợ Visa, Master, Napas, Apple Pay</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            <button onClick={() => setShowPaymentModal(false)} className="w-1/3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 py-3.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer">Hủy bỏ</button>
                            <button onClick={handleCheckout} disabled={(paymentMethod === 'CASH' && Number(cashGiven) < finalTotal) || (paymentMethod === 'SPLIT' && splitCash + splitTransfer !== finalTotal)} className="w-2/3 bg-[#1890ff] hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 text-white py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-wider border border-transparent">
                                <CheckCircle size={18} /> HOÀN TẤT THU TIỀN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}