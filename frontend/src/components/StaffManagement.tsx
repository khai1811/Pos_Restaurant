import React, { useState } from 'react';
import {
    Users,
    UserPlus,
    Key,
    Phone,
    Edit2,
    Trash2,
    ShieldAlert,
    Mail,
    X
} from 'lucide-react';
import { sound } from '../utils/formatters';
import type { User } from '../types';

export interface StaffPermissions {
    canDiscount: boolean;
    canRefund: boolean;
    canViewReports: boolean;
    canManageMenu: boolean;
    canManageStaff: boolean;
}

export interface PosUser extends User {
    pin?: string;
    phone?: string;
    avatar?: string;
    active?: boolean;
    permissions?: StaffPermissions;
}

interface StaffManagementProps {
    staffList: PosUser[];
    currentUser: PosUser;
    onUpdateStaff: (user: PosUser) => void;
    onAddStaff: (user: PosUser) => void;
    onDeleteStaff: (userId: string) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
    staffList,
    currentUser,
    onUpdateStaff,
    onAddStaff,
    onDeleteStaff,
}) => {
    const [editingStaff, setEditingStaff] = useState<PosUser | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState<Partial<PosUser>>({
        username: '',
        email: '',
        fullName: '',
        pin: '',
        role: 'STAFF',
        phone: '',
        avatar: '',
        active: true,
        permissions: {
            canDiscount: false,
            canRefund: false,
            canViewReports: false,
            canManageMenu: false,
            canManageStaff: false,
        },
    });

    const handleOpenEdit = (staff: PosUser) => {
        sound.play('click');
        setEditingStaff(staff);
        setFormData({
            ...staff,
            username: staff.username || '',
            fullName: staff.fullName || '',
            email: staff.email || '',
            phone: staff.phone || '',
            pin: staff.pin || '',
            avatar: staff.avatar || '',
            permissions: staff.permissions || {
                canDiscount: false,
                canRefund: false,
                canViewReports: false,
                canManageMenu: false,
                canManageStaff: false,
            },
        });
        setIsCreating(false);
    };

    const handleOpenCreate = () => {
        sound.play('click');
        setEditingStaff(null);
        setFormData({
            username: '',
            email: '',
            fullName: '',
            pin: '',
            role: 'STAFF',
            phone: '',
            avatar: '',
            active: true,
            permissions: {
                canDiscount: false,
                canRefund: false,
                canViewReports: false,
                canManageMenu: false,
                canManageStaff: false,
            },
        });
        setIsCreating(true);
    };

    const handleRoleChange = (role: 'ADMIN' | 'CASHIER' | 'STAFF') => {
        const perms: StaffPermissions = {
            canDiscount: role === 'ADMIN' || role === 'CASHIER',
            canRefund: role === 'ADMIN' || role === 'CASHIER',
            canViewReports: role === 'ADMIN' || role === 'CASHIER',
            canManageMenu: role === 'ADMIN',
            canManageStaff: role === 'ADMIN',
        };

        setFormData((prev) => ({
            ...prev,
            role,
            permissions: perms,
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.username || !formData.pin) {
            alert('Vui lòng nhập đủ Họ tên, Username và Mã PIN!');
            return;
        }
        if (formData.pin.length !== 4) {
            alert('Mã PIN phải gồm đúng 4 chữ số!');
            return;
        }

        sound.play('pay_success');

        if (isCreating) {
            const newUser: PosUser = {
                id: `usr_${Date.now()}`,
                username: formData.username || '',
                email: formData.email || '',
                fullName: formData.fullName || '',
                role: formData.role || 'STAFF',
                pin: formData.pin || '0000',
                phone: formData.phone || '',
                avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'NV')}&background=f97316&color=fff`,
                active: formData.active ?? true,
                permissions: formData.permissions,
            };
            onAddStaff(newUser);
        } else if (editingStaff) {
            onUpdateStaff({
                ...editingStaff,
                ...formData,
            } as PosUser);
        }

        setEditingStaff(null);
        setIsCreating(false);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-bold px-2.5 py-1 rounded tracking-wide">QUẢN LÝ</span>;
            case 'CASHIER': return <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2.5 py-1 rounded tracking-wide">THU NGÂN</span>;
            default: return <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-bold px-2.5 py-1 rounded tracking-wide">NHÂN VIÊN</span>;
        }
    };

    return (
        <div className="space-y-6 select-none">
            {/* Top Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div>
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2.5">
                        <Users className="w-5 h-5 text-[#ff7f3f]" />
                        Quản lý Nhân sự & Phân quyền
                    </h2>
                    <p className="text-[13px] text-slate-500 mt-1 font-medium">
                        Thiết lập tài khoản, mã PIN đổi ca và phân quyền truy cập hệ thống POS
                    </p>
                </div>

                {currentUser?.role === 'ADMIN' && (
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ff7f3f] hover:bg-[#e66000] text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm Nhân Viên</span>
                    </button>
                )}
            </div>

            {/* Staff Grid - Khóa cứng 4 cột cho iPad */}
            <div className="grid grid-cols-4 gap-4">
                {staffList.map((st) => (
                    <div
                        key={st.id}
                        className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-[#ff7f3f] hover:shadow-[0_4px_15px_rgba(255,127,63,0.1)] transition-all"
                    >
                        <div>
                            <div className="flex items-start justify-between">
                                <img
                                    src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.fullName)}&background=f97316&color=fff`}
                                    alt={st.fullName}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                                />
                                {getRoleBadge(st.role)}
                            </div>

                            <div className="mt-4">
                                <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{st.fullName}</h3>
                                <p className="text-[11px] text-slate-400 font-medium">@{st.username}</p>

                                <div className="space-y-2 mt-3">
                                    <p className="text-[12px] text-slate-500 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        {st.email || 'Chưa cập nhật'}
                                    </p>
                                    <p className="text-[12px] text-slate-500 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        {st.phone || 'Chưa cập nhật SĐT'}
                                    </p>
                                    <p className="text-[12px] text-slate-500 flex items-center gap-2">
                                        <Key className="w-3.5 h-3.5 text-slate-400" />
                                        Mã PIN POS: <strong className="font-mono text-slate-700 bg-slate-100 px-1.5 rounded tracking-widest">{st.pin || '****'}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* HIỂN THỊ ĐỦ 3 QUYỀN */}
                            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium space-y-1.5">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="flex items-center gap-1.5"><ShieldAlert size={12} /> Chiết khấu:</span>
                                    <span className={st.permissions?.canDiscount ? "text-emerald-600 font-bold" : "text-slate-300"}>{st.permissions?.canDiscount ? 'Được phép' : 'Không'}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="flex items-center gap-1.5"><ShieldAlert size={12} /> Hoàn tiền:</span>
                                    <span className={st.permissions?.canRefund ? "text-emerald-600 font-bold" : "text-slate-300"}>{st.permissions?.canRefund ? 'Được phép' : 'Không'}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="flex items-center gap-1.5"><ShieldAlert size={12} /> Báo cáo:</span>
                                    <span className={st.permissions?.canViewReports ? "text-emerald-600 font-bold" : "text-slate-300"}>{st.permissions?.canViewReports ? 'Được phép' : 'Không'}</span>
                                </div>
                            </div>
                        </div>

                        {currentUser?.role === 'ADMIN' && (
                            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleOpenEdit(st)}
                                    className="flex-1 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[13px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                                </button>
                                {st.id !== currentUser?.id && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Xác nhận xóa nhân viên "${st.fullName}"?`)) {
                                                onDeleteStaff(st.id);
                                            }
                                        }}
                                        className="py-2 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                        title="Xóa nhân viên"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Thêm/Sửa */}
            {(isCreating || editingStaff) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fade-in">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-lg text-slate-800">
                                {isCreating ? 'Thêm Tài Khoản Nhân Viên' : `Cập nhật: ${editingStaff?.fullName}`}
                            </h3>
                            <button onClick={() => { setEditingStaff(null); setIsCreating(false); }} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="font-bold text-[13px] text-slate-700 block mb-1.5">Họ và tên đầy đủ:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName || ''}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="VD: Nguyễn Văn A"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#ff7f3f] focus:bg-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-[13px] text-slate-700 block mb-1.5">Username đăng nhập:</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isCreating}
                                        value={formData.username || ''}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="nguyenvan_a"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-50 focus:outline-none focus:border-[#ff7f3f] focus:bg-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-[13px] text-slate-700 block mb-1.5">Mã PIN Đổi ca (4 số):</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        required
                                        value={formData.pin || ''}
                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="1234"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono font-black text-center tracking-[0.3em] text-[#ff7f3f] focus:outline-none focus:border-[#ff7f3f] focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="font-bold text-[13px] text-slate-700 block mb-1.5">Số điện thoại liên hệ:</label>
                                    <input
                                        type="text"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        placeholder="Nhập SĐT..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#ff7f3f] focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="font-bold text-[13px] text-slate-700 block mb-1.5">Địa chỉ Email:</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@domain.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#ff7f3f] focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="font-bold text-[13px] text-slate-700 block mb-1.5">Vai trò hệ thống:</label>
                                    <select
                                        value={formData.role || 'STAFF'}
                                        onChange={(e) => handleRoleChange(e.target.value as 'ADMIN' | 'CASHIER' | 'STAFF')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#ff7f3f] cursor-pointer transition-colors"
                                    >
                                        <option value="ADMIN">Quản lý (Admin)</option>
                                        <option value="CASHIER">Thu ngân (Cashier)</option>
                                        <option value="STAFF">Phục vụ / Bếp (Staff)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <span className="font-bold text-[13px] text-slate-800 block mb-2">Quyền hạn hệ thống:</span>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions?.canDiscount ?? false}
                                        disabled={formData.role === 'ADMIN'}
                                        onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions!, canDiscount: e.target.checked } })}
                                        className="w-4 h-4 rounded border-slate-300 accent-[#ff7f3f] cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-[13px] font-medium text-slate-700">Áp dụng giảm giá / Chiết khấu</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions?.canRefund ?? false}
                                        disabled={formData.role === 'ADMIN'}
                                        onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions!, canRefund: e.target.checked } })}
                                        className="w-4 h-4 rounded border-slate-300 accent-[#ff7f3f] cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-[13px] font-medium text-slate-700">Hoàn tiền & Hủy hóa đơn</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions?.canViewReports ?? false}
                                        disabled={formData.role === 'ADMIN'}
                                        onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions!, canViewReports: e.target.checked } })}
                                        className="w-4 h-4 rounded border-slate-300 accent-[#ff7f3f] cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-[13px] font-medium text-slate-700">Truy cập Báo cáo Doanh thu</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => { setEditingStaff(null); setIsCreating(false); }} className="w-1/3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[13px] text-slate-700 font-bold transition-colors cursor-pointer">
                                    Hủy
                                </button>
                                <button type="submit" className="w-2/3 py-2.5 rounded-lg bg-[#ff7f3f] hover:bg-[#e66000] text-white text-[13px] font-bold transition-colors cursor-pointer">
                                    {isCreating ? 'Tạo Tài Khoản' : 'Lưu Thay Đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};