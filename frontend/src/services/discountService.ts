import api from './api';

export const getDiscounts = async () => {
    const response = await api.get("/discounts");
    return response.data;
}