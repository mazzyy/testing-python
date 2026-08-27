import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Key, Eye, EyeOff, Copy, Trash2, ExternalLink, Plus, Search,
    X, Check, RefreshCw, Globe, Lock, ChevronDown
} from 'lucide-react';
import { Credential, CredentialCategory, CredentialCreate } from '../../types/vault';
import { vaultApi } from '../../api/vault';
import { toast } from 'react-hot-toast';

interface CredentialManagerProps {
    credentials: Credential[];
    onUpdate: () => void;
    isLoading: boolean;
}

// ── Category styling ─────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    [CredentialCategory.UNIVERSITY_PORTAL]: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <Globe className="w-5 h-5" /> },
    [CredentialCategory.VISA_PORTAL]: { color: 'text-purple-600', bg: 'bg-purple-50', icon: <Globe className="w-5 h-5" /> },
    [CredentialCategory.SCHOLARSHIP_PORTAL]: { color: 'text-green-600', bg: 'bg-green-50', icon: <Globe className="w-5 h-5" /> },
    [CredentialCategory.TEST_PORTAL]: { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100', icon: <Key className="w-5 h-5" /> },
    [CredentialCategory.OTHER]: { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100', icon: <Key className="w-5 h-5" /> },
};

const getCategoryStyle = (category: string) =>
    CATEGORY_STYLES[category] || { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100', icon: <Key className="w-5 h-5" /> };

// ── Password generator ───────────────────────────────────────────────────────

const generatePassword = (length = 20): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (n) => chars[n % chars.length]).join('');
};

// ── Skeleton Loader ──────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white dark:bg-surface-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-50 dark:bg-surface-900 rounded w-1/3" />
            </div>
        </div>
        <div className="space-y-2.5">
            <div className="h-3 bg-gray-50 dark:bg-surface-900 rounded w-full" />
            <div className="h-3 bg-gray-50 dark:bg-surface-900 rounded w-3/4" />
        </div>
    </div>
);

// ── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteModal: React.FC<{
    cred: Credential | null;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ cred, isDeleting, onConfirm, onCancel }) => {
    if (!cred) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', duration: 0.35 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-sm w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-red-50 rounded-xl">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Credential</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        This will permanently remove the saved credential for:
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-surface-900 px-3 py-2 rounded-lg mb-5 truncate">
                        {cred.title}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors
                                       disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                            ) : (
                                'Delete'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Copyable Field ───────────────────────────────────────────────────────────

const CopyableField: React.FC<{
    label: string;
    value: string;
    isMasked?: boolean;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
}> = ({ label, value, isMasked, isVisible, onToggleVisibility }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(`${label} copied`, { duration: 1500, style: { fontSize: '13px' } });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group/field flex items-center gap-2 py-1.5">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide w-[4.5rem] shrink-0">{label}</span>
            <div className="flex-1 min-w-0 relative">
                <code className="block bg-gray-50 dark:bg-surface-900 px-2.5 py-1 rounded-md text-sm text-gray-700 dark:text-gray-300 truncate">
                    {isMasked && !isVisible ? '•'.repeat(Math.min(value.length, 16)) : value}
                </code>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/field:opacity-100 transition-opacity">
                {isMasked && onToggleVisibility && (
                    <button
                        onClick={onToggleVisibility}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 rounded transition-colors"
                        title={isVisible ? 'Hide' : 'Show'}
                    >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                )}
                <button
                    onClick={handleCopy}
                    className={`p-1 rounded transition-colors ${copied
                        ? 'text-green-600'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-400'}`}
                    title="Copy"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────

const CredentialManager: React.FC<CredentialManagerProps> = ({ credentials, onUpdate, isLoading }) => {
    const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [credToDelete, setCredToDelete] = useState<Credential | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<CredentialCategory | 'all'>('all');

    const [newCred, setNewCred] = useState<CredentialCreate>({
        title: '',
        url: '',
        username: '',
        password: '',
        category: CredentialCategory.UNIVERSITY_PORTAL,
        notes: ''
    });

    const resetForm = () => {
        setNewCred({ title: '', url: '', username: '', password: '', category: CredentialCategory.UNIVERSITY_PORTAL, notes: '' });
    };

    const filtered = useMemo(() => {
        let result = [...credentials];
        if (filterCategory !== 'all') {
            result = result.filter(c => c.category === filterCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(q) ||
                c.username?.toLowerCase().includes(q) ||
                c.url?.toLowerCase().includes(q) ||
                c.category.toLowerCase().includes(q)
            );
        }
        return result;
    }, [credentials, filterCategory, searchQuery]);

    const togglePassword = (id: number) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = async () => {
        if (!credToDelete) return;
        setIsDeleting(true);
        try {
            await vaultApi.deleteCredential(credToDelete.id);
            toast.success('Credential deleted');
            onUpdate();
        } catch {
            toast.error('Failed to delete credential');
        } finally {
            setIsDeleting(false);
            setCredToDelete(null);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCred.title.trim()) {
            toast.error('Title is required');
            return;
        }
        setIsSaving(true);
        try {
            await vaultApi.createCredential(newCred);
            toast.success('Credential saved');
            setIsAdding(false);
            resetForm();
            onUpdate();
        } catch {
            toast.error('Failed to save credential');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGeneratePassword = () => {
        const pw = generatePassword();
        setNewCred({ ...newCred, password: pw });
        toast.success('Strong password generated', { duration: 1500 });
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Delete confirmation */}
            <DeleteModal cred={credToDelete} isDeleting={isDeleting} onConfirm={handleDelete} onCancel={() => setCredToDelete(null)} />

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stored Credentials</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{credentials.length} saved {credentials.length === 1 ? 'account' : 'accounts'}</p>
                </div>
                <button
                    onClick={() => { setIsAdding(!isAdding); if (isAdding) resetForm(); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                        ${isAdding
                            ? 'bg-gray-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-600/20'}`}
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? 'Cancel' : 'Add Credential'}
                </button>
            </div>

            {/* ── Add Form ────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleAdd} className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5 mb-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                <Lock className="w-4 h-4 text-primary-600" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Credential</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-900/50
                                                   focus:bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all
                                                   placeholder:text-gray-400"
                                        placeholder="e.g. TUM Application Portal"
                                        value={newCred.title}
                                        onChange={e => setNewCred({ ...newCred, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-900/50 appearance-none
                                                       focus:bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all"
                                            value={newCred.category}
                                            onChange={e => setNewCred({ ...newCred, category: e.target.value as CredentialCategory })}
                                        >
                                            {Object.values(CredentialCategory).map(cat => (
                                                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-900/50
                                                   focus:bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all
                                                   placeholder:text-gray-400"
                                        placeholder="https://..."
                                        value={newCred.url}
                                        onChange={e => setNewCred({ ...newCred, url: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-900/50
                                                   focus:bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all
                                                   placeholder:text-gray-400"
                                        placeholder="user@example.com"
                                        value={newCred.username}
                                        onChange={e => setNewCred({ ...newCred, username: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Password</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-900/50 font-mono
                                                       focus:bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all
                                                       placeholder:font-sans placeholder:text-gray-400"
                                            placeholder="Enter or generate a password"
                                            value={newCred.password}
                                            onChange={e => setNewCred({ ...newCred, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGeneratePassword}
                                            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200
                                                       rounded-xl hover:bg-primary-100 transition-colors shrink-0"
                                            title="Generate strong password"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Generate</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
                                    <textarea
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-900/50 resize-none
                                                   focus:bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all
                                                   placeholder:text-gray-400"
                                        rows={2}
                                        placeholder="Any extra notes…"
                                        value={newCred.notes}
                                        onChange={e => setNewCred({ ...newCred, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); resetForm(); }}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700
                                               shadow-sm shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                                    ) : (
                                        'Save Credential'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Search & Filter ──────────────────────────────────────────────── */}
            {credentials.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search credentials…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-lg
                                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                                ${filterCategory === 'all'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-500 dark:text-gray-400 hover:bg-gray-200'}`}
                        >
                            All
                        </button>
                        {Object.values(CredentialCategory).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap capitalize
                                    ${filterCategory === cat
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-500 dark:text-gray-400 hover:bg-gray-200'}`}
                            >
                                {cat.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────────── */}
            {credentials.length === 0 && !isAdding && (
                <div className="flex flex-col items-center justify-center py-20 px-8 bg-white dark:bg-surface-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary-600/5 rounded-full scale-150 blur-xl" />
                        <div className="relative p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl">
                            <Key className="w-10 h-10 text-purple-500/70" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No saved credentials</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs mb-6">
                        Securely store your logins and access them whenever you need.
                    </p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium
                                   hover:bg-primary-700 shadow-sm shadow-primary-600/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add your first credential
                    </button>
                </div>
            )}

            {/* ── No results ──────────────────────────────────────────────────── */}
            {credentials.length > 0 && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-10 h-10 text-gray-300 mb-3" />
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">No matches found</h4>
                    <p className="text-sm text-gray-400 mb-4">Try a different search term or category.</p>
                    <button
                        onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* ── Credential Cards ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                    {filtered.map((cred) => {
                        const catStyle = getCategoryStyle(cred.category);
                        return (
                            <motion.div
                                key={cred.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="group bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
                                           hover:shadow-md hover:border-gray-200 dark:border-gray-700 transition-all duration-200 relative"
                            >
                                {/* Delete button */}
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setCredToDelete(cred)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2.5 rounded-xl ${catStyle.bg} ${catStyle.color}`}>
                                        {catStyle.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate leading-snug">{cred.title}</h4>
                                        <span className="text-xs text-gray-400 capitalize">{cred.category.replace(/_/g, ' ')}</span>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="space-y-0.5">
                                    {cred.url && (
                                        <div className="flex items-center gap-2 py-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide w-[4.5rem] shrink-0">URL</span>
                                            <a
                                                href={cred.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary-600 hover:text-primary-700 hover:underline truncate flex items-center gap-1 transition-colors"
                                            >
                                                {cred.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                            </a>
                                        </div>
                                    )}

                                    {cred.username && (
                                        <CopyableField label="User" value={cred.username} />
                                    )}

                                    {cred.password && (
                                        <CopyableField
                                            label="Pass"
                                            value={cred.password}
                                            isMasked
                                            isVisible={showPassword[cred.id]}
                                            onToggleVisibility={() => togglePassword(cred.id)}
                                        />
                                    )}
                                </div>

                                {cred.notes && (
                                    <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 line-clamp-2 leading-relaxed">
                                        {cred.notes}
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CredentialManager;