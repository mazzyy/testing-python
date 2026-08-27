import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { programsApi } from '../../api';
import type { ProgramFilters } from '../../types';
import { Button, Input, Select, Card, PageLoader, EmptyState } from '../../components/ui';
import { ProgramCard } from '../../components/programs';
import SEO from '../../components/common/SEO';

const DEGREE_TYPES = [
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Masters', label: 'Masters' },
  { value: 'PhD', label: 'PhD' },
];

const TEACHING_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'German', label: 'German' },
];

export default function ProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const filters: ProgramFilters = {
    page: parseInt(searchParams.get('page') || '1'),
    page_size: 12,
    degree_type: searchParams.get('degree_type') || undefined,
    city: searchParams.get('city') || undefined,
    search: searchParams.get('search') || undefined,
    teaching_language: searchParams.get('teaching_language') || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['programs', filters],
    queryFn: () => programsApi.getPrograms(filters),
  });

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => programsApi.getCities(),
  });

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
    // Only reset to first page when changing filters, not when navigating pages
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const activeFiltersCount = [
    filters.degree_type,
    filters.city,
    filters.teaching_language,
    filters.search,
  ].filter(Boolean).length;

  const totalPages = data ? Math.ceil(data.total / (filters.page_size || 12)) : 0;

  // SEO Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Browse German University Programs",
    "description": "Search and filter thousands of Bachelor, Master, and PhD programs in Germany.",
    "url": window.location.href,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": data?.programs.map((prog, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${window.location.origin}/programs/${prog.id}`,
        "name": prog.program_name
      })) || []
    }
  };

  return (
    <div className="page-container py-8">
      <SEO
        title="Browse 10,000+ German University Programs — Tuition-Free 2025 | CampusConsult"
        description="Search and filter Bachelor's, Master's & PhD programs across 400+ German universities. Find English-taught, tuition-free courses with scholarship opportunities. Updated for 2025 intake."
        keywords={['german university programs', 'english taught masters germany', 'study in germany courses', 'tuition free universities germany']}
        schema={schema}
      />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Browse Programs
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          Explore {data?.total || 0} programs from top German universities
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search programs, universities..."
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

          {/* View Toggle */}
          <div className="hidden md:flex border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:bg-surface-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:bg-surface-800'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
                  label="Degree Type"
                  options={DEGREE_TYPES}
                  placeholder="All degrees"
                  value={filters.degree_type || ''}
                  onChange={(e) => updateFilter('degree_type', e.target.value || null)}
                />
                <Select
                  label="City"
                  options={citiesData?.cities.map(city => ({ value: city, label: city })) || []}
                  placeholder="All cities"
                  value={filters.city || ''}
                  onChange={(e) => updateFilter('city', e.target.value || null)}
                />
                <Select
                  label="Teaching Language"
                  options={TEACHING_LANGUAGES}
                  placeholder="All languages"
                  value={filters.teaching_language || ''}
                  onChange={(e) => updateFilter('teaching_language', e.target.value || null)}
                />
                <div className="flex items-end">
                  <Button variant="ghost" onClick={clearAllFilters} className="w-full">
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
          {filters.degree_type && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
              {filters.degree_type}
              <button onClick={() => updateFilter('degree_type', null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.city && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
              {filters.city}
              <button onClick={() => updateFilter('city', null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.teaching_language && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
              {filters.teaching_language}
              <button onClick={() => updateFilter('teaching_language', null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
              Search: {filters.search}
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
          icon={Search}
          title="Error loading programs"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      ) : data?.programs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No programs found"
          description="Try adjusting your filters or search terms"
          actionLabel="Clear Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <>
          {/* Programs Grid/List */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'
              : 'space-y-4'
          }>
            {data?.programs.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={viewMode === 'grid' ? 'h-full flex flex-col' : ''}
              >
                <ProgramCard program={program} compact={viewMode === 'list'} />
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
    </div>
  );
}
