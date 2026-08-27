import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles, RefreshCw, Filter, ChevronDown,
  Loader2, GraduationCap,
  MapPin, Building2
} from 'lucide-react';
import { profileApi } from '../../api/profile';
import { ProgramRecommendation } from '../../types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { MatchScore } from '../../components/programs';
import { getToken } from '../../api/client';

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    degree_type: '',
    teaching_language: '',
    n_results: 10,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Streaming State
  const [streamingRecommendations, setStreamingRecommendations] = useState<ProgramRecommendation[]>([]);
  const [isStreaming, setIsStreaming] = useState(true); // Start true so loader shows immediately
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  const streamAbortController = useRef<AbortController | null>(null);
  const forceRefreshRef = useRef(false);
  const [streamTrigger, setStreamTrigger] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  // Try to load cached data first
  const queryKey = ['recommendations', filters, false];
  const cachedData = queryClient.getQueryData<{ recommendations: ProgramRecommendation[] }>(queryKey);

  useEffect(() => {
    if (cachedData && !forceRefreshRef.current) {
      setStreamingRecommendations(cachedData.recommendations);
      setIsStreaming(false);
      setHasEverLoaded(true);
      return;
    }

    const shouldForce = forceRefreshRef.current;
    forceRefreshRef.current = false;

    const startStream = async () => {
      if (streamAbortController.current) {
        streamAbortController.current.abort();
      }
      streamAbortController.current = new AbortController();

      setIsStreaming(true);
      setStreamingRecommendations([]);

      try {
        const token = getToken();
        const params = new URLSearchParams({
          use_profile: 'true',
          n_results: filters.n_results.toString()
        });
        if (filters.degree_type) params.append('degree_type', filters.degree_type);
        if (filters.teaching_language) params.append('teaching_language', filters.teaching_language);
        if (shouldForce) params.append('force_refresh', 'true');

        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${baseUrl}/recommendations/stream?${params.toString()}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'text/event-stream'
          },
          signal: streamAbortController.current.signal
        });

        if (!response.body) throw new Error('ReadableStream not supported');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let finalArray: ProgramRecommendation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');

            if (!chunk) continue;

            const lines = chunk.split('\n');
            let event = 'message';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event:')) event = line.slice(6).trim();
              else if (line.startsWith('data:')) data = line.slice(5).trim();
            }

            if (event === 'done') {
              queryClient.setQueryData(queryKey, { recommendations: finalArray });
              break;
            } else if (event === 'error') {
              try {
                const rec = JSON.parse(data) as ProgramRecommendation;
                finalArray = [...finalArray, rec].sort((a, b) => b.match_score - a.match_score);
                setStreamingRecommendations(finalArray);
              } catch (e) {
                console.error("Failed to parse error event", e);
              }
            } else {
              try {
                const rec = JSON.parse(data) as ProgramRecommendation;
                finalArray = [...finalArray, rec].sort((a, b) => b.match_score - a.match_score);
                setStreamingRecommendations(finalArray);
              } catch (e) {
                console.error("Failed to parse stream chunk JSON", e, data);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Stream failed:", error);
        }
      } finally {
        setIsStreaming(false);
        setHasEverLoaded(true);
      }
    };

    startStream();

    return () => {
      if (streamAbortController.current) {
        streamAbortController.current.abort();
      }
    };
  }, [filters, streamTrigger, queryClient]);

  const handleRefresh = () => {
    queryClient.removeQueries({ queryKey });
    setStreamingRecommendations([]);
    setIsStreaming(true);
    setHasEverLoaded(false);
    forceRefreshRef.current = true;
    setStreamTrigger(t => t + 1);
  };

  // Determine what to show in the main content area
  const showLoadingBar = isStreaming;
  const showResults = streamingRecommendations.length > 0;
  const showEmptyState = !isStreaming && hasEverLoaded && streamingRecommendations.length === 0;
  const showSkeleton = !isStreaming && !hasEverLoaded && streamingRecommendations.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-surface-900 dark:to-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-surface-800 dark:via-surface-800 dark:to-surface-900 dark:border-b dark:border-surface-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">AI Recommendations</h1>
                <p className="text-primary-100 dark:text-surface-400 text-sm sm:text-base">
                  Personalized program suggestions powered by AI
                </p>
              </div>
            </div>

            {profile && (
              <div className="mt-4 p-4 bg-white/10 dark:bg-surface-700/50 rounded-xl inline-block">
                <p className="text-sm text-primary-100 dark:text-surface-300">
                  Recommendations based on:{' '}
                  <span className="text-white font-medium">
                    {profile.desired_degree || profile.current_degree || 'Your profile'}
                    {profile.field_of_study && ` in ${profile.field_of_study}`}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Filters */}
            <Card className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-surface-300">Filters</span>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-primary-600 text-sm hover:underline flex items-center gap-1"
                  >
                    {showFilters ? 'Hide' : 'Show'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isStreaming}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isStreaming ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid sm:grid-cols-3 gap-4 pt-4 mt-4 border-t">
                      <Select
                        label="Degree Type"
                        value={filters.degree_type}
                        onChange={(e) => setFilters(f => ({ ...f, degree_type: e.target.value }))}
                        options={[
                          { value: '', label: 'All Degrees' },
                          { value: 'Bachelor', label: 'Bachelor' },
                          { value: 'Masters', label: 'Masters' },
                          { value: 'PhD', label: 'PhD' },
                        ]}
                      />
                      <Select
                        label="Teaching Language"
                        value={filters.teaching_language}
                        onChange={(e) => setFilters(f => ({ ...f, teaching_language: e.target.value }))}
                        options={[
                          { value: '', label: 'All Languages' },
                          { value: 'English', label: 'English' },
                          { value: 'German', label: 'German' },
                        ]}
                      />
                      <Select
                        label="Results"
                        value={String(filters.n_results)}
                        onChange={(e) => setFilters(f => ({ ...f, n_results: Number(e.target.value) }))}
                        options={[
                          { value: '5', label: '5 programs' },
                          { value: '10', label: '10 programs' },
                          { value: '20', label: '20 programs' },
                        ]}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Legend for match indicators */}
            {showResults && (
              <div className="flex items-center justify-end gap-4 mb-4 text-xs text-slate-500 dark:text-surface-400">
                <span className="flex items-center gap-1"><span className="text-green-500">●</span> Match</span>
                <span className="flex items-center gap-1"><span className="text-amber-500">●</span> Gap</span>
                <span className="flex items-center gap-1"><span className="text-slate-300">●</span> N/A</span>
              </div>
            )}

            {/* ─── LOADING BAR ─── always visible while streaming ─── */}
            <AnimatePresence>
              {showLoadingBar && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800/40 p-5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {/* Pulsing ring behind icon */}
                        <span className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping" />
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-900 dark:text-primary-200">
                          Fetching best suitable programs for you…
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                          {streamingRecommendations.length > 0
                            ? `Found ${streamingRecommendations.length} program${streamingRecommendations.length !== 1 ? 's' : ''} so far — still searching…`
                            : 'Analyzing your profile and matching programs — results will appear shortly'}
                        </p>
                      </div>

                      <Loader2 className="w-5 h-5 animate-spin text-primary-500 flex-shrink-0" />
                    </div>

                    {/* Progress track */}
                    <div className="mt-4 h-1.5 rounded-full bg-primary-200/60 dark:bg-primary-800/30 overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 20, ease: 'easeOut' }}
                      />
                      {/* Shimmer */}
                      <motion.div
                        className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '400%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── STREAMING SKELETON PLACEHOLDERS ─── */}
            {/* Show gentle skeleton cards while streaming but no results yet */}
            {isStreaming && streamingRecommendations.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={`stream-skel-${i}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-4 animate-pulse">
                        <div className="flex-shrink-0 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30" />
                          <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-primary-100 dark:bg-primary-900/30 rounded w-3/4" />
                          <div className="h-4 bg-primary-50 dark:bg-primary-900/20 rounded w-1/2" />
                          <div className="flex gap-3 pt-1">
                            <div className="h-3 bg-primary-50 dark:bg-primary-900/20 rounded w-16" />
                            <div className="h-3 bg-primary-50 dark:bg-primary-900/20 rounded w-20" />
                            <div className="h-3 bg-primary-50 dark:bg-primary-900/20 rounded w-14" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center">
                          <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ─── RESULTS LIST ─── */}
            {showResults && (
              <div className="space-y-4">
                {streamingRecommendations.map((rec, index) => (
                  <motion.div
                    key={rec.program.id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                  >
                    <RecommendationCard recommendation={rec} rank={index + 1} />
                  </motion.div>
                ))}

                {/* Streaming tail indicator — shows after results while more are loading */}
                {isStreaming && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 py-4 text-sm text-primary-500"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more programs…</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─── EMPTY STATE ─── only after streaming finishes with zero results ─── */}
            {showEmptyState && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Recommendations Yet</h3>
                  <p className="text-slate-600 dark:text-surface-300 mb-4">
                    Complete your profile to get personalized program recommendations.
                  </p>
                  <Link to="/profile"><Button>Complete Profile</Button></Link>
                </Card>
              </motion.div>
            )}

            {/* ─── INITIAL SKELETON ─── before first load ever ─── */}
            {showSkeleton && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-4 animate-pulse">
                        <div className="flex-shrink-0 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-surface-700" />
                          <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-surface-700" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-slate-200 dark:bg-surface-700 rounded w-3/4" />
                          <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded w-1/2" />
                          <div className="flex gap-3 pt-1">
                            <div className="h-3 bg-slate-200 dark:bg-surface-700 rounded w-16" />
                            <div className="h-3 bg-slate-200 dark:bg-surface-700 rounded w-20" />
                            <div className="h-3 bg-slate-200 dark:bg-surface-700 rounded w-14" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center">
                          <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-surface-700" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Recommendation Card Component ───────────────────────────────────────────

function RecommendationCard({ recommendation, rank }: { recommendation: ProgramRecommendation; rank: number }) {
  const { program, match_score, match_reasons, gaps, highlights } = recommendation;
  const [showReasoningModal, setShowReasoningModal] = useState(false);

  const rankColor = rank === 1
    ? 'from-amber-400 to-amber-500'
    : rank === 2
      ? 'from-slate-300 to-slate-400'
      : rank === 3
        ? 'from-orange-400 to-orange-500'
        : 'from-primary-500 to-primary-600';

  return (
    <>
      <Card hover className="relative overflow-hidden group">
        {/* Subtle left accent border */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${match_score >= 80 ? 'from-green-400 to-green-500' :
            match_score >= 60 ? 'from-amber-400 to-amber-500' :
              'from-red-400 to-red-500'
          }`} />

        {/* Rank Badge */}
        <div className={`absolute top-4 left-4 w-8 h-8 rounded-full bg-gradient-to-br ${rankColor} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
          {rank}
        </div>

        <div className="pl-12">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${program.degree_type === 'Masters' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  program.degree_type === 'Bachelor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                  {program.degree_type || program.degree}
                </span>
                {program.teaching_language && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-surface-300">
                    {Array.isArray(program.teaching_language)
                      ? program.teaching_language[0]
                      : program.teaching_language}
                  </span>
                )}
              </div>

              <Link
                to={`/programs/${program.slug}`}
                className="text-xl font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {program.program_name}
              </Link>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600 dark:text-surface-300">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {program.university_name}
                </span>
                {program.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {program.city}
                  </span>
                )}
              </div>

              {highlights && (
                <p className="mt-3 text-sm text-slate-600 dark:text-surface-300 italic leading-relaxed">
                  "{highlights}"
                </p>
              )}
            </div>

            {/* Match Score & Visual Indicators */}
            <div className="flex lg:flex-col items-center gap-4">
              <div className="text-center">
                {/* Clickable Match Score */}
                <button
                  onClick={() => setShowReasoningModal(true)}
                  className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  title="Click to see AI reasoning"
                >
                  <MatchScore score={match_score} size="lg" />
                  <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click for details</p>
                </button>

                {/* Visual match indicators grid */}
                <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
                  <div className="flex items-center gap-1" title="Degree Level">
                    <span className={match_reasons?.some(r => r.toLowerCase().includes('degree') || r.toLowerCase().includes('bachelor') || r.toLowerCase().includes('master')) ? 'text-green-500' : 'text-slate-300 dark:text-surface-600'}>●</span>
                    <span className="text-slate-500 dark:text-surface-400">Degree</span>
                  </div>
                  <div className="flex items-center gap-1" title="Field of Study">
                    <span className={match_reasons?.some(r => r.toLowerCase().includes('field') || r.toLowerCase().includes('background') || r.toLowerCase().includes('related')) ? 'text-green-500' : 'text-slate-300 dark:text-surface-600'}>●</span>
                    <span className="text-slate-500 dark:text-surface-400">Field</span>
                  </div>
                  <div className="flex items-center gap-1" title="Language Requirements">
                    <span className={match_reasons?.some(r => r.toLowerCase().includes('english') || r.toLowerCase().includes('language') || r.toLowerCase().includes('german')) ? 'text-green-500' : gaps?.some(g => g.toLowerCase().includes('language') || g.toLowerCase().includes('german')) ? 'text-amber-500' : 'text-slate-300 dark:text-surface-600'}>●</span>
                    <span className="text-slate-500 dark:text-surface-400">Lang</span>
                  </div>
                  <div className="flex items-center gap-1" title="GPA/Academic">
                    <span className={gaps?.some(g => g.toLowerCase().includes('gpa') || g.toLowerCase().includes('grade') || g.toLowerCase().includes('academic')) ? 'text-amber-500' : match_reasons?.some(r => r.toLowerCase().includes('gpa') || r.toLowerCase().includes('academic')) ? 'text-green-500' : 'text-slate-300 dark:text-surface-600'}>●</span>
                    <span className="text-slate-500 dark:text-surface-400">GPA</span>
                  </div>
                </div>
              </div>

              <div className="flex lg:flex-col gap-2">
                <Link to={`/programs/${program.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Reasoning Modal */}
      <AnimatePresence>
        {showReasoningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowReasoningModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Match Analysis</h3>
                  </div>
                  <button
                    onClick={() => setShowReasoningModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-surface-300 hover:bg-slate-200 dark:hover:bg-surface-600 transition-colors text-lg"
                  >
                    ×
                  </button>
                </div>

                {/* Program Name */}
                <p className="text-sm text-slate-600 dark:text-surface-300 mb-4">
                  Analysis for <span className="font-medium text-slate-900 dark:text-white">{program.program_name}</span>
                </p>

                {/* Match Score Display */}
                <div className="flex justify-center mb-6">
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${match_score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/20' :
                      match_score >= 60 ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20' :
                        'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/20'
                      }`}>
                      {match_score}%
                    </div>
                    <p className="text-sm text-slate-500 dark:text-surface-400 mt-2">
                      {match_score >= 80 ? 'Strong Match' : match_score >= 60 ? 'Moderate Match' : 'Stretch Target'}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                {match_reasons && match_reasons.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xs">✓</span>
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {match_reasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-slate-600 dark:text-surface-300 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border-l-4 border-green-500">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns/Gaps */}
                {gaps && gaps.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs">!</span>
                      Areas to Consider
                    </h4>
                    <ul className="space-y-2">
                      {gaps.map((gap, idx) => (
                        <li key={idx} className="text-sm text-slate-600 dark:text-surface-300 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border-l-4 border-amber-500">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Recommendation */}
                {highlights && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-primary-700 dark:text-primary-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Recommendation
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-surface-300 bg-primary-50 dark:bg-primary-900/10 p-3 rounded-lg border-l-4 border-primary-500 italic">
                      "{highlights}"
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-surface-700 text-center">
                  <p className="text-xs text-slate-400 dark:text-surface-500">
                    This analysis is powered by AI and considers your profile, program requirements, and fit.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}