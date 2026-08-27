import React, { useState } from 'react';
import { Comment } from '../../types/community';
import { MessageCircle, Reply, ArrowBigUp, ArrowBigDown, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextEditor from './RichTextEditor';
import MarkdownRenderer from './MarkdownRenderer';

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (content: string, parentId?: number) => Promise<void>;
    onVote: (commentId: number, value: number) => void;
}

// Helper to generate initials
const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

const CommentForm: React.FC<{
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
    autoFocus?: boolean;
    onCancel?: () => void;
    submitLabel?: string;
}> = ({ onSubmit, placeholder, autoFocus, onCancel, submitLabel = "Post" }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
            if (onCancel) onCancel();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-slate-400 dark:text-surface-400" />
                </div>
                <div className="flex-1">
                    <div className="relative group">
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder={placeholder}
                            minHeight="100px"
                            autoFocus={autoFocus}
                        />
                        <div className="flex justify-end items-center gap-2 mt-2">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                    className="px-3 py-1.5 text-slate-500 dark:text-surface-400 hover:text-slate-700 dark:hover:text-surface-200 hover:bg-slate-100 dark:hover:bg-surface-700 rounded-lg text-xs font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => handleSubmit()}
                                disabled={isSubmitting || !content.trim()}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100 dark:shadow-none"
                            >
                                {isSubmitting ? 'Posting...' : submitLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommentItem: React.FC<{
    comment: Comment;
    onAddComment: (content: string, parentId?: number) => Promise<void>;
    onVote: (id: number, val: number) => void;
    depth?: number;
}> = ({ comment, onAddComment, onVote, depth = 0 }) => {
    const [isReplying, setIsReplying] = useState(false);

    if (depth > 5) return null;

    return (
        <div className={`group ${depth > 0 ? 'ml-0' : ''}`}>
            <div className="flex gap-4">
                {/* Thread Line */}
                {depth > 0 && (
                    <div className="flex flex-col items-center">
                        <div className="w-px h-full bg-slate-100 dark:bg-surface-700 mx-5" />
                    </div>
                )}

                <div className="flex-1 pl-0">
                    <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-surface-800 border border-slate-100 dark:border-surface-700 flex items-center justify-center shrink-0 shadow-sm text-slate-600 dark:text-surface-300 text-xs font-bold ring-2 ring-transparent group-hover:ring-indigo-50 dark:group-hover:ring-surface-700 transition-all">
                            {comment.author?.username ? getInitials(comment.author.username) : <UserIcon className="w-4 h-4 dark:text-surface-400" />}
                        </div>

                        <div className="flex-1">
                            <div className="bg-slate-50/50 dark:bg-surface-800/50 rounded-2xl p-4 hover:bg-slate-50 dark:hover:bg-surface-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-surface-700 mb-2">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-sm text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                        {comment.author?.username || 'Unknown'}
                                    </span>
                                    <span className="text-slate-300 dark:text-surface-600 text-xs">•</span>
                                    <span className="text-xs text-slate-500 dark:text-surface-400 font-medium">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="text-slate-700 dark:text-surface-300 text-sm leading-relaxed prose dark:prose-invert max-w-none">
                                    <MarkdownRenderer>
                                        {comment.content}
                                    </MarkdownRenderer>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 px-2">
                                {/* Vote Controls */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onVote(comment.id, 1)}
                                        className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors ${comment.user_vote === 1 ? 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' : 'text-slate-400 hover:text-slate-600 dark:text-surface-400 dark:hover:text-surface-200'}`}
                                    >
                                        <ArrowBigUp className="w-4 h-4" />
                                    </button>
                                    <span className={`text-xs font-bold min-w-[1rem] text-center ${comment.user_vote !== 0 ? (comment.user_vote === 1 ? 'text-orange-600' : 'text-indigo-600') : 'text-slate-500 dark:text-surface-400'}`}>
                                        {comment.vote_count}
                                    </span>
                                    <button
                                        onClick={() => onVote(comment.id, -1)}
                                        className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors ${comment.user_vote === -1 ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:text-surface-400 dark:hover:text-surface-200'}`}
                                    >
                                        <ArrowBigDown className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsReplying(!isReplying)}
                                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all ${isReplying ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 dark:text-surface-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-700/50'}`}
                                >
                                    <Reply className="w-3.5 h-3.5" />
                                    Reply
                                </button>

                            </div>

                            {/* Inline Reply Form */}
                            {isReplying && (
                                <div className="mt-4 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/30">
                                    <CommentForm
                                        placeholder={`Replying to ${comment.author?.username || 'user'}...`}
                                        autoFocus
                                        submitLabel="Reply"
                                        onCancel={() => setIsReplying(false)}
                                        onSubmit={async (content) => {
                                            await onAddComment(content, comment.id);
                                            setIsReplying(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-5 pl-4 border-l-2 border-slate-100 dark:border-surface-700 mt-3 space-y-4">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onAddComment={onAddComment}
                            onVote={onVote}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment, onVote }) => {
    return (
        <div className="mt-8 bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-surface-700">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Discussion
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-surface-400 font-medium">
                        {comments.length} comments
                    </p>
                </div>
            </div>

            {/* Main Comment Input */}
            <div className="mb-10">
                <CommentForm
                    onSubmit={(content) => onAddComment(content)}
                    placeholder="What are your thoughts? Join the conversation..."
                    submitLabel="Post Comment"
                />
            </div>

            {/* Comments List */}
            <div className="space-y-8">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onAddComment={onAddComment}
                        onVote={onVote}
                    />
                ))}
                {comments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-surface-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-surface-700">
                            <MessageCircle className="w-8 h-8 text-slate-300 dark:text-surface-500" />
                        </div>
                        <p className="text-slate-900 dark:text-white font-medium">No comments yet</p>
                        <p className="text-slate-500 dark:text-surface-400 text-sm mt-1">Be the first to share your thoughts!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
