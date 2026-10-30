import api from './api';
import type { KitchenStatus } from '@/admin/domain';

export const getKitchenData = async () => {
    const response = await api.get("/kitchen");
    return response.data;
}

export const updateKitchenStatus = async (id: number, status: KitchenStatus) => {
    const response = await api.patch(`/kitchen/${id}/status`, { status });
    return response.data;
}
