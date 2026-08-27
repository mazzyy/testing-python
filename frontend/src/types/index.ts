// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Profile Types
export interface LanguageInfo {
  language: string;
  level: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  full_name?: string;
  nationality?: string;
  date_of_birth?: string;
  phone?: string;
  current_degree?: string;
  field_of_study?: string;
  university?: string;
  graduation_date?: string;
  cgpa?: number;
  gpa_scale?: number;
  relevant_courses?: string[];
  skills?: string[];
  honors_awards?: string;
  work_experience?: string;
  research_experience?: string;
  english_level?: string;
  english_certificate?: string;
  english_score?: string;
  german_level?: string;
  german_certificate?: string;
  german_score?: string;
  other_languages?: LanguageInfo[];
  desired_degree?: string;
  desired_fields?: string[];
  preferred_cities?: string[];
  preferred_universities?: string[];
  preferred_language?: string;
  university_type?: string;
  intake_semester?: string;
  program_format?: string;
  accommodation_preference?: string;
  career_goals?: string;
  special_requirements?: string[];
  interests_hobbies?: string[];
  budget_range?: string;
  needs_funding?: string;
  transcript_path?: string;
  cv_path?: string;
  parsed_transcript?: Record<string, unknown>;
  parsed_cv?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export type ProfileFormData = Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'transcript_path' | 'cv_path' | 'parsed_transcript' | 'parsed_cv'>;

// Program Types
export interface Program {
  id: number;
  program_id: string;
  slug?: string;
  url?: string;
  program_name: string;
  university_name: string;
  city?: string;
  degree?: string;
  degree_type?: string;
  course_location?: string;
  teaching_language?: string[];
  languages?: string;
  full_time_part_time?: string[];
  mode_of_study?: string;
  programme_duration?: string;
  beginning?: string;
  application_deadline?: string;
  tuition_fees_per_semester_eur?: string;
  additional_info_tuition_fees?: string;
  semester_contribution?: string;
  description_content?: string;
  international_elements?: string[];
  integrated_internships?: string;
  academic_admission_requirements?: string;
  language_requirements?: string;
  funding_opportunities?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  submit_application_to?: string;
  costs_of_living?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ProgramFilters {
  page?: number;
  page_size?: number;
  degree_type?: string;
  city?: string;
  university?: string;
  search?: string;
  teaching_language?: string;
}

export interface ProgramListResponse {
  programs: Program[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProgramStats {
  total_programs: number;
  active_programs: number;
  inactive_programs: number;
  by_degree_type: {
    Bachelor: number;
    Masters: number;
    PhD: number;
  };
  unique_cities: number;
  unique_universities: number;
}

// University Types
export interface University {
  name: string;
  cities: string[];
  program_count: number;
  degree_types: string[];
}

export interface UniversityListResponse {
  universities: University[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface UniversityFilters {
  page?: number;
  page_size?: number;
  search?: string;
  city?: string;
  degree_type?: string;
}

// Recommendation Types
export interface ProgramRecommendation {
  program: Program;
  match_score: number;
  match_reasons: string[];
  gaps?: string[];  // Potential concerns or missing requirements
  highlights?: string;
}

export interface RecommendationRequest {
  query?: string;
  use_profile?: boolean;
  n_results?: number;
  degree_type?: string;
  city?: string;
  teaching_language?: string;
  force_refresh?: boolean;
}

export interface RecommendationResponse {
  recommendations: ProgramRecommendation[];
  total_found: number;
  query_used?: string;
  filters_applied: Record<string, string>;
}

export interface ChatRequest {
  message: string;
  include_recommendations?: boolean;
  n_results?: number;
}

import { Document as VaultDocument } from './vault';

export interface ChatResponse {
  response: string;
  recommendations?: ProgramRecommendation[];
  scholarships?: Scholarship[];
  universities?: University[];
  vault_documents?: VaultDocument[];
  sources?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ProgramRecommendation[];
  scholarships?: Scholarship[];
  universities?: University[];
  vault_documents?: VaultDocument[];
  timestamp: Date;
}

// Application Types
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: number;
  user_id: number;
  program_id: number;
  status: ApplicationStatus;
  match_score?: number;
  user_notes?: string;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  program?: Program;
  checklist_progress?: number;
  current_phase?: string;
}

export interface CreateApplicationData {
  program_id: number;
  user_notes?: string;
}

export interface UpdateApplicationData {
  status?: ApplicationStatus;
  user_notes?: string;
  admin_notes?: string;
}

// Document Upload Types
export interface DocumentUploadResponse {
  success: boolean;
  document_type: string;
  file_saved: string;
  extracted_data?: Record<string, unknown>;
  raw_text_preview?: string;
  error?: string;
}

// Application Tracker Types

export interface ApplicationChecklistItem {
  id: number;
  application_id: number;
  category: 'profile_setup' | 'eligibility' | 'language' | 'documents' | 'hec_verification' | 'university_application' | 'admission_confirmation' | 'financial_documents' | 'visa_process';
  item_name: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable';
  notes?: string;
  due_date?: string;
  completed_at?: string;
  display_order: number;
}

export interface DocumentRequirement {
  id: number;
  application_id: number;
  document_type: string;
  document_name?: string;
  is_required: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable';
  file_path?: string;
  file_name?: string;
  is_verified: boolean;
  verified_at?: string;
  notes?: string;
}

export interface EligibilityRequirement {
  id: number;
  application_id: number;
  requirement_type: string;
  requirement_name: string;
  requirement_value?: string;
  user_value?: string;
  is_met?: boolean;
  is_mandatory: boolean;
}

export interface HECVerification {
  id: number;
  user_id: number;
  degree_type: string;
  degree_name?: string;
  verification_status: string;
  tracking_number?: string;
  submitted_at?: string;
}

// API Response Types
export interface ApiError {
  detail: string;
  status?: number;
}

// Scholarship Types
export interface Scholarship {
  id: number;
  scholarship_id: number;
  title: string;
  link?: string;
  objective?: string;
  eligibility?: string;
  value_benefits?: string;
  duration?: string;
  deadline?: string;
  selection_criteria?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ScholarshipFilters {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface ScholarshipListResponse {
  scholarships: Scholarship[];
  total: number;
  page: number;
  page_size: number;
}

export interface ScholarshipEligibility {
  scholarship: Scholarship;
  eligibility_score: number;
  reasons: string[];
  concerns: string[];
  recommendation?: string;
}

export interface ScholarshipEligibilityResponse {
  scholarships: ScholarshipEligibility[];
  total: number;
  missing_fields: string[];
  profile_complete: boolean;
}
