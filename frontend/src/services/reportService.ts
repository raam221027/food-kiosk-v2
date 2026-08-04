import api from './api';

export const getSalesReport = async () => {
    const response = await api.get("/reports/sales");
    return response.data;
}