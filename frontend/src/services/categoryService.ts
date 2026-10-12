import api from './api';
import type { Category } from '@/admin/domain';

/** Public kiosk menu: active categories only. */
export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
}

export interface CategoryInput {
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  requires_size: boolean;
}

/** Every category, including inactive ones, with `products_count`. */
export const getManagerCategories = async (): Promise<Category[]> => {
  const response = await api.get("/manager/categories");
  return response.data.data;
}

export const createCategory = async (input: CategoryInput): Promise<Category> => {
  const response = await api.post("/manager/categories", input);
  return response.data.data;
}

export const updateCategory = async (id: number, input: CategoryInput): Promise<Category> => {
  const response = await api.put(`/manager/categories/${id}`, input);
  return response.data.data;
}

export const deleteCategory = async (id: number) => {
  await api.delete(`/manager/categories/${id}`);
}

export const uploadCategoryImage = async (id: number, file: File): Promise<Category> => {
  const body = new FormData();
  body.append("image", file);
  const response = await api.post(`/manager/categories/${id}/image`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}
