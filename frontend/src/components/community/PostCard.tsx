import React, { useState } from 'react';
import { Post } from '../../types/community';
import { MessageCircle, ArrowBigUp, ArrowBigDown, User, Share2, Bookmark, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuthStore } from '../../store/authStore';

interface PostCardProps {
    post: Post;
    onVote: (postId: number, value: number) => void;
    onToggleSave?: (postId: number) => void;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onVote, onToggleSave, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isAuthor = user && post.author_id === user.id;
    const isAdmin = user && (user as any).role === 'admin';
    const canModify = isAuthor || isAdmin;

    const handleVote = (e: React.MouseEvent, value: number) => {
        e.stopPropagation();
        onVote(post.id, value);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/community/posts/${post.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSave) {
            onToggleSave(post.id);
        }
    };

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onEdit) onEdit(post);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
        if (onDelete) onDelete(post.id);
    };

    const handleDeleteCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    return (
        <div
            onClick={() => navigate(`/community/posts/${post.id}`)}
            className="group bg-white dark:bg-surface-800 rounded-2xl p-4 sm:p-5 mb-4 border border-gray-100 dark:border-surface-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-indigo-100 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            <div className="flex gap-3 sm:gap-5">
                {/* Vote Sidebar - hidden on mobile, shown on sm+ */}
                <div className="hidden sm:flex flex-col items-center gap-1 bg-slate-50 dark:bg-surface-900/50 p-1.5 rounded-xl h-fit border border-slate-100 dark:border-surface-800 shrink-0">
                    <button
                        onClick={(e) => handleVote(e, 1)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${post.user_vote === 1
                            ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 shadow-sm'
                            : 'text-slate-400 hover:bg-white dark:bg-transparent hover:text-orange-500 hover:shadow-sm dark:hover:bg-surface-800'
                            }`}
                    >
                        <ArrowBigUp className="w-5 h-5" />
                    </button>

                    <span className={`font-bold text-sm py-0.5 ${post.user_vote !== 0
                        ? (post.user_vote === 1 ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400')
                        : 'text-slate-600 dark:text-surface-400'
                        }`}>
                        {post.vote_count}
                    </span>

                    <button
                        onClick={(e) => handleVote(e, -1)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${post.user_vote === -1
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-400 hover:bg-white dark:bg-transparent hover:text-indigo-500 hover:shadow-sm dark:hover:bg-surface-800'
                            }`}
                    >
                        <ArrowBigDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 text-xs">
                        {post.category && (
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase text-[10px]">
                                {post.category}
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-surface-400 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                                    <User className="w-3 h-3 text-slate-400 dark:text-surface-400" />
                                </span>
                                <span className="font-medium hover:text-indigo-600 transition-colors truncate">
                                    {post.author?.username || 'Unknown'}
                                </span>
                            </div>
                            <span className="text-slate-300 dark:text-surface-600 shrink-0">•</span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-surface-400 shrink-0 whitespace-nowrap">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                            {post.updated_at && post.updated_at !== post.created_at && (
                                <>
                                    <span className="text-slate-300 dark:text-surface-600 hidden sm:inline">•</span>
                                    <span className="italic text-slate-400 dark:text-surface-500 hidden sm:inline">edited</span>
                                </>
                            )}
                        </div>

                        {/* Actions Dropdown (author/admin only) */}
                        {canModify && (
                            <div className="relative ml-auto">
                                <button
                                    onClick={handleMenuToggle}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={handleMenuToggle} />
                                        <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-gray-100 dark:border-surface-700 py-1 overflow-hidden">
                                            <button
                                                onClick={handleEdit}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-surface-200 hover:bg-slate-50 dark:hover:bg-surface-700/50 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit Post
                                            </button>
                                            <button
                                                onClick={handleDeleteClick}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete Post
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {post.title}
                    </h3>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                            {post.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-800/50 text-surface-600 dark:text-surface-300 rounded text-xs">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="text-slate-600 dark:text-surface-300 text-sm leading-relaxed line-clamp-3 mb-4">
                        <MarkdownRenderer>
                            {post.content}
                        </MarkdownRenderer>
                    </div>

                    {/* Action Bar - responsive layout */}
                    <div className="flex items-center flex-wrap gap-1 sm:gap-2 border-t border-slate-50 dark:border-surface-700/50 pt-3 mt-2">
                        {/* Mobile vote buttons - inline with other actions */}
                        <div className="flex sm:hidden items-center gap-0.5 mr-1">
                            <button
                                onClick={(e) => handleVote(e, 1)}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${post.user_vote === 1
                                    ? 'text-orange-500 dark:text-orange-400'
                                    : 'text-slate-400'
                                    }`}
                            >
                                <ArrowBigUp className="w-4 h-4" />
                            </button>
                            <span className={`font-bold text-xs ${post.user_vote !== 0
                                ? (post.user_vote === 1 ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400')
                                : 'text-slate-600 dark:text-surface-400'
                                }`}>
                                {post.vote_count}
                            </span>
                            <button
                                onClick={(e) => handleVote(e, -1)}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${post.user_vote === -1
                                    ? 'text-indigo-500 dark:text-indigo-400'
                                    : 'text-slate-400'
                                    }`}
                            >
                                <ArrowBigDown className="w-4 h-4" />
                            </button>
                        </div>

                        <button className="flex items-center gap-1.5 group/btn px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700/50 transition-colors">
                            <MessageCircle className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-500 transition-colors shrink-0" />
                            <span className="text-xs font-medium text-slate-500 dark:text-surface-400 group-hover/btn:text-indigo-600 whitespace-nowrap">
                                {post.comment_count} <span className="hidden xs:inline">Comments</span>
                            </span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 group/btn px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700/50 transition-colors"
                        >
                            {copied ? (
                                <span className="text-green-500 font-medium text-xs">Copied!</span>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-500 transition-colors shrink-0" />
                                    <span className="text-xs font-medium text-slate-500 dark:text-surface-400 group-hover/btn:text-indigo-600">
                                        Share
                                    </span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-1.5 group/btn px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-700/50 transition-colors ${post.is_saved ? 'text-blue-600 dark:text-blue-400' : ''}`}
                        >
                            <Bookmark className={`w-4 h-4 shrink-0 ${post.is_saved ? 'fill-current text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover/btn:text-blue-500 transition-colors'}`} />
                            <span className={`text-xs font-medium ${post.is_saved ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-surface-400 group-hover/btn:text-blue-500'}`}>
                                {post.is_saved ? 'Saved' : 'Save'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={handleDeleteCancel}
                >
                    <div
                        className="bg-white dark:bg-surface-800 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 dark:border-surface-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Post?</h3>
                        <p className="text-sm text-slate-500 dark:text-surface-400 mb-5">
                            This will permanently delete the post and all its comments. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-surface-300 bg-slate-100 dark:bg-surface-800 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;