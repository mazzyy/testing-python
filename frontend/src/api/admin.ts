import api from './client';

// Types
export interface User {
    id: number;
    email: string;
    username: string;
    full_name: string | null;
    role: 'admin' | 'user';
    is_active: boolean;
    is_verified: boolean;
    created_at: string | null;
    last_login: string | null;
}

export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    page_size: number;
}

export interface UserStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    admin_count: number;
    user_count: number;
    verified_users: number;
    unverified_users: number;
    users_with_profile: number;
    users_with_applications: number;
}

export interface LanguageInfo {
    language: string;
    level: string;
}

export interface UserProfile {
    id: number;
    user_id: number;
    full_name: string | null;
    nationality: string | null;
    date_of_birth: string | null;
    phone: string | null;
    current_degree: string | null;
    field_of_study: string | null;
    university: string | null;
    graduation_date: string | null;
    cgpa: number | null;
    gpa_scale: number | null;
    relevant_courses: string[] | null;
    skills: string[] | null;
    honors_awards: string | null;
    work_experience: string | null;
    research_experience: string | null;
    english_level: string | null;
    english_certificate: string | null;
    english_score: string | null;
    german_level: string | null;
    german_certificate: string | null;
    german_score: string | null;
    other_languages: LanguageInfo[] | null;
    desired_degree: string | null;
    desired_fields: string[] | null;
    preferred_cities: string[] | null;
    preferred_universities: string[] | null;
    preferred_language: string | null;
    budget_range: string | null;
    needs_funding: string | null;
    transcript_path: string | null;
    cv_path: string | null;
    parsed_transcript: Record<string, unknown> | null;
    parsed_cv: Record<string, unknown> | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface Program {
    id: number;
    program_name: string;
    university_name: string;
    city: string;
    degree_type: string;
}

export interface UserApplication {
    id: number;
    user_id: number;
    program_id: number;
    status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
    match_score: number | null;
    user_notes: string | null;
    admin_notes: string | null;
    created_at: string | null;
    updated_at: string | null;
    submitted_at: string | null;
    program: Program | null;
}

export interface CachedRecommendation {
    id: number;
    program_id: number;
    match_score: number;
    match_reasons: string[] | null;
    highlights: string | null;
    gaps: string[] | null;
    created_at: string | null;
    program_name: string | null;
    university_name: string | null;
    degree_type: string | null;
    city: string | null;
}

export interface UserDetails {
    user: User;
    profile: UserProfile | null;
    applications: UserApplication[];
    recommendations: CachedRecommendation[];
}

export interface GetUsersParams {
    page?: number;
    page_size?: number;
    role?: 'admin' | 'user';
    is_active?: boolean;
    search?: string;
}

// Admin API functions
export const adminApi = {
    // Get user statistics
    getUserStats: async (): Promise<UserStats> => {
        const response = await api.get('/users/stats');
        return response.data;
    },

    // Get paginated users list
    getUsers: async (params: GetUsersParams = {}): Promise<UserListResponse> => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    // Get comprehensive user details
    getUserDetails: async (userId: number): Promise<UserDetails> => {
        const response = await api.get(`/users/${userId}/details`);
        return response.data;
    },

    // Get basic user info
    getUser: async (userId: number): Promise<User> => {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    },

    // Activate user
    activateUser: async (userId: number): Promise<User> => {
        const response = await api.post(`/users/${userId}/activate`);
        return response.data;
    },

    // Deactivate user (soft delete)
    deactivateUser: async (userId: number): Promise<void> => {
        await api.delete(`/users/${userId}`);
    },

    // Make user admin
    makeAdmin: async (userId: number): Promise<User> => {
        const response = await api.post(`/users/${userId}/make-admin`);
        return response.data;
    },

    // ============== Token Usage API ==============

    // Get overall usage statistics
    getUsageStats: async (): Promise<TokenUsageStats> => {
        const response = await api.get('/usage/stats');
        return response.data;
    },

    // Get paginated list of users with usage
    getUsersUsage: async (params: GetUsersUsageParams = {}): Promise<UserUsageListResponse> => {
        const response = await api.get('/usage/users', { params });
        return response.data;
    },

    // Get detailed usage for a specific user
    getUserUsageDetails: async (userId: number): Promise<UserUsageDetail> => {
        const response = await api.get(`/usage/users/${userId}`);
        return response.data;
    },

    // Get usage breakdown by operation type
    getUsageBreakdown: async (): Promise<UsageBreakdownResponse> => {
        const response = await api.get('/usage/breakdown');
        return response.data;
    },
};

// ============== Token Usage Types ==============

export interface TokenUsageStats {
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    unique_users: number;
    total_requests: number;
}

export interface UserUsageSummary {
    user_id: number;
    username: string;
    email: string;
    full_name: string | null;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    operation_count: number;
    last_used: string | null;
}

export interface UserUsageListResponse {
    users: UserUsageSummary[];
    total: number;
    page: number;
    page_size: number;
}

export interface TokenUsageRecord {
    id: number;
    operation_type: string | null;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    model: string | null;
    created_at: string | null;
}

export interface OperationBreakdown {
    operation_type: string;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    request_count: number;
}

export interface UserUsageDetail {
    user_id: number;
    username: string;
    email: string;
    full_name: string | null;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    operation_count: number;
    usage_by_operation: OperationBreakdown[];
    recent_usage: TokenUsageRecord[];
}

export interface UsageBreakdownResponse {
    breakdown: OperationBreakdown[];
    total_tokens: number;
    total_cost_usd: number;
}

export interface GetUsersUsageParams {
    page?: number;
    page_size?: number;
    search?: string;
}
