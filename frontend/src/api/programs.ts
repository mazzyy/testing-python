import api from './client';
import type {
  Program,
  ProgramFilters,
  ProgramListResponse,
  ProgramStats,
  UniversityListResponse,
  UniversityFilters
} from '../types';

export const programsApi = {
  getPrograms: async (filters: ProgramFilters = {}): Promise<ProgramListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.degree_type) params.append('degree_type', filters.degree_type);
    if (filters.city) params.append('city', filters.city);
    if (filters.university) params.append('university', filters.university);
    if (filters.search) params.append('search', filters.search);
    if (filters.teaching_language) params.append('teaching_language', filters.teaching_language);

    const response = await api.get<ProgramListResponse>(`/programs?${params.toString()}`);
    return response.data;
  },

  getProgram: async (id: string | number): Promise<Program> => {
    const response = await api.get<Program>(`/programs/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<ProgramStats> => {
    const response = await api.get<ProgramStats>('/programs/statistics');
    return response.data;
  },

  searchSemantic: async (query: string, nResults: number = 10, degreeType?: string): Promise<Program[]> => {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('n_results', nResults.toString());
    if (degreeType) params.append('degree_type', degreeType);

    const response = await api.get<Program[]>(`/programs/search/semantic?${params.toString()}`);
    return response.data;
  },

  // University endpoints
  getCities: async (): Promise<{ cities: string[] }> => {
    const response = await api.get<{ cities: string[] }>('/programs/cities');
    return response.data;
  },

  getUniversities: async (filters: UniversityFilters = {}): Promise<UniversityListResponse> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.city) params.append('city', filters.city);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.degree_type) params.append('degree_type', filters.degree_type);

    const response = await api.get<UniversityListResponse>(`/programs/universities?${params.toString()}`);
    return response.data;
  },

  getUniversityPrograms: async (universityName: string, filters: ProgramFilters = {}): Promise<ProgramListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.degree_type) params.append('degree_type', filters.degree_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.teaching_language) params.append('teaching_language', filters.teaching_language);
    if (filters.city) params.append('city', filters.city);

    const encodedName = encodeURIComponent(universityName);
    const response = await api.get<ProgramListResponse>(`/programs/universities/${encodedName}/programs?${params.toString()}`);
    return response.data;
  },

  // Admin endpoints
  importPrograms: async (file: File, degreeType?: string): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (degreeType) formData.append('degree_type', degreeType);

    const response = await api.post('/programs/import/json', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  indexPrograms: async (forceReload: boolean = false): Promise<{
    success: boolean;
    indexed_count: number;
    message: string;
  }> => {
    const response = await api.post(`/programs/index?force_reload=${forceReload}`);
    return response.data;
  },

  deleteProgram: async (id: number, hardDelete: boolean = false): Promise<void> => {
    await api.delete(`/programs/${id}?hard_delete=${hardDelete}`);
  },
};
