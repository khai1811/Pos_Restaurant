import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { orderApi } from '../api/orderApi';
import { formatVND } from '../utils/formatters';
import {
    ChevronLeft, Plus, Minus, Search, Trash2,
    CheckCircle2, CreditCard, DollarSign,
    QrCode, Wallet, X, Send, Users,
    UtensilsCrossed, ShoppingCart, Clock, Grid, TrendingUp,
    History, ChefHat, LogOut, Receipt, Tag, Lock, Menu,
    Layers, Settings
} from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    description: string;
    category?: string;
    image?: string;
}

interface CartItem extends MenuItem {
    itemId?: string;
    quantity: number;
    note?: string;
    isSent?: boolean;
    status?: string;
}

export default function OrderPage() {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = currentUser?.role?.toUpperCase() || 'STAFF';
    const canCheckout = userRole === 'ADMIN' || userRole === 'CASHIER';

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [tableName, setTableName] = useState<string>('Đang tải...');
    const [areaName, setAreaName] = useState<string>('Khu vực');
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [orderCode, setOrderCode] = useState<string>('ĐƠN MỚI');
    const [guestCount, setGuestCount] = useState<number>(1);

    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [isVatEnabled, setIsVatEnabled] = useState<boolean>(true);

    const [checkoutModal, setCheckoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR' | 'POS' | 'MOMO' | 'SPLIT'>('CASH');
    const [cashGiven, setCashGiven] = useState<number>(0);
    const [splitCash, setSplitCash] = useState<number>(0);
    const [splitTransfer, setSplitTransfer] = useState<number>(0);
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

    const [isMainNavOpen, setIsMainNavOpen] = useState(false);

    const fetchData = useCallback(async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const isTakeaway = tableId === 'new-takeaway';

            if (!isTakeaway && tableId) {
                try {
                    const tableRes = await axiosClient.get(`/tables/${tableId}`);
                    const tableData = tableRes.data;
                    setTableName(tableData.tableNumber ? `Bàn ${tableData.tableNumber}` : (tableData.name || 'Bàn'));
                    setAreaName(tableData.area || 'Sảnh chính');

                    let orderData: any = await orderApi.getByTable(tableId);
                    if (Array.isArray(orderData)) orderData = orderData.length > 0 ? orderData[0] : null;

                    if (orderData && (orderData.id || orderData._id)) {
                        const oid: string = String(orderData.id || orderData._id || '');
                        if (oid) {
                            setCreatedOrderId(oid);
                            setOrderCode(`#${oid.slice(-6).toUpperCase()}`);
                        }
                        setGuestCount(orderData.guestCount || 2);

                        const currentItems = orderData.items || orderData.orderItems || [];
                        if (currentItems.length > 0) {
                            const existingCart = currentItems
                                .filter((it: any) => it != null)
                                .map((it: any) => ({
                                    itemId: it?.id,
                                    id: it?.menuItemId || it?.menuItem?.id || Math.random().toString(),
                                    name: it?.menuItem?.name || it?.name || 'Món ăn',
                                    price: Number(it?.price || it?.menuItem?.price || 0),
                                    quantity: Number(it?.quantity || 1),
                                    note: it?.note || '',
                                    isSent: true,
                                    status: (it?.status || it?.itemStatus || 'PENDING').toUpperCase()
                                }));

                            setCart(prevCart => {
                                const newItems = prevCart.filter(item => !item.isSent);
                                return [...existingCart, ...newItems];
                            });
                        }
                    }
                } catch {
                    setTableName(`Bàn ${tableId}`);
                    setAreaName('Sảnh chính');
                }
            } else {
                setTableName('Mang về');
                setAreaName('Khách vãng lai');
            }

            if (menuItems.length === 0) {
                const menuRes = await axiosClient.get('/menu-items');
                const rawMenu = Array.isArray(menuRes.data) ? menuRes.data : (menuRes.data?.data || []);

                const formattedMenu = rawMenu
                    .filter((m: any) => m !== null && m !== undefined)
                    .map((m: any) => {
                        let catName = 'Khác';
                        if (typeof m?.category === 'string') catName = m.category;
                        else if (typeof m?.category === 'object' && m?.category !== null) catName = m.category.name || 'Khác';

                        return {
                            id: String(m?.id || m?.M_ID || m?._id || Math.random()),
                            name: String(typeof m?.name === 'string' ? m.name : (m?.name?.name || 'Món ăn')),
                            price: Number(m?.price || 0),
                            description: String(typeof m?.description === 'string' ? m.description : ''),
                            category: String(catName),
                            image: typeof m?.image === 'string' ? m.image : (m?.imageUrl || '')
                        };
                    });

                setMenuItems(formattedMenu);
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [tableId, menuItems.length]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(() => {
            fetchData(true);
        }, 5000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const categories = useMemo(() => {
        const set = new Set(menuItems.map(m => m.category || 'Khác'));
        return ['Tất cả', ...Array.from(set)];
    }, [menuItems]);

    const filteredMenu = useMemo(() => {
        return menuItems.filter(m => {
            const matchCat = selectedCategory === 'Tất cả' || (m.category || 'Khác') === selectedCategory;
            const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
            return matchCat && matchSearch;
        });
    }, [menuItems, selectedCategory, searchTerm]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const exist = prev.find((i) => i.id === item.id && !i.isSent);
            if (exist) return prev.map((i) => (i.id === item.id && !i.isSent ? { ...i, quantity: i.quantity + 1 } : i));
            return [...prev, { ...item, quantity: 1, note: '', isSent: false, status: 'PENDING' }];
        });
    };

    const updateQuantity = (id: string, delta: number, itemStatus?: string) => {
        if (itemStatus?.toUpperCase() === 'SERVED' && delta < 0) {
            alert('Món đã được Bếp nấu xong, không thể giảm số lượng!');
            return;
        }

        setCart((prev) => prev.map((item) => {
            if (item.id === id && !item.isSent) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeCartItem = (id: string, isSent?: boolean, itemStatus?: string) => {
        if (isSent && itemStatus?.toUpperCase() === 'SERVED') {
            alert('Món đã được Bếp nấu xong, nhân viên không thể tự ý xóa!');
            return;
        }
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    const discountAmount = useMemo(() => {
        if (discountType === 'percent') return subtotal * (Math.min(Math.max(discountValue, 0), 100) / 100);
        return Math.min(Math.max(discountValue, 0), subtotal);
    }, [subtotal, discountType, discountValue]);

    const taxableAmount = subtotal - discountAmount;
    const vatAmount = isVatEnabled ? taxableAmount * 0.08 : 0;
    const finalTotal = taxableAmount + vatAmount;
    const changeAmount = cashGiven >= finalTotal ? cashGiven - finalTotal : 0;

    const quickCashList = useMemo(() => {
        if (finalTotal === 0) return [];
        const suggestions = [finalTotal];
        [50000, 100000, 500000].forEach(r => {
            const val = Math.ceil(finalTotal / r) * r;
            if (val > finalTotal && !suggestions.includes(val)) suggestions.push(val);
        });
        if (!suggestions.includes(500000) && finalTotal < 500000) suggestions.push(500000);
        return suggestions.slice(0, 4);
    }, [finalTotal]);

    const handleSendOrder = async () => {
        if (cart.length === 0) return alert('Giỏ hàng đang trống!');

        const newItemsToSend = cart.filter(i => !i.isSent);
        if (newItemsToSend.length === 0) {
            return alert('Không có món mới nào cần lưu bếp!');
        }

        setIsSubmitting(true);
        try {
            const orderPayload: any = {
                items: newItemsToSend.map((i) => ({ menuItemId: i.id, quantity: i.quantity, note: i.note }))
            };
            if (tableId && tableId !== 'new-takeaway') orderPayload.tableId = tableId;

            const res = await orderApi.createOrder(orderPayload);
            const orderId = res.id || res.data?.id;
            if (orderId) {
                const oid: string = String(orderId);
                setCreatedOrderId(oid);
                setOrderCode(`#${oid.slice(-6).toUpperCase()}`);
            }

            alert('Đã gửi gọi món xuống bếp thành công!');
            await fetchData();
        } catch (error: any) {
            alert(`Lỗi tạo đơn hàng: ${error.response?.data?.message || 'Vui lòng thử lại.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (paymentMethod === 'CASH' && cashGiven < finalTotal) return alert('Số tiền khách đưa không đủ!');
        if (paymentMethod === 'SPLIT' && (splitCash + splitTransfer !== finalTotal)) return alert('Tổng tiền thanh toán tách kênh chưa khớp với hóa đơn!');

        try {
            let targetOrderId = createdOrderId;
            if (!targetOrderId) {
                const orderPayload: any = { items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity, note: i.note })) };
                if (tableId && tableId !== 'new-takeaway') orderPayload.tableId = tableId;
                const res = await orderApi.createOrder(orderPayload);
                targetOrderId = res.id || res.data?.id;
            }

            if (!targetOrderId) throw new Error('Không tạo được mã đơn hàng');

            const paymentPayload: any = {
                orderId: targetOrderId,
                totalAmount: finalTotal,
                paidAmount: paymentMethod === 'CASH' ? cashGiven : finalTotal,
                changeAmount: paymentMethod === 'CASH' ? changeAmount : 0,
                method: paymentMethod
            };

            if (paymentMethod === 'SPLIT') {
                paymentPayload.cashAmount = splitCash;
                paymentPayload.transferAmount = splitTransfer;
            }

            await orderApi.payOrder(paymentPayload);

            alert('Thanh toán thành công!');
            navigate('/');
        } catch (err: any) {
            alert(`Thanh toán thất bại: ${err.message || err.response?.data?.message}`);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất khỏi ca làm việc?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f0f2f5]">
                <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

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

            <div className="flex flex-col md:flex-row h-screen w-full bg-[#f0f2f5] font-sans text-slate-800 overflow-hidden select-none print:hidden">

                {/* OVERLAY SIDEBAR NAV */}
                {isMainNavOpen && (
                    <div className="fixed inset-0 z-[120] flex">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMainNavOpen(false)}></div>
                        <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-fade-in-right">
                            <div className="h-[56px] border-b flex items-center px-5 justify-between bg-[#1890ff] text-white">
                                <span className="font-bold text-lg">Menu Quản Lý</span>
                                <button onClick={() => setIsMainNavOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto py-3">
                                {[
                                    { path: '/', name: 'Sơ đồ bàn', icon: Grid, roles: ['ADMIN', 'CASHIER', 'STAFF'] },
                                    { path: '/menu', name: 'Thực đơn', icon: UtensilsCrossed, roles: ['ADMIN'] },
                                    { path: '/dashboard', name: 'Báo cáo doanh thu', icon: TrendingUp, roles: ['ADMIN'] },
                                    { path: '/history', name: 'Lịch sử giao dịch', icon: History, roles: ['ADMIN', 'CASHIER'] },
                                    { path: '/kitchen', name: 'Màn hình Bếp', icon: ChefHat, roles: ['ADMIN', 'KITCHEN', 'STAFF'] },
                                    { path: '/staff', name: 'Nhân sự', icon: Users, roles: ['ADMIN'] },
                                    { path: '/settings', name: 'Cài đặt hệ thống', icon: Settings, roles: ['ADMIN'] },
                                ].filter(item => item.roles.includes(userRole)).map((item) => (
                                    <button key={item.path} onClick={() => { setIsMainNavOpen(false); navigate(item.path); }} className="w-full flex items-center gap-3 px-6 py-4 font-bold text-slate-600 hover:bg-slate-50 hover:text-[#1890ff]">
                                        <item.icon size={22} className="text-slate-400" /> {item.name}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t p-4 flex flex-col gap-3 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1890ff] flex items-center justify-center font-bold text-lg shadow-sm">
                                        {currentUser?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold text-slate-800 text-[14px]">{currentUser?.fullName || 'Nhân viên'}</p>
                                        <p className="text-[#1890ff] font-semibold mt-0.5">{userRole}</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-bold border border-rose-200 transition-colors shadow-sm">
                                    <LogOut size={18} /> Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CỘT TRÁI: MENU GRID CHUẨN TABLET */}
                <div className="flex-1 flex flex-col min-w-0 bg-white shadow-[2px_0_10px_rgba(0,0,0,0.03)] z-10">

                    {/* Header Trái: Nút Menu + Tìm kiếm */}
                    <header className="h-[60px] px-3 md:px-5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMainNavOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                                <Menu size={24} />
                            </button>
                            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-700 font-black text-[16px] hover:text-[#1890ff] cursor-pointer">
                                <ChevronLeft size={22} /> <span className="hidden sm:inline">Sơ đồ bàn</span>
                            </button>
                        </div>
                        <div className="relative w-[200px] md:w-[280px] lg:w-[350px]">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Tìm tên món..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-100 border-none pl-10 pr-4 py-2.5 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 transition-all" />
                        </div>
                    </header>

                    {/* Thanh ngang Danh mục (Tối ưu vuốt ngang cho Tablet) */}
                    <div className="h-[60px] bg-white border-b border-gray-200 flex items-center px-3 overflow-x-auto scrollbar-none shrink-0 gap-2">
                        {categories.map(cat => {
                            const isActive = selectedCategory === cat;
                            return (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${isActive ? 'bg-[#1890ff] text-white font-black shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200'}`}>
                                    <span className="text-[14px]">{cat}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Lưới sản phẩm */}
                    <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-[#f8fafc]">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {filteredMenu.map((item) => (
                                <div key={item.id} onClick={() => addToCart(item)} className="relative bg-white aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer group hover:border-[#1890ff] hover:shadow-lg transition-all">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            <UtensilsCrossed size={36} strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-white/95 text-[#1890ff] backdrop-blur-sm text-[13px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                                        {item.price.toLocaleString('vi-VN')}
                                    </div>
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pt-8 pb-3 px-3 text-white text-[13px] md:text-[14px] font-bold group-hover:text-amber-300 transition-colors leading-tight line-clamp-2">
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: GIỎ HÀNG (Cố định width ~400px trên Tablet) */}
                <div className="w-full md:w-[380px] lg:w-[420px] h-[50vh] md:h-screen bg-white flex flex-col shrink-0 z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] border-t md:border-t-0 md:border-l border-slate-200">

                    {/* Cart Header */}
                    <div className="h-[60px] bg-white border-b border-slate-200 px-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1890ff] flex items-center justify-center border border-blue-100">
                                <UtensilsCrossed size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-[16px] text-slate-800 leading-none">{tableName}</h3>
                                <p className="text-[12px] text-slate-500 font-bold mt-1.5 flex items-center gap-1"><Users size={12} /> {guestCount} khách</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black px-2.5 py-1.5 rounded-lg ${orderCode === 'ĐƠN MỚI' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                                {orderCode}
                            </span>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-3 space-y-2.5">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ShoppingCart size={48} className="mb-4 opacity-20 text-slate-600" />
                                <span className="text-[15px] font-bold">Chưa có món nào</span>
                            </div>
                        ) : (
                            cart.map((item, idx) => {
                                const isItemLocked = item.status && ['PREPARING', 'COOKING', 'SERVED'].includes(item.status.toUpperCase());
                                return (
                                    <div key={`${item.id}-${idx}`} className="flex flex-col p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 pr-2">
                                                <div className="text-[14px] md:text-[15px] font-black text-slate-800 leading-tight mb-1">
                                                    {item.name}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="text-[13px] text-[#1890ff] font-bold">
                                                        {item.price.toLocaleString('vi-VN')} đ
                                                    </div>
                                                    <span className="text-slate-300">•</span>
                                                    {item.status?.toUpperCase() === 'SERVED' ? (
                                                        <span className="text-emerald-600 text-[10px] font-bold">✔ Đã lên</span>
                                                    ) : ['PREPARING', 'COOKING'].includes(item.status?.toUpperCase() || '') ? (
                                                        <span className="text-amber-600 text-[10px] font-bold">🔥 Đang nấu</span>
                                                    ) : item.isSent ? (
                                                        <span className="text-slate-500 text-[10px] font-bold">🕒 Chờ bếp</span>
                                                    ) : (
                                                        <span className="text-orange-500 text-[10px] font-bold">● Mới</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="font-black text-[16px] text-slate-900 shrink-0">
                                                {(item.price * item.quantity).toLocaleString('vi-VN')}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <input
                                                type="text" placeholder="Ghi chú..." value={item.note || ''} disabled={Boolean(isItemLocked)}
                                                onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? { ...i, note: e.target.value } : i))}
                                                className="flex-1 text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#1890ff] disabled:opacity-50"
                                            />

                                            {/* Nút bấm lớn hơn cho Touch (Tablet) */}
                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                                                <button onClick={() => updateQuantity(item.id, -1, item.status)} disabled={Boolean(isItemLocked)} className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-lg flex items-center justify-center font-bold text-slate-600 shadow-sm border border-slate-200 cursor-pointer disabled:opacity-50">
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-8 md:w-10 text-center text-[15px] font-black text-[#1890ff]">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1, item.status)} disabled={Boolean(isItemLocked)} className="w-8 h-8 md:w-9 md:h-9 bg-[#1890ff] rounded-lg flex items-center justify-center font-bold text-white shadow-sm cursor-pointer disabled:opacity-50">
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button onClick={() => removeCartItem(item.id, item.isSent, item.status)} disabled={Boolean(isItemLocked)} className={`p-2.5 rounded-xl border transition-colors shrink-0 ${isItemLocked ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 cursor-pointer'}`}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Cart Footer (Cố định thanh toán) */}
                    <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] text-[13px]">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                            <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-1.5">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-600"><Receipt size={14} className="text-slate-400" /> Tiền hàng</span>
                                <span className="font-bold text-slate-800">{subtotal.toLocaleString('vi-VN')}</span>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 border-b border-dashed border-gray-300 pb-1.5">
                                <Tag size={14} className="text-[#1890ff]" />
                                <div className="flex bg-white border border-slate-300 rounded-md overflow-hidden w-28 shadow-sm">
                                    <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder="Giảm" className="w-full px-2 py-1.5 text-right font-black text-[#1890ff] outline-none text-[13px]" />
                                    <select value={discountType} onChange={(e: any) => setDiscountType(e.target.value)} className="bg-slate-100 border-l border-slate-300 px-1.5 font-black text-slate-700 outline-none text-[13px]">
                                        <option value="percent">%</option>
                                        <option value="fixed">đ</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-1.5">
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-600">
                                    <input type="checkbox" checked={isVatEnabled} onChange={(e) => setIsVatEnabled(e.target.checked)} className="w-4 h-4 rounded accent-[#1890ff]" />
                                    Thuế VAT 8%
                                </label>
                                <span className="font-black text-slate-800">+{vatAmount.toLocaleString('vi-VN')}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-1.5">
                                <span className="font-semibold text-slate-600">Tổng giảm</span>
                                <span className="font-black text-rose-500">-{discountAmount.toLocaleString('vi-VN')}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mb-4 pt-1">
                            <span className="font-black text-[15px] uppercase text-slate-800">CẦN THANH TOÁN</span>
                            <span className="font-black text-3xl text-[#1890ff] leading-none">{finalTotal.toLocaleString('vi-VN')}</span>
                        </div>

                        <div className="flex w-full gap-2">
                            {canCheckout ? (
                                <>
                                    <button onClick={handleSendOrder} disabled={cart.length === 0 || isSubmitting} className="flex-1 py-4 bg-blue-50 text-[#1890ff] hover:bg-[#1890ff] hover:text-white rounded-xl font-black text-[14px] uppercase tracking-wide transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border border-blue-200">
                                        <Send size={18} /> LƯU BẾP
                                    </button>
                                    <button onClick={() => setCheckoutModal(true)} disabled={cart.length === 0} className="flex-1 py-4 bg-[#1890ff] hover:bg-blue-600 text-white rounded-xl font-black text-[14px] uppercase tracking-wide transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-md">
                                        <CreditCard size={18} /> THU TIỀN
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleSendOrder} disabled={cart.length === 0 || isSubmitting} className="w-full py-4.5 bg-[#1890ff] hover:bg-blue-600 text-white rounded-xl font-black text-[16px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-md">
                                    <Send size={22} /> GỬI YÊU CẦU BẾP
                                </button>
                            )}
                        </div>
                        {!canCheckout && (
                            <div className="text-center mt-2 text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1"><Lock size={10} /> Phục vụ không có quyền thu tiền</div>
                        )}
                    </div>
                </div>

                {/* MODAL THANH TOÁN (Giữ nguyên toàn bộ logic nhập tiền) */}
                {checkoutModal && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-6 font-sans animate-fade-in">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Thanh Toán</h3>
                                    <p className="text-[13px] text-slate-500 mt-1">{tableName} • {cart.reduce((a, b) => a + b.quantity, 0)} món</p>
                                </div>
                                <button onClick={() => setCheckoutModal(false)} className="text-slate-400 hover:text-rose-500 bg-slate-100 p-2.5 rounded-full transition cursor-pointer"><X size={20} /></button>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex justify-between items-center">
                                <span className="text-[14px] font-bold text-slate-500 uppercase tracking-wider">TỔNG CẦN THU</span>
                                <span className="text-4xl font-black text-[#1890ff]">{formatVND(finalTotal)}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-5 gap-2 md:gap-3">
                                    {[
                                        { id: 'CASH', label: 'Tiền mặt', icon: DollarSign },
                                        { id: 'VIETQR', label: 'VietQR', icon: QrCode },
                                        { id: 'POS', label: 'Thẻ POS', icon: CreditCard },
                                        { id: 'MOMO', label: 'MoMo', icon: Wallet },
                                        { id: 'SPLIT', label: 'Tách kênh', icon: Layers },
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        const isSelected = paymentMethod === m.id;
                                        return (
                                            <button
                                                key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                                                className={`py-3 md:py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-[#1890ff] text-[#1890ff] shadow-sm ring-1 ring-[#1890ff]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                <Icon size={24} className={isSelected ? 'text-[#1890ff]' : 'text-slate-400'} />
                                                <span className="text-[11px] md:text-xs font-bold">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-2">
                                    {paymentMethod === 'CASH' && (
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                                            <div>
                                                <label className="text-[13px] font-bold text-slate-700 block mb-2">Khách đưa (VNĐ):</label>
                                                <input type="number" value={cashGiven || ''} onChange={(e) => setCashGiven(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-[#1890ff]" placeholder="Nhập số tiền khách đưa..." />
                                            </div>
                                            <div>
                                                <span className="text-[12px] font-medium text-slate-500 block mb-2">Gợi ý nhanh:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {quickCashList.map(amt => (
                                                        <button key={amt} onClick={() => setCashGiven(amt)} className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:bg-blue-50 hover:border-[#1890ff] hover:text-[#1890ff] transition cursor-pointer">
                                                            {formatVND(amt)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                                                <span className="text-[15px] font-bold text-slate-600">Tiền thối lại:</span>
                                                <span className={`text-2xl font-black ${changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{changeAmount.toLocaleString('vi-VN')} đ</span>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'SPLIT' && (
                                        <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[13px] font-bold text-slate-700 block mb-2">Tiền mặt</label>
                                                    <input type="number" value={splitCash || ''} onChange={(e) => { const v = Number(e.target.value); setSplitCash(v); setSplitTransfer(Math.max(0, finalTotal - v)); }} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#1890ff]" />
                                                </div>
                                                <div>
                                                    <label className="text-[13px] font-bold text-slate-700 block mb-2">Chuyển khoản</label>
                                                    <input type="number" value={splitTransfer || ''} onChange={(e) => { const v = Number(e.target.value); setSplitTransfer(v); setSplitCash(Math.max(0, finalTotal - v)); }} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#1890ff]" />
                                                </div>
                                            </div>
                                            <div className="text-center text-[13px] text-slate-500 font-medium">
                                                Tổng chia: <strong className={splitCash + splitTransfer === finalTotal ? 'text-emerald-600 text-base' : 'text-rose-600 text-base'}>{formatVND(splitCash + splitTransfer)}</strong> / {formatVND(finalTotal)}
                                            </div>
                                        </div>
                                    )}

                                    {(paymentMethod === 'VIETQR' || paymentMethod === 'MOMO') && (
                                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                            <div className="w-40 h-40 md:w-48 md:h-48 bg-white p-2.5 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center shadow-sm">
                                                <img src={`https://img.vietqr.io/image/970422-0123456789-compact.png?amount=${finalTotal}&addInfo=ThanhToan_${tableName}`} alt="VietQR" className="w-full h-full object-contain" />
                                            </div>
                                            <p className="text-[11px] md:text-xs text-center text-slate-500 font-medium">Mở ứng dụng Ngân hàng và quét mã để thanh toán.</p>
                                        </div>
                                    )}

                                    {paymentMethod === 'POS' && (
                                        <div className="py-10 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <CreditCard className="w-16 h-16 text-[#1890ff] mx-auto mb-4" />
                                            <p className="font-bold text-slate-800 text-lg">Quẹt thẻ trên máy POS</p>
                                            <p className="text-[13px] text-slate-500 mt-1">Hỗ trợ Visa, Master, Napas, Apple Pay</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-3 mt-4">
                                    <button onClick={() => setCheckoutModal(false)} className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[14px] transition-colors cursor-pointer shadow-sm">Hủy bỏ</button>
                                    <button onClick={handleConfirmPayment} disabled={(paymentMethod === 'CASH' && cashGiven < finalTotal) || (paymentMethod === 'SPLIT' && splitCash + splitTransfer !== finalTotal)} className="w-2/3 bg-[#1890ff] hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md uppercase tracking-wide">
                                        <CheckCircle2 size={20} /> HOÀN TẤT THU TIỀN
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* GIAO DIỆN IN BILL TẠM TÍNH */}
            <div className="hidden print:block print-receipt">
                <div className="text-center mb-4">
                    <h2 className="text-[18px] font-black uppercase mb-1">NHÀ HÀNG GOURMET</h2>
                    <p className="text-[11px] mb-1">Khu Di Sản Thiên Nhiên, Nha Trang</p>
                    <p className="text-[11px] mb-3">Hotline: 0988.999.888</p>
                    <h3 className="text-[16px] font-black uppercase mt-2">PHIẾU TẠM TÍNH</h3>
                </div>

                <div className="text-[12px] mb-2 leading-tight space-y-1">
                    <p><strong>Bàn:</strong> {tableName}</p>
                    <p><strong>Ngày:</strong> {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}</p>
                    <p><strong>Nhân viên:</strong> {currentUser?.fullName || 'Nhân viên'}</p>
                    {orderCode !== 'ĐƠN MỚI' && <p><strong>Mã HĐ:</strong> {orderCode}</p>}
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
                        {cart.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-1 w-1/2 pr-1">{item.name}</td>
                                <td className="py-1 text-center align-top w-1/6">{item.quantity}</td>
                                <td className="py-1 text-right align-top w-1/3">{(item.price * item.quantity).toLocaleString('vi-VN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="dashed-line"></div>

                <div className="space-y-1 text-[12px] leading-tight">
                    <div className="flex justify-between">
                        <span>Tạm tính ({cart.reduce((a, b) => a + b.quantity, 0)} món):</span>
                        <span>{subtotal.toLocaleString('vi-VN')}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Giảm giá:</span>
                            <span>-{discountAmount.toLocaleString('vi-VN')}</span>
                        </div>
                    )}
                    {vatAmount > 0 && (
                        <div className="flex justify-between">
                            <span>VAT (8%):</span>
                            <span>{vatAmount.toLocaleString('vi-VN')}</span>
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
        </>
    );
}