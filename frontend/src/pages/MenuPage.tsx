import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { menuApi } from '../api/menuApi';
import type { MenuItemDto } from '../api/menuApi';
import axiosClient from '../api/axiosClient';
import type { MenuItem, Category } from '../types';
import { formatVND, sound } from '../utils/formatters';
import {
    Plus, Edit2, Trash2, Search, UtensilsCrossed, Flame, CheckCircle2, X
} from 'lucide-react';

interface ExtendedMenuItem extends MenuItem {
    code?: string;
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

    const [formData, setFormData] = useState<Partial<ExtendedMenuItem>>({
        code: '', name: '', categoryId: '', price: 100000,
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
                code: item.code || `M${item.id?.toString().slice(-3) || '001'}`,
                costPrice: item.costPrice || Math.round((item.price || 0) * 0.5),
                unit: item.unit || 'Phần',
                inStock: item.isAvailable ?? item.inStock ?? true,
                popular: item.popular ?? false,
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

    const filteredItems = menuItems.filter((item) => {
        const itemCatId = item.categoryId || item.category?.id;
        const matchCat = selectedCat === 'all' || itemCatId === selectedCat;
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.code && item.code.toLowerCase().includes(search.toLowerCase()));
        return matchCat && matchSearch;
    });

    const handleOpenCreate = () => {
        sound.play('click');
        setEditingItem(null);
        setFormData({
            code: `M${menuItems.length + 1}`, name: '', categoryId: categories[0]?.id || '',
            price: 100000, costPrice: 50000, unit: 'Phần',
            inStock: true, popular: false, description: '', image: '',
        });
        setIsCreating(true);
    };

    const handleOpenEdit = (item: ExtendedMenuItem) => {
        sound.play('click');
        setEditingItem(item);
        setFormData({ ...item, categoryId: item.categoryId || item.category?.id || '', image: item.image || '' });
        setIsCreating(false);
    };

    const handleToggleStock = async (item: ExtendedMenuItem) => {
        sound.play('click');
        const newStockStatus = !item.inStock;
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, inStock: newStockStatus, isAvailable: newStockStatus } : i)));

        try {
            await menuApi.update(item.id, {
                name: item.name, price: Number(item.price), description: item.description || '',
                categoryId: item.categoryId || item.category?.id || '', isAvailable: newStockStatus, image: item.image || '',
            });
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái món:', error);
            fetchData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;
        sound.play('pay_success');

        const payload: MenuItemDto = {
            name: formData.name, price: Number(formData.price), description: formData.description || '',
            categoryId: formData.categoryId || '', isAvailable: formData.inStock ?? true,
            image: formData.image ? formData.image.trim() : '',
        };

        try {
            if (isCreating) { await menuApi.create(payload); alert('Thêm món thành công!'); }
            else if (editingItem) { await menuApi.update(editingItem.id, payload); alert('Cập nhật món thành công!'); }
            setIsCreating(false); setEditingItem(null); fetchData();
        } catch (error: any) { alert(error.response?.data?.message || 'Thao tác thất bại!'); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa món "${name}" không?`)) return;
        try {
            await menuApi.delete(id); sound.play('click'); fetchData();
        } catch (error) { alert('Không thể xóa món này!'); }
    };

    return (
        <div className="flex h-screen bg-[#f0f2f5] text-slate-900 font-sans">
            {/* Đã xóa <AppSidebar /> */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />

                <main className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <UtensilsCrossed className="w-6 h-6 text-[#1890ff] shrink-0" />
                            <h2 className="text-lg font-bold text-slate-800 shrink-0">Quản Lý Thực Đơn</h2>
                            <div className="relative w-full md:w-64 ml-2">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm món, mã món..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-semibold focus:outline-none focus:border-[#1890ff]"
                            >
                                <option value="all">Tất cả danh mục ({menuItems.length})</option>
                                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>

                            <button
                                onClick={handleOpenCreate}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1890ff] hover:bg-blue-600 text-white font-bold text-[13px] shadow-sm transition shrink-0 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> <span>Thêm Món Mới</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                            Đang tải thực đơn...
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">Không tìm thấy món ăn phù hợp</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map((dish) => {
                                const catName = dish.category?.name || categories.find((c) => c.id === dish.categoryId)?.name || 'Khác';
                                const cost = dish.costPrice || 0;
                                const profit = dish.price - cost;
                                const profitPct = dish.price > 0 ? Math.round((profit / dish.price) * 100) : 0;

                                return (
                                    <div key={dish.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 flex gap-3.5 items-center justify-between hover:border-[#1890ff] hover:shadow-md transition">
                                        <img src={dish.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'} alt={dish.name} className="w-20 h-20 rounded-lg object-cover shrink-0 bg-slate-100 border border-slate-100" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{dish.code}</span>
                                                <span className="text-[11px] text-slate-500 font-semibold truncate">{catName}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-[13px] truncate mt-1">{dish.name}</h4>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="font-black text-[#1890ff] text-[14px]">{formatVND(dish.price)}</span>
                                                <span className="text-[10px] font-medium text-slate-400">Vốn: {formatVND(cost)} (+{profitPct}%)</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button onClick={() => handleToggleStock(dish)} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${dish.inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                                                    {dish.inStock ? 'Đang phục vụ' : 'Tạm hết'}
                                                </button>
                                                {dish.popular && (
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                                        <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> Hot
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0 pl-2 border-l border-slate-100">
                                            <button onClick={() => handleOpenEdit(dish)} className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-[#1890ff] hover:border-blue-200 text-slate-600 transition cursor-pointer" title="Chỉnh sửa"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(dish.id, dish.name)} className="p-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer" title="Xóa món"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* MODAL THÊM / SỬA MÓN */}
            {(isCreating || editingItem) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800 max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                <UtensilsCrossed size={20} className="text-[#1890ff]" />
                                {isCreating ? 'Thêm món ăn mới' : `Chỉnh sửa: ${editingItem?.name}`}
                            </h3>
                            <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="text-slate-400 hover:text-rose-500 bg-slate-100 p-1 rounded-full cursor-pointer"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 text-[13px]">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Mã món:</label>
                                    <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 uppercase font-mono font-bold focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                                </div>
                                <div className="col-span-2">
                                    <label className="font-bold text-slate-700 block mb-1">Tên món ăn:</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-slate-900 focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Danh mục:</label>
                                    <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 font-medium focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]">
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Đơn vị tính:</label>
                                    <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Phần, Nồi, Dĩa..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 font-medium focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Giá bán (VNĐ):</label>
                                    <input type="number" step={1000} required value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 font-black text-[#1890ff] focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Giá vốn (Cost):</label>
                                    <input type="number" step={1000} value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-slate-700 focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Mô tả món ăn:</label>
                                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Thành phần, hương vị..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Đường dẫn ảnh (URL):</label>
                                <input type="text" value={formData.image || ''} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="Dán link ảnh vào đây..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:border-[#1890ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff]" />
                            </div>

                            <div className="flex items-center gap-6 pt-2 pb-1">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                    <input type="checkbox" checked={formData.inStock} onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })} className="w-4 h-4 rounded accent-[#1890ff] cursor-pointer" />
                                    <span>Còn hàng trong kho</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                                    <input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({ ...formData, popular: e.target.checked })} className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
                                    <span>Nhãn Hot / Bán chạy</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button type="button" onClick={() => { setEditingItem(null); setIsCreating(false); }} className="w-1/3 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer transition">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="w-2/3 py-3 rounded-lg bg-[#1890ff] hover:bg-blue-600 text-white font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-2 uppercase tracking-wide">
                                    <CheckCircle2 size={18} /> Lưu thông tin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}