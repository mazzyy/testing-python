import api from './client';
import type { 
  RecommendationRequest, 
  RecommendationResponse, 
  ChatRequest, 
  ChatResponse 
} from '../types';

export const recommendationsApi = {
  getRecommendations: async (request: RecommendationRequest): Promise<RecommendationResponse> => {
    const response = await api.post<RecommendationResponse>('/recommendations', request);
    return response.data;
  },

  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/recommendations/chat', request);
    return response.data;
  },

  getQuickRecommendations: async (
    query: string, 
    nResults: number = 5, 
    degreeType?: string
  ): Promise<RecommendationResponse> => {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('n_results', nResults.toString());
    if (degreeType) params.append('degree_type', degreeType);

    const response = await api.get<RecommendationResponse>(`/recommendations/quick?${params.toString()}`);
    return response.data;
  },

  getProfileRecommendations: async (nResults: number = 10): Promise<RecommendationResponse> => {
    const response = await api.get<RecommendationResponse>(
      `/recommendations/for-profile?n_results=${nResults}`
    );
    return response.data;
  },
};
