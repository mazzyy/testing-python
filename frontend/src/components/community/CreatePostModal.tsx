import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; content: string; category: string; tags: string[] }) => Promise<void>;
    isLoading?: boolean;
    initialData?: { title: string; content: string; category?: string } | null;
}

const CATEGORIES = ["General", "Visa", "Housing", "Admissions", "Student Life", "Jobs"];

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit, isLoading, initialData }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const isEditing = !!initialData;

    // Populate form when initialData changes (edit mode)
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setCategory(initialData.category || CATEGORIES[0]);
        } else {
            setTitle('');
            setContent('');
            setCategory(CATEGORIES[0]);
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Extract tags from content (optimistic/client-side check if needed, but easier to let backend handle)
        // Pass empty tags array as backend will parse content
        await onSubmit({ title, content, category, tags: [] });

        // Reset form
        setTitle('');
        setContent('');
        setCategory(CATEGORIES[0]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-surface-700 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Post' : 'Create Post'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-surface-400" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-4">
                    <form id="create-post-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tag Input Removed - Use Hashtags in content */}
                            <div className="flex items-end pb-2">
                                <span className="text-sm text-gray-500 dark:text-surface-400 italic">
                                    Tip: Use #hashtags in your content to tag your post!
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What's on your mind?"
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                                Content
                            </label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Share your thoughts... Use #hashtags for topics!"
                                minHeight="250px"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 p-4 border-t border-gray-100 dark:border-surface-700 shrink-0 bg-gray-50 dark:bg-surface-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-surface-300 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-post-form"
                        disabled={isLoading || !title.trim() || !content.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                    >
                        {isLoading ? (isEditing ? 'Saving...' : 'Posting...') : (isEditing ? 'Save Changes' : 'Post')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
