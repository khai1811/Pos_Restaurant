import axiosClient from './axiosClient';
import type { Table } from '../types';

export const tableApi = {
    getAll: () => axiosClient.get<Table[]>('/tables'),
    getById: (id: string) => axiosClient.get<Table>(`/tables/${id}`),
    create: (data: Partial<Table>) => axiosClient.post<Table>('/tables', data),

    // 🔥 Bổ sung hàm update để Frontend có đường dẫn gửi dữ liệu sửa bàn xuống Backend
    update: (id: string, data: Partial<Table>) => axiosClient.put<Table>(`/tables/${id}`, data),

    updateStatus: (id: string, status: Table['status']) => axiosClient.patch<Table>(`/tables/${id}/status`, { status }),
};