import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Grid,
    UtensilsCrossed,
    TrendingUp,
    History,
    ChefHat,
    Users,
    LogOut,
    Settings
} from 'lucide-react';

export default function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy thông tin user đang đăng nhập
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const role = currentUser?.role?.toUpperCase() || 'STAFF'; // Mặc định là staff

    // Định nghĩa các mục menu và phân quyền (allowedRoles)
    const allNavItems = [
        { path: '/', name: 'Sơ đồ bàn', icon: Grid, roles: ['ADMIN', 'CASHIER', 'STAFF'] },
        { path: '/menu', name: 'Thực đơn', icon: UtensilsCrossed, roles: ['ADMIN'] },
        { path: '/dashboard', name: 'Báo cáo doanh thu', icon: TrendingUp, roles: ['ADMIN'] },
        { path: '/history', name: 'Lịch sử giao dịch', icon: History, roles: ['ADMIN', 'CASHIER'] },
        { path: '/kitchen', name: 'Màn hình Bếp (KDS)', icon: ChefHat, roles: ['ADMIN', 'KITCHEN', 'STAFF'] },
        { path: '/staff', name: 'Quản lý nhân sự', icon: Users, roles: ['ADMIN'] },
        { path: '/settings', name: 'Cài đặt hệ thống', icon: Settings, roles: ['ADMIN'] },
    ];

    // Lọc menu theo role
    const navItems = allNavItems.filter(item => item.roles.includes(role));

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất khỏi ca làm việc?')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    return (
        < aside className="w-[76px] lg:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-800 transition-all duration-300 z-20" >

            {/* Header / Logo */}
            < div className="h-16 lg:h-18 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800" >
                <div className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl bg-[#ff7f3f] flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
                    POS
                </div>
                <div className="hidden lg:block ml-3 overflow-hidden">
                    <h1 className="font-bold text-white text-[13px] lg:text-sm tracking-wide truncate">NHÀ HÀNG GOURMET</h1>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        Ca: {role}
                    </span>
                </div>
            </div >

            {/* Danh sách Menu điều hướng */}
            < div className="flex-1 py-4 px-2 lg:px-3 space-y-1.5 overflow-y-auto scrollbar-none" >
                {
                    navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={item.name}
                                className={`w-full flex items-center justify-center lg:justify-start gap-3.5 px-0 lg:px-4 py-3.5 lg:py-3 rounded-xl text-[13px] lg:text-xs font-bold transition-all cursor-pointer ${isActive
                                    ? 'bg-[#ff7f3f] text-white shadow-lg shadow-orange-500/20'
                                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} className="lg:w-[18px] lg:h-[18px] shrink-0" />
                                <span className="hidden lg:block whitespace-nowrap">{item.name}</span>
                            </button>
                        );
                    })
                }
            </div >

            {/* Thông tin nhân viên & Nút Đăng xuất */}
            < div className="p-3 lg:p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col items-center lg:items-stretch" >
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4 lg:mb-3">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'User')}&background=ff7f3f&color=fff`}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="hidden lg:block overflow-hidden">
                        <p className="text-[13px] lg:text-xs font-bold text-white truncate">{currentUser?.fullName || 'Nhân viên'}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-mono truncate">@{currentUser?.username || 'staff'}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    title="Đăng xuất ca"
                    className="w-full flex items-center justify-center gap-2 py-3 lg:py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700 text-slate-300 text-[13px] lg:text-xs font-bold transition-all cursor-pointer"
                >
                    <LogOut size={18} className="lg:w-[15px] lg:h-[15px] shrink-0" />
                    <span className="hidden lg:block">Đăng Xuất</span>
                </button>
            </div >
        </aside >
    );
}