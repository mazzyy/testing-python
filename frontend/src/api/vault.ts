import axios from 'axios';
import { Document, Credential, DocumentCategory, CredentialCreate, CredentialUpdate } from '../types/vault';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with auth header
const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const vaultApi = {
    // Documents
    getDocuments: async (): Promise<Document[]> => {
        const response = await api.get('/vault/documents');
        return response.data;
    },

    uploadDocument: async (file: File, category: DocumentCategory, description?: string): Promise<Document> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        if (description) {
            formData.append('description', description);
        }

        const response = await api.post('/vault/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteDocument: async (id: number): Promise<void> => {
        await api.delete(`/vault/documents/${id}`);
    },

    getDownloadUrl: (id: number) => {
        return `${API_URL}/vault/documents/${id}/download`;
    },

    fetchDocumentBlob: async (id: number): Promise<Blob> => {
        const response = await api.get(`/vault/documents/${id}/download`, {
            responseType: 'blob',
        });
        return response.data;
    },

    downloadDocument: async (id: number, fileName: string) => {
        try {
            const response = await api.get(`/vault/documents/${id}/download`, {
                responseType: 'blob',
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed', error);
            throw error;
        }
    },

    // Credentials
    getCredentials: async (): Promise<Credential[]> => {
        const response = await api.get('/vault/credentials');
        return response.data;
    },

    createCredential: async (data: CredentialCreate): Promise<Credential> => {
        const response = await api.post('/vault/credentials', data);
        return response.data;
    },

    updateCredential: async (id: number, data: CredentialUpdate): Promise<Credential> => {
        const response = await api.put(`/vault/credentials/${id}`, data);
        return response.data;
    },

    deleteCredential: async (id: number): Promise<void> => {
        await api.delete(`/vault/credentials/${id}`);
    },
};