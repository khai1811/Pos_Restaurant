import axiosClient from './axiosClient';

export interface RegisterDto {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: 'ADMIN' | 'STAFF' | 'CASHIER';
}

export const authApi = {
    login: async (data: { email: string; password: string }) => {
        const response = await axiosClient.post('/auth/login', data);
        return response.data;
    },
    register: async (data: RegisterDto) => {
        const response = await axiosClient.post('/auth/register', data);
        return response.data;
    },
    getMe: async () => {
        const response = await axiosClient.get('/auth/me');
        return response.data;
    }
};