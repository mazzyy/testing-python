import api from './client';
import type { 
  UserProfile, 
  ProfileFormData, 
  Application, 
  CreateApplicationData, 
  UpdateApplicationData,
  DocumentUploadResponse 
} from '../types';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/profile');
    return response.data;
  },

  createProfile: async (data: ProfileFormData): Promise<UserProfile> => {
    const response = await api.post<UserProfile>('/profile', data);
    return response.data;
  },

  updateProfile: async (data: Partial<ProfileFormData>): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/profile', data);
    return response.data;
  },

  uploadDocument: async (
    file: File, 
    documentType: 'transcript' | 'cv' | 'degree' | 'language_cert'
  ): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    const response = await api.post<DocumentUploadResponse>('/profile/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Applications
  getApplications: async (): Promise<Application[]> => {
    const response = await api.get<Application[]>('/profile/applications');
    return response.data;
  },

  createApplication: async (data: CreateApplicationData): Promise<Application> => {
    const response = await api.post<Application>('/profile/applications', data);
    return response.data;
  },

  updateApplication: async (id: number, data: UpdateApplicationData): Promise<Application> => {
    const response = await api.put<Application>(`/profile/applications/${id}`, data);
    return response.data;
  },

  deleteApplication: async (id: number): Promise<void> => {
    await api.delete(`/profile/applications/${id}`);
  },
};
