import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { StaffManagement } from '../components/StaffManagement';
import type { PosUser } from '../components/StaffManagement';
import axiosClient from '../api/axiosClient';

export default function StaffPage() {
    const [staffList, setStaffList] = useState<PosUser[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUser: PosUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchStaffs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/users');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setStaffList(data);
        } catch (error) {
            console.error('Lỗi tải danh sách nhân viên:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaffs();
    }, [fetchStaffs]);

    const handleAddStaff = async (newStaff: PosUser) => {
        try {
            await axiosClient.post('/auth/register', {
                username: newStaff.username, email: newStaff.email,
                fullName: newStaff.fullName, password: '123',
                role: newStaff.role, pin: newStaff.pin,
                phone: newStaff.phone, permissions: newStaff.permissions
            });
            alert('Thêm tài khoản nhân viên thành công!');
            fetchStaffs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi khi thêm nhân viên. Vui lòng kiểm tra lại Username/Email!');
        }
    };

    const handleUpdateStaff = async (updatedStaff: PosUser) => {
        try {
            await axiosClient.put(`/users/${updatedStaff.id}`, updatedStaff);
            alert('Cập nhật thông tin thành công!');
            fetchStaffs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Không thể cập nhật thông tin!');
        }
    };

    const handleDeleteStaff = async (staffId: string) => {
        try {
            await axiosClient.delete(`/users/${staffId}`);
            alert('Đã xóa nhân viên khỏi hệ thống!');
            fetchStaffs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi khi xóa nhân viên!');
        }
    };

    return (
        <div className="flex h-screen bg-[#f0f2f5] font-sans text-slate-900 overflow-hidden">
            {/* Đã xóa <AppSidebar /> */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 text-slate-500 font-medium">
                            <div className="w-10 h-10 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                            Đang tải dữ liệu nhân sự...
                        </div>
                    ) : (
                        <StaffManagement
                            staffList={staffList}
                            currentUser={currentUser}
                            onAddStaff={handleAddStaff}
                            onUpdateStaff={handleUpdateStaff}
                            onDeleteStaff={handleDeleteStaff}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}