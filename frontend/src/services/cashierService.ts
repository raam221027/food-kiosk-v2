import api from './api';

export const getCashierData = async () => {
    const response = await api.get("/cashier");
    return response.data;
}