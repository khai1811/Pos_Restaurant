import axiosClient from './axiosClient';

export interface MenuItemDto {
    name: string;
    price: number;
    description?: string;
    categoryId: string;
    isAvailable?: boolean;
    popular?: boolean;
    image?: string;
}

export const menuApi = {
    getAll: async () => {
        const response = await axiosClient.get('/menu-items');
        return response.data;
    },
    create: async (data: MenuItemDto) => {
        const response = await axiosClient.post('/menu-items', data);
        return response.data;
    },
    update: async (id: string, data: MenuItemDto) => {
        const response = await axiosClient.put(`/menu-items/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await axiosClient.delete(`/menu-items/${id}`);
        return response.data;
    }
};