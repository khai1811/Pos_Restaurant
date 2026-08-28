import React, { useState } from 'react'; //[cite: 22]
import { useNavigate, Link } from 'react-router-dom'; //[cite: 22]
import axiosClient from '../api/axiosClient'; //[cite: 22]

export default function LoginPage() { //[cite: 22]
    const [username, setUsername] = useState(''); //[cite: 22]
    const [password, setPassword] = useState(''); //[cite: 22]
    const [error, setError] = useState(''); //[cite: 22]
    const [loading, setLoading] = useState(false); //[cite: 22]
    const navigate = useNavigate(); //[cite: 22]

    const handleLogin = async (e: React.FormEvent) => { //[cite: 22]
        e.preventDefault(); //[cite: 22]
        try { //[cite: 22]
            setError(''); //[cite: 22]
            setLoading(true); //[cite: 22]

            // Gửi { username, password } lên backend[cite: 22]
            const response = await axiosClient.post('/auth/login', { //[cite: 22]
                username: username.trim(), //[cite: 22]
                password //[cite: 22]
            }); //[cite: 22]

            // Lấy token từ response (hỗ trợ cả trường hợp backend trả về .token hoặc .accessToken)[cite: 22]
            const token = response.data.token || response.data.accessToken; //[cite: 22]

            if (token) { //[cite: 22]
                // ĐỒNG BỘ DÙNG 'accessToken' ĐỂ KHỚP VỚI AXISCLIENT[cite: 22]
                localStorage.setItem('accessToken', token); //[cite: 22]
            }

            const loggedInUser = response.data.user;
            if (loggedInUser) {
                localStorage.setItem('user', JSON.stringify(loggedInUser));
            }

            // ĐIỀU HƯỚNG THÔNG MINH DỰA TRÊN VAI TRÒ (ROLE)
            const role = loggedInUser?.role?.toUpperCase();
            if (role === 'KITCHEN') {
                navigate('/kitchen'); // Bếp trưởng vào thẳng màn hình bếp
            } else {
                navigate('/'); // Admin, Thu ngân, Phục vụ vào sơ đồ bàn
            }
        } catch (err: any) { //[cite: 22]
            console.error('Lỗi đăng nhập:', err); //[cite: 22]
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!'); //[cite: 22]
        } finally { //[cite: 22]
            setLoading(false); //[cite: 22]
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

                <p className="text-center text-sm text-slate-400 mt-6">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="text-amber-500 hover:underline font-medium">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}