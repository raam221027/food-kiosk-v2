import api from './api';

export const getCoupons = async () => {
    const response = await api.get("/coupons");
    return response.data;
}