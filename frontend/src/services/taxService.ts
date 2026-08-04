import api from './api';

export const getTaxes = async () => {
    const response = await api.get("/taxes");
    return response.data;
}