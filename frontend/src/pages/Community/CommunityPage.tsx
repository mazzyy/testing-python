import React, { useEffect, useState } from 'react';
import { communityApi } from '../../api/community';
import { Post } from '../../types/community';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import { Plus, Search, Bookmark, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../../components/common/SEO';

const CommunityPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTabParam = searchParams.get('tab') as 'all' | 'saved' || 'all';
    const tagParam = searchParams.get('tag') || undefined;
    const categoryParam = searchParams.get('category') || undefined;

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const activeTab = activeTabParam;
    const selectedTag = tagParam;
    const category = categoryParam;

    const availableTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 10);

    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            let data;
            if (activeTab === 'saved' && isAuthenticated) {
                data = await communityApi.getSavedPosts(1, 20);
            } else {
                data = await communityApi.getPosts(1, 20, category, sortBy, debouncedSearch, selectedTag);
            }
            setPosts(data);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [category, sortBy, debouncedSearch, activeTab, selectedTag, isAuthenticated]);

    const handleCreatePost = async (data: { title: string; content: string; category: string; tags: string[] }) => {
        try {
            await communityApi.createPost(data);
            fetchPosts();
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    };

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleUpdatePost = async (data: { title: string; content: string; category: string; tags: string[] }) => {
        if (!editingPost) return;
        try {
            await communityApi.updatePost(editingPost.id, data);
            setEditingPost(null);
            fetchPosts();
        } catch (error) {
            console.error('Failed to update post:', error);
        }
    };

    const handleDeletePost = async (postId: number) => {
        try {
            await communityApi.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    const handleCreateClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setIsModalOpen(true);
    };

    const handleVote = async (postId: number, value: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, user_vote: value === p.user_vote ? 0 : value, vote_count: p.vote_count + (value === p.user_vote ? -value : (value - p.user_vote)) };
                }
                return p;
            }));

            await communityApi.vote({ value, post_id: postId });
            fetchPosts();
        } catch (error) {
            console.error('Failed to vote:', error);
            fetchPosts();
        }
    };

    const handleToggleSave = async (postId: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, is_saved: !p.is_saved };
                }
                return p;
            }));

            const post = posts.find(p => p.id === postId);
            if (post?.is_saved) {
                await communityApi.unsavePost(postId);
            } else {
                await communityApi.savePost(postId);
            }
        } catch (error) {
            console.error('Failed to toggle save:', error);
            fetchPosts();
        }
    };

    return (
        <div className="min-h-screen relative z-[1] bg-gray-50 dark:bg-surface-900 overflow-x-hidden">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <SEO
                    title="Student Community — Ask Questions & Share Experiences | UniAdvisorAI"
                    description="Join 1,000+ international students discussing life in Germany. Get answers on visas, housing, admissions, student jobs & daily life — from students who've been there."
                    keywords={['student community germany', 'study in germany forum', 'german student visa questions', 'student housing germany discussions', 'international students germany forum']}
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Community</h1>
                                <p className="text-gray-500 dark:text-surface-400">Connect with other students, ask questions, and share experiences.</p>
                            </div>
                            <button
                                onClick={handleCreateClick}
                                className="hidden sm:flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium transition-all bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/35"
                            >
                                <Plus className="w-5 h-5" />
                                Create Post
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-surface-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search discussions..."
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500"
                            />
                        </div>

                        {/* Tabs & Filters */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-1.5 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto bg-gray-100 dark:bg-surface-800 border border-gray-200 dark:border-surface-700">
                                <button
                                    onClick={() => setSearchParams(prev => {
                                        prev.set('tab', 'all');
                                        return prev;
                                    })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'all'
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-200'
                                        }`}
                                >
                                    All Posts
                                </button>
                                <button
                                    onClick={() => {
                                        if (isAuthenticated) {
                                            setSearchParams(prev => {
                                                prev.set('tab', 'saved');
                                                return prev;
                                            });
                                        } else {
                                            navigate('/login');
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'saved'
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-200'
                                        }`}
                                >
                                    <Bookmark className="w-4 h-4" />
                                    Saved
                                </button>
                            </div>

                            <div className="relative min-w-[140px] hidden sm:block">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full appearance-none px-4 py-2.5 rounded-xl text-sm font-medium outline-none cursor-pointer bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 text-gray-700 dark:text-white"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                            </div>
                        </div>

                        {/* Mobile Create Button */}
                        <button
                            onClick={handleCreateClick}
                            className="sm:hidden w-full mb-6 flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl font-medium transition-all bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Post
                        </button>

                        {/* Post List */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                </div>
                            ) : posts.length > 0 ? (
                                posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onVote={handleVote}
                                        onToggleSave={handleToggleSave}
                                        onEdit={handleEditPost}
                                        onDelete={handleDeletePost}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 rounded-2xl bg-gray-100 dark:bg-surface-800/50 border-2 border-dashed border-gray-200 dark:border-surface-700">
                                    <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-200 dark:bg-surface-800">
                                        <TrendingUp className="w-8 h-8 text-gray-400 dark:text-surface-400" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">No posts found</h3>
                                    <p className="text-gray-500 dark:text-surface-400 max-w-xs mx-auto">
                                        {searchQuery ? `No results for "${searchQuery}"` : "Be the first to start a conversation!"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        <div className="rounded-2xl p-5 sticky top-24 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                Topics
                            </h3>
                            <div className="space-y-1.5">
                                <button
                                    onClick={() => setSearchParams(prev => {
                                        prev.delete('category');
                                        return prev;
                                    }, { replace: true })}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${!category
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50'
                                        : 'text-gray-500 dark:text-surface-400 hover:bg-gray-50 dark:hover:bg-surface-700/50 border border-transparent'
                                        }`}
                                >
                                    All Topics
                                </button>
                                {["General", "Visa", "Housing", "Admissions", "Student Life", "Jobs"].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSearchParams(prev => {
                                            prev.set('category', c);
                                            return prev;
                                        }, { replace: true })}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${category === c
                                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50'
                                            : 'text-gray-500 dark:text-surface-400 hover:bg-gray-50 dark:hover:bg-surface-700/50 border border-transparent'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            {/* Tags */}
                            {availableTags.length > 0 && (
                                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-surface-700">
                                    <h3 className="font-bold mb-3 text-sm text-gray-900 dark:text-white">Popular Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setSearchParams(prev => {
                                                    if (selectedTag === tag) {
                                                        prev.delete('tag');
                                                    } else {
                                                        prev.set('tag', tag);
                                                    }
                                                    return prev;
                                                })}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${selectedTag === tag
                                                    ? 'bg-indigo-500 text-white border border-indigo-500'
                                                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-500 dark:text-surface-400 border border-gray-200 dark:border-surface-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                                                    }`}
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <CreatePostModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingPost(null); }}
                    onSubmit={editingPost ? handleUpdatePost : handleCreatePost}
                    initialData={editingPost}
                />
            </div>
        </div>
    );
};

export default CommunityPage;