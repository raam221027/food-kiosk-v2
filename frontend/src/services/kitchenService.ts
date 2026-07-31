import api from './api';

export const getKitchenData = async () => {
    const response = await api.get("/kitchen");
    return response.data;
}