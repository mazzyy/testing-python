export enum DocumentCategory {
    CV = "cv",
    TRANSCRIPT = "transcript",
    DEGREE = "degree",
    CERTIFICATE = "certificate",
    RECOMMENDATION = "recommendation",
    COVER_LETTER = "cover_letter",
    IDENTIFICATION = "identification",
    FINANCIAL = "financial",
    SOP = "sop",
    TEST_SCORE = "test_score",
    RESEARCH_PROPOSAL = "research_proposal",
    PORTFOLIO = "portfolio",
    OTHER = "other"
}

export enum CredentialCategory {
    UNIVERSITY_PORTAL = "university_portal",
    VISA_PORTAL = "visa_portal",
    SCHOLARSHIP_PORTAL = "scholarship_portal",
    TEST_PORTAL = "test_portal",
    OTHER = "other"
}

export interface Document {
    id: number;
    user_id: number;
    file_name: string;
    file_path: string;
    file_type?: string;
    file_size?: number;
    category: DocumentCategory;
    description?: string;
    created_at: string;
    updated_at?: string;
}

export interface Credential {
    id: number;
    user_id: number;
    title: string;
    url?: string;
    username?: string;
    password?: string;
    category: CredentialCategory;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export interface DocumentCreate {
    file: File;
    category: DocumentCategory;
    description?: string;
}

export interface CredentialCreate {
    title: string;
    url?: string;
    username?: string;
    password?: string;
    category: CredentialCategory;
    notes?: string;
}

export interface CredentialUpdate extends Partial<CredentialCreate> { }
