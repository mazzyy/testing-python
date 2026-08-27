import client from './client';
import { Post, Comment, CreatePostData, CreateCommentData, Vote } from '../types/community';

export const communityApi = {
    getPosts: async (page = 1, limit = 20, category?: string, sortBy: 'newest' | 'popular' = 'newest', search?: string, tag?: string) => {
        const skip = (page - 1) * limit;
        const response = await client.get<Post[]>('/community/posts', {
            params: { skip, limit, category, sort_by: sortBy, search, tag }
        });
        return response.data;
    },

    createPost: async (data: CreatePostData) => {
        const response = await client.post<Post>('/community/posts', data);
        return response.data;
    },

    getPost: async (id: number) => {
        const response = await client.get<Post & { comments: Comment[] }>(`/community/posts/${id}`);
        return response.data;
    },

    createComment: async (postId: number, data: CreateCommentData) => {
        const response = await client.post<Comment>(`/community/posts/${postId}/comments`, data);
        return response.data;
    },

    vote: async (data: Vote) => {
        const response = await client.post<{ status: string }>('/community/vote', data);
        return response.data;
    },

    savePost: async (postId: number) => {
        const response = await client.post<{ status: string }>(`/community/posts/${postId}/save`);
        return response.data;
    },

    unsavePost: async (postId: number) => {
        const response = await client.delete<{ status: string }>(`/community/posts/${postId}/save`);
        return response.data;
    },

    updatePost: async (postId: number, data: Partial<CreatePostData>) => {
        const response = await client.put<Post>(`/community/posts/${postId}`, data);
        return response.data;
    },

    deletePost: async (postId: number) => {
        const response = await client.delete<{ status: string }>(`/community/posts/${postId}`);
        return response.data;
    },

    getSavedPosts: async (page = 1, limit = 20) => {
        const skip = (page - 1) * limit;
        const response = await client.get<Post[]>('/community/saved-posts', {
            params: { skip, limit }
        });
        return response.data;
    }
};
