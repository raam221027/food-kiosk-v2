import api from './api';
import type { ModifierGroup } from '@/admin/domain';

export const getModifiers = async () => {
    const response = await api.get("/modifiers");
    return response.data;
}

export interface ModifierGroupInput {
    name: string;
    min_selection: number;
    /** 0 means no upper limit. */
    max_selection: number;
    is_required: boolean;
    modifiers: { id?: number; name: string; price: number; is_available: boolean }[];
}

/** Add-on groups with their add-ons. */
export const getModifierGroups = async (): Promise<ModifierGroup[]> => {
    const response = await api.get("/manager/modifier-groups");
    return response.data.data;
}

export const createModifierGroup = async (input: ModifierGroupInput): Promise<ModifierGroup> => {
    const response = await api.post("/manager/modifier-groups", input);
    return response.data.data;
}

export const updateModifierGroup = async (id: number, input: ModifierGroupInput): Promise<ModifierGroup> => {
    const response = await api.put(`/manager/modifier-groups/${id}`, input);
    return response.data.data;
}

export const deleteModifierGroup = async (id: number) => {
    await api.delete(`/manager/modifier-groups/${id}`);
}
