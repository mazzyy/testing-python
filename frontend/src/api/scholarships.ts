import api from './client';
import type { Scholarship, ScholarshipFilters, ScholarshipListResponse, ScholarshipEligibilityResponse } from '../types';

export const scholarshipsApi = {
    getScholarships: async (filters: ScholarshipFilters = {}): Promise<ScholarshipListResponse> => {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        if (filters.search) params.append('search', filters.search);

        const response = await api.get<ScholarshipListResponse>(`/scholarships?${params.toString()}`);
        return response.data;
    },

    getScholarship: async (id: number): Promise<Scholarship> => {
        const response = await api.get<Scholarship>(`/scholarships/${id}`);
        return response.data;
    },

    getEligibleScholarships: async (nResults: number = 10): Promise<ScholarshipEligibilityResponse> => {
        const response = await api.get<ScholarshipEligibilityResponse>(`/scholarships/eligible?n_results=${nResults}`);
        return response.data;
    },

    importScholarships: async (file: File): Promise<{
        success: boolean;
        imported: number;
        skipped: number;
        indexed?: number;
        errors: string[];
    }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/scholarships/import/json', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
