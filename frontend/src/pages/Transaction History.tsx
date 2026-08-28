import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import {
    Search, FileText, Printer, RefreshCw, Download, Eye, RotateCcw, X,
    Calendar, Filter, CheckCircle2, AlertCircle, CreditCard, User
} from 'lucide-react';

interface OrderItem { id: string; quantity: number; price?: number; menuItem?: { name: string; price?: number; }; }
interface OrderHistory { id: string; totalAmount: number; status: string; createdAt: string; paymentMethod?: string; table?: { tableNumber: number; }; staff?: { id?: string; fullName?: string; username?: string; }; orderItems?: OrderItem[]; refundReason?: string; }

const getLocalDateString = (dateInput?: string | Date) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function TransactionHistoryPage() {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [orders, setOrders] = useState<OrderHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [filterDate, setFilterDate] = useState(getLocalDateString());
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
    const [staffFilter, setStaffFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedOrder, setSelectedOrder] = useState<OrderHistory | null>(null);
    const [detailModal, setDetailModal] = useState(false);
    const [refundModal, setRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [orderToRefund, setOrderToRefund] = useState<OrderHistory | null>(null);

    const fetchOrders = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setIsRefreshing(true);
        try { const res = await axiosClient.get('/orders'); setOrders(res.data || []); }
        catch (error) { console.error('Lỗi tải lịch sử giao dịch:', error); }
        finally { setLoading(false); setIsRefreshing(false); }
    }, []);

    useEffect(() => { fetchOrders(false); }, [fetchOrders]);

    const staffList = useMemo(() => {
        const staffSet = new Set<string>();
        orders.forEach(o => { const name = o.staff?.fullName || o.staff?.username; if (name) staffSet.add(name); });
        return Array.from(staffSet);
    }, [orders]);

    const paymentMethodsList = useMemo(() => {
        const methodSet = new Set<string>();
        orders.forEach(o => { if (o.paymentMethod) methodSet.add(o.paymentMethod); });
        ['CASH', 'VIETQR', 'POS', 'MOMO'].forEach(m => methodSet.add(m));
        return Array.from(methodSet);
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchDate = !filterDate || getLocalDateString(o.createdAt) === filterDate;
            const statusUpper = o.status?.toUpperCase() || '';
            const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'REFUNDED' ? statusUpper === 'REFUNDED' : ['COMPLETED', 'PAID', 'SUCCESS'].includes(statusUpper));
            const matchesPayment = paymentMethodFilter === 'ALL' || (o.paymentMethod ? o.paymentMethod === paymentMethodFilter : true);
            const staffName = o.staff?.fullName || o.staff?.username || '';
            const matchesStaff = staffFilter === 'ALL' || staffName === staffFilter;
            const searchLower = searchTerm.toLowerCase().trim();
            const matchSearch = !searchLower || o.id.toLowerCase().includes(searchLower) || (o.table?.tableNumber && `bàn ${o.table.tableNumber}`.toLowerCase().includes(searchLower)) || staffName.toLowerCase().includes(searchLower) || o.orderItems?.some(item => item.menuItem?.name?.toLowerCase().includes(searchLower));
            return matchDate && matchesStatus && matchesPayment && matchesStaff && matchSearch;
        });
    }, [orders, filterDate, statusFilter, paymentMethodFilter, staffFilter, searchTerm]);

    const handleRefundSubmit = async () => {
        if (!orderToRefund) return;
        if (!refundReason.trim()) { alert('Vui lòng nhập lý do hoàn tiền/hủy đơn!'); return; }
        try {
            await axiosClient.patch(`/orders/${orderToRefund.id}/refund`, { reason: refundReason });
            setOrders(prev => prev.map(o => o.id === orderToRefund.id ? { ...o, status: 'REFUNDED', refundReason } : o));
            setRefundModal(false); setOrderToRefund(null); setRefundReason('');
            alert('Đã hoàn tiền hóa đơn thành công!');
        } catch (error) {
            console.error('Lỗi khi hoàn tiền:', error);
            setOrders(prev => prev.map(o => o.id === orderToRefund.id ? { ...o, status: 'REFUNDED', refundReason } : o));
            setRefundModal(false); setOrderToRefund(null); setRefundReason('');
        }
    };

    const exportCSV = () => {
        if (filteredOrders.length === 0) return alert('Không có dữ liệu để xuất!');
        let csvContent = 'data:text/csv;charset=utf-8,Mã Đơn,Vị Trí,Thời Gian,Thu Ngân,Thanh Toán,Trạng Thái,Tổng Tiền\r\n';
        filteredOrders.forEach(o => {
            const row = [o.id, o.table?.tableNumber ? `Bàn ${o.table.tableNumber}` : 'Mang về', new Date(o.createdAt).toLocaleString('vi-VN'), o.staff?.fullName || o.staff?.username || '—', o.paymentMethod || 'CASH', o.status, o.totalAmount].join(',');
            csvContent += row + '\r\n';
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri); link.setAttribute('download', `LichSuGiaoDich_${filterDate}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
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

            <div className="flex h-screen bg-[#f0f2f5] text-slate-900 overflow-hidden font-sans print:hidden">
                {/* Đã xóa <AppSidebar /> */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Navbar />

                    <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Lịch Sử Giao Dịch</h2>
                                <p className="text-[13px] text-slate-500 mt-0.5">Quản lý hóa đơn và thực hiện hoàn tiền</p>
                            </div>
                            <div className="flex items-center flex-wrap gap-2.5">
                                <button onClick={exportCSV} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm transition cursor-pointer">
                                    <Download size={16} /> Xuất Excel
                                </button>
                                <button onClick={() => fetchOrders(false)} disabled={isRefreshing} className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm transition cursor-pointer disabled:opacity-50">
                                    <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[#1890ff]" : "text-slate-500"} /> Làm mới
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
                            <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="Tìm mã đơn, bàn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]" />
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-300">
                                    <Calendar size={16} className="text-[#1890ff]" />
                                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent text-[13px] font-bold text-slate-700 focus:outline-none cursor-pointer" />
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-300">
                                    <CreditCard size={16} className="text-[#1890ff]" />
                                    <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="bg-transparent text-[13px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                                        <option value="ALL">Mọi thanh toán</option>
                                        {paymentMethodsList.map(method => (<option key={method} value={method}>{method}</option>))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-300">
                                    <Filter size={16} className="text-[#1890ff]" />
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-[13px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                                        <option value="ALL">Mọi trạng thái</option>
                                        <option value="COMPLETED">Thành công</option>
                                        <option value="REFUNDED">Hoàn tiền</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-[13px] text-slate-500 font-medium shrink-0">
                                Hiển thị <span className="font-bold text-slate-800">{filteredOrders.length}</span> giao dịch
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center"><div className="w-8 h-8 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-3"></div>Đang tải dữ liệu...</div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">Không tìm thấy giao dịch phù hợp</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                                <th className="p-3.5 font-bold">Mã đơn</th>
                                                <th className="p-3.5 font-bold">Vị trí</th>
                                                <th className="p-3.5 font-bold">Thời gian</th>
                                                <th className="p-3.5 font-bold">Thu ngân</th>
                                                <th className="p-3.5 font-bold">Thanh toán</th>
                                                <th className="p-3.5 font-bold">Trạng thái</th>
                                                <th className="p-3.5 font-bold text-right">Tổng tiền</th>
                                                <th className="p-3.5 font-bold text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredOrders.map((order) => {
                                                const isRefunded = order.status?.toUpperCase() === 'REFUNDED';
                                                return (
                                                    <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                                                        <td className="p-3.5 font-mono font-bold text-slate-700">#{order.id.slice(-6)}</td>
                                                        <td className="p-3.5 font-bold text-[#1890ff]">{order.table?.tableNumber ? `Bàn ${order.table.tableNumber}` : 'Mang về'}</td>
                                                        <td className="p-3.5 text-slate-500 font-medium">{new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                                                        <td className="p-3.5 text-slate-600 font-medium">{order.staff?.fullName || order.staff?.username || '—'}</td>
                                                        <td className="p-3.5"><span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">{order.paymentMethod || 'CASH'}</span></td>
                                                        <td className="p-3.5">
                                                            {isRefunded ? (
                                                                <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded text-[11px] font-bold"><AlertCircle size={12} /> Đã hoàn tiền</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded text-[11px] font-bold"><CheckCircle2 size={12} /> Thành công</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3.5 text-right font-black text-slate-800">{Number(order.totalAmount).toLocaleString('vi-VN')} đ</td>
                                                        <td className="p-3.5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => { setSelectedOrder(order); setDetailModal(true); }} title="Xem chi tiết" className="p-1.5 bg-white border border-slate-200 hover:border-[#1890ff] hover:text-[#1890ff] text-slate-600 rounded transition-all cursor-pointer"><Eye size={16} /></button>
                                                                {!isRefunded && (
                                                                    <button onClick={() => { setOrderToRefund(order); setRefundModal(true); }} title="Hoàn tiền / Hủy đơn" className="p-1.5 bg-white border border-slate-200 hover:border-rose-500 hover:text-rose-600 text-slate-600 rounded transition-all cursor-pointer"><RotateCcw size={16} /></button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                {/* Modal Chi Tiết Hóa Đơn */}
                {detailModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 font-sans animate-fade-in">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText size={20} className="text-[#1890ff]" /> Chi Tiết Hóa Đơn #{selectedOrder.id.slice(-6)}</h3>
                                <button onClick={() => setDetailModal(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer bg-slate-50 p-1.5 rounded-lg"><X size={18} /></button>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg text-[13px] text-slate-700 space-y-1.5 border border-slate-200">
                                <p><strong>Vị trí:</strong> <span className="text-[#1890ff] font-bold">{selectedOrder.table?.tableNumber ? `Bàn ${selectedOrder.table.tableNumber}` : 'Mang về'}</span></p>
                                <p><strong>Thời gian:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                <p><strong>Thu ngân:</strong> {selectedOrder.staff?.fullName || selectedOrder.staff?.username || '—'}</p>
                                <p><strong>Hình thức TT:</strong> {selectedOrder.paymentMethod || 'CASH'}</p>
                                <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
                                {selectedOrder.refundReason && (<p className="text-rose-600"><strong>Lý do hoàn tiền:</strong> {selectedOrder.refundReason}</p>)}
                            </div>

                            <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-white">
                                {selectedOrder.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-[13px] border-b border-dashed border-slate-200 pb-1 last:border-0 last:pb-0">
                                        <span className="font-semibold text-slate-700">{item.menuItem?.name || 'Món ăn'} <span className="text-[#1890ff]">x{item.quantity}</span></span>
                                        <span className="font-bold text-slate-900">{((item.price || item.menuItem?.price || 0) * item.quantity).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex justify-between items-center font-black text-base text-slate-800">
                                <span>TỔNG CỘNG:</span>
                                <span className="text-[#1890ff] text-xl">{Number(selectedOrder.totalAmount).toLocaleString('vi-VN')} đ</span>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => window.print()} className="flex-1 bg-[#1890ff] hover:bg-blue-600 text-white py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm uppercase"><Printer size={16} /> In Lại Bill</button>
                                <button onClick={() => setDetailModal(false)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-6 rounded-lg text-[13px] font-bold cursor-pointer transition">Đóng</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Hoàn Tiền */}
                {refundModal && orderToRefund && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
                                <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2"><RotateCcw size={20} /> Hoàn Tiền / Hủy Đơn</h3>
                                <button onClick={() => setRefundModal(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer bg-slate-50 p-1.5 rounded-lg"><X size={18} /></button>
                            </div>

                            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-[13px] text-rose-800">
                                Bạn đang thực hiện hoàn tiền cho hóa đơn <strong className="font-mono bg-white px-1 border border-rose-200 rounded">#{orderToRefund.id.slice(-6)}</strong> số tiền <strong className="text-rose-600">{Number(orderToRefund.totalAmount).toLocaleString('vi-VN')} đ</strong>. Thao tác này sẽ trừ trực tiếp vào báo cáo doanh thu ngày.
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-slate-700">Lý do hoàn tiền (Bắt buộc):</label>
                                <textarea rows={3} placeholder="Ví dụ: Khách đổi ý, tính nhầm bàn..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setRefundModal(false); setOrderToRefund(null); setRefundReason(''); }} className="w-1/3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer transition">Hủy</button>
                                <button onClick={handleRefundSubmit} className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md uppercase tracking-wide"><AlertCircle size={16} /> Xác Nhận Hoàn</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* GIAO DIỆN IN LẠI BILL */}
            {selectedOrder && (
                <div className="hidden print:block print-receipt">
                    <div className="text-center mb-4">
                        <h2 className="text-[18px] font-black uppercase mb-1">NHÀ HÀNG GOURMET</h2>
                        <p className="text-[11px] mb-1">Khu Di Sản Thiên Nhiên, Nha Trang</p>
                        <p className="text-[11px] mb-3">Hotline: 0988.999.888</p>
                        <h3 className="text-[16px] font-black uppercase mt-2">PHIẾU THANH TOÁN (IN LẠI)</h3>
                    </div>

                    <div className="text-[12px] mb-2 leading-tight space-y-1">
                        <p><strong>Bàn:</strong> {selectedOrder.table?.tableNumber ? `Bàn ${selectedOrder.table.tableNumber}` : 'Mang về'}</p>
                        <p><strong>Ngày:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                        <p><strong>Thu ngân:</strong> {selectedOrder.staff?.fullName || selectedOrder.staff?.username || '—'}</p>
                        <p><strong>Mã HĐ:</strong> #{selectedOrder.id.slice(-6).toUpperCase()}</p>
                    </div>

                    <div className="dashed-line"></div>
                    <table className="w-full text-[12px] text-left leading-tight">
                        <thead>
                            <tr><th className="py-1 font-bold w-1/2">Tên món</th><th className="py-1 font-bold text-center w-1/6">SL</th><th className="py-1 font-bold text-right w-1/3">T.Tiền</th></tr>
                        </thead>
                    </table>
                    <div className="dashed-line"></div>

                    <table className="w-full text-[12px] text-left leading-tight">
                        <tbody>
                            {selectedOrder.orderItems?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1 w-1/2 pr-1">{item.menuItem?.name || 'Món ăn'}</td>
                                    <td className="py-1 text-center align-top w-1/6">{item.quantity}</td>
                                    <td className="py-1 text-right align-top w-1/3">{((item.price || item.menuItem?.price || 0) * item.quantity).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="dashed-line"></div>
                    <div className="flex justify-between items-center text-[16px] font-black uppercase mt-2 border-t border-dashed border-black pt-2">
                        <span>TỔNG CỘNG:</span>
                        <span>{Number(selectedOrder.totalAmount).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="dashed-line mt-2"></div>

                    <div className="text-center mt-3 text-[11px] leading-tight space-y-1">
                        <p>Cảm ơn Quý Khách và Hẹn Gặp Lại!</p>
                        <p>Wifi: GOURMET_FREE - Pass: 88889999</p>
                        <p className="italic mt-1 text-[10px]">Bản in lại - Powered by POS System</p>
                    </div>
                </div>
            )}
        </>
    );
}