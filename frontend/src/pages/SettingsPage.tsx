import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import { tableApi } from '../api/tableApi';
import {
    Settings, UtensilsCrossed, Grid, Plus, Edit2, Trash2, X, CheckCircle2, ChevronRight, AlertCircle, Sun, Moon, Palette
} from 'lucide-react';

interface Category { id: string; name: string; description?: string; }
interface Table { id: string; tableNumber: string | number; capacity: number; area: string; status: string; }

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'categories' | 'tables' | 'theme'>('categories');

    const [categories, setCategories] = useState<Category[]>([]);
    const [catModal, setCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ name: '', description: '' });

    const [tables, setTables] = useState<Table[]>([]);
    const [tableModal, setTableModal] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [tableForm, setTableForm] = useState({ tableNumber: '', capacity: 4, area: 'Sảnh chính', status: 'AVAILABLE' });

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'cat' | 'table', id: string, name: string } | null>(null);

    // ================== LOGIC GIAO DIỆN SÁNG/TỐI ==================
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);
    // =============================================================

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.all([
                axiosClient.get('/categories').catch(() => ({ data: [] })),
                tableApi.getAll().catch(() => ({ data: [] })),
                axiosClient.get('/orders').catch(() => ({ data: [] }))
            ]);

            const catRes: any = results[0];
            const tableRes: any = results[1];
            const orderRes: any = results[2];

            setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []));
            const rawTables = Array.isArray(tableRes.data) ? tableRes.data : (tableRes.data?.data || []);
            const rawOrders = Array.isArray(orderRes.data) ? orderRes.data : (orderRes.data?.data || []);

            const activeOrders = rawOrders.filter((o: any) =>
                !['COMPLETED', 'PAID', 'CANCELLED'].includes(String(o.status || '').toUpperCase())
            );

            const formattedTables: Table[] = rawTables.map((t: any) => {
                const tableId = String(t.id || t._id);
                let currentStatus = String(t.status || 'AVAILABLE').toUpperCase();
                const hasActiveOrder = activeOrders.some((o: any) => String(o.tableId) === tableId);

                if (currentStatus === 'OCCUPIED' && !hasActiveOrder) {
                    currentStatus = 'AVAILABLE';
                    axiosClient.patch(`/tables/${tableId}/status`, { status: 'AVAILABLE' })
                        .catch(() => axiosClient.put(`/tables/${tableId}/status`, { status: 'AVAILABLE' }))
                        .catch(() => { });
                }

                return {
                    id: tableId,
                    tableNumber: t.tableNumber || t.name,
                    capacity: Number(t.capacity || t.seats || 4),
                    area: typeof t.area === 'string' && t.area.trim() !== '' ? t.area : (t.area?.name || 'Sảnh chính'),
                    status: currentStatus
                };
            });

            formattedTables.sort((a, b) => {
                const numA = parseInt(String(a.tableNumber).replace(/\D/g, '')) || 0;
                const numB = parseInt(String(b.tableNumber).replace(/\D/g, '')) || 0;
                if (numA !== numB) return numA - numB;
                return String(a.tableNumber).localeCompare(String(b.tableNumber));
            });

            setTables(formattedTables);
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCat) {
                await axiosClient.put(`/categories/${editingCat.id}`, catForm);
            } else {
                await axiosClient.post('/categories', catForm);
            }
            setCatModal(false);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi lưu danh mục');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveTable = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: any = {
                tableNumber: String(tableForm.tableNumber).trim(),
                capacity: Number(tableForm.capacity),
                area: tableForm.area.trim() || 'Sảnh chính',
                status: tableForm.status
            };
            if (editingTable) {
                await tableApi.update(editingTable.id, payload);
            } else {
                await tableApi.create(payload);
            }
            setTableModal(false);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi lưu bàn');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setIsSubmitting(true);
        try {
            if (deleteConfirm.type === 'cat') {
                await axiosClient.delete(`/categories/${deleteConfirm.id}`);
            } else {
                await axiosClient.delete(`/tables/${deleteConfirm.id}`);
            }
            setDeleteConfirm(null);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi khi xóa dữ liệu. Có thể dữ liệu đang được sử dụng ở nơi khác!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCatModal = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat);
            setCatForm({ name: cat.name, description: cat.description || '' });
        } else {
            setEditingCat(null);
            setCatForm({ name: '', description: '' });
        }
        setCatModal(true);
    };

    const openTableModal = (table?: Table) => {
        if (table) {
            setEditingTable(table);
            setTableForm({ tableNumber: String(table.tableNumber), capacity: table.capacity, area: table.area, status: table.status || 'AVAILABLE' });
        } else {
            setEditingTable(null);
            setTableForm({ tableNumber: '', capacity: 4, area: 'Sảnh chính', status: 'AVAILABLE' });
        }
        setTableModal(true);
    };

    return (
        <div className="fixed inset-0 flex flex-col w-screen h-[100dvh] bg-[#f4f6f8] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden overscroll-none select-none transition-colors duration-300">
            <div className="shrink-0 z-20 shadow-sm border-b border-slate-200/60 dark:border-slate-800/60">
                <Navbar />
            </div>

            <main className="flex-1 flex justify-center p-4 md:p-6 overflow-hidden w-full relative">
                <div className="w-full max-w-[1400px] bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex overflow-hidden h-full transition-colors duration-300">

                    {/* SIDEBAR BÊN TRÁI */}
                    <div className="w-[200px] md:w-[260px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 flex flex-col">
                        <div className="flex items-center gap-3 mb-6 px-2 mt-2">
                            <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-xl text-[#1890ff] shadow-sm">
                                <Settings size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-[16px] font-black text-slate-800 dark:text-white tracking-wide">CÀI ĐẶT</h2>
                        </div>

                        <nav className="flex flex-col gap-2 w-full flex-1">
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={`w-full px-4 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-between transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-[#1890ff] text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <span className="flex items-center gap-3"><UtensilsCrossed size={18} /> Danh Mục</span>
                                {activeTab === 'categories' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('tables')}
                                className={`w-full px-4 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-between transition-all cursor-pointer ${activeTab === 'tables' ? 'bg-[#1890ff] text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <span className="flex items-center gap-3"><Grid size={18} /> Sơ Đồ Bàn</span>
                                {activeTab === 'tables' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('theme')}
                                className={`w-full px-4 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-between transition-all cursor-pointer ${activeTab === 'theme' ? 'bg-[#1890ff] text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <span className="flex items-center gap-3"><Palette size={18} /> Giao Diện</span>
                                {activeTab === 'theme' && <ChevronRight size={16} />}
                            </button>
                        </nav>
                    </div>

                    {/* NỘI DUNG BÊN PHẢI */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
                        {loading && activeTab !== 'theme' && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                                <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-3 shadow-sm"></div>
                                <span className="text-[13px] font-bold">Đang đồng bộ dữ liệu...</span>
                            </div>
                        )}

                        <div className="h-[80px] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center shrink-0 transition-colors duration-300">
                            <div>
                                <h3 className="font-black text-[20px] text-slate-800 dark:text-white">
                                    {activeTab === 'categories' ? 'Quản Lý Danh Mục Món' : activeTab === 'tables' ? 'Quản Lý Sơ Đồ Bàn' : 'Cài Đặt Giao Diện'}
                                </h3>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    {activeTab === 'categories' ? `Hệ thống hiện có ${categories.length} danh mục` : activeTab === 'tables' ? `Hệ thống đang có ${tables.length} bàn phục vụ` : 'Tùy chỉnh chế độ hiển thị Sáng/Tối cho toàn hệ thống'}
                                </p>
                            </div>

                            {activeTab !== 'theme' && (
                                <button
                                    onClick={() => activeTab === 'categories' ? openCatModal() : openTableModal()}
                                    className="bg-[#1890ff] hover:bg-blue-600 text-white px-5 py-3 rounded-xl text-[14px] font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                                >
                                    <Plus size={18} strokeWidth={2.5} /> Thêm Mới
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] dark:bg-slate-950 scrollbar-none transition-colors duration-300">

                            {/* TAB GIAO DIỆN */}
                            {activeTab === 'theme' && (
                                <div className="max-w-3xl">
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                                        <h4 className="text-[16px] font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                            <Palette className="text-[#1890ff]" size={20} /> Chọn chế độ màu nền
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                            {/* Nút Sáng */}
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-[#1890ff] bg-blue-50 dark:bg-blue-900/20 shadow-md ring-4 ring-[#1890ff]/10' : 'border-slate-200 dark:border-slate-600 hover:border-[#1890ff]/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'}`}
                                            >
                                                <div className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-amber-500">
                                                    <Sun size={40} />
                                                </div>
                                                <span className={`font-black text-[18px] tracking-wide ${theme === 'light' ? 'text-[#1890ff]' : 'text-slate-600 dark:text-slate-300'}`}>Giao Diện Sáng</span>
                                                {theme === 'light' && <span className="bg-[#1890ff] text-white px-3 py-1 rounded-full text-[12px] font-bold">Đang sử dụng</span>}
                                            </button>

                                            {/* Nút Tối */}
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-[#1890ff] bg-blue-50 dark:bg-blue-900/20 shadow-md ring-4 ring-[#1890ff]/10' : 'border-slate-200 dark:border-slate-600 hover:border-[#1890ff]/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'}`}
                                            >
                                                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700 shadow-lg flex items-center justify-center text-amber-400">
                                                    <Moon size={40} />
                                                </div>
                                                <span className={`font-black text-[18px] tracking-wide ${theme === 'dark' ? 'text-[#1890ff]' : 'text-slate-600 dark:text-slate-300'}`}>Giao Diện Tối</span>
                                                {theme === 'dark' && <span className="bg-[#1890ff] text-white px-3 py-1 rounded-full text-[12px] font-bold">Đang sử dụng</span>}
                                            </button>

                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'categories' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#1890ff] dark:hover:border-[#1890ff] hover:shadow-md transition-all bg-white dark:bg-slate-800 flex flex-col h-full">
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 dark:text-white text-[16px] line-clamp-1">{cat.name}</h4>
                                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{cat.description || 'Không có mô tả chi tiết'}</p>
                                            </div>
                                            <div className="flex gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 justify-end">
                                                <button onClick={() => openCatModal(cat)} className="px-4 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-[#1890ff] font-bold text-[13px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"><Edit2 size={14} /> Sửa</button>
                                                <button onClick={() => setDeleteConfirm({ type: 'cat', id: cat.id, name: cat.name })} className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'tables' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {tables.map(table => (
                                        <div key={table.id} className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#1890ff] dark:hover:border-[#1890ff] hover:shadow-md transition-all bg-white dark:bg-slate-800 flex flex-col h-full relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 group-hover:bg-[#1890ff] transition-colors"></div>
                                            <div className="flex justify-between items-start mb-4 mt-1">
                                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-600">{table.area}</span>
                                                <span className={`flex items-center gap-1.5 text-[11px] font-bold ${table.status === 'AVAILABLE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${table.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    {table.status === 'AVAILABLE' ? 'Trống' : 'Có khách'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 dark:text-white text-[18px]">Bàn {table.tableNumber}</h4>
                                                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold mt-1">Sức chứa: {table.capacity} khách</p>
                                            </div>
                                            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 justify-end">
                                                <button onClick={() => openTableModal(table)} className="px-3 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-[#1890ff] font-bold text-[12px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"><Edit2 size={14} /> Sửa</button>
                                                <button onClick={() => setDeleteConfirm({ type: 'table', id: table.id, name: String(table.tableNumber) })} className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"><Trash2 size={15} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {(catModal || tableModal) && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[150] font-sans select-none">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[460px] shadow-2xl flex flex-col max-h-[90dvh] animate-fade-in overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                            <h3 className="font-black text-[18px] text-slate-800 dark:text-white flex items-center gap-2">
                                {catModal ? <UtensilsCrossed size={22} className="text-[#1890ff]" /> : <Grid size={22} className="text-[#1890ff]" />}
                                {catModal ? (editingCat ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới') : (editingTable ? 'Sửa Bàn' : 'Thêm Bàn Mới')}
                            </h3>
                            <button onClick={() => { setCatModal(false); setTableModal(false); }} className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-500 dark:hover:text-rose-400 text-slate-500 dark:text-slate-300 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-none">
                            <form id="settings-form" onSubmit={catModal ? handleSaveCategory : handleSaveTable} className="space-y-5">
                                {catModal && (
                                    <>
                                        <div>
                                            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Tên danh mục <span className="text-rose-500">*</span></label>
                                            <input required type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3.5 outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] font-bold text-[15px] dark:text-white transition-all shadow-sm" placeholder="Ví dụ: Đồ Uống" />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                                            <textarea rows={3} value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3.5 outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] font-medium text-[14px] dark:text-slate-200 transition-all resize-none shadow-sm" placeholder="Nhập mô tả cho danh mục này..." />
                                        </div>
                                    </>
                                )}

                                {tableModal && (
                                    <>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Tên / Số bàn <span className="text-rose-500">*</span></label>
                                                <input required type="text" value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3.5 outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] font-black text-[#1890ff] text-[16px] transition-all shadow-sm" placeholder="VD: VIP 1" />
                                            </div>
                                            <div>
                                                <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Sức chứa (Người)</label>
                                                <input required type="number" min="1" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3.5 outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] font-bold text-[15px] dark:text-white transition-all shadow-sm" placeholder="VD: 4" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Khu vực / Tầng <span className="text-rose-500">*</span></label>
                                                <input required type="text" value={tableForm.area} onChange={e => setTableForm({ ...tableForm, area: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3.5 outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] font-bold text-[15px] dark:text-white transition-all shadow-sm" placeholder="Ví dụ: Sảnh chính, Tầng 2..." />
                                            </div>
                                            <div>
                                                <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Trạng thái bàn <span className="text-rose-500">*</span></label>
                                                <select required value={tableForm.status} onChange={e => setTableForm({ ...tableForm, status: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3.5 outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] font-bold text-[14px] dark:text-white transition-all shadow-sm cursor-pointer">
                                                    <option value="AVAILABLE">Trống (Sẵn sàng)</option>
                                                    <option value="OCCUPIED">Có khách</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>

                        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => { setCatModal(false); setTableModal(false); }}
                                className="w-1/3 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-[14px] transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                form="settings-form"
                                disabled={isSubmitting}
                                className="w-2/3 py-3.5 rounded-xl bg-[#1890ff] hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-black text-[14px] shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
                            >
                                {isSubmitting ? <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full"></span> : <><CheckCircle2 size={20} /> Lưu Thông Tin</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[200] font-sans select-none animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[360px] shadow-2xl flex flex-col overflow-hidden text-center p-6 border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-black text-[20px] text-slate-800 dark:text-white mb-2">Xác nhận xóa?</h3>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'cat' ? 'danh mục' : 'bàn'} <strong className="text-slate-800 dark:text-white">"{deleteConfirm.name}"</strong> không? Thao tác này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-[14px] transition cursor-pointer">
                                Hủy
                            </button>
                            <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 dark:disabled:bg-rose-800 text-white font-black rounded-xl text-[14px] transition shadow-md cursor-pointer flex items-center justify-center">
                                {isSubmitting ? <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full"></span> : 'Xóa ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}