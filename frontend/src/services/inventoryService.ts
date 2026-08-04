import api from './api';

export const getInventory = async () => {
    const response = await api.get("/inventory");
    return response.data;
}