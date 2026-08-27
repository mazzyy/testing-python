import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityApi } from '../../api/community';
import { Post, Comment } from '../../types/community';
import PostCard from '../../components/community/PostCard';
import CommentSection from '../../components/community/CommentSection';
import CreatePostModal from '../../components/community/CreatePostModal';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import SEO from '../../components/common/SEO';

const PostDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [post, setPost] = useState<(Post & { comments: Comment[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchPost = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await communityApi.getPost(parseInt(id));
            setPost(data);
        } catch (error) {
            console.error('Failed to fetch post:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    const handleVote = async (postId: number, value: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await communityApi.vote({ value, post_id: postId });
            fetchPost();
        } catch (error) {
            console.error('Failed to vote post:', error);
        }
    };

    const handleToggleSave = async (postId: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!post) return;

        try {
            // Optimistic update
            setPost(prev => prev ? { ...prev, is_saved: !prev.is_saved } : null);

            if (post.is_saved) {
                await communityApi.unsavePost(postId);
            } else {
                await communityApi.savePost(postId);
            }
            // Fetch to confirm state if needed, but optimistic is usually fine
            // fetchPost(); 
        } catch (error) {
            console.error('Failed to toggle save:', error);
            fetchPost(); // Revert
        }
    };

    const handleCommentVote = async (commentId: number, value: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await communityApi.vote({ value, comment_id: commentId });
            fetchPost();
        } catch (error) {
            console.error('Failed to vote comment:', error);
        }
    };

    const handleAddComment = async (content: string, parentId?: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!post) return;
        try {
            await communityApi.createComment(post.id, { content, parent_id: parentId });
            fetchPost();
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleEdit = (_postToEdit: Post) => {
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (data: { title: string; content: string; category: string; tags: string[] }) => {
        if (!post) return;
        try {
            await communityApi.updatePost(post.id, data);
            setIsEditModalOpen(false);
            fetchPost();
        } catch (error) {
            console.error('Failed to update post:', error);
        }
    };

    const handleDelete = async (postId: number) => {
        try {
            await communityApi.deletePost(postId);
            navigate('/community');
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    if (isLoading) return <div className="text-center py-12">Loading...</div>;
    if (!post) return <div className="text-center py-12">Post not found</div>;

    // SEO Schema for Q&A
    const qaSchema = {
        "@context": "https://schema.org",
        "@type": "QAPage",
        "mainEntity": {
            "@type": "Question",
            "name": post.title,
            "text": post.content,
            "answerCount": post.comments.length,
            "upvoteCount": post.vote_count,
            "dateCreated": post.created_at,
            "author": {
                "@type": "Person",
                "name": post?.author?.full_name || "Anonymous"
            },
            "suggestedAnswer": post.comments.map(comment => ({
                "@type": "Answer",
                "text": comment.content,
                "dateCreated": comment.created_at,
                "upvoteCount": comment.vote_count,
                "author": {
                    "@type": "Person",
                    "name": comment?.author?.full_name || "Anonymous"
                }
            }))
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <SEO
                title={`${post.title} | UniAdvisorAI Community`}
                description={post.content.substring(0, 160)}
                keywords={['student community', 'question', 'discussion', post.category || 'general']}
                schema={qaSchema}
            />
            <button
                onClick={() => navigate('/community')}
                className="flex items-center gap-2 text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Community
            </button>

            <PostCard post={post} onVote={handleVote} onToggleSave={handleToggleSave} onEdit={handleEdit} onDelete={handleDelete} />

            <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm dark:shadow-surface-900/50 border border-gray-100 dark:border-surface-700 p-6">
                <CommentSection
                    comments={post.comments}
                    onAddComment={handleAddComment}
                    onVote={handleCommentVote}
                />
            </div>

            <CreatePostModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdate}
                initialData={post}
            />
        </div>
    );
};

export default PostDetailPage;
