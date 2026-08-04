import api from './api';

export const getDevices = async () => {
    const response = await api.get("/devices");
    return response.data;
}