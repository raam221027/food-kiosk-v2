import api from './api';

export const getOrders = async () => {
    const response = await api.get("/orders");
    return response.data;
}

export interface NewOrderItem {
    product_id: number;
    variant_id: number | null;
    product_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

export interface NewOrder {
    restaurant_id: number;
    order_type: 'dine-in' | 'take-out';
    customer_name: string;
    subtotal: number;
    tax: number;
    total_amount: number;
    items: NewOrderItem[];
}

export const createOrder = async (order: NewOrder) => {
    const response = await api.post("/orders", order);
    return response.data;
}
