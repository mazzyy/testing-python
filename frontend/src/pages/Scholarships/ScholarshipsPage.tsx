import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, GraduationCap, ExternalLink, Clock, Calendar, Users, CheckCircle, Sparkles, AlertCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scholarshipsApi } from '../../api/scholarships';
import type { ScholarshipFilters, ScholarshipEligibility } from '../../types';
import { Button, Input, EmptyState, Card } from '../../components/ui';
import { ScholarshipCard } from '../../components/scholarships';
import { useAuthStore } from '../../store/authStore';
import SEO from '../../components/common/SEO';

// Field name to display label mapping
const FIELD_LABELS: Record<string, string> = {
    current_degree: 'Current Degree',
    desired_degree: 'Desired Degree Level',
    nationality: 'Nationality',
    field_of_study: 'Field of Study',
    cgpa: 'CGPA',
    english_level: 'English Level',
    german_level: 'German Level',
};

// Skeleton card for loading states
function SkeletonCard() {
    return (
        <Card className="p-6 flex flex-col h-full">
            <div className="animate-pulse">
                <div className="flex justify-between items-start mb-3">
                    <div className="h-5 bg-slate-200 dark:bg-surface-700 rounded w-3/4" />
                    <div className="h-7 w-16 bg-slate-200 dark:bg-surface-700 rounded-full" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 dark:bg-surface-700/60 rounded w-2/3 mb-4" />
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-200 dark:bg-surface-700" />
                        <div className="h-3 bg-slate-100 dark:bg-surface-700/60 rounded w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-200 dark:bg-surface-700" />
                        <div className="h-3 bg-slate-100 dark:bg-surface-700/60 rounded w-32" />
                    </div>
                </div>
                <div className="pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto">
                    <div className="flex gap-2">
                        <div className="h-9 bg-slate-200 dark:bg-surface-700 rounded-lg flex-1" />
                        <div className="h-9 w-9 bg-slate-200 dark:bg-surface-700 rounded-lg" />
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Loading bar component
function LoadingBar({ message, subtitle }: { message: string; subtitle: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
        >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/40 p-5">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            {message}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            {subtitle}
                        </p>
                    </div>

                    <div className="w-5 h-5 flex-shrink-0">
                        <svg className="animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                </div>

                {/* Progress track */}
                <div className="mt-4 h-1.5 rounded-full bg-amber-200/60 dark:bg-amber-800/30 overflow-hidden relative">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 12, ease: 'easeOut' }}
                    />
                    <motion.div
                        className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '400%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default function ScholarshipsPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [eligibilityMode, setEligibilityMode] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [selectedEligibility, setSelectedEligibility] = useState<ScholarshipEligibility | null>(null);

    const filters: ScholarshipFilters = {
        page: parseInt(searchParams.get('page') || '1'),
        page_size: 12,
        search: searchParams.get('search') || undefined,
    };

    // Regular scholarships query
    const { data, isLoading, error } = useQuery({
        queryKey: ['scholarships', filters],
        queryFn: () => scholarshipsApi.getScholarships(filters),
        enabled: !eligibilityMode,
    });

    // Eligible scholarships query
    const {
        data: eligibilityData,
        isLoading: eligibilityLoading,
        error: eligibilityError
    } = useQuery({
        queryKey: ['scholarships-eligible'],
        queryFn: () => scholarshipsApi.getEligibleScholarships(6),
        enabled: eligibilityMode && isAuthenticated,
    });

    // Handle eligibility response
    useEffect(() => {
        if (eligibilityData && eligibilityData.missing_fields.length > 0) {
            setMissingFields(eligibilityData.missing_fields);
        }
    }, [eligibilityData]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== (searchParams.get('search') || '')) {
                updateFilter('search', searchInput || null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const updateFilter = (key: string, value: string | null) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        if (key !== 'page') {
            newParams.set('page', '1');
        }
        setSearchParams(newParams);
    };

    const handleFindMyScholarships = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setEligibilityMode(true);
    };

    const handleShowAllScholarships = () => {
        setEligibilityMode(false);
        setMissingFields([]);
    };

    const totalPages = data ? Math.ceil(data.total / (filters.page_size || 12)) : 0;

    const currentLoading = eligibilityMode ? eligibilityLoading : isLoading;
    const currentError = eligibilityMode ? eligibilityError : error;

    // SEO Schema
    const schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Find Scholarships in Germany",
        "description": "Discover scholarships for international students in Germany. Stiftung, and university-specific funding opportunities.",
        "url": window.location.href,
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": (eligibilityMode ? eligibilityData?.scholarships : data?.scholarships)?.map((item, index) => {
                const scholarship = 'scholarship' in item ? item.scholarship : item;
                return {
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": `${window.location.origin}/scholarships/${scholarship.id}`,
                    "name": scholarship.title
                };
            }) || []
        }
    };

    return (
        <div className="page-container py-8">
            <SEO
                title={eligibilityMode ? 'Your Eligible Scholarships — Matched to Your Profile | UniAdvisorAI' : 'Fully Funded Scholarships in Germany for International Students (2026)'}
                description="Find the best DAAD, merit-based, and university-specific scholarships for international students in Germany. Check your eligibility and apply today."
                keywords={['scholarships germany', 'DAAD scholarship', 'german scholarship 2026', 'Deutschlandstipendium', 'funding for students', 'study in germany free']}
                schema={schema}
            />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
                                {eligibilityMode ? 'Your Eligible Scholarships' : 'Scholarships'}
                            </h1>
                            <p className="text-surface-500 dark:text-surface-400">
                                {currentLoading
                                    ? eligibilityMode
                                        ? 'Analyzing your profile for matching scholarships…'
                                        : 'Loading scholarships…'
                                    : eligibilityMode
                                        ? `Found ${eligibilityData?.total || 0} scholarships matching your profile`
                                        : `Explore ${data?.total || 0} scholarships to fund your studies in Germany`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Toggle Button */}
                    <div className="flex gap-2">
                        {eligibilityMode ? (
                            <Button variant="secondary" onClick={handleShowAllScholarships}>
                                Show All Scholarships
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleFindMyScholarships}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                            >
                                <Sparkles className="w-4 h-4" />
                                Find My Scholarships
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Missing Fields Warning */}
            <AnimatePresence>
                {eligibilityMode && missingFields.length > 0 && !eligibilityLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                                    Complete your profile for better results
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                                    Add the following to get more accurate eligibility scores:
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {missingFields.map((field) => (
                                        <span
                                            key={field}
                                            className="px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm"
                                        >
                                            {FIELD_LABELS[field] || field}
                                        </span>
                                    ))}
                                </div>
                                <Link to="/profile">
                                    <Button variant="secondary" size="sm">
                                        <User className="w-4 h-4" />
                                        Update Profile
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Bar (only in browse mode) */}
            {!eligibilityMode && (
                <div className="mb-6">
                    <Input
                        placeholder="Search scholarships by title, eligibility..."
                        leftIcon={<Search className="w-4 h-4" />}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        rightIcon={
                            searchInput ? (
                                <button onClick={() => setSearchInput('')}>
                                    <X className="w-4 h-4" />
                                </button>
                            ) : undefined
                        }
                    />
                </div>
            )}

            {/* ─── LOADING STATE ─── Loading bar + skeleton grid ─── */}
            {currentLoading && (
                <>
                    <AnimatePresence>
                        <LoadingBar
                            message={
                                eligibilityMode
                                    ? 'Finding scholarships you qualify for…'
                                    : 'Fetching scholarships for you…'
                            }
                            subtitle={
                                eligibilityMode
                                    ? 'Matching your profile against eligibility requirements — hang tight'
                                    : 'Loading available scholarships — results will appear shortly'
                            }
                        />
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <motion.div
                                key={`skel-${i}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <SkeletonCard />
                            </motion.div>
                        ))}
                    </div>
                </>
            )}

            {/* ─── ERROR STATE ─── */}
            {!currentLoading && currentError && (
                <EmptyState
                    icon={Search}
                    title="Error loading scholarships"
                    description="Something went wrong. Please try again."
                    actionLabel="Retry"
                    onAction={() => window.location.reload()}
                />
            )}

            {/* ─── ELIGIBILITY MODE RESULTS ─── */}
            {!currentLoading && !currentError && eligibilityMode && (
                <>
                    {eligibilityData?.scholarships.length === 0 ? (
                        <EmptyState
                            icon={GraduationCap}
                            title="No matching scholarships found"
                            description="Try completing more of your profile for better results"
                            actionLabel="Update Profile"
                            onAction={() => navigate('/profile')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eligibilityData?.scholarships.map((item, index) => (
                                <motion.div
                                    key={item.scholarship.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                                >
                                    <Card hover className="p-6 flex flex-col h-full relative group overflow-hidden">
                                        {/* Score-colored top accent */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 ${item.eligibility_score >= 70
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                                : item.eligibility_score >= 40
                                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                    : 'bg-gradient-to-r from-slate-300 to-slate-400'
                                            }`} />

                                        {/* Eligibility Score Badge */}
                                        <div className="absolute top-4 right-4">
                                            <div className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${item.eligibility_score >= 70
                                                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                                                : item.eligibility_score >= 40
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                                                }`}>
                                                {item.eligibility_score}% match
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3
                                            className="text-lg font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer line-clamp-2 mb-3 pr-20 transition-colors"
                                            onClick={() => setSelectedEligibility(item)}
                                        >
                                            {item.scholarship.title}
                                        </h3>

                                        {/* Reasons */}
                                        {item.reasons.length > 0 && (
                                            <div className="mb-3 space-y-1">
                                                {item.reasons.slice(0, 2).map((reason, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-success-600 dark:text-success-400">
                                                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-1">{reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Concerns */}
                                        {item.concerns.length > 0 && (
                                            <div className="mb-3 space-y-1">
                                                {item.concerns.slice(0, 1).map((concern, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-1">{concern}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quick Info */}
                                        <div className="space-y-2 text-sm mb-4 flex-1">
                                            {item.scholarship.duration && (
                                                <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                                                    <Clock className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-1">{item.scholarship.duration}</span>
                                                </div>
                                            )}
                                            {item.scholarship.deadline && (
                                                <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                                                    <Calendar className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-1">{item.scholarship.deadline}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setSelectedEligibility(item)}
                                            >
                                                View Details
                                            </Button>
                                            {item.scholarship.link && (
                                                <a href={item.scholarship.link} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="sm" className="btn-icon">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ─── BROWSE MODE RESULTS ─── */}
            {!currentLoading && !currentError && !eligibilityMode && (
                <>
                    {data?.scholarships.length === 0 ? (
                        <EmptyState
                            icon={GraduationCap}
                            title="No scholarships found"
                            description="Try adjusting your search terms"
                            actionLabel="Clear Search"
                            onAction={() => { setSearchInput(''); updateFilter('search', null); }}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data?.scholarships.map((scholarship, index) => (
                                    <motion.div
                                        key={scholarship.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ScholarshipCard
                                            scholarship={scholarship}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 flex-wrap">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => updateFilter('page', String((filters.page || 1) - 1))}
                                        disabled={filters.page === 1}
                                    >
                                        Prev
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const pages: (number | string)[] = [];
                                            const currentPage = filters.page || 1;
                                            const isMobile = window.innerWidth < 640;
                                            const siblings = isMobile ? 0 : 1;

                                            if (totalPages <= (isMobile ? 5 : 7)) {
                                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                                            } else {
                                                pages.push(1);
                                                if (currentPage > 2 + siblings) pages.push('...');

                                                const start = Math.max(2, currentPage - siblings);
                                                const end = Math.min(totalPages - 1, currentPage + siblings);
                                                for (let i = start; i <= end; i++) pages.push(i);

                                                if (currentPage < totalPages - 1 - siblings) pages.push('...');
                                                pages.push(totalPages);
                                            }

                                            return pages.map((p, i) =>
                                                typeof p === 'string' ? (
                                                    <span key={`ellipsis-${i}`} className="px-1 sm:px-2 text-surface-400">…</span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => updateFilter('page', String(p))}
                                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm transition-colors ${currentPage === p
                                                            ? 'bg-primary-600 text-white'
                                                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            );
                                        })()}
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => updateFilter('page', String((filters.page || 1) + 1))}
                                        disabled={filters.page === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Detail Modal for eligibility results */}
            <AnimatePresence>
                {selectedEligibility && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedEligibility(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 p-6 rounded-t-2xl">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${selectedEligibility.eligibility_score >= 70
                                            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                                            : selectedEligibility.eligibility_score >= 40
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                                            }`}>
                                            {selectedEligibility.eligibility_score}% Match
                                        </div>
                                        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                                            {selectedEligibility.scholarship.title}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedEligibility(null)}
                                        className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Why you match */}
                                {selectedEligibility.reasons.length > 0 && (
                                    <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/10 border border-success-100 dark:border-success-800/30">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-success-700 dark:text-success-300 mb-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Why You Match
                                        </h3>
                                        <ul className="space-y-1">
                                            {selectedEligibility.reasons.map((reason, i) => (
                                                <li key={i} className="text-sm text-success-600 dark:text-success-400 flex items-start gap-2">
                                                    <span className="text-success-400 dark:text-success-500">•</span>
                                                    {reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Things to consider */}
                                {selectedEligibility.concerns.length > 0 && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Things to Consider
                                        </h3>
                                        <ul className="space-y-1">
                                            {selectedEligibility.concerns.map((concern, i) => (
                                                <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                                                    <span className="text-amber-400 dark:text-amber-500">•</span>
                                                    {concern}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendation */}
                                {selectedEligibility.recommendation && (
                                    <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                                            <Sparkles className="w-4 h-4" />
                                            AI Recommendation
                                        </h3>
                                        <p className="text-sm text-primary-600 dark:text-primary-400">{selectedEligibility.recommendation}</p>
                                    </div>
                                )}

                                {/* Scholarship Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedEligibility.scholarship.duration && (
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                                            <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 text-sm mb-1">
                                                <Clock className="w-4 h-4" />
                                                Duration
                                            </div>
                                            <p className="font-medium text-surface-900 dark:text-white">{selectedEligibility.scholarship.duration}</p>
                                        </div>
                                    )}
                                    {selectedEligibility.scholarship.deadline && (
                                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                                            <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 text-sm mb-1">
                                                <Calendar className="w-4 h-4" />
                                                Deadline
                                            </div>
                                            <p className="font-medium text-surface-900 dark:text-white">{selectedEligibility.scholarship.deadline}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedEligibility.scholarship.eligibility && (
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                                            <Users className="w-4 h-4" />
                                            Eligibility Requirements
                                        </h3>
                                        <p className="text-surface-600 dark:text-surface-400 whitespace-pre-line">{selectedEligibility.scholarship.eligibility}</p>
                                    </div>
                                )}

                                {selectedEligibility.scholarship.value_benefits && (
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            Value & Benefits
                                        </h3>
                                        <p className="text-surface-600 dark:text-surface-400 whitespace-pre-line">{selectedEligibility.scholarship.value_benefits}</p>
                                    </div>
                                )}
                            </div>

                            <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-surface-100 dark:border-surface-700 p-6 rounded-b-2xl">
                                <div className="flex gap-3">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setSelectedEligibility(null)}
                                    >
                                        Close
                                    </Button>
                                    <Link to={`/scholarships/${selectedEligibility.scholarship.id}`} className="flex-1">
                                        <Button variant="primary" className="w-full">
                                            View Full Page
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}