import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Volume2, VolumeX, Lock, ChevronDown, Clock, CircleDot,
    CheckCircle2, Menu, X, Grid, UtensilsCrossed, TrendingUp, History, ChefHat, Users, LogOut, Settings
} from 'lucide-react';
import { sound } from '../utils/formatters';
import axiosClient from '../api/axiosClient';

interface NavbarProps {
    occupiedTablesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ occupiedTablesCount = 0 }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [time, setTime] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

    const [isMainNavOpen, setIsMainNavOpen] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    const [currentStaff, setCurrentStaff] = useState<any>(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    });

    const userRole = currentStaff?.role?.toUpperCase() || 'STAFF';

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setDate(now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleSound = () => {
        sound.enabled = !soundEnabled;
        setSoundEnabled(sound.enabled);
        if (sound.enabled) sound.play('click');
    };

    const handleOpenStaffModal = async () => {
        sound.play('click');
        setPinInput(''); setPinError(''); setShowStaffModal(true);
        try {
            const res = await axiosClient.get('/users');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setStaffList(data);
            if (data.length > 0) {
                const found = data.find((s: any) => s.id === currentStaff?.id) || data[0];
                setSelectedStaff(found);
            }
        } catch (err) { console.error('Lỗi tải danh sách nhân viên:', err); }
    };

    const handleKeyPress = (num: string) => {
        sound.play('click');
        if (pinInput.length < 4) { setPinInput((prev) => prev + num); setPinError(''); }
    };

    const handleVerifyPin = async () => {
        if (!selectedStaff) return;
        if (pinInput.length !== 4) { setPinError('Vui lòng nhập đủ 4 số PIN!'); return; }

        try {
            const response = await axiosClient.post('/auth/pin-login', { userId: selectedStaff.id, pin: pinInput });
            const token = response.data.token || response.data.accessToken;
            if (token) localStorage.setItem('accessToken', token);

            const loggedInUser = response.data.user;
            if (loggedInUser) {
                localStorage.setItem('user', JSON.stringify(loggedInUser));
                setCurrentStaff(loggedInUser);
            }

            sound.play('pay_success');
            setShowStaffModal(false);
            setPinInput('');

            const role = loggedInUser?.role?.toUpperCase();
            if (role === 'KITCHEN') navigate('/kitchen');
            else navigate('/');
        } catch (err: any) {
            sound.play('error');
            setPinError(err.response?.data?.message || 'Mã PIN không chính xác!');
            setPinInput('');
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role?.toUpperCase()) {
            case 'ADMIN': return 'Quản lý';
            case 'CASHIER': return 'Thu ngân';
            case 'KITCHEN': return 'Bếp';
            default: return 'Phục vụ';
        }
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất khỏi ca làm việc?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    const navItems = [
        { path: '/', name: 'Sơ đồ bàn', icon: Grid, roles: ['ADMIN', 'CASHIER', 'STAFF'] },
        { path: '/menu', name: 'Thực đơn', icon: UtensilsCrossed, roles: ['ADMIN'] },
        { path: '/dashboard', name: 'Báo cáo doanh thu', icon: TrendingUp, roles: ['ADMIN'] },
        { path: '/history', name: 'Lịch sử giao dịch', icon: History, roles: ['ADMIN', 'CASHIER'] },
        { path: '/kitchen', name: 'Màn hình Bếp (KDS)', icon: ChefHat, roles: ['ADMIN', 'KITCHEN', 'STAFF'] },
        { path: '/staff', name: 'Quản lý nhân sự', icon: Users, roles: ['ADMIN'] },
        { path: '/settings', name: 'Cài đặt hệ thống', icon: Settings, roles: ['ADMIN'] },
    ].filter(item => item.roles.includes(userRole));

    return (
        <>
            <header className="bg-white text-slate-800 border-b border-gray-300 sticky top-0 z-30 select-none shadow-sm print:hidden">
                <div className="px-4 sm:px-6 flex items-center justify-between h-[52px]">

                    {/* LEFT: Nút Menu 3 gạch & Trạng thái bàn */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMainNavOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:text-[#1890ff] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-semibold">
                            <CircleDot className="w-3 h-3 text-[#1890ff] animate-pulse" />
                            <span className="text-slate-600">Đang phục vụ:</span>
                            <strong className="text-[#1890ff]">{occupiedTablesCount} bàn</strong>
                        </div>
                    </div>

                    {/* RIGHT: Đồng hồ, Cài đặt, Âm thanh & Widget Đổi ca */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex flex-col items-end text-right text-xs text-slate-500 pr-3 border-r border-gray-200">
                            <span className="font-mono font-bold text-[#1890ff] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {time}
                            </span>
                            <span className="text-[10px] font-medium">{date}</span>
                        </div>

                        {userRole === 'ADMIN' && (
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 text-slate-500 hover:text-[#1890ff] hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                                title="Cài đặt hệ thống"
                            >
                                <Settings size={20} strokeWidth={2} />
                            </button>
                        )}

                        <button onClick={toggleSound} className="p-2 rounded-xl text-slate-500 hover:text-[#1890ff] hover:bg-blue-50 transition cursor-pointer">
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        <button onClick={handleOpenStaffModal} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-left cursor-pointer">
                            <img src={currentStaff?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStaff?.fullName || 'User')}&background=1890ff&color=fff`} alt="Avatar" className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-100" />
                            <div className="hidden sm:block text-xs leading-tight">
                                <div className="font-bold text-slate-800 truncate max-w-[100px]">{currentStaff?.fullName || 'Chọn ca'}</div>
                                <div className="text-[10px] text-[#1890ff] font-bold">{getRoleLabel(currentStaff?.role)}</div>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    </div>
                </div>
            </header>

            {/* DRAWER MENU TRƯỢT TỪ TRÁI SANG */}
            {isMainNavOpen && (
                <div className="fixed inset-0 z-[100] flex font-sans print:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMainNavOpen(false)}></div>
                    <div className="relative w-64 md:w-72 bg-white h-full shadow-2xl flex flex-col animate-fade-in-right">
                        <div className="h-[52px] border-b flex items-center px-4 justify-between bg-[#1890ff] text-white shrink-0">
                            <span className="font-bold text-lg">Menu Quản Lý</span>
                            <button onClick={() => setIsMainNavOpen(false)} className="hover:text-blue-200 transition-colors cursor-pointer"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-2 space-y-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => { setIsMainNavOpen(false); navigate(item.path); }}
                                        className={`w-full flex items-center gap-3 px-6 py-3.5 text-[14px] font-bold transition-colors cursor-pointer ${isActive ? 'bg-blue-50 text-[#1890ff] border-r-4 border-[#1890ff]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#1890ff]'}`}
                                    >
                                        <item.icon size={20} className={isActive ? 'text-[#1890ff]' : 'text-slate-400'} />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="border-t border-gray-200 p-4 bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1890ff] flex items-center justify-center font-bold text-lg shadow-sm">
                                    {currentStaff?.fullName?.charAt(0) || 'U'}
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-slate-800 text-[14px]">{currentStaff?.fullName || 'Nhân viên'}</p>
                                    <p className="text-[#1890ff] font-semibold mt-0.5">{getRoleLabel(currentStaff?.role)}</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-bold border border-rose-200 transition-colors cursor-pointer shadow-sm">
                                <LogOut size={18} /> Đăng xuất ca
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MÃ PIN GIAO DIỆN SÁNG (Mới) */}
            {showStaffModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 select-none font-sans print:hidden">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl text-slate-800 space-y-5 animate-fade-in relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-[#1890ff] font-bold text-base">
                                <Lock className="w-5 h-5" />
                                <span>Đổi ca làm việc / Đăng nhập</span>
                            </div>
                            <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-rose-500 p-1 rounded-lg cursor-pointer">✕</button>
                        </div>

                        {pinError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-2.5 rounded-xl text-xs font-medium">
                                {pinError}
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. CHỌN NHÂN VIÊN:</label>
                            <div className="grid grid-cols-2 gap-2.5 max-h-44 overflow-y-auto pr-1">
                                {staffList.map((st) => {
                                    const isSelected = selectedStaff?.id === st.id;
                                    return (
                                        <div
                                            key={st.id}
                                            onClick={() => { sound.play('click'); setSelectedStaff(st); setPinInput(''); setPinError(''); }}
                                            className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'border-[#1890ff] bg-blue-50 shadow-sm ring-1 ring-[#1890ff]' : 'border-slate-200 bg-slate-50 hover:border-[#1890ff]'}`}
                                        >
                                            <img src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.fullName)}&background=1890ff&color=fff`} alt={st.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-xs text-slate-800 truncate">{st.fullName}</h4>
                                                <p className="text-[10px] text-[#1890ff] font-medium">{getRoleLabel(st.role)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-500 uppercase tracking-wider">
                                    2. Nhập mã PIN của <strong className="text-[#1890ff]">{selectedStaff?.fullName || '...'}</strong>:
                                </span>
                            </div>

                            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-[0.5em] text-[#1890ff] min-h-[48px] flex items-center justify-center">
                                {pinInput ? pinInput.padEnd(4, '•').replace(/./g, (c, i) => i < pinInput.length ? c : '•') : <span className="text-slate-400 text-sm tracking-normal">Nhập 4 số PIN...</span>}
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                    <button key={num} type="button" onClick={() => handleKeyPress(num)} className="py-3 bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-800 font-bold text-base rounded-xl transition-all cursor-pointer shadow-sm">
                                        {num}
                                    </button>
                                ))}
                                <button type="button" onClick={() => { sound.play('click'); setPinInput(''); setPinError(''); }} className="py-3 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer">Xóa</button>
                                <button type="button" onClick={() => handleKeyPress('0')} className="py-3 bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-800 font-bold text-base rounded-xl transition-all cursor-pointer shadow-sm">0</button>
                                <button type="button" disabled={pinInput.length !== 4} onClick={handleVerifyPin} className="py-3 bg-[#1890ff] hover:bg-blue-600 active:scale-95 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};