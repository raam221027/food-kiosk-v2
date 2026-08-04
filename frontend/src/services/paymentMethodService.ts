import api from './api';

export const getPaymentMethods = async () => {
    const response = await api.get("/payment-methods");
    return response.data;
}