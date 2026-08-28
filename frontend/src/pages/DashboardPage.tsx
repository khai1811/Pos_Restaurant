import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import {
    DollarSign, ShoppingBag, TrendingUp, Calendar, Search, FileText,
    LineChart as LineChartIcon, RefreshCw, Download, Printer, Percent, Award
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrderItem {
    quantity: number;
    menuItem?: {
        name: string;
        price?: number;
    };
}

interface OrderHistory {
    id: string; totalAmount: number; status: string; createdAt: string;
    table?: { tableNumber: number; }; staff?: { fullName?: string; username?: string; };
    orderItems?: OrderItem[];
}

const getLocalDateString = (dateInput?: string | Date) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [orders, setOrders] = useState<OrderHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterDate, setFilterDate] = useState(getLocalDateString());
    const [searchTerm, setSearchTerm] = useState('');
    const [zReportModal, setZReportModal] = useState(false);

    const fetchOrders = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setIsRefreshing(true);
        try {
            const res = await axiosClient.get('/orders');
            setOrders(res.data || []);
        } catch (error) { console.error('Lỗi tải danh sách đơn hàng:', error); }
        finally { setLoading(false); setIsRefreshing(false); }
    }, []);

    useEffect(() => {
        fetchOrders(false);
        const interval = setInterval(() => fetchOrders(true), 10000);
        const onFocus = () => fetchOrders(true);
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetchOrders]);

    const completedOrders = useMemo(() => {
        const validStatuses = ['COMPLETED', 'PAID', 'SUCCESS'];
        return orders.filter(o => o.status && validStatuses.includes(o.status.toUpperCase()));
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return completedOrders.filter(o => {
            const matchDate = getLocalDateString(o.createdAt) === filterDate;
            const searchLower = searchTerm.toLowerCase().trim();
            const matchSearch = !searchLower || o.id.toLowerCase().includes(searchLower) || (o.table?.tableNumber && `bàn ${o.table.tableNumber}`.toLowerCase().includes(searchLower));
            return matchDate && matchSearch;
        });
    }, [completedOrders, filterDate, searchTerm]);

    const totalRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0), [filteredOrders]);
    const totalOrdersCount = filteredOrders.length;
    const estimatedCost = totalRevenue * 0.4;
    const grossProfit = totalRevenue - estimatedCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    const totalCustomers = Math.round(totalOrdersCount * 2.5);
    const spendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const hourlyChartData = useMemo(() => {
        const hours = Array.from({ length: 15 }, (_, i) => i + 8);
        return hours.map(h => {
            const hourLabel = `${h.toString().padStart(2, '0')}:00`;
            const revenueInHour = filteredOrders.filter(o => new Date(o.createdAt).getHours() === h).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
            return { time: hourLabel, doanhThu: revenueInHour };
        });
    }, [filteredOrders]);

    const topDishes = useMemo(() => {
        const counts: Record<string, { quantity: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
            o.orderItems?.forEach(item => {
                const name = item.menuItem?.name || 'Món khác';
                const qty = Number(item.quantity || 0);
                const price = Number(item.menuItem?.price || 0);
                if (!counts[name]) counts[name] = { quantity: 0, revenue: 0 };
                counts[name].quantity += qty; counts[name].revenue += qty * price;
            });
        });
        return Object.entries(counts).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    }, [filteredOrders]);

    const maxDishQty = topDishes.length > 0 ? topDishes[0].quantity : 1;

    const exportCSV = () => {
        if (filteredOrders.length === 0) return alert('Không có dữ liệu để xuất!');
        let csvContent = 'data:text/csv;charset=utf-8,Mã Đơn,Bàn,Thời gian,Nhân viên,Tổng Tiền\r\n';
        filteredOrders.forEach(o => {
            const row = [
                o.id,
                o.table?.tableNumber ? `Bàn ${o.table.tableNumber}` : 'Mang về',
                new Date(o.createdAt).toLocaleString('vi-VN'),
                o.staff?.fullName || o.staff?.username || '—',
                o.totalAmount
            ].join(',');
            csvContent += row + '\r\n';
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `BaoCaoDoanhThu_${filterDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            <div className="flex h-screen bg-[#f0f2f5] text-slate-900 overflow-hidden print:hidden font-sans">
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Navbar />

                    <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Báo Cáo Doanh Thu</h2>
                                <p className="text-[13px] text-slate-500 mt-0.5">Tổng hợp dữ liệu kinh doanh trong ngày</p>
                            </div>
                            <div className="flex items-center flex-wrap gap-2.5">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                    <Calendar size={16} className="text-[#1890ff]" />
                                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent text-[13px] font-bold text-slate-700 focus:outline-none cursor-pointer" />
                                </div>
                                <button onClick={() => setZReportModal(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm transition cursor-pointer">
                                    <FileText size={16} /> Z-Report Ca
                                </button>
                                <button onClick={exportCSV} className="flex items-center gap-1.5 bg-[#1890ff] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm transition cursor-pointer">
                                    <Download size={16} /> Xuất Excel
                                </button>
                                <button onClick={() => fetchOrders(false)} disabled={isRefreshing} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-[13px] font-bold shadow-sm transition cursor-pointer disabled:opacity-50">
                                    <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[#1890ff]" : "text-slate-500"} /> Làm mới
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { title: 'Tổng Doanh Thu', val: `${totalRevenue.toLocaleString('vi-VN')} đ`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { title: 'Lợi Nhuận Gộp', val: `${grossProfit.toLocaleString('vi-VN')} đ`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { title: 'Tỷ Suất LN Biên', val: `${profitMargin.toFixed(1)}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { title: 'Đơn Trung Bình (AOV)', val: `${Math.round(averageOrderValue).toLocaleString('vi-VN')} đ`, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' }
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                                        <h3 className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={24} /></div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <LineChartIcon size={20} className="text-[#1890ff]" />
                                    <h3 className="text-[15px] font-bold text-slate-800">Doanh thu theo giờ (Peak Hours)</h3>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={hourlyChartData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontWeight="bold" />
                                            <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" tickFormatter={(v) => `${v / 1000}k`} />
                                            <Tooltip formatter={(value: any) => [`${Number(value || 0).toLocaleString('vi-VN')} đ`, 'Doanh thu']} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="doanhThu" stroke="#1890ff" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <Award size={20} className="text-[#1890ff]" />
                                    <h3 className="text-[15px] font-bold text-slate-800">Top Bán Chạy</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-64 space-y-3.5 pr-1 scrollbar-none">
                                    {topDishes.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
                                    ) : (
                                        topDishes.map((dish, index) => (
                                            <div key={dish.name} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <span className="truncate max-w-[140px]">{index + 1}. {dish.name}</span>
                                                    <span className="text-[#1890ff]">{dish.quantity} phần</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-[#1890ff] h-full rounded-full transition-all duration-500" style={{ width: `${(dish.quantity / maxDishQty) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* BẢNG DANH SÁCH ĐƠN HÀNG ĐÃ BUNG ĐẦY ĐỦ KHÔNG RÚT GỌN */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={20} className="text-[#1890ff]" /> Danh Sách Hóa Đơn ({filteredOrders.length})
                                </h3>
                                <div className="relative w-full md:w-64">
                                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo bàn, mã đơn..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1890ff]"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">Không có giao dịch nào trong ngày đã chọn</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                                <th className="p-4 font-bold">Mã HĐ</th>
                                                <th className="p-4 font-bold">Bàn</th>
                                                <th className="p-4 font-bold">Thời gian</th>
                                                <th className="p-4 font-bold">Nhân viên thu ngân</th>
                                                <th className="p-4 font-bold text-right">Tổng tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="p-4 font-mono font-bold text-slate-700">#{order.id.slice(-6).toUpperCase()}</td>
                                                    <td className="p-4 font-bold text-[#1890ff]">{order.table?.tableNumber ? `Bàn ${order.table.tableNumber}` : 'Mang về'}</td>
                                                    <td className="p-4 text-slate-500 font-medium">{new Date(order.createdAt).toLocaleTimeString('vi-VN')} - {new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                                    <td className="p-4 text-slate-600">{order.staff?.fullName || order.staff?.username || '—'}</td>
                                                    <td className="p-4 text-right font-black text-slate-800">{Number(order.totalAmount).toLocaleString('vi-VN')} đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                {zReportModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fade-in">
                            <div className="text-center border-b border-slate-200 pb-3">
                                <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-wide">Z-REPORT CUỐI CA</h3>
                                <p className="text-[11px] text-slate-500 mt-1">Ngày báo cáo: {filterDate}</p>
                            </div>
                            <div className="space-y-2 text-[13px]">
                                <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-medium">Hóa đơn:</span><span className="font-bold text-slate-800">{totalOrdersCount} đơn</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-medium">Doanh thu:</span><span className="font-black text-[#1890ff]">{totalRevenue.toLocaleString('vi-VN')} đ</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-medium">Ước tính giá vốn:</span><span className="font-bold text-slate-600">{estimatedCost.toLocaleString('vi-VN')} đ</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-medium">Lợi nhuận gộp:</span><span className="font-bold text-emerald-600">{grossProfit.toLocaleString('vi-VN')} đ</span></div>
                                <div className="flex justify-between py-1"><span className="text-slate-500 font-medium">AOV (TB đơn):</span><span className="font-bold text-indigo-600">{Math.round(averageOrderValue).toLocaleString('vi-VN')} đ</span></div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                                <button onClick={() => window.print()} className="flex-1 bg-[#1890ff] hover:bg-blue-600 text-white py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"><Printer size={16} /> In Z-Report</button>
                                <button onClick={() => setZReportModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-lg text-[13px] font-bold cursor-pointer">Đóng</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* GIAO DIỆN IN Z-REPORT */}
            <div className="hidden print:block print-receipt">
                <div className="text-center mb-4">
                    <h2 className="text-[18px] font-black uppercase mb-1">NHÀ HÀNG GOURMET</h2>
                    <p className="text-[11px] mb-1">Khu Di Sản Thiên Nhiên, Nha Trang</p>
                    <h3 className="text-[16px] font-black uppercase mt-2">BÁO CÁO Z-REPORT</h3>
                </div>

                <div className="text-[12px] mb-2 leading-tight space-y-1">
                    <p><strong>Ngày báo cáo:</strong> {filterDate}</p>
                    <p><strong>Giờ in:</strong> {new Date().toLocaleString('vi-VN')}</p>
                    <p><strong>Nhân viên:</strong> {currentUser?.fullName || 'Quản lý'}</p>
                </div>

                <div className="dashed-line"></div>

                <div className="space-y-2 text-[12px] leading-tight my-2">
                    <div className="flex justify-between"><span>Tổng hóa đơn:</span><span className="font-bold">{totalOrdersCount}</span></div>
                    <div className="flex justify-between"><span>Tổng doanh thu:</span><span className="font-bold">{totalRevenue.toLocaleString('vi-VN')} đ</span></div>
                    <div className="flex justify-between"><span>Ước tính giá vốn:</span><span>{estimatedCost.toLocaleString('vi-VN')} đ</span></div>
                    <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-black">
                        <span className="font-bold">Lợi nhuận gộp:</span><span className="font-bold">{grossProfit.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between"><span>Trung bình đơn:</span><span>{Math.round(averageOrderValue).toLocaleString('vi-VN')} đ</span></div>
                </div>

                <div className="dashed-line mt-2"></div>
                <div className="text-center mt-3 text-[11px] leading-tight font-bold italic"><p>*** KẾT THÚC BÁO CÁO ***</p></div>
            </div>
        </>
    );
}