import api from './api';
import type { Product } from '@/admin/domain';

/** Public kiosk menu: active products only. */
export const getProducts = async () => {
  const response = await api.get("/products");
  return response.data;
}

/** What the manager product form sends; sizes, add-ons and combo parts included. */
export interface ProductInput {
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  is_active: boolean;
  is_available: boolean;
  is_combo: boolean;
  variants: { id?: number; name: string; price: number; is_available: boolean }[];
  modifier_group_ids: number[];
  combo_items: { product_id: number; quantity: number }[];
}

export interface ProductStatus {
  is_active?: boolean;
  is_available?: boolean;
}

/** Every product, including hidden and sold-out ones. */
export const getManagerProducts = async (): Promise<Product[]> => {
  const response = await api.get("/manager/products");
  return response.data.data;
}

export const createProduct = async (input: ProductInput): Promise<Product> => {
  const response = await api.post("/manager/products", input);
  return response.data.data;
}

export const updateProduct = async (id: number, input: ProductInput): Promise<Product> => {
  const response = await api.put(`/manager/products/${id}`, input);
  return response.data.data;
}

export const updateProductStatus = async (id: number, status: ProductStatus): Promise<Product> => {
  const response = await api.patch(`/manager/products/${id}/status`, status);
  return response.data.data;
}

export const deleteProduct = async (id: number) => {
  await api.delete(`/manager/products/${id}`);
}

export const uploadProductImage = async (id: number, file: File): Promise<Product> => {
  const body = new FormData();
  body.append("image", file);
  // Let the browser set the multipart boundary instead of the JSON default.
  const response = await api.post(`/manager/products/${id}/image`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export const deleteProductImage = async (id: number): Promise<Product> => {
  const response = await api.delete(`/manager/products/${id}/image`);
  return response.data.data;
}
