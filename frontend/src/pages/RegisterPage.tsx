import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'STAFF' // Mặc định là nhân viên
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');

            await axiosClient.post('/auth/register', formData);

            setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng về trang đăng nhập...');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
            <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
                <h2 className="text-3xl font-bold text-center mb-2 text-amber-500">Tạo Tài Khoản</h2>
                <p className="text-center text-slate-400 mb-6">Đăng ký tài khoản hệ thống POS</p>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg mb-4 text-sm">
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Tên đăng nhập</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                            placeholder="nguyenvanA"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Họ và tên</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                            placeholder="admin@pos.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Vai trò</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                        >
                            <option value="STAFF">Nhân viên phục vụ (Staff)</option>
                            <option value="CASHIER">Thu ngân (Cashier)</option>
                            <option value="ADMIN">Quản lý (Admin)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 transition-colors font-semibold rounded-lg text-white shadow-lg shadow-amber-600/20"
                    >
                        Đăng Ký
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="text-amber-500 hover:underline font-medium">
                        Đăng nhập ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}