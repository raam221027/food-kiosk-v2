import api from './api';

export const getSettings = async () => {
    const response = await api.get("/settings");
    return response.data;
}