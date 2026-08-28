import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import { tableApi } from '../api/tableApi';
import {
    Settings, UtensilsCrossed, Grid, Plus, Edit2, Trash2, X, CheckCircle2, ChevronRight
} from 'lucide-react';

interface Category { id: string; name: string; description?: string; }
interface Table { id: string; tableNumber: string | number; capacity: number; area: string; status: string; }

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'categories' | 'tables'>('categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [catModal, setCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ name: '', description: '' });

    const [tables, setTables] = useState<Table[]>([]);
    const [tableModal, setTableModal] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [tableForm, setTableForm] = useState({ tableNumber: '', capacity: 4, area: 'Sảnh chính' });

    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [catRes, tableRes] = await Promise.all([
                axiosClient.get('/categories').catch(() => ({ data: [] as any })),
                tableApi.getAll().catch(() => ({ data: [] as any }))
            ]);
            setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []));
            const rawTables = Array.isArray(tableRes.data) ? tableRes.data : (tableRes.data?.data || []);
            setTables(rawTables.map((t: any) => ({
                id: String(t.id || t._id),
                tableNumber: t.tableNumber || t.name,
                capacity: Number(t.capacity || t.seats || 4),
                area: typeof t.area === 'string' && t.area.trim() !== '' ? t.area : (t.area?.name || 'Sảnh chính'),
                status: String(t.status || 'AVAILABLE')
            })));
        } catch (error) { console.error("Lỗi:", error); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCat) await axiosClient.put(`/categories/${editingCat.id}`, catForm);
            else await axiosClient.post('/categories', catForm);
            setCatModal(false); fetchData();
        } catch (err: any) { alert(err.response?.data?.message || 'Lỗi lưu danh mục'); }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Xóa danh mục "${name}"?`)) return;
        try { await axiosClient.delete(`/categories/${id}`); fetchData(); } catch (err) { alert('Lỗi xóa danh mục.'); }
    };

    const openCatModal = (cat?: Category) => {
        if (cat) { setEditingCat(cat); setCatForm({ name: cat.name, description: cat.description || '' }); }
        else { setEditingCat(null); setCatForm({ name: '', description: '' }); }
        setCatModal(true);
    };

    const handleSaveTable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { tableNumber: Number(tableForm.tableNumber), capacity: Number(tableForm.capacity), area: tableForm.area.trim() || 'Sảnh chính' };
            if (editingTable) await tableApi.update(editingTable.id, payload);
            else await tableApi.create(payload);
            setTableModal(false); fetchData();
        } catch (err: any) { alert(err.response?.data?.message || 'Lỗi lưu bàn'); }
    };

    const handleDeleteTable = async (id: string, name: string) => {
        if (!window.confirm(`Xóa Bàn ${name}?`)) return;
        try { await axiosClient.delete(`/tables/${id}`); fetchData(); } catch (err) { alert('Lỗi xóa bàn.'); }
    };

    const openTableModal = (table?: Table) => {
        if (table) { setEditingTable(table); setTableForm({ tableNumber: String(table.tableNumber), capacity: table.capacity, area: table.area }); }
        else { setEditingTable(null); setTableForm({ tableNumber: '', capacity: 4, area: 'Sảnh chính' }); }
        setTableModal(true);
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />

                <main className="flex-1 p-4 md:p-8 flex justify-center overflow-hidden">
                    {/* LAYOUT SPLIT (CÀI ĐẶT CHUYÊN NGHIỆP) */}
                    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex overflow-hidden">

                        {/* SIDEBAR BÊN TRÁI */}
                        <div className="w-64 bg-slate-50/50 border-r border-slate-100 p-5 shrink-0 flex flex-col">
                            <h2 className="text-xl font-black text-slate-800 mb-6 px-2 flex items-center gap-2">
                                <Settings className="text-[#1890ff]" size={22} /> Cài Đặt
                            </h2>
                            <nav className="flex flex-col gap-1.5">
                                <button onClick={() => setActiveTab('categories')} className={`px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-between transition-all ${activeTab === 'categories' ? 'bg-white text-[#1890ff] shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'}`}>
                                    <span className="flex items-center gap-3"><UtensilsCrossed size={18} /> Danh Mục Menu</span>
                                    {activeTab === 'categories' && <ChevronRight size={16} />}
                                </button>
                                <button onClick={() => setActiveTab('tables')} className={`px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-between transition-all ${activeTab === 'tables' ? 'bg-white text-[#1890ff] shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'}`}>
                                    <span className="flex items-center gap-3"><Grid size={18} /> Khu Vực & Bàn</span>
                                    {activeTab === 'tables' && <ChevronRight size={16} />}
                                </button>
                            </nav>
                        </div>

                        {/* NỘI DUNG BÊN PHẢI */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                            {loading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-400 font-medium">
                                    <div className="w-8 h-8 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-3"></div>
                                    Đang đồng bộ dữ liệu...
                                </div>
                            )}

                            {activeTab === 'categories' && (
                                <div className="h-full flex flex-col">
                                    <div className="p-8 pb-4 flex justify-between items-end border-b border-slate-100 shrink-0">
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-800">Danh Mục Món Ăn</h3>
                                            <p className="text-slate-500 text-sm mt-1">Quản lý các nhóm thực đơn ({categories.length} danh mục)</p>
                                        </div>
                                        <button onClick={() => openCatModal()} className="bg-[#1890ff] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"><Plus size={18} /> Thêm Danh Mục</button>
                                    </div>
                                    <div className="p-8 flex-1 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {categories.map(cat => (
                                                <div key={cat.id} className="group p-5 rounded-2xl border border-slate-200 hover:border-[#1890ff] hover:shadow-md transition-all bg-white relative overflow-hidden">
                                                    <h4 className="font-black text-slate-800 text-base">{cat.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-1.5 mb-6 line-clamp-2 leading-relaxed">{cat.description || 'Không có mô tả'}</p>
                                                    <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openCatModal(cat)} className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-[#1890ff] rounded-lg transition-colors"><Edit2 size={15} /></button>
                                                        <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tables' && (
                                <div className="h-full flex flex-col">
                                    <div className="p-8 pb-4 flex justify-between items-end border-b border-slate-100 shrink-0">
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-800">Khu Vực & Bàn</h3>
                                            <p className="text-slate-500 text-sm mt-1">Quản lý sơ đồ phục vụ nhà hàng ({tables.length} bàn)</p>
                                        </div>
                                        <button onClick={() => openTableModal()} className="bg-[#1890ff] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"><Plus size={18} /> Thêm Bàn Mới</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8">
                                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                                                        <th className="p-4 font-bold">Số Bàn</th>
                                                        <th className="p-4 font-bold">Khu vực</th>
                                                        <th className="p-4 font-bold">Sức chứa</th>
                                                        <th className="p-4 font-bold">Trạng thái</th>
                                                        <th className="p-4 font-bold text-right">Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {tables.map(table => (
                                                        <tr key={table.id} className="group hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-4 font-black text-slate-800 text-base">Bàn {table.tableNumber}</td>
                                                            <td className="p-4">
                                                                <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">{table.area}</span>
                                                            </td>
                                                            <td className="p-4 text-slate-600 font-medium">{table.capacity} khách</td>
                                                            <td className="p-4">
                                                                {table.status === 'AVAILABLE' ? (
                                                                    <span className="text-emerald-600 flex items-center gap-2 text-xs font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Trống</span>
                                                                ) : (
                                                                    <span className="text-amber-600 flex items-center gap-2 text-xs font-bold"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Đang dùng</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => openTableModal(table)} className="p-2 text-slate-400 hover:text-[#1890ff] hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                                <button onClick={() => handleDeleteTable(table.id, String(table.tableNumber))} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* MODALS TỐI GIẢN */}
            {(catModal || tableModal) && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-7 shadow-2xl animate-fade-in border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">
                                {catModal ? (editingCat ? 'Sửa Danh Mục' : 'Thêm Danh Mục') : (editingTable ? 'Sửa Bàn' : 'Thêm Bàn')}
                            </h3>
                            <button onClick={() => { setCatModal(false); setTableModal(false); }} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-full transition-colors"><X size={18} /></button>
                        </div>

                        {catModal && (
                            <form onSubmit={handleSaveCategory} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên danh mục</label>
                                    <input required type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-blue-100 text-sm font-bold transition-all" placeholder="Ví dụ: Đồ Uống" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mô tả</label>
                                    <textarea rows={3} value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-blue-100 text-sm transition-all resize-none" placeholder="Nhập mô tả..." />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-[#1890ff] hover:bg-blue-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-md shadow-blue-200 transition-all"><CheckCircle2 size={18} /> Lưu Thay Đổi</button>
                            </form>
                        )}

                        {tableModal && (
                            <form onSubmit={handleSaveTable} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên / Số bàn</label>
                                        <input required type="number" value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-blue-100 text-base font-black text-[#1890ff] transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sức chứa</label>
                                        <input required type="number" min="1" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-blue-100 text-sm font-bold transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Khu vực</label>
                                    <input required type="text" value={tableForm.area} onChange={e => setTableForm({ ...tableForm, area: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-blue-100 text-sm font-bold transition-all" placeholder="Ví dụ: Tầng 1" />
                                </div>
                                <button type="submit" className="w-full py-3.5 mt-2 bg-[#1890ff] hover:bg-blue-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-md shadow-blue-200 transition-all"><CheckCircle2 size={18} /> Xác Nhận Lưu</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}