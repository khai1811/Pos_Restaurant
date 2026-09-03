import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { orderApi } from '../api/orderApi';
import { formatVND } from '../utils/formatters';
import {
    ChevronLeft, Plus, Minus, Search, Trash2,
    CheckCircle2, CreditCard, DollarSign,
    QrCode, Wallet, X, Send, Users,
    UtensilsCrossed, ShoppingCart, Layers, Flame
} from 'lucide-react';

interface MenuItem { id: string; name: string; price: number; description: string; category?: string; image?: string; popular?: boolean; }
interface CartItem extends MenuItem { itemId?: string; quantity: number; note?: string; isSent?: boolean; status?: string; }

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

    const fetchMenu = async () => {
        try {
            const rawMenu = (await axiosClient.get('/menu-items')).data;
            const formattedMenu = (Array.isArray(rawMenu) ? rawMenu : rawMenu?.data || []).map((m: any) => ({
                id: String(m?.id || m?.M_ID || m?._id || Math.random()),
                name: String(typeof m?.name === 'string' ? m.name : (m?.name?.name || 'Món ăn')),
                price: Number(m?.price || 0), description: String(typeof m?.description === 'string' ? m.description : ''),
                category: String(typeof m?.category === 'string' ? m.category : (m?.category?.name || 'Khác')),
                image: typeof m?.image === 'string' ? m.image : (m?.imageUrl || ''),
                popular: m?.popular ?? m?.isPopular ?? false
            }));
            setMenuItems(formattedMenu);
        } catch (error) { console.error('Lỗi tải thực đơn:', error); }
    };

    const fetchOrderInfo = useCallback(async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const isTakeaway = tableId === 'new-takeaway';

            if (!isTakeaway && tableId) {
                try {
                    const tableData = (await axiosClient.get(`/tables/${tableId}`)).data;
                    setTableName(tableData.tableNumber ? `Bàn ${tableData.tableNumber}` : (tableData.name || 'Bàn'));

                    let orderData: any = await orderApi.getByTable(tableId);
                    if (Array.isArray(orderData)) orderData = orderData.length > 0 ? orderData[0] : null;

                    if (orderData && (orderData.id || orderData._id)) {
                        const oid = String(orderData.id || orderData._id || '');
                        if (oid) { setCreatedOrderId(oid); setOrderCode(`#${oid.slice(-6).toUpperCase()}`); }
                        setGuestCount(orderData.guestCount || 2);
                        const currentItems = orderData.items || orderData.orderItems || [];
                        if (currentItems.length > 0) {
                            const existingCart = currentItems.filter((it: any) => it != null).map((it: any) => ({
                                itemId: it?.id, id: it?.menuItemId || it?.menuItem?.id || Math.random().toString(),
                                name: it?.menuItem?.name || it?.name || 'Món ăn', price: Number(it?.price || it?.menuItem?.price || 0),
                                quantity: Number(it?.quantity || 1), note: it?.note || '', isSent: true,
                                status: (it?.status || it?.itemStatus || 'PENDING').toUpperCase()
                            }));
                            setCart(prev => {
                                const localUnsent = prev.filter(item => !item.isSent);
                                return [...existingCart, ...localUnsent];
                            });
                        }
                    }
                } catch { setTableName(`Bàn ${tableId}`); }
            } else {
                setTableName('Mang về');
            }
        } catch (error) { console.error('Lỗi tải dữ liệu bàn:', error); }
        finally { if (!isBackground) setLoading(false); }
    }, [tableId]);

    useEffect(() => {
        fetchMenu();
        fetchOrderInfo(false);
    }, [fetchOrderInfo]);

    // 🔥 CẬP NHẬT: Thêm nút "Món Hot 🔥" vào danh sách danh mục
    const categories = useMemo(() => ['Tất cả', 'Món Hot 🔥', ...Array.from(new Set(menuItems.map(m => m.category || 'Khác')))], [menuItems]);

    // 🔥 CẬP NHẬT: Lọc món ăn dựa trên danh mục "Món Hot 🔥"
    const filteredMenu = useMemo(() => {
        return menuItems.filter(m => {
            const searchLower = searchTerm.toLowerCase().trim();
            const matchSearch = m.name.toLowerCase().includes(searchLower);

            if (selectedCategory === 'Tất cả') return matchSearch;
            if (selectedCategory === 'Món Hot 🔥') return m.popular && matchSearch;
            return (m.category || 'Khác') === selectedCategory && matchSearch;
        });
    }, [menuItems, selectedCategory, searchTerm]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const exist = prev.find((i) => i.id === item.id && !i.isSent);
            if (exist) return prev.map((i) => (i.id === item.id && !i.isSent ? { ...i, quantity: i.quantity + 1 } : i));
            return [...prev, { ...item, quantity: 1, note: '', isSent: false, status: 'PENDING' }];
        });
    };

    const updateQuantity = (id: string, delta: number, isSent?: boolean) => {
        if (isSent) {
            return alert('Món đã lưu bếp! Vui lòng chọn lại món từ danh sách bên trái để gọi thêm.');
        }
        setCart((prev) => prev.map((item) => {
            if (item.id === id && item.isSent === isSent) {
                const newQ = item.quantity + delta; return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeCartItem = (id: string, isSent?: boolean) => {
        if (isSent) {
            return alert('Món đã lưu bếp không thể xóa ở đây. Vui lòng báo Quản lý hủy món!');
        }
        setCart(prev => prev.filter(item => !(item.id === id && item.isSent === isSent)));
    };

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const discountAmount = useMemo(() => discountType === 'percent' ? subtotal * (Math.min(Math.max(discountValue, 0), 100) / 100) : Math.min(Math.max(discountValue, 0), subtotal), [subtotal, discountType, discountValue]);
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = isVatEnabled ? taxableAmount * 0.08 : 0;
    const finalTotal = taxableAmount + vatAmount;
    const changeAmount = cashGiven >= finalTotal ? cashGiven - finalTotal : 0;

    const quickCashList = useMemo(() => {
        if (finalTotal === 0) return [];
        const suggestions = [finalTotal];
        [50000, 100000, 500000].forEach(r => { const val = Math.ceil(finalTotal / r) * r; if (val > finalTotal && !suggestions.includes(val)) suggestions.push(val); });
        if (!suggestions.includes(500000) && finalTotal < 500000) suggestions.push(500000); return suggestions.slice(0, 4);
    }, [finalTotal]);

    const handleSendOrder = async () => {
        const newItemsToSend = cart.filter(i => !i.isSent);
        if (newItemsToSend.length === 0) return alert('Không có món mới nào cần lưu bếp!');
        setIsSubmitting(true);
        try {
            const orderPayload: any = { items: newItemsToSend.map((i) => ({ menuItemId: i.id, quantity: i.quantity, note: i.note })) };
            if (tableId && tableId !== 'new-takeaway') orderPayload.tableId = tableId;

            setCart(prev => prev.filter(i => i.isSent));

            const res = await orderApi.createOrder(orderPayload);
            if (res.id || res.data?.id) { setCreatedOrderId(String(res.id || res.data?.id)); setOrderCode(`#${String(res.id || res.data?.id).slice(-6).toUpperCase()}`); }

            alert('Đã gửi món xuống bếp!');
            await fetchOrderInfo(false);
        } catch (error: any) {
            alert(`Lỗi tạo đơn hàng: ${error.response?.data?.message || 'Thử lại sau.'}`);
            await fetchOrderInfo(false);
        } finally { setIsSubmitting(false); }
    };

    const handleConfirmPayment = async () => {
        if (paymentMethod === 'CASH' && cashGiven < finalTotal) return alert('Số tiền khách đưa không đủ!');
        if (paymentMethod === 'SPLIT' && (splitCash + splitTransfer !== finalTotal)) return alert('Tổng tiền tách kênh chưa khớp hóa đơn!');
        try {
            let targetOrderId = createdOrderId;

            const newItems = cart.filter(i => !i.isSent);
            if (!targetOrderId || newItems.length > 0) {
                const orderPayload: any = { items: newItems.map((i) => ({ menuItemId: i.id, quantity: i.quantity, note: i.note })) };
                if (tableId && tableId !== 'new-takeaway') orderPayload.tableId = tableId;
                setCart(prev => prev.filter(i => i.isSent));
                const res = await orderApi.createOrder(orderPayload);
                targetOrderId = res.id || res.data?.id;
            }

            if (!targetOrderId) throw new Error('Lỗi mã đơn');

            const paymentPayload: any = { orderId: targetOrderId, totalAmount: finalTotal, paidAmount: paymentMethod === 'CASH' ? cashGiven : finalTotal, changeAmount: paymentMethod === 'CASH' ? changeAmount : 0, method: paymentMethod };
            if (paymentMethod === 'SPLIT') { paymentPayload.cashAmount = splitCash; paymentPayload.transferAmount = splitTransfer; }
            await orderApi.payOrder(paymentPayload);

            await axiosClient.put(`/orders/${targetOrderId}/status`, { status: 'PAID' }).catch(() => { });
            if (tableId && tableId !== 'new-takeaway') {
                await axiosClient.patch(`/tables/${tableId}/status`, { status: 'AVAILABLE' })
                    .catch(() => axiosClient.put(`/tables/${tableId}`, { status: 'AVAILABLE' }))
                    .catch(() => { });
            }

            alert('Thanh toán thành công!');
            navigate('/');
        } catch (err: any) {
            alert(`Lỗi thanh toán: ${err.message || err.response?.data?.message}`);
        }
    };

    if (loading) return <div className="flex h-[100dvh] items-center justify-center bg-[#f0f2f5]"><div className="w-8 h-8 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <>
            <div className="fixed inset-0 flex flex-row w-screen h-[100dvh] bg-[#f4f6f8] font-sans text-slate-800 overflow-hidden overscroll-none select-none print:hidden">
                {/* MENU TRÁI */}
                <div className="flex-1 flex flex-col min-w-0 bg-white shadow-sm z-10 h-full">
                    <header className="h-12 px-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-600 font-bold text-[14px] hover:text-[#1890ff]">
                                <ChevronLeft size={20} /> Quay lại
                            </button>
                        </div>
                        <div className="relative w-[180px] md:w-[240px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Tìm món..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-100 border-none pl-8 pr-3 py-1.5 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-[#1890ff]/50" />
                        </div>
                    </header>

                    <div className="h-12 bg-white border-b border-gray-100 flex items-center px-2 overflow-x-auto scrollbar-none shrink-0 gap-1.5">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                // 🔥 CẬP NHẬT: Tô màu đặc biệt cho nút "Món Hot"
                                className={`px-4 py-1.5 rounded-full text-[12px] transition-all whitespace-nowrap font-bold ${selectedCategory === cat
                                    ? (cat === 'Món Hot 🔥' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm' : 'bg-[#1890ff] text-white shadow-sm')
                                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2.5">
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                            {filteredMenu.map((item) => (
                                <div key={item.id} onClick={() => addToCart(item)} className="relative bg-white aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer group active:scale-95 transition-transform">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <UtensilsCrossed size={24} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <div className="absolute top-1.5 left-1.5 bg-white/95 text-[#1890ff] text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm border border-slate-100">
                                        {item.price.toLocaleString('vi-VN')}
                                    </div>

                                    {item.popular && (
                                        <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 z-10 border border-orange-400">
                                            <Flame size={11} className="fill-current" /> Hot
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 text-white text-[11px] font-bold leading-tight line-clamp-2">
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: GIỎ HÀNG */}
                <div className="w-[320px] md:w-[340px] h-[100dvh] bg-white flex flex-col shrink-0 z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] border-l border-slate-200">
                    <div className="h-12 bg-white border-b border-slate-200 px-3 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1890ff] flex items-center justify-center border border-blue-100">
                                <UtensilsCrossed size={16} strokeWidth={2.5} />
                            </div>
                            <div className="leading-tight">
                                <h3 className="font-black text-[13px] text-slate-800">{tableName}</h3>
                                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Users size={10} /> {guestCount} khách</p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded bg-slate-100 text-slate-600`}>{orderCode}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 space-y-2 scrollbar-none">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ShoppingCart size={32} className="mb-2 opacity-20" />
                                <span className="text-[13px] font-bold">Chưa có món nào</span>
                            </div>
                        ) : (
                            cart.map((item, idx) => {
                                const isItemLocked = item.isSent;
                                return (
                                    <div key={`${item.id}-${idx}`} className="flex flex-col p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-2 leading-tight">
                                                <div className="text-[13px] font-black text-slate-800 line-clamp-1">{item.name}</div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="text-[11px] text-[#1890ff] font-bold">{item.price.toLocaleString('vi-VN')} đ</div>
                                                    <span className="text-slate-300 text-[10px]">•</span>
                                                    {item.status?.toUpperCase() === 'SERVED' ? <span className="text-emerald-600 text-[9px] font-bold">✔ Đã lên</span>
                                                        : ['PREPARING', 'COOKING'].includes(item.status?.toUpperCase() || '') ? <span className="text-amber-600 text-[9px] font-bold">🔥 Đang nấu</span>
                                                            : item.isSent ? <span className="text-slate-500 text-[9px] font-bold">🕒 Chờ bếp</span>
                                                                : <span className="text-orange-500 text-[9px] font-bold">● Mới</span>}
                                                </div>
                                            </div>
                                            <div className="font-black text-[13px] text-slate-900 shrink-0">{(item.price * item.quantity).toLocaleString('vi-VN')}</div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <input
                                                type="text" placeholder="Ghi chú..." value={item.note || ''} disabled={Boolean(isItemLocked)}
                                                onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? { ...i, note: e.target.value } : i))}
                                                className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#1890ff] disabled:opacity-50"
                                            />
                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shrink-0">
                                                <button onClick={() => updateQuantity(item.id, -1, item.isSent)} disabled={Boolean(isItemLocked)} className="w-6 h-6 bg-white rounded flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 disabled:opacity-50"><Minus size={12} /></button>
                                                <span className="w-6 text-center text-[12px] font-black text-[#1890ff]">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1, item.isSent)} disabled={Boolean(isItemLocked)} className="w-6 h-6 bg-[#1890ff] rounded flex items-center justify-center text-white shadow-sm disabled:opacity-50"><Plus size={12} /></button>
                                            </div>
                                            <button onClick={() => removeCartItem(item.id, item.isSent)} disabled={Boolean(isItemLocked)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 shrink-0 disabled:opacity-50"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="bg-white border-t border-slate-200 p-3 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] text-[11px]">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2">
                            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-1">
                                <span className="font-semibold text-slate-600">Tiền hàng</span>
                                <span className="font-bold text-slate-800">{subtotal.toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-1">
                                <div className="flex bg-white border border-slate-300 rounded overflow-hidden w-20 shadow-sm">
                                    <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder="Giảm" className="w-full px-1 py-0.5 text-right font-bold text-[#1890ff] outline-none text-[11px]" />
                                    <select value={discountType} onChange={(e: any) => setDiscountType(e.target.value)} className="bg-slate-100 border-l border-slate-300 px-1 font-bold outline-none text-[10px]">
                                        <option value="percent">%</option><option value="fixed">đ</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-1">
                                <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-600">
                                    <input type="checkbox" checked={isVatEnabled} onChange={(e) => setIsVatEnabled(e.target.checked)} className="w-3 h-3 accent-[#1890ff]" /> VAT 8%
                                </label>
                                <span className="font-bold text-slate-800">+{vatAmount.toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-1">
                                <span className="font-semibold text-slate-600">Tổng giảm</span>
                                <span className="font-bold text-rose-500">-{discountAmount.toLocaleString('vi-VN')}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mb-3">
                            <span className="font-black text-[12px] uppercase text-slate-800">Thanh toán</span>
                            <span className="font-black text-2xl text-[#1890ff] leading-none">{finalTotal.toLocaleString('vi-VN')}</span>
                        </div>

                        <div className="flex w-full gap-2">
                            {canCheckout ? (
                                <>
                                    <button onClick={handleSendOrder} disabled={cart.length === 0 || isSubmitting} className="flex-1 py-2.5 bg-blue-50 text-[#1890ff] rounded-lg font-black text-[12px] flex items-center justify-center gap-1.5 border border-blue-200 disabled:opacity-50">
                                        <Send size={14} /> LƯU BẾP
                                    </button>
                                    <button onClick={() => setCheckoutModal(true)} disabled={cart.length === 0} className="flex-1 py-2.5 bg-[#1890ff] text-white rounded-lg font-black text-[12px] flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50">
                                        <CreditCard size={14} /> THU TIỀN
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleSendOrder} disabled={cart.length === 0 || isSubmitting} className="w-full py-2.5 bg-[#1890ff] text-white rounded-lg font-black text-[12px] flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50">
                                    <Send size={14} /> GỬI YÊU CẦU BẾP
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL THANH TOÁN */}
                {checkoutModal && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden border border-slate-200">
                            <div className="flex justify-between items-center p-4 border-b border-slate-200 shrink-0 bg-white">
                                <div><h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-[#1890ff]" size={20} /> Thanh Toán</h3><p className="text-[12px] text-slate-500 mt-1">{tableName} • {cart.reduce((a, b) => a + b.quantity, 0)} món</p></div>
                                <button onClick={() => setCheckoutModal(false)} className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors"><X size={18} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-none">
                                <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex justify-between items-center"><span className="text-[12px] font-bold text-slate-500">TỔNG CẦN THU</span><span className="text-3xl font-black text-[#1890ff]">{formatVND(finalTotal)}</span></div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[{ id: 'CASH', label: 'Tiền mặt', icon: DollarSign }, { id: 'VIETQR', label: 'VietQR', icon: QrCode }, { id: 'POS', label: 'Thẻ POS', icon: CreditCard }, { id: 'SPLIT', label: 'Tách kênh', icon: Layers }].map(m => {
                                        const Icon = m.icon;
                                        return (
                                            <button key={m.id} onClick={() => setPaymentMethod(m.id as any)} className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition-colors ${paymentMethod === m.id ? 'bg-blue-50 border-[#1890ff] text-[#1890ff] shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                                                <Icon size={18} />
                                                {m.label}
                                            </button>
                                        )
                                    })}
                                </div>

                                {paymentMethod === 'CASH' && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                        <input type="number" value={cashGiven || ''} onChange={e => setCashGiven(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[15px] font-black outline-none focus:border-[#1890ff] transition-colors" placeholder="Khách đưa..." />
                                        <div className="flex flex-wrap gap-2">{quickCashList.map(amt => <button key={amt} onClick={() => setCashGiven(amt)} className="px-3 py-1.5 border border-slate-200 rounded-md text-[12px] font-bold hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">{formatVND(amt)}</button>)}</div>
                                        <div className="flex justify-between font-bold text-[13px] text-slate-600 border-t border-dashed border-slate-200 pt-3 mt-1"><span>Tiền thối:</span><span className="text-emerald-600 text-lg">{formatVND(changeAmount)}</span></div>
                                    </div>
                                )}

                                {paymentMethod === 'SPLIT' && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase">Tiền mặt</label>
                                                <input type="number" value={splitCash || ''} onChange={(e) => { const v = Number(e.target.value); setSplitCash(v); setSplitTransfer(Math.max(0, finalTotal - v)); }} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 font-black text-[14px] outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase">Chuyển khoản</label>
                                                <input type="number" value={splitTransfer || ''} onChange={(e) => { const v = Number(e.target.value); setSplitTransfer(v); setSplitCash(Math.max(0, finalTotal - v)); }} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 font-black text-[14px] outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all" />
                                            </div>
                                        </div>
                                        <div className="text-center text-[12px] text-slate-500 font-medium bg-slate-50 py-2.5 rounded-lg border border-slate-100">
                                            Tổng chia: <strong className={splitCash + splitTransfer === finalTotal ? 'text-emerald-600 text-[14px]' : 'text-rose-600 text-[14px]'}>{formatVND(splitCash + splitTransfer)}</strong> / {formatVND(finalTotal)}
                                        </div>
                                    </div>
                                )}

                                {(paymentMethod === 'VIETQR' || paymentMethod === 'MOMO') && (
                                    <div className="flex flex-col items-center justify-center py-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <QrCode className="w-16 h-16 text-[#1890ff] mb-2 opacity-50" />
                                        <p className="font-bold text-slate-800 text-[14px]">Sử dụng thiết bị phụ để hiển thị mã QR</p>
                                    </div>
                                )}

                                {paymentMethod === 'POS' && (
                                    <div className="flex flex-col items-center justify-center py-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <CreditCard className="w-16 h-16 text-[#1890ff] mb-2 opacity-50" />
                                        <p className="font-bold text-slate-800 text-[14px]">Sử dụng máy quẹt thẻ POS</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-200 shrink-0 bg-white">
                                <button onClick={handleConfirmPayment} disabled={(paymentMethod === 'CASH' && cashGiven < finalTotal) || (paymentMethod === 'SPLIT' && splitCash + splitTransfer !== finalTotal)} className="w-full py-3.5 bg-[#1890ff] disabled:bg-slate-300 text-white rounded-xl font-black text-[13px] shadow-md uppercase tracking-wide transition-colors">XÁC NHẬN THU TIỀN</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* GIAO DIỆN IN LẠI BILL / TẠM TÍNH */}
            <div className="hidden print:block print-receipt">
                <div className="text-center mb-4">
                    <h2 className="text-[18px] font-black uppercase mb-1">NHÀ HÀNG GOURMET</h2>
                    <p className="text-[11px] mb-1">Khu Di Sản Thiên Nhiên, Nha Trang</p>
                    <p className="text-[11px] mb-3">Hotline: 0988.999.888</p>
                    <h3 className="text-[16px] font-black uppercase mt-2">PHIẾU TẠM TÍNH</h3>
                </div>

                <div className="text-[12px] mb-2 leading-tight space-y-1">
                    <p><strong>Vị trí:</strong> {tableName}</p>
                    <p><strong>Ngày:</strong> {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}</p>
                    <p><strong>Nhân viên:</strong> {currentUser?.fullName || 'Thu ngân'}</p>
                    <p><strong>Mã HĐ:</strong> {orderCode}</p>
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
                </div>
            </div>
        </>
    );
}