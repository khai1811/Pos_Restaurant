import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);

            const response = await axiosClient.post('/auth/login', {
                username: username.trim(),
                password
            });

            const token = response.data.token || response.data.accessToken;

            if (token) {
                localStorage.setItem('accessToken', token);
            }

            const loggedInUser = response.data.user;
            if (loggedInUser) {
                localStorage.setItem('user', JSON.stringify(loggedInUser));
            }

            const role = loggedInUser?.role?.toUpperCase();
            if (role === 'KITCHEN') {
                navigate('/kitchen');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Lỗi đăng nhập:', err);
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white select-none">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800">
                <h2 className="text-3xl font-bold text-center mb-2 text-amber-500">POS Nhà Hàng</h2>
                <p className="text-center text-gray-400 mb-6">Đăng nhập hệ thống quản lý</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tên đăng nhập</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white disabled:opacity-50"
                            placeholder="nguyenvanA"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white disabled:opacity-50"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 transition-colors font-semibold rounded-lg text-white shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}