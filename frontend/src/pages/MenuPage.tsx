import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { menuApi } from '../api/menuApi';
import type { MenuItemDto } from '../api/menuApi';
import axiosClient from '../api/axiosClient';
import type { MenuItem, Category } from '../types';
import { formatVND, sound } from '../utils/formatters';
import {
    Plus, Edit2, Trash2, Search, UtensilsCrossed, Flame, CheckCircle2, X, AlertCircle, LayoutGrid, ImagePlus
} from 'lucide-react';

interface ExtendedMenuItem extends MenuItem {
    costPrice?: number;
    unit?: string;
    inStock?: boolean;
    popular?: boolean;
    image?: string;
}

export default function MenuPage() {
    const [menuItems, setMenuItems] = useState<ExtendedMenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('all');

    const [editingItem, setEditingItem] = useState<ExtendedMenuItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    const [formData, setFormData] = useState<Partial<ExtendedMenuItem>>({
        name: '', categoryId: '', price: 100000,
        costPrice: 50000, unit: 'Phần', inStock: true,
        popular: false, description: '', image: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [menuRes, catRes] = await Promise.all([
                menuApi.getAll(),
                axiosClient.get('/categories').catch(() => ({ data: [] })),
            ]);

            const mappedItems: ExtendedMenuItem[] = (menuRes || []).map((item: any) => ({
                ...item,
                costPrice: item.costPrice || Math.round((item.price || 0) * 0.5),
                unit: item.unit || 'Phần',
                inStock: item.isAvailable ?? item.inStock ?? true,
                popular: item.popular ?? item.isPopular ?? false,
                image: item.image || item.imageUrl || '',
            }));

            setMenuItems(mappedItems);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error('Lỗi tải dữ liệu thực đơn:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 CẬP NHẬT: Logic lọc món ăn hỗ trợ danh mục "hot"
    const filteredItems = menuItems.filter((item) => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;

        if (selectedCat === 'all') return true;
        if (selectedCat === 'hot') return item.popular === true;

        const itemCatId = item.categoryId || item.category?.id;
        return itemCatId === selectedCat;
    });

    const handleOpenCreate = () => {
        sound.play('click');
        setEditingItem(null);
        setFormData({
            name: '', categoryId: categories[0]?.id || '',
            price: 100000, costPrice: 50000, unit: 'Phần',
            inStock: true, popular: false, description: '', image: '',
        });
        setIsCreating(true);
    };

    const handleOpenEdit = (item: ExtendedMenuItem) => {
        sound.play('click');
        setEditingItem(item);
        setFormData({ ...item, categoryId: item.categoryId || item.category?.id || '', image: item.image || '', popular: item.popular });
        setIsCreating(false);
    };

    const handleToggleStock = async (item: ExtendedMenuItem) => {
        sound.play('click');
        const newStockStatus = !item.inStock;
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, inStock: newStockStatus, isAvailable: newStockStatus } : i)));

        try {
            await menuApi.update(item.id, {
                name: item.name, price: Number(item.price), description: item.description || '',
                categoryId: item.categoryId || item.category?.id || '', isAvailable: newStockStatus, image: item.image || '', popular: item.popular
            } as any);
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái món:', error);
            fetchData();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasteImage = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFormData({ ...formData, image: reader.result as string });
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;
        sound.play('pay_success');
        setIsSubmitting(true);

        const payload: any = {
            name: formData.name,
            price: Number(formData.price),
            description: formData.description || '',
            categoryId: formData.categoryId || '',
            isAvailable: formData.inStock ?? true,
            image: formData.image ? formData.image.trim() : '',
            popular: formData.popular ?? false
        };

        try {
            if (isCreating) { await menuApi.create(payload); }
            else if (editingItem) { await menuApi.update(editingItem.id, payload); }
            setIsCreating(false); setEditingItem(null); fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Thao tác thất bại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setIsSubmitting(true);
        try {
            await menuApi.delete(deleteConfirm.id);
            sound.play('click');
            setDeleteConfirm(null);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi server. Món này đang nằm trong hóa đơn cũ!');
            setDeleteConfirm(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col w-screen h-[100dvh] bg-[#f0f4f8] font-sans text-slate-900 overflow-hidden overscroll-none select-none">
            <div className="shrink-0 z-20 shadow-sm border-b border-slate-200/60">
                <Navbar />
            </div>

            <main className="flex-1 flex flex-col p-3 sm:p-4 gap-3 sm:gap-4 min-h-0 overflow-hidden w-full max-w-[1600px] mx-auto">

                {/* THANH ĐIỀU KHIỂN TOP */}
                <div className="shrink-0 bg-white p-3 sm:p-4 rounded-[16px] shadow-sm border border-slate-200 flex items-center justify-between gap-3 sm:gap-4 w-full">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-50 text-[#1890ff] items-center justify-center shrink-0">
                            <UtensilsCrossed size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="hidden md:block text-[16px] lg:text-[18px] font-black text-slate-800 tracking-tight shrink-0">Thực Đơn</h2>

                        <div className="relative w-full max-w-[300px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm kiếm món ăn..."
                                className="w-full bg-[#f4f6f8] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:bg-white focus:border-[#1890ff] focus:ring-2 focus:ring-[#1890ff]/20 font-bold text-slate-700 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#1890ff] hover:bg-blue-600 text-white font-black text-[13px] sm:text-[14px] shadow-md shadow-[#1890ff]/20 transition-all shrink-0 cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline">Thêm Món</span>
                    </button>
                </div>

                {/* KHU VỰC SPLIT VIEW (Dọc/Ngang) */}
                <div className="flex-1 flex flex-row gap-3 sm:gap-4 min-h-0 overflow-hidden w-full">

                    {/* SIDEBAR DANH MỤC */}
                    <aside className="w-[130px] sm:w-[160px] lg:w-[220px] shrink-0 bg-white rounded-[16px] shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                        <div className="flex items-center gap-2 p-3 lg:p-4 border-b border-slate-100 shrink-0">
                            <LayoutGrid size={16} className="text-slate-400" />
                            <span className="text-[11px] lg:text-[13px] font-black text-slate-500 uppercase tracking-wider truncate">Phân Loại</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 lg:p-3 flex flex-col gap-1.5 scrollbar-none">
                            <button
                                onClick={() => setSelectedCat('all')}
                                className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-[12px] lg:text-[14px] transition-all cursor-pointer flex items-center justify-between ${selectedCat === 'all' ? 'bg-[#1890ff] font-black text-white shadow-md' : 'bg-transparent font-bold text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className="truncate">Tất cả</span>
                                <span className={`flex items-center justify-center min-w-[20px] lg:min-w-[24px] h-5 lg:h-6 text-[10px] lg:text-[11px] rounded-md lg:rounded-lg font-bold shrink-0 ml-1 ${selectedCat === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{menuItems.length}</span>
                            </button>

                            {/* 🔥 NÚT LỌC MÓN HOT */}
                            <button
                                onClick={() => setSelectedCat('hot')}
                                className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-[12px] lg:text-[14px] transition-all cursor-pointer flex items-center justify-between ${selectedCat === 'hot' ? 'bg-gradient-to-r from-orange-500 to-rose-500 font-black text-white shadow-md' : 'bg-transparent font-bold text-slate-600 hover:bg-orange-50 text-orange-600'}`}
                            >
                                <span className="truncate flex items-center gap-1.5">
                                    <Flame size={14} className={selectedCat === 'hot' ? 'text-white' : 'text-orange-500'} /> Món Hot
                                </span>
                                <span className={`flex items-center justify-center min-w-[20px] lg:min-w-[24px] h-5 lg:h-6 text-[10px] lg:text-[11px] rounded-md lg:rounded-lg font-bold shrink-0 ml-1 ${selectedCat === 'hot' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                    {menuItems.filter(m => m.popular).length}
                                </span>
                            </button>

                            {categories.map((c) => {
                                const count = menuItems.filter(m => m.categoryId === c.id || m.category?.id === c.id).length;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCat(c.id)}
                                        className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-[12px] lg:text-[14px] transition-all cursor-pointer flex items-center justify-between ${selectedCat === c.id ? 'bg-[#1890ff] font-black text-white shadow-md' : 'bg-transparent font-bold text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className="truncate">{c.name}</span>
                                        <span className={`flex items-center justify-center min-w-[20px] lg:min-w-[24px] h-5 lg:h-6 text-[10px] lg:text-[11px] rounded-md lg:rounded-lg font-bold shrink-0 ml-1 ${selectedCat === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* LƯỚI MÓN ĂN */}
                    <section className="flex-1 bg-transparent overflow-y-auto scrollbar-none pb-6 rounded-[16px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-3 shadow-sm"></div>
                                <span className="text-[14px] font-bold">Đang tải dữ liệu...</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                Không tìm thấy món ăn phù hợp.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 w-full content-start">
                                {filteredItems.map((dish) => {
                                    const catName = dish.category?.name || categories.find((c) => c.id === dish.categoryId)?.name || 'Khác';
                                    const cost = dish.costPrice || 0;
                                    const profitPct = dish.price > 0 ? Math.round(((dish.price - cost) / dish.price) * 100) : 0;

                                    return (
                                        <div key={dish.id} className="relative bg-white rounded-[16px] border border-slate-200 shadow-sm p-3 lg:p-4 flex flex-col justify-between hover:border-[#1890ff] hover:shadow-md transition-all group">
                                            {/* 🔥 GIAO DIỆN NHÃN HOT TRÊN THẺ MÓN */}
                                            {dish.popular && (
                                                <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm border border-orange-400 flex items-center gap-1 z-10">
                                                    <Flame size={10} className="fill-current" /> Hot
                                                </div>
                                            )}

                                            <div className="flex gap-2.5 lg:gap-4 items-start">
                                                <img src={dish.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'} alt={dish.name} className="w-[60px] h-[60px] lg:w-[72px] lg:h-[72px] rounded-xl object-cover shrink-0 bg-slate-50 border border-slate-100 shadow-sm" />

                                                <div className="flex-1 min-w-0 pr-8">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[9px] lg:text-[10px] text-[#1890ff] font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 truncate">{catName}</span>
                                                    </div>
                                                    <h4 className="font-black text-slate-800 text-[12px] lg:text-[14px] line-clamp-2 leading-tight">{dish.name}</h4>

                                                    {dish.description && (
                                                        <p className="text-[9px] lg:text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                                                            {dish.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-col mt-1.5">
                                                        <span className="font-black text-amber-600 text-[13px] lg:text-[16px] leading-none">{formatVND(dish.price)}</span>
                                                        <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 mt-1">Vốn: {formatVND(cost)} (+{profitPct}%)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 lg:mt-4 pt-2.5 border-t border-slate-100">
                                                <button onClick={() => handleToggleStock(dish)} className={`inline-flex items-center justify-center text-[9px] lg:text-[10px] font-black px-2 lg:px-3 py-1.5 rounded-lg transition cursor-pointer ${dish.inStock ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                                                    {dish.inStock ? 'SẴN SÀNG' : 'TẠM HẾT'}
                                                </button>

                                                <div className="flex items-center gap-1.5 lg:gap-2">
                                                    <button onClick={() => handleOpenEdit(dish)} className="p-1.5 lg:p-2 rounded-lg bg-slate-50 hover:bg-[#1890ff] hover:text-white text-slate-500 transition-colors cursor-pointer"><Edit2 size={14} className="lg:w-4 lg:h-4" /></button>
                                                    <button onClick={() => setDeleteConfirm({ id: dish.id, name: dish.name })} className="p-1.5 lg:p-2 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 transition-colors cursor-pointer"><Trash2 size={14} className="lg:w-4 lg:h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* MODAL THÊM / SỬA MÓN CÓ UPLOAD ẢNH */}
            {(isCreating || editingItem) && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 font-sans">
                    <div className="bg-white rounded-[24px] max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90dvh] flex flex-col animate-fade-in overflow-hidden">

                        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white">
                            <h3 className="font-black text-[18px] text-slate-800 flex items-center gap-2">
                                <UtensilsCrossed size={22} className="text-[#1890ff]" />
                                {isCreating ? 'Thêm món ăn mới' : `Sửa: ${editingItem?.name}`}
                            </h3>
                            <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="text-slate-400 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 p-2 rounded-full cursor-pointer transition-colors"><X size={18} strokeWidth={2.5} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-none bg-slate-50/50">
                            <form id="menu-form" onSubmit={handleSave} className="space-y-5 text-[13px]">

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="font-bold text-slate-700 block mb-3 uppercase text-[11px] tracking-wider">Hình ảnh Món ăn (Tùy chọn)</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 shrink-0 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImagePlus className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={formData.image || ''}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                onPaste={handlePasteImage}
                                                placeholder="Dán URL hoặc Copy (Ctrl+V) ảnh thẳng vào đây..."
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:border-[#1890ff] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1890ff]/20 shadow-sm text-[12px] font-medium transition-all"
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="block w-full text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-blue-50 file:text-[#1890ff] hover:file:bg-blue-100 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">Tên món ăn <span className="text-rose-500">*</span></label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 font-bold text-[15px] text-slate-900 focus:border-[#1890ff] focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 shadow-sm transition-all" placeholder="VD: Sườn nướng BBQ..." />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">Danh mục <span className="text-rose-500">*</span></label>
                                        <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 font-bold text-[14px] focus:border-[#1890ff] focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 shadow-sm cursor-pointer text-slate-800 transition-all">
                                            <option value="">-- Chọn --</option>
                                            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">Đơn vị tính</label>
                                        <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Phần, Ly..." className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 font-bold text-[14px] focus:border-[#1890ff] focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 shadow-sm transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">Giá bán (VNĐ) <span className="text-rose-500">*</span></label>
                                        <input type="number" step={1000} required value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 font-black text-[#1890ff] text-[16px] focus:border-[#1890ff] focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 shadow-sm transition-all" />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">Giá vốn (Cost)</label>
                                        <input type="number" step={1000} value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 font-bold text-slate-700 text-[15px] focus:border-[#1890ff] focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 shadow-sm transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">Mô tả chi tiết</label>
                                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Thành phần chính, hương vị..." className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:border-[#1890ff] focus:outline-none focus:ring-2 focus:ring-[#1890ff]/20 resize-none shadow-sm text-[14px] font-medium transition-all" />
                                </div>

                                <div className="flex items-center gap-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
                                        <input type="checkbox" checked={formData.inStock} onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })} className="w-5 h-5 rounded accent-[#1890ff] cursor-pointer" />
                                        <span className="text-[14px]">Sẵn sàng bán</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
                                        <input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({ ...formData, popular: e.target.checked })} className="w-5 h-5 rounded accent-orange-500 cursor-pointer" />
                                        <span className="text-[14px]">Nhãn Hot</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0 bg-white">
                            <button type="button" onClick={() => { setEditingItem(null); setIsCreating(false); }} className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold cursor-pointer transition text-[14px]">
                                Hủy bỏ
                            </button>
                            <button type="submit" form="menu-form" disabled={isSubmitting} className="w-2/3 py-3.5 rounded-xl bg-[#1890ff] hover:bg-blue-600 disabled:bg-slate-400 text-white font-black shadow-md shadow-[#1890ff]/30 cursor-pointer transition flex items-center justify-center gap-2 uppercase tracking-wide text-[14px]">
                                {isSubmitting ? <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full"></span> : <><CheckCircle2 size={18} /> Lưu thông tin</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN XÓA */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[200] font-sans select-none animate-fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-[340px] shadow-2xl flex flex-col overflow-hidden text-center p-6 border border-slate-200">
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-black text-[20px] text-slate-800 mb-2">Xác nhận xóa?</h3>
                        <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
                            Xóa món <strong className="text-slate-800">"{deleteConfirm.name}"</strong>? Thao tác không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[14px] transition cursor-pointer">
                                Hủy
                            </button>
                            <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-black rounded-xl text-[14px] transition shadow-md shadow-rose-500/30 cursor-pointer flex items-center justify-center">
                                {isSubmitting ? <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full"></span> : 'Xóa ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}