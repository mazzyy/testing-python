import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, BookOpen, GraduationCap, Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { programsApi } from '../../api';
import type { ProgramFilters } from '../../types';
import { Button, Select, Card, PageLoader, EmptyState, Input } from '../../components/ui';
import { ProgramCard } from '../../components/programs';
import Badge from '../../components/ui/Badge';
import SEO from '../../components/common/SEO';

const DEGREE_TYPES = [
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Masters', label: 'Masters' },
    { value: 'PhD', label: 'PhD' },
];

export default function UniversityDetailPage() {
    const { name } = useParams<{ name: string }>();
    const decodedName = name ? decodeURIComponent(name) : '';

    const [page, setPage] = useState(1);
    const [degreeFilter, setDegreeFilter] = useState<string | null>(null);
    const [teachingLanguageFilter, setTeachingLanguageFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filters: ProgramFilters = {
        page,
        page_size: 12,
        degree_type: degreeFilter || undefined,
        search: debouncedSearch || undefined,
        teaching_language: teachingLanguageFilter || undefined,
    };

    // Fetch programs for this university
    const { data, isLoading, error } = useQuery({
        queryKey: ['university-programs', decodedName, filters],
        queryFn: () => programsApi.getUniversityPrograms(decodedName, filters),
        enabled: !!decodedName,
    });

    // Fetch university info from the universities list
    const { data: universitiesData } = useQuery({
        queryKey: ['universities'],
        queryFn: () => programsApi.getUniversities(),
    });

    const universityInfo = universitiesData?.universities.find(
        (u) =>
            u.name === decodedName ||
            u.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === decodedName
    );

    // If we only have a slug and no exact match from the API yet, format the slug to look better
    const displayTitle = universityInfo?.name || decodedName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const totalPages = data ? Math.ceil(data.total / (filters.page_size || 12)) : 0;

    const degreeColors: Record<string, 'primary' | 'success' | 'warning' | 'neutral'> = {
        Bachelor: 'primary',
        Masters: 'success',
        PhD: 'warning',
    };

    const hasActiveFilters = degreeFilter || teachingLanguageFilter || debouncedSearch;

    const handleClearFilters = () => {
        setDegreeFilter(null);
        setTeachingLanguageFilter(null);
        setSearchQuery('');
        setDebouncedSearch('');
        setPage(1);
    };

    // Generate smart pagination range
    const getPaginationRange = () => {
        const delta = 1;
        const range: (number | 'ellipsis')[] = [];
        const left = Math.max(2, page - delta);
        const right = Math.min(totalPages - 1, page + delta);

        range.push(1);
        if (left > 2) range.push('ellipsis');
        for (let i = left; i <= right; i++) range.push(i);
        if (right < totalPages - 1) range.push('ellipsis');
        if (totalPages > 1) range.push(totalPages);

        return range;
    };

    // SEO Schema
    const universitySchema = universityInfo ? {
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity",
        "name": universityInfo.name,
        "description": `Study at ${universityInfo.name} in ${universityInfo.cities?.[0] || 'Germany'}. Offers ${universityInfo.degree_types.join(', ')} programs.`,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": universityInfo.cities?.[0] || 'Germany',
            "addressCountry": "DE"
        },
        "url": window.location.href
    } : undefined;

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.uniadvisorai.com/"
        }, {
            "@type": "ListItem",
            "position": 2,
            "name": "Universities",
            "item": "https://www.uniadvisorai.com/universities"
        }, {
            "@type": "ListItem",
            "position": 3,
            "name": decodedName
        }]
    };

    const combinedSchema = universitySchema ? [universitySchema, breadcrumbSchema] : [breadcrumbSchema];

    const activeFilterCount = (degreeFilter ? 1 : 0) + (teachingLanguageFilter ? 1 : 0);

    return (
        <div className="page-container py-8">
            <SEO
                title={`${displayTitle}: Acceptance Rate, English Programs & Fees 2026`}
                description={`Everything you need to know about studying at ${displayTitle} in ${universityInfo?.cities?.[0] || 'Germany'}. Find programs, tuition fees, and admission requirements.`}
                keywords={[displayTitle, `study at ${displayTitle}`, `${displayTitle} programs`, `universities in ${universityInfo?.cities?.[0] || 'Germany'}`]}
                schema={combinedSchema}
            />

            {/* Back button */}
            <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Link
                    to="/universities"
                    className="group inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">All Universities</span>
                </Link>
            </motion.div>

            {/* University Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
            >
                <Card className="relative overflow-hidden mb-10 dark:bg-surface-800 dark:border-surface-700">
                    {/* Decorative background accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-transparent to-transparent pointer-events-none dark:from-primary-900/20" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none dark:bg-primary-900/10" />

                    <div className="relative p-8 md:p-10">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                            {/* University Icon */}
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-200/50 dark:shadow-none">
                                <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2 leading-tight">
                                    {displayTitle}
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
                                    {universityInfo?.cities && universityInfo.cities.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                                            <MapPin className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                                            <span className="text-sm font-medium">{universityInfo.cities[0]}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
                                        <BookOpen className="w-4 h-4 text-surface-400 dark:text-surface-500" />
                                        <span className="text-sm">
                                            {data?.total === 1 ? '1 program available' : `${data?.total || 0} programs available`}
                                        </span>
                                    </div>
                                </div>

                                {/* Degree types */}
                                {universityInfo?.degree_types && universityInfo.degree_types.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {universityInfo.degree_types.map((type) => (
                                            <Badge key={type} variant={degreeColors[type] || 'neutral'}>
                                                {type}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Toolbar: Title + Search + Filters toggle */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="flex flex-col gap-4 mb-6"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                        Programs
                        {data?.total !== undefined && (
                            <span className="ml-2 text-sm font-normal text-surface-400 dark:text-surface-500">
                                {data.total} {data.total === 1 ? 'result' : 'results'}
                            </span>
                        )}
                    </h2>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Input
                                placeholder="Search programs..."
                                leftIcon={<Search className="w-4 h-4" />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 dark:bg-surface-800 dark:text-white dark:border-surface-700"
                                rightIcon={
                                    searchQuery ? (
                                        <button
                                            onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                                            className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    ) : undefined
                                }
                            />
                        </div>

                        <Button
                            variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
                            size="md"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex-shrink-0 relative"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-surface-800 text-primary-600 text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm dark:shadow-surface-900/50 ring-2 ring-primary-600">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Active filter chips */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-wrap items-center gap-2 overflow-hidden"
                        >
                            {debouncedSearch && (
                                <motion.span
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm border border-surface-200 dark:border-surface-600"
                                >
                                    <Search className="w-3 h-3 text-surface-400 dark:text-surface-500" />
                                    "{debouncedSearch}"
                                    <button
                                        onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                                        className="ml-0.5 p-0.5 rounded-full hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.span>
                            )}
                            {degreeFilter && (
                                <motion.span
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm border border-primary-200 dark:border-primary-800"
                                >
                                    {degreeFilter}
                                    <button
                                        onClick={() => { setDegreeFilter(null); setPage(1); }}
                                        className="ml-0.5 p-0.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.span>
                            )}
                            {teachingLanguageFilter && (
                                <motion.span
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm border border-primary-200 dark:border-primary-800"
                                >
                                    {teachingLanguageFilter}
                                    <button
                                        onClick={() => { setTeachingLanguageFilter(null); setPage(1); }}
                                        className="ml-0.5 p-0.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.span>
                            )}
                            <button
                                onClick={handleClearFilters}
                                className="text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors px-2 py-1"
                            >
                                Clear all
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Expandable Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <Card className="p-5 sm:p-6 mb-8 border-primary-100 dark:bg-surface-800 dark:border-surface-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Degree Type"
                                    options={DEGREE_TYPES}
                                    placeholder="All degrees"
                                    value={degreeFilter || ''}
                                    onChange={(e) => {
                                        setDegreeFilter(e.target.value || null);
                                        setPage(1);
                                    }}
                                    className="dark:bg-surface-800 dark:text-white dark:border-surface-700"
                                />

                                <Select
                                    label="Teaching Language"
                                    options={[
                                        { value: 'English', label: 'English' },
                                        { value: 'German', label: 'German' },
                                    ]}
                                    placeholder="All languages"
                                    value={teachingLanguageFilter || ''}
                                    onChange={(e) => {
                                        setTeachingLanguageFilter(e.target.value || null);
                                        setPage(1);
                                    }}
                                    className="dark:bg-surface-800 dark:text-white dark:border-surface-700"
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Programs list */}
            {isLoading ? (
                <PageLoader />
            ) : error ? (
                <EmptyState
                    icon={BookOpen}
                    title="Error loading programs"
                    description="Something went wrong. Please try again."
                    actionLabel="Retry"
                    onAction={() => window.location.reload()}
                />
            ) : data?.programs.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No programs found"
                    description={hasActiveFilters ? "Try adjusting or clearing your filters" : "This university has no programs listed"}
                    actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
                    onAction={hasActiveFilters ? handleClearFilters : undefined}
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {data?.programs.map((program, index) => (
                            <motion.div
                                key={program.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.3 }}
                            >
                                <ProgramCard program={program} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-10">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-0.5 mx-1">
                                {getPaginationRange().map((item, i) =>
                                    item === 'ellipsis' ? (
                                        <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-surface-400 dark:text-surface-500 text-sm select-none">
                                            ···
                                        </span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setPage(item as number)}
                                            className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${page === item
                                                ? 'bg-primary-600 text-white shadow-sm dark:shadow-surface-900/50 shadow-primary-200 dark:shadow-none'
                                                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {item}
                                        </button>
                                    )
                                )}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}