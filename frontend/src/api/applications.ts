import client from './client';
import { ApplicationChecklistItem, DocumentRequirement, EligibilityRequirement, HECVerification } from '../types';

// Define types locally if not yet in global types
export interface TrackerState {
    checklist: ApplicationChecklistItem[];
    documents: DocumentRequirement[];
    eligibility: EligibilityRequirement[];
    hec_verification: HECVerification[];
    credentials: any[];
    program: any;
    application_status: string;
    visa_appointment_date?: string;
    user_nationality?: string;
    profile_gpa?: {
        cgpa: number;
        scale: number;
    };
}

export const applicationsApi = {
    // Initialize tracker
    initTracker: (id: number) =>
        client.post(`/applications/${id}/tracker/init`).then(res => res.data),

    // Re-initialize tracker (clears stale data, rebuilds from current nationality)
    reinitTracker: (id: number) =>
        client.post(`/applications/${id}/tracker/reinit`).then(res => res.data),

    // Get tracker details
    getTracker: (id: number) =>
        client.get<TrackerState>(`/applications/${id}/tracker`).then(res => res.data),

    // Update checklist item status
    updateChecklistItem: (appId: number, itemId: number, status: string) =>
        client.put(`/applications/${appId}/checklist/${itemId}`, null, { params: { status } }).then(res => res.data),

    // Calculate GPA
    calculateGpa: (gpa: number, scale: number, minPassing?: number) =>
        client.post('/tools/gpa-calculator', null, { params: { gpa, scale, min_passing_grade: minPassing } }).then(res => res.data),

    // Check Eligibility
    checkEligibility: (appId: number) =>
        client.post(`/applications/${appId}/check-eligibility`).then(res => res.data),

    // Add Credential
    addCredential: (appId: number, data: { portal_url: string; username: string; password?: string; portal_name?: string }) =>
        client.post(`/applications/${appId}/credentials`, data).then(res => res.data),

    // Update Application Details (e.g. Visa Date)
    updateApplication: (appId: number, data: { visa_appointment_date?: string }) =>
        client.put(`/applications/${appId}`, data).then(res => res.data),

    // Upload Document
    uploadDocument: (appId: number, file: File, documentType: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        return client.post(`/applications/${appId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    },

    // Link Vault Document
    linkVaultDocument: (appId: number, documentType: string, vaultDocId: number) => {
        const formData = new FormData();
        formData.append('document_type', documentType);
        formData.append('vault_document_id', vaultDocId.toString());
        return client.post(`/applications/${appId}/documents/link-vault`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' } // Form data for consistency with backend expectation
        }).then(res => res.data);
    },

    deleteDocument: (appId: number, documentType: string) => {
        return client.delete(`/applications/${appId}/documents/${documentType}`).then(res => res.data);
    },

    // Fetch the file blob for a specific document requirement (for preview)
    fetchRequirementBlob: (appId: number, reqId: number): Promise<Blob> =>
        client.get(`/applications/${appId}/requirements/${reqId}/file`, { responseType: 'blob' })
            .then(r => r.data),
};
