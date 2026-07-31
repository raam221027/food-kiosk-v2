import api from './api';

export const getModifiers = async () => {
    const response = await api.get("/modifiers");
    return response.data;
}