import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, FileSpreadsheet, FileImage, File, FileArchive,
    Download, Trash2, Clock, LayoutGrid, List, Eye, Search,
    ArrowUpDown, ArrowUp, ArrowDown, X, AlertCircle, ChevronDown, Filter, Folder
} from 'lucide-react';
import { Document, DocumentCategory } from '../../types/vault';
import { format } from 'date-fns';
import { vaultApi } from '../../api/vault';
import { toast } from 'react-hot-toast';

interface DocumentListProps {
    documents: Document[];
    onDelete: (id: number) => void;
    isLoading: boolean;
}

type SortField = 'name' | 'date' | 'category';
type SortDirection = 'asc' | 'desc';

// ── Helpers ──────────────────────────────────────────────────────────────────

const FILE_TYPE_MAP: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    pdf: { icon: <FileText className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50' },
    doc: { icon: <FileText className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    docx: { icon: <FileText className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    xls: { icon: <FileSpreadsheet className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
    xlsx: { icon: <FileSpreadsheet className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
    csv: { icon: <FileSpreadsheet className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
    ppt: { icon: <FileText className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
    pptx: { icon: <FileText className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
    txt: { icon: <FileText className="w-5 h-5" />, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-surface-900' },
    png: { icon: <FileImage className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    jpg: { icon: <FileImage className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    jpeg: { icon: <FileImage className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    zip: { icon: <FileArchive className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    rar: { icon: <FileArchive className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const getFileStyle = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return FILE_TYPE_MAP[ext] || { icon: <File className="w-5 h-5" />, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100' };
};

const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
};

const isPreviewable = (fileName: string) => {
    const ext = getFileExtension(fileName);
    return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext);
};

const getUniversityFromDoc = (doc: Document): string | null => {
    // Try to extract from [University Name] prefix
    const match = doc.file_name.match(/^\[(.*?)\]/);
    if (match) return match[1];

    // Try to extract from description "Application to {University}"
    if (doc.description && doc.description.startsWith('Application to ')) {
        return doc.description.replace('Application to ', '');
    }

    return null;
};

// ── Skeleton Loader ──────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white dark:bg-surface-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-50 dark:bg-surface-900 rounded w-1/3" />
            </div>
        </div>
        <div className="h-3 bg-gray-50 dark:bg-surface-900 rounded w-1/2 mt-4 pt-2" />
    </div>
);



// ── Preview Modal ────────────────────────────────────────────────────────────

const PreviewModal: React.FC<{
    doc: Document;
    previewUrl: string;
    onClose: () => void;
    onDownload: () => void;
}> = ({ doc, previewUrl, onClose, onDownload }) => {
    const [textContent, setTextContent] = useState<string>('');
    const [isLoadingText, setIsLoadingText] = useState(false);

    const ext = getFileExtension(doc.file_name);
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
    const isPdf = ext === 'pdf';
    const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
    const isText = ['txt', 'csv'].includes(ext);

    // Load text content for text files
    React.useEffect(() => {
        if (isText && previewUrl) {
            setIsLoadingText(true);
            fetch(previewUrl)
                .then(response => response.text())
                .then(text => {
                    setTextContent(text);
                    setIsLoadingText(false);
                })
                .catch(() => {
                    setTextContent('Failed to load text content');
                    setIsLoadingText(false);
                });
        }
    }, [isText, previewUrl]);

    // For Office documents, use Microsoft Office Online viewer
    const officeViewerUrl = isOffice
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`
        : null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg ${getFileStyle(doc.file_name).bg} ${getFileStyle(doc.file_name).color}`}>
                            {getFileStyle(doc.file_name).icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{doc.file_name}</h3>
                            <p className="text-xs text-gray-400 capitalize">{doc.category.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-surface-900">
                    {isImage ? (
                        <div className="flex items-center justify-center min-h-full">
                            <img
                                src={previewUrl}
                                alt={doc.file_name}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={previewUrl}
                            className="w-full h-full min-h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-800"
                            title={doc.file_name}
                        />
                    ) : isOffice && officeViewerUrl ? (
                        <div className="w-full h-full min-h-[600px]">
                            <iframe
                                src={officeViewerUrl}
                                className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-800"
                                title={doc.file_name}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                                Powered by Microsoft Office Online Viewer
                            </p>
                        </div>
                    ) : isText ? (
                        <div className="bg-white dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                            {isLoadingText ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-[500px]">
                                    {textContent}
                                </pre>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                                <FileText className="w-12 h-12 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Preview not available</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                This file type cannot be previewed in the browser.
                            </p>
                            <button
                                onClick={onDownload}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download to view
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteModal: React.FC<{
    doc: Document | null;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ doc, onConfirm, onCancel }) => {
    if (!doc) return null;
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Document</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Are you sure you want to delete this document?
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-surface-900 px-3 py-2 rounded-lg mb-5 truncate">
                        {doc.file_name}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete, isLoading }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState<DocumentCategory | 'all'>('all');
    const [universityFilter, setUniversityFilter] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [isDownloading, setIsDownloading] = useState<number | null>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Derived data
    const filteredAndSorted = useMemo(() => {
        let result = [...documents];

        // Filter by category
        if (filter !== 'all') {
            result = result.filter(d => d.category === filter);
        }

        // Filter by University
        if (universityFilter !== 'all') {
            if (universityFilter === 'My Uploads') {
                result = result.filter(d => !getUniversityFromDoc(d));
            } else {
                result = result.filter(d => getUniversityFromDoc(d) === universityFilter);
            }
        }

        // Filter by search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.file_name.toLowerCase().includes(q) ||
                d.description?.toLowerCase().includes(q) ||
                d.category.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'name':
                    cmp = a.file_name.localeCompare(b.file_name);
                    break;
                case 'date':
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case 'category':
                    cmp = a.category.localeCompare(b.category);
                    break;
            }
            return sortDirection === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [documents, filter, universityFilter, searchQuery, sortField, sortDirection]);

    const universities = useMemo(() => {
        const unis = new Set<string>();
        documents.forEach(d => {
            const uni = getUniversityFromDoc(d);
            if (uni) unis.add(uni);
        });
        return Array.from(unis).sort();
    }, [documents]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: documents.length };
        documents.forEach(d => {
            counts[d.category] = (counts[d.category] || 0) + 1;
        });
        return counts;
    }, [documents]);

    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField]);

    const handleDownload = async (doc: Document) => {
        setIsDownloading(doc.id);
        const toastId = toast.loading('Preparing download…');
        try {
            await vaultApi.downloadDocument(doc.id, doc.file_name);
            toast.success('Download started', { id: toastId });
        } catch {
            toast.error('Download failed — please try again', { id: toastId });
        } finally {
            setIsDownloading(null);
        }
    };

    const handlePreview = async (doc: Document) => {
        if (!isPreviewable(doc.file_name)) {
            toast.error('Preview not available for this file type');
            return;
        }

        setIsLoadingPreview(true);
        const toastId = toast.loading('Loading preview…');

        try {
            const response = await fetch(vaultApi.getDownloadUrl(doc.id), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to load preview');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setPreviewDoc(doc);
            setPreviewUrl(url);
            toast.dismiss(toastId);
        } catch (error) {
            toast.error('Could not load preview', { id: toastId });
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewDoc(null);
        setPreviewUrl(null);
    };

    const confirmDelete = () => {
        if (docToDelete) {
            onDelete(docToDelete.id);
            setDocToDelete(null);
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" />
            : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />;
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-14 bg-white dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    // ── Empty state ──────────────────────────────────────────────────────────
    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-8 bg-white dark:bg-surface-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary-600/5 rounded-full scale-150 blur-xl" />
                    <div className="relative p-5 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl">
                        <FileText className="w-10 h-10 text-primary-600/70" />
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No documents yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">
                    Upload your first document to keep it safe and organized in your vault.
                </p>
            </div>
        );
    }

    // ── No results state ─────────────────────────────────────────────────────
    const NoResults = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-gray-300 mb-3" />
            <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">No documents found</h4>
            <p className="text-sm text-gray-400 mb-4">
                Try adjusting your search or filter criteria.
            </p>
            <button
                onClick={() => { setSearchQuery(''); setFilter('all'); }}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
                Clear all filters
            </button>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Modals */}
            <AnimatePresence>
                {previewDoc && previewUrl && (
                    <PreviewModal
                        doc={previewDoc}
                        previewUrl={previewUrl}
                        onClose={closePreview}
                        onDownload={() => previewDoc && handleDownload(previewDoc)}
                    />
                )}
            </AnimatePresence>
            <DeleteModal doc={docToDelete} onConfirm={confirmDelete} onCancel={() => setDocToDelete(null)} />

            {/* ── Toolbar ─────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                {/* Top row: Search + view toggle */}
                <div className="flex items-center gap-3 p-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search documents…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-surface-900 border border-gray-200 dark:border-gray-700 rounded-lg
                                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600/40 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle (mobile-friendly) */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                            ${filter !== 'all'
                                ? 'bg-primary-50 text-primary-700 border-primary-200'
                                : 'bg-gray-50 dark:bg-surface-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-surface-700'}`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filter</span>
                        {filter !== 'all' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                        )}

                    </button>

                    {/* University Filter */}
                    <div className="relative group">
                        <button
                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                                ${universityFilter !== 'all'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-gray-50 dark:bg-surface-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-surface-700'}`}
                        >
                            <Folder className="w-4 h-4" />
                            <span className="hidden sm:inline">
                                {universityFilter === 'all' ? 'All Programs' : universityFilter}
                            </span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg
                                        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1 max-h-64 overflow-y-auto">
                            <button
                                onClick={() => setUniversityFilter('all')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:bg-surface-900 transition-colors
                                    ${universityFilter === 'all' ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                                All Programs
                            </button>
                            <button
                                onClick={() => setUniversityFilter('My Uploads')}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:bg-surface-900 transition-colors
                                    ${universityFilter === 'My Uploads' ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                                My Uploads
                            </button>

                            {universities.length > 0 && <div className="h-px bg-gray-100 my-1" />}

                            {universities.map(uni => (
                                <button
                                    key={uni}
                                    onClick={() => setUniversityFilter(uni)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:bg-surface-900 transition-colors
                                        ${universityFilter === uni ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                                    {uni}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Sort dropdown */}
                    <div className="relative group">
                        <button
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border
                                       bg-gray-50 dark:bg-surface-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            <span className="hidden sm:inline">Sort</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg
                                        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1">
                            {([['date', 'Date'], ['name', 'Name'], ['category', 'Category']] as [SortField, string][]).map(([field, label]) => (
                                <button
                                    key={field}
                                    onClick={() => handleSort(field)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:bg-surface-900 transition-colors
                                        ${sortField === field ? 'text-primary-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    {label}
                                    <SortIcon field={field} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider + View toggle */}
                    <div className="w-px h-6 bg-gray-200" />
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                                ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-400'}`}
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                                ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-400'}`}
                            aria-label="List view"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Category filter pills (collapsible) */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                                        ${filter === 'all'
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                                >
                                    All
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === 'all' ? 'bg-white/20' : 'bg-gray-200'}`}>
                                        {categoryCounts.all}
                                    </span>
                                </button>
                                {Object.values(DocumentCategory).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap capitalize
                                            ${filter === cat
                                                ? 'bg-primary-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        {cat.replace(/_/g, ' ')}
                                        {categoryCounts[cat] && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === cat ? 'bg-white/20' : 'bg-gray-200'}`}>
                                                {categoryCounts[cat]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            {/* Results count */}
            < div className="flex items-center justify-between text-xs text-gray-400 px-1" >
                <span>
                    {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'document' : 'documents'}

                    {(filter !== 'all' || universityFilter !== 'all' || searchQuery) && ` (filtered from ${documents.length})`}
                </span>
            </div >

            {
                filteredAndSorted.length === 0 ? <NoResults /> : viewMode === 'grid' ? (
                    /* ── Grid View ──────────────────────────────────────────────────── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        <AnimatePresence mode="popLayout">
                            {filteredAndSorted.map((doc) => {
                                const fileStyle = getFileStyle(doc.file_name);
                                return (
                                    <motion.div
                                        key={doc.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="group relative bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
                                               hover:shadow-md hover:border-gray-200 dark:border-gray-700 transition-all duration-200"
                                    >
                                        {/* Action overlay */}
                                        <div className="absolute top-3 right-3 flex gap-1.5
                                                    opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                                                    transition-all duration-200">
                                            <button
                                                onClick={() => handlePreview(doc)}
                                                disabled={!isPreviewable(doc.file_name) || isLoadingPreview}
                                                className="p-1.5 bg-white/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-lg
                                                       text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:border-primary-300 transition-colors shadow-sm
                                                       disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={isPreviewable(doc.file_name) ? "Preview" : "Preview not available"}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                disabled={isDownloading === doc.id}
                                                className="p-1.5 bg-white/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-lg
                                                       text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:border-primary-300 transition-colors shadow-sm
                                                       disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Download"
                                            >
                                                <Download className={`w-3.5 h-3.5 ${isDownloading === doc.id ? 'animate-bounce' : ''}`} />
                                            </button>
                                            {doc.id > 0 ? (
                                                <button
                                                    onClick={() => setDocToDelete(doc)}
                                                    className="p-1.5 bg-white/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-lg
                                                           text-gray-500 dark:text-gray-400 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="p-1.5 bg-gray-50 dark:bg-surface-900 text-gray-300 rounded-lg cursor-not-allowed"
                                                    title="Auto-imported — manage from Profile settings"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex items-start gap-3.5 mb-3">
                                            <div className={`p-2.5 rounded-xl ${fileStyle.bg} ${fileStyle.color} shrink-0`}>
                                                {fileStyle.icon}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate leading-snug" title={doc.file_name}>
                                                    {doc.file_name}
                                                </h4>
                                                <p className="text-xs text-gray-400 capitalize mt-0.5">
                                                    {doc.category.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        {doc.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                                                {doc.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                            </span>
                                            {doc.id < 0 && (
                                                <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Auto-imported
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* ── List View ──────────────────────────────────────────────────── */
                    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th
                                            className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:text-gray-300 transition-colors"
                                            onClick={() => handleSort('name')}
                                        >
                                            <span className="flex items-center gap-1.5">Name <SortIcon field="name" /></span>
                                        </th>
                                        <th
                                            className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:text-gray-300 transition-colors"
                                            onClick={() => handleSort('category')}
                                        >
                                            <span className="flex items-center gap-1.5">Category <SortIcon field="category" /></span>
                                        </th>
                                        <th
                                            className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:text-gray-300 transition-colors"
                                            onClick={() => handleSort('date')}
                                        >
                                            <span className="flex items-center gap-1.5">Date <SortIcon field="date" /></span>
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <AnimatePresence>
                                        {filteredAndSorted.map((doc) => {
                                            const fileStyle = getFileStyle(doc.file_name);
                                            return (
                                                <motion.tr
                                                    key={doc.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="group hover:bg-gray-50 dark:bg-surface-900/60 transition-colors"
                                                >
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${fileStyle.bg} ${fileStyle.color} shrink-0`}>
                                                                {React.cloneElement(fileStyle.icon as React.ReactElement, { className: 'w-4 h-4' })}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{doc.file_name}</p>
                                                                {doc.description && (
                                                                    <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{doc.description}</p>
                                                                )}
                                                            </div>
                                                            {doc.id < 0 && (
                                                                <span className="shrink-0 flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Auto
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="inline-block px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                                                            {doc.category.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                        <span title={format(new Date(doc.created_at), 'PPP')}>
                                                            {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handlePreview(doc)}
                                                                disabled={!isPreviewable(doc.file_name) || isLoadingPreview}
                                                                className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                title={isPreviewable(doc.file_name) ? "Preview" : "Preview not available"}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(doc)}
                                                                disabled={isDownloading === doc.id}
                                                                className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 transition-colors disabled:opacity-40"
                                                                title="Download"
                                                            >
                                                                <Download className={`w-4 h-4 ${isDownloading === doc.id ? 'animate-bounce' : ''}`} />
                                                            </button>
                                                            {doc.id > 0 ? (
                                                                <button
                                                                    onClick={() => setDocToDelete(doc)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <button disabled className="p-1.5 text-gray-200 cursor-not-allowed" title="Auto-imported">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DocumentList;