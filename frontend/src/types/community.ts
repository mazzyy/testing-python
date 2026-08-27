export interface Vote {
    value: number; // 1 or -1
    post_id?: number;
    comment_id?: number;
}

export interface Comment {
    id: number;
    content: string;
    post_id: number;
    author_id: number;
    parent_id?: number;
    created_at: string;
    updated_at?: string;
    author?: {
        full_name: string;
        username: string;
        [key: string]: any;
    };
    vote_count: number;
    user_vote: number;
    replies: Comment[];
}

export interface Post {
    id: number;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    author_id: number;
    created_at: string;
    updated_at?: string;
    author?: {
        full_name: string;
        username: string;
        [key: string]: any;
    };
    comment_count: number;
    vote_count: number;
    user_vote: number;
    is_saved: boolean;
}

export interface CreatePostData {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
}

export interface CreateCommentData {
    content: string;
    parent_id?: number;
}
