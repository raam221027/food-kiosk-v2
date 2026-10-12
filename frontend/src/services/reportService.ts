import api from './api';
import type { SalesReport } from '@/admin/domain';

/** Sales and operations for a date range (YYYY-MM-DD, inclusive). */
export const getSalesReport = async (range?: { from: string; to: string }): Promise<SalesReport> => {
    const response = await api.get("/manager/reports/sales", { params: range });
    return response.data.data;
}
