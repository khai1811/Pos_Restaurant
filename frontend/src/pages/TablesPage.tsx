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

    const fetchTablesAndOrders = useCallback(async () => {
        try {
            const res: any = await tableApi.getAll();
            const rawTables = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);

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

            try {
                const orderRes = await axiosClient.get('/orders');
                const rawOrders = Array.isArray(orderRes.data) ? orderRes.data : (orderRes.data?.data || []);

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
                        // 🔥 DIỆT TẬN GỐC "BÀN MA": Hễ không có đơn hàng, ép bàn về màu Xanh!
                        if (table.status !== 'RESERVED') {
                            table.status = 'AVAILABLE';
                        }
                    }
                });
                setActiveOrders(ordersMap);

            } catch (e) {
                console.error("Lỗi lấy danh sách đơn", e);
            }

            setTables(formattedTables);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bàn:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTablesAndOrders();
        const intervalId = setInterval(() => fetchTablesAndOrders(), 5000);
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

            // 🔥 ÉP BACKEND DỌN BÀN NGAY LẬP TỨC NẾU CHƯA DỌN
            if (selectedTable.id !== 'takeaway') {
                try {
                    await axiosClient.put(`/tables/${selectedTable.id}/status`, { status: 'AVAILABLE' }).catch(() =>
                        axiosClient.patch(`/tables/${selectedTable.id}/status`, { status: 'AVAILABLE' })
                    ).catch(() => { });
                } catch (e) { }
            }

            alert(`Thanh toán thành công ${finalTotal.toLocaleString('vi-VN')} đ!`);
            setShowPaymentModal(false); setSelectedTable(null); setActiveOrder(null); setDiscountValue(0);
            fetchTablesAndOrders();
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
            fetchTablesAndOrders();
        } catch (error: any) {
            console.error('Lỗi chuyển/gộp bàn:', error);
            alert(error.response?.data?.message || `Hệ thống lỗi khi thực hiện ${transferType === 'move' ? 'chuyển' : 'gộp'} bàn!`);
        } finally {
            setIsTransferring(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return { label: 'Bàn trống', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' };
            case 'OCCUPIED': return { label: 'Có khách', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
            case 'BILL_REQUESTED': return { label: 'Chờ TT', bg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse', dot: 'bg-rose-500' };
            case 'RESERVED': return { label: 'Đặt trước', bg: 'bg-blue-50 text-[#1890ff] border-blue-200', dot: 'bg-[#1890ff]' };
            default: return { label: 'Trống', bg: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
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

            <div className="flex h-screen bg-[#f0f2f5] text-slate-900 print:hidden font-sans">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar occupiedTablesCount={tables.filter(t => t.status === 'OCCUPIED' || t.status === 'BILL_REQUESTED').length} />

                    <main className="flex-1 p-3 md:p-5 lg:p-6 space-y-4 overflow-y-auto">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium w-full xl:w-auto">
                                <button onClick={() => setStatusFilter('all')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'all' ? 'bg-[#1890ff] text-white border-[#1890ff] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-[#1890ff]'}`}>
                                    Tất cả ({tables.length})
                                </button>
                                <button onClick={() => setStatusFilter('AVAILABLE')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Trống ({tables.filter(t => t.status === 'AVAILABLE').length})
                                </button>
                                <button onClick={() => setStatusFilter('OCCUPIED')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'OCCUPIED' ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-sm' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'}`}>
                                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Có khách ({tables.filter(t => t.status === 'OCCUPIED').length})
                                </button>
                                <button onClick={() => setStatusFilter('BILL_REQUESTED')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border transition cursor-pointer ${statusFilter === 'BILL_REQUESTED' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Chờ TT ({tables.filter(t => t.status === 'BILL_REQUESTED').length})
                                </button>
                            </div>
                            <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                                <button onClick={() => setShowTransferModal(true)} className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:text-[#1890ff] hover:border-[#1890ff] hover:bg-blue-50 text-[13px] font-bold transition cursor-pointer">
                                    <ArrowRightLeft className="w-4 h-4" /> Chuyển/Gộp
                                </button>
                                <button onClick={() => navigate('/order/new-takeaway')} className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1890ff] hover:bg-blue-600 text-white font-bold text-[13px] shadow-sm transition cursor-pointer">
                                    <ShoppingBag className="w-4 h-4" /> + Đơn Mang Về
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
                            {areas.map(area => (
                                <button key={area} onClick={() => setSelectedArea(area)} className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition whitespace-nowrap cursor-pointer ${selectedArea === area ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                                    {area === 'all' ? 'Tất cả khu vực' : area}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="text-center text-slate-500 py-16 flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                                Đang tải danh sách bàn...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-10 sm:gap-x-5 md:gap-y-14 lg:gap-y-16 pt-8 pb-4">
                                    {filteredTables.map(table => {
                                        const badge = getStatusBadge(table.status);
                                        const order = activeOrders[table.id];
                                        const capacity = Number((table as any).capacity || (table as any).seats) || 4;

                                        const tableColor = table.status === 'OCCUPIED' ? 'bg-amber-100/90 border-amber-400 shadow-amber-200/50'
                                            : table.status === 'BILL_REQUESTED' ? 'bg-rose-100/90 border-rose-400 shadow-rose-200/50'
                                                : 'bg-white border-slate-200 hover:border-[#1890ff] hover:bg-blue-50 shadow-sm';

                                        const chairColor = table.status === 'OCCUPIED' ? 'bg-amber-400'
                                            : table.status === 'BILL_REQUESTED' ? 'bg-rose-400 animate-pulse'
                                                : 'bg-slate-200 group-hover:bg-[#1890ff]';

                                        return (
                                            <div key={table.id} onClick={() => handleTableClick(table)} className="flex flex-col items-center justify-center cursor-pointer group relative">
                                                <div className="absolute -top-7 md:-top-9 text-[11px] md:text-[12px] font-bold text-slate-400 mb-2 truncate max-w-full px-2">{(table as any).area}</div>

                                                <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mb-4">
                                                    <div className="absolute -top-3 md:-top-3.5 flex justify-center w-full gap-3 md:gap-4">
                                                        <div className={`w-8 md:w-10 h-3 md:h-3.5 rounded-t-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                        {capacity > 2 && <div className={`w-8 md:w-10 h-3 md:h-3.5 rounded-t-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>}
                                                    </div>
                                                    <div className="absolute -bottom-3 md:-bottom-3.5 flex justify-center w-full gap-3 md:gap-4">
                                                        <div className={`w-8 md:w-10 h-3 md:h-3.5 rounded-b-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                        {capacity > 2 && <div className={`w-8 md:w-10 h-3 md:h-3.5 rounded-b-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>}
                                                    </div>
                                                    {capacity > 4 && (
                                                        <>
                                                            <div className="absolute -left-3 md:-left-3.5 flex flex-col justify-center h-full gap-3 md:gap-4">
                                                                <div className={`w-3 md:w-3.5 h-8 md:h-10 rounded-l-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                            </div>
                                                            <div className="absolute -right-3 md:-right-3.5 flex flex-col justify-center h-full gap-3 md:gap-4">
                                                                <div className={`w-3 md:w-3.5 h-8 md:h-10 rounded-r-full transition-colors duration-300 shadow-sm ${chairColor}`}></div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className={`relative z-10 w-full h-full rounded-[1.5rem] md:rounded-[2rem] border-[3px] flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${tableColor}`}>
                                                        <span className={`font-black text-lg md:text-xl lg:text-2xl ${table.status === 'AVAILABLE' ? 'text-slate-400 group-hover:text-[#1890ff]' : 'text-slate-900'}`}>
                                                            Bàn {(table as any).tableNumber || (table as any).name}
                                                        </span>
                                                        {order ? (
                                                            <div className="flex flex-col items-center mt-1">
                                                                <span className={`text-[13px] md:text-[15px] font-black ${table.status === 'BILL_REQUESTED' ? 'text-rose-600' : 'text-amber-700'}`}>
                                                                    {formatVND((order as any).totalAmount || (order as any).total || 0)}
                                                                </span>
                                                                <span className="text-[11px] md:text-[12px] font-bold text-slate-600 mt-0.5 opacity-90">{(order as any).items?.length || (order as any).orderItems?.length || 0} món</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center mt-1.5 text-slate-300 group-hover:text-[#1890ff] transition-colors"><Plus className="w-6 h-6 md:w-8 md:h-8" /></div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-sm transition-transform group-hover:scale-105 ${badge.bg}`}>
                                                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />{badge.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* KHU VỰC ĐƠN MANG VỀ */}
                                {takeawayOrders.length > 0 && (
                                    <div className="mt-8 border-t border-slate-200 pt-8 pb-12">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <ShoppingBag className="text-[#1890ff]" /> Đơn Khách Chờ / Mang Về ({takeawayOrders.length})
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6">
                                            {takeawayOrders.map(order => {
                                                const isServed = order.status?.toUpperCase() === 'SERVED' || order.status?.toUpperCase() === 'BILL_REQUESTED';

                                                const cardBg = isServed ? 'bg-emerald-100/95 border-emerald-400 shadow-emerald-200/50' : 'bg-blue-50/90 border-blue-400 shadow-blue-200/50';
                                                const badgeBg = isServed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-[#1890ff] border-blue-200';
                                                const dotColor = isServed ? 'bg-emerald-500' : 'bg-[#1890ff] animate-pulse';

                                                return (
                                                    <div
                                                        key={order.id as string}
                                                        onClick={() => handleTakeawayClick(order)}
                                                        className="flex flex-col items-center justify-center cursor-pointer group relative pt-4"
                                                    >
                                                        <div className="absolute -top-1 text-[11px] md:text-[12px] font-bold text-slate-400 mb-2">Đơn Mang Về</div>

                                                        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mb-4">
                                                            <div className={`relative z-10 w-full h-full rounded-[1.5rem] md:rounded-[2rem] border-[3px] flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${cardBg} group-hover:scale-105`}>
                                                                <div className="w-10 h-10 rounded-full bg-white/80 text-[#1890ff] flex items-center justify-center shadow-sm mb-1">
                                                                    <ShoppingBag size={20} />
                                                                </div>
                                                                <span className="font-black text-sm md:text-base text-slate-900">
                                                                    #{String(order.id || '').slice(-6).toUpperCase()}
                                                                </span>
                                                                <div className="flex flex-col items-center mt-1">
                                                                    <span className="text-[13px] md:text-[14px] font-black text-amber-700">
                                                                        {formatVND((order as any).totalAmount || 0)}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold text-slate-600 mt-0.5 opacity-90">
                                                                        {(order as any).items?.length || (order as any).orderItems?.length || 0} món
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-sm ${badgeBg}`}>
                                                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                                            {isServed ? 'Đã nấu xong' : 'Chờ bếp nấu'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Modal Lựa chọn thao tác nghiệp vụ */}
            {showActionModal && selectedTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-blue-50 text-[#1890ff] rounded-2xl flex items-center justify-center mx-auto font-black text-2xl border-2 border-blue-100">
                            {selectedTable.id === 'takeaway' ? <ShoppingBag size={28} /> : ((selectedTable as any).tableNumber || (selectedTable as any).name)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{selectedTable.id === 'takeaway' ? (selectedTable as any).name : `Bàn ${(selectedTable as any).tableNumber || (selectedTable as any).name} đang phục vụ`}</h3>
                            <p className="text-[13px] text-slate-500 mt-1">Vui lòng chọn thao tác nghiệp vụ:</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {selectedTable.id !== 'takeaway' && (
                                <button onClick={() => { setShowActionModal(false); navigate(`/order/${encodeURIComponent(selectedTable.id)}`); }} className="w-full py-4 bg-blue-50 hover:bg-[#1890ff] text-[#1890ff] hover:text-white font-bold rounded-xl text-[15px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-blue-200">
                                    <Utensils size={20} /> Xem / Gọi Thêm Món
                                </button>
                            )}

                            <button onClick={handlePrintBill} className="w-full py-4 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white font-bold rounded-xl text-[15px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-emerald-200">
                                <Printer size={20} /> In Phiếu Tạm Tính
                            </button>

                            {canCheckout ? (
                                <button onClick={() => { setShowActionModal(false); setShowPaymentModal(true); }} className="w-full py-4 bg-[#1890ff] hover:bg-blue-600 text-white font-bold rounded-xl text-[15px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer">
                                    <ShoppingCart size={20} /> Thanh Toán Hóa Đơn
                                </button>
                            ) : (
                                <div className="w-full py-4 bg-slate-50 text-slate-400 font-bold rounded-xl text-[14px] flex items-center justify-center gap-2 border border-slate-200">
                                    <Lock size={18} /> Phục vụ không có quyền thu tiền
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowActionModal(false)} className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-[15px] transition cursor-pointer border border-slate-200">Đóng</button>
                    </div>
                </div>
            )}

            {/* Modal Chuyển / Gộp bàn */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800">
                            <ArrowRightLeft className="text-[#1890ff]" /> Chuyển / Gộp bàn
                        </h3>
                        <div className="space-y-4 text-[13px] font-medium">
                            <div className="flex gap-2">
                                <button onClick={() => setTransferType('move')} className={`flex-1 py-2.5 rounded-lg border transition cursor-pointer font-bold ${transferType === 'move' ? 'bg-blue-50 text-[#1890ff] border-[#1890ff]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>Chuyển Bàn</button>
                                <button onClick={() => setTransferType('merge')} className={`flex-1 py-2.5 rounded-lg border transition cursor-pointer font-bold ${transferType === 'merge' ? 'bg-blue-50 text-[#1890ff] border-[#1890ff]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>Gộp Bàn</button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Bàn Nguồn (Đang có khách)</label>
                                <select value={transferSourceId} onChange={(e) => setTransferSourceId(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:border-[#1890ff] focus:outline-none">
                                    <option value="">Chọn bàn nguồn...</option>
                                    {tables.filter(t => t.status === 'OCCUPIED' || t.status === 'BILL_REQUESTED').map(t => <option key={t.id} value={t.id}>Bàn {(t as any).tableNumber || (t as any).name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">{transferType === 'move' ? 'Bàn Đích (Bàn Trống)' : 'Bàn Đích (Bàn muốn gộp vào)'}</label>
                                <select value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:border-[#1890ff] focus:outline-none">
                                    <option value="">Chọn bàn đích...</option>
                                    {tables.filter(t => transferType === 'move' ? t.status === 'AVAILABLE' : (t.status === 'OCCUPIED' && t.id !== transferSourceId)).map(t => <option key={t.id} value={t.id}>Bàn {(t as any).tableNumber || (t as any).name}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => { setShowTransferModal(false); setTransferSourceId(''); setTransferTargetId(''); }}
                                    className="w-1/3 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition cursor-pointer"
                                    disabled={isTransferring}
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={!transferSourceId || !transferTargetId || isTransferring}
                                    onClick={handleExecuteTransfer}
                                    className="w-2/3 py-3 bg-[#1890ff] hover:bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
                                >
                                    {isTransferring ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Xử lý...</>
                                    ) : (
                                        'Xác Nhận'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thanh toán */}
            {showPaymentModal && selectedTable && activeOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden font-sans">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-2 text-slate-800">
                                    <ShoppingCart size={22} className="text-[#1890ff]" /> Thanh Toán {(selectedTable as any).name || `Bàn ${(selectedTable as any).tableNumber}`}
                                </h3>
                                <p className="text-[13px] text-slate-500 mt-1">Mã đơn: <span className="font-mono bg-slate-100 px-1 rounded">#{String(activeOrder.id || (activeOrder as any)._id || '').slice(-6).toUpperCase()}</span> • {(activeOrder as any).items?.length || (activeOrder as any).orderItems?.length || 0} món</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-lg transition cursor-pointer"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-slate-700">Chiết khấu / Giảm giá</label>
                                    <div className="flex gap-0 border border-slate-300 rounded-lg overflow-hidden">
                                        <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-full p-2.5 bg-white font-bold text-slate-800 focus:outline-none" placeholder="0" />
                                        <select value={discountType} onChange={(e: any) => setDiscountType(e.target.value)} className="bg-slate-50 border-l border-slate-300 px-3 font-bold text-slate-700 outline-none cursor-pointer">
                                            <option value="PERCENT">%</option>
                                            <option value="AMOUNT">VNĐ</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6 px-4">
                                    <span className="text-[14px] font-bold text-slate-700">Thuế VAT (8%)</span>
                                    <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="w-5 h-5 accent-[#1890ff] cursor-pointer rounded" />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 text-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">TỔNG CẦN THU</span>
                                    <span className="text-4xl font-black text-[#1890ff]">{formatVND(finalTotal)}</span>
                                </div>
                                <div className="text-right text-[13px] text-slate-500 space-y-1">
                                    <div>Tạm tính: <span className="font-bold text-slate-700">{formatVND(subtotal)}</span></div>
                                    {discountAmount > 0 && <div className="text-rose-500">Giảm: -{formatVND(discountAmount)}</div>}
                                    {vatAmount > 0 && <div>VAT 8%: +{formatVND(vatAmount)}</div>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">HÌNH THỨC THANH TOÁN</label>
                                <div className="grid grid-cols-5 gap-2.5">
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
                                            <button key={m.id} onClick={() => setPaymentMethod(m.id as any)} className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${isActive ? 'bg-white border-[#1890ff] text-[#1890ff] shadow-sm ring-1 ring-[#1890ff]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}>
                                                <Icon size={24} />
                                                <span className="text-[11px] font-bold">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-1">
                                {paymentMethod === 'CASH' && (
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                                        <div>
                                            <label className="text-[13px] font-bold text-slate-700 block mb-2">Khách đưa (VNĐ):</label>
                                            <input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-[#1890ff] shadow-inner" />
                                        </div>
                                        <div>
                                            <span className="text-[12px] font-medium text-slate-500 block mb-2">Gợi ý nhanh:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {quickCashList.map(amt => (
                                                    <button key={amt} onClick={() => setCashGiven(amt)} className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:border-[#1890ff] hover:text-[#1890ff] transition cursor-pointer">
                                                        {formatVND(amt)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                                            <span className="text-[15px] font-bold text-slate-600">Tiền thối lại:</span>
                                            <span className="text-2xl font-black text-emerald-600">{formatVND(changeAmount)}</span>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'SPLIT' && (
                                    <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[13px] font-bold text-slate-700 block mb-2">Tiền mặt</label>
                                                <input
                                                    type="number" value={splitCash || ''}
                                                    onChange={(e) => { const v = Number(e.target.value); setSplitCash(v); setSplitTransfer(Math.max(0, finalTotal - v)); }}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#1890ff]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[13px] font-bold text-slate-700 block mb-2">Chuyển khoản</label>
                                                <input
                                                    type="number" value={splitTransfer || ''}
                                                    onChange={(e) => { const v = Number(e.target.value); setSplitTransfer(v); setSplitCash(Math.max(0, finalTotal - v)); }}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#1890ff]"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center text-[13px] text-slate-500 font-medium">
                                            Tổng chia: <strong className={splitCash + splitTransfer === finalTotal ? 'text-emerald-600 text-base' : 'text-rose-600 text-base'}>{formatVND(splitCash + splitTransfer)}</strong> / {formatVND(finalTotal)}
                                        </div>
                                    </div>
                                )}

                                {(paymentMethod === 'QR' || paymentMethod === 'MOMO') && (
                                    <div className="flex items-center justify-center bg-white p-6 rounded-xl border border-slate-200 gap-6 shadow-sm">
                                        <div className="w-48 h-48 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 shadow-sm">
                                            <img src={`https://img.vietqr.io/image/970422-0123456789-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent('ThanhToan_' + ((selectedTable as any).tableNumber || 'Ban'))}`} alt="VietQR" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold text-slate-800">Quét mã {paymentMethod === 'MOMO' ? 'MoMo' : 'VietQR'}</p>
                                            <p className="text-[13px] text-slate-500">Mở ứng dụng Ngân hàng hoặc Ví điện tử để quét mã.</p>
                                            <div className="mt-4 inline-block bg-blue-50 text-[#1890ff] px-4 py-2 rounded-lg text-lg font-black border border-blue-200">
                                                {formatVND(finalTotal)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'CARD' && (
                                    <div className="py-10 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <CreditCard className="w-16 h-16 text-[#1890ff] mx-auto mb-4" />
                                        <p className="font-bold text-slate-800 text-lg">Quẹt thẻ trên máy POS</p>
                                        <p className="text-[13px] text-slate-500 mt-1">Hỗ trợ Visa, Master, Napas, Apple Pay</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-slate-200 mt-4">
                                <button onClick={() => setShowPaymentModal(false)} className="w-1/3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-3.5 rounded-lg text-[14px] font-bold transition-colors cursor-pointer shadow-sm">Hủy bỏ</button>
                                <button onClick={handleCheckout} disabled={(paymentMethod === 'CASH' && Number(cashGiven) < finalTotal) || (paymentMethod === 'SPLIT' && splitCash + splitTransfer !== finalTotal)} className="w-2/3 bg-[#1890ff] hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white py-3.5 rounded-lg text-[14px] font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md uppercase tracking-wide">
                                    <CheckCircle size={20} /> HOÀN TẤT THU TIỀN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GIAO DIỆN IN LẠI BILL */}
            {activeOrder && selectedTable && (
                <div className="hidden print:block print-receipt">
                    <div className="text-center mb-4">
                        <h2 className="text-[18px] font-black uppercase mb-1">NHÀ HÀNG GOURMET</h2>
                        <p className="text-[11px] mb-1">Khu Di Sản Thiên Nhiên, Nha Trang</p>
                        <p className="text-[11px] mb-3">Hotline: 0988.999.888</p>
                        <h3 className="text-[16px] font-black uppercase mt-2">HÓA ĐƠN TẠM TÍNH</h3>
                    </div>

                    <div className="text-[12px] mb-2 leading-tight space-y-1">
                        <p><strong>Vị trí:</strong> {selectedTable.id === 'takeaway' ? 'Đơn Mang Về' : `Bàn ${(selectedTable as any).tableNumber || (selectedTable as any).name}`}</p>
                        <p><strong>Ngày:</strong> {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}</p>
                        <p><strong>Thu ngân:</strong> {currentUser?.fullName || 'Thu ngân'}</p>
                        <p><strong>Mã HĐ:</strong> #{String(activeOrder.id || (activeOrder as any)._id || '').slice(-6).toUpperCase()}</p>
                    </div>

                    <div className="dashed-line"></div>
                    <table className="w-full text-[12px] text-left leading-tight">
                        <thead>
                            <tr>
                                <th className="py-1 font-bold w-1/2">Tên món</th>
                                <th className="py-1 font-bold text-center w-1/6">SL</th>
                                <th className="py-1 font-bold text-right w-1/3">T.Tiền</th>
                            </tr>
                        </thead>
                    </table>
                    <div className="dashed-line"></div>

                    <table className="w-full text-[12px] text-left leading-tight">
                        <tbody>
                            {((activeOrder as any).items || (activeOrder as any).orderItems || []).map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-1 w-1/2 pr-1">{item.menuItem?.name || item.name}</td>
                                    <td className="py-1 text-center align-top w-1/6">{item.quantity}</td>
                                    <td className="py-1 text-right align-top w-1/3">{((item.price || item.menuItem?.price || 0) * item.quantity).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="dashed-line"></div>
                    <div className="space-y-1 text-[12px] leading-tight">
                        <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span>{subtotal.toLocaleString('vi-VN')} đ</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Giảm giá:</span>
                                <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                        )}
                        {vatAmount > 0 && (
                            <div className="flex justify-between">
                                <span>VAT (8%):</span>
                                <span>{vatAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                        )}
                    </div>

                    <div className="dashed-line"></div>
                    <div className="flex justify-between items-center text-[16px] font-black uppercase mt-1">
                        <span>TỔNG CỘNG:</span>
                        <span>{finalTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="dashed-line mt-2"></div>

                    <div className="text-center mt-3 text-[11px] leading-tight space-y-1">
                        <p>Cảm ơn Quý Khách và Hẹn Gặp Lại!</p>
                        <p>Wifi: GOURMET_FREE - Pass: 88889999</p>
                        <p className="italic mt-1 text-[10px]">Powered by POS System</p>
                    </div>
                </div>
            )}
        </>
    );
}