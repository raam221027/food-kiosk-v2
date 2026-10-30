import api from './api';

export const getOrders = async () => {
    const response = await api.get("/orders");
    return response.data;
}

/** No prices: the backend works out every amount from the menu itself. */
export interface NewOrderItem {
    product_id: number;
    variant_id: number | null;
    quantity: number;
}

export interface NewOrder {
    order_type: 'dine-in' | 'take-out';
    customer_name: string;
    items: NewOrderItem[];
}

export const createOrder = async (order: NewOrder) => {
    const response = await api.post("/orders", order);
    return response.data;
}
