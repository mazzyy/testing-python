import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, GraduationCap, Building2, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { programsApi } from '../../api';
import { Input, PageLoader, EmptyState, Button, Select, Card } from '../../components/ui';
import { UniversityCard } from '../../components/universities';
import SEO from '../../components/common/SEO';

const DEGREE_TYPES = [
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Masters', label: 'Masters' },
    { value: 'PhD', label: 'PhD' },
];

export default function UniversitiesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const [showFilters, setShowFilters] = useState(false);

    // Filters and Pagination State
    const selectedCity = searchParams.get('city') || '';
    const selectedDegree = searchParams.get('degree_type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 12;

    const activeFiltersCount = [
        selectedCity,
        selectedDegree,
        searchParams.get('search'),
    ].filter(Boolean).length;

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

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== (searchParams.get('search') || '')) {
                updateFilter('search', searchInput || null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch cities for filter dropdown
    const { data: citiesData } = useQuery({
        queryKey: ['cities'],
        queryFn: () => programsApi.getCities(),
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['universities', searchParams.get('search'), selectedCity, selectedDegree, page, pageSize],
        queryFn: () => programsApi.getUniversities({
            search: searchParams.get('search') || undefined,
            city: selectedCity || undefined,
            degree_type: selectedDegree || undefined,
            page,
            page_size: pageSize
        }),
    });

    const handleClearFilters = () => {
        setSearchParams({});
        setSearchInput('');
    };

    const hasActiveFilters = searchInput || selectedCity;
    const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

    // SEO Schema
    const schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Top Universities in Germany",
        "description": "Explore top ranking universities in Germany offering Bachelors, Masters, and PhD programs.",
        "url": window.location.href,
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": data?.universities.map((uni, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": `${window.location.origin}/universities/${encodeURIComponent(uni.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))}`,
                "name": uni.name
            })) || []
        }
    };

    return (
        <div className="page-container py-8">
            <SEO
                title="Top Universities in Germany 2025 — Rankings & Admission Guide | CampusConsult"
                description="Explore 400+ top-ranked German universities. Compare programs, tuition fees, admission requirements & student reviews. Find your perfect university in Germany."
                keywords={['universities in germany', 'study in germany', 'german universities', 'ranking', 'tuition fees', 'admission requirements']}
                schema={schema}
            />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
                        Universities
                    </h1>
                </div>
                <p className="text-surface-500 dark:text-surface-400">
                    Explore {data?.total || 0} universities offering programs in Germany
                </p>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1">
                    <Input
                        placeholder="Search universities..."
                        leftIcon={<Search className="w-4 h-4" />}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        rightIcon={
                            searchInput ? (
                                <button onClick={() => { setSearchInput(''); updateFilter('search', null); }}>
                                    <X className="w-4 h-4" />
                                </button>
                            ) : undefined
                        }
                    />
                </div>

                {/* Filter Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={showFilters ? 'primary' : 'secondary'}
                        onClick={() => setShowFilters(!showFilters)}
                        className="relative"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Select
                                    label="City"
                                    options={citiesData?.cities.map(city => ({ value: city, label: city })) || []}
                                    placeholder="All cities"
                                    value={selectedCity || ''}
                                    onChange={(e) => updateFilter('city', e.target.value || null)}
                                />
                                <Select
                                    label="Degree Type"
                                    options={DEGREE_TYPES}
                                    placeholder="All degrees"
                                    value={selectedDegree || ''}
                                    onChange={(e) => updateFilter('degree_type', e.target.value || null)}
                                />
                                <div className="flex items-end md:col-start-4">
                                    <Button variant="ghost" onClick={handleClearFilters} className="w-full">
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {selectedCity && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
                            {selectedCity}
                            <button onClick={() => updateFilter('city', null)}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedDegree && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
                            {selectedDegree}
                            <button onClick={() => updateFilter('degree_type', null)}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {searchParams.get('search') && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
                            Search: {searchParams.get('search')}
                            <button onClick={() => { updateFilter('search', null); setSearchInput(''); }}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Results */}
            {isLoading ? (
                <PageLoader />
            ) : error ? (
                <EmptyState
                    icon={GraduationCap}
                    title="Error loading universities"
                    description="Something went wrong. Please try again."
                    actionLabel="Retry"
                    onAction={() => window.location.reload()}
                />
            ) : data?.universities.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="No universities found"
                    description={hasActiveFilters ? "Try adjusting your search or filters" : "No universities available"}
                    actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
                    onAction={hasActiveFilters ? handleClearFilters : undefined}
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data?.universities.map((university, index) => (
                            <motion.div
                                key={university.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <UniversityCard university={university} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 flex-wrap">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => updateFilter('page', String(page - 1))}
                                disabled={page === 1}
                            >
                                Prev
                            </Button>

                            <div className="flex items-center gap-1">
                                {(() => {
                                    const pages: (number | string)[] = [];
                                    const isMobile = window.innerWidth < 640;
                                    const siblings = isMobile ? 0 : 1;

                                    if (totalPages <= (isMobile ? 5 : 7)) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        pages.push(1);
                                        if (page > 2 + siblings) pages.push('...');

                                        const start = Math.max(2, page - siblings);
                                        const end = Math.min(totalPages - 1, page + siblings);
                                        for (let i = start; i <= end; i++) pages.push(i);

                                        if (page < totalPages - 1 - siblings) pages.push('...');
                                        pages.push(totalPages);
                                    }

                                    return pages.map((p, i) =>
                                        typeof p === 'string' ? (
                                            <span key={`ellipsis-${i}`} className="px-1 sm:px-2 text-surface-400">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => updateFilter('page', String(p))}
                                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm transition-colors ${page === p
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
                                onClick={() => updateFilter('page', String(page + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
