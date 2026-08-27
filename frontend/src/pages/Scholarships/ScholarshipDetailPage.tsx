import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Clock,
    Calendar,
    Users,
    CheckCircle,
    Info,
    ExternalLink,
    ArrowLeft,
    Share2,
    GraduationCap
} from 'lucide-react';
import { scholarshipsApi } from '../../api/scholarships';
import { programsApi } from '../../api/programs';
import { Button, PageLoader, EmptyState } from '../../components/ui';
import { ProgramCard } from '../../components/programs';
import SEO from '../../components/common/SEO';


export default function ScholarshipDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [isCopied, setIsCopied] = useState(false);

    const { data: scholarship, isLoading, error } = useQuery({
        queryKey: ['scholarship', id],
        queryFn: () => scholarshipsApi.getScholarship(Number(id)),
        enabled: !!id && !isNaN(Number(id)),
        retry: 1
    });

    const { data: relatedPrograms } = useQuery({
        queryKey: ['related-programs', scholarship?.title],
        queryFn: async () => {
            try {
                const results = await programsApi.searchSemantic(scholarship!.title, 3);
                if (results && results.length > 0) return results;
            } catch (e) {
                console.error("Semantic search failed", e);
            }
            // Fallback to general programs if semantic backend returns empty
            const fallback = await programsApi.getPrograms({ page_size: 3 });
            return fallback.programs || [];
        },
        enabled: !!scholarship?.title,
    });

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: scholarship?.title,
                    text: `Check out this scholarship: ${scholarship?.title}`,
                    url: window.location.href,
                });
            } catch (err) {
                // Error sharing silently ignored
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                // Error copying silently ignored
            }
        }
    };

    if (isLoading) return <PageLoader />;

    if (error || !scholarship) {
        return (
            <div className="page-container py-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/scholarships')}
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Scholarships
                </Button>
                <EmptyState
                    icon={GraduationCap}
                    title="Scholarship not found"
                    description="The scholarship you're looking for doesn't exist or has been removed."
                    actionLabel="Browse all scholarships"
                    onAction={() => navigate('/scholarships')}
                />
            </div>
        );
    }

    // JSON-LD for Scholarship
    const scholarshipSchema = {
        "@context": "https://schema.org",
        "@type": "Scholarship",
        "name": scholarship.title,
        "description": scholarship.objective || scholarship.title,
        "provider": {
            "@type": "Organization",
            "name": "UniAdvisorAI" // Ideally this would be the actual provider if available
        },
        "url": window.location.href,
        "deadline": scholarship.deadline,
        "educationLevel": scholarship.eligibility,
        "amount": scholarship.value_benefits
    };

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
            "name": "Scholarships",
            "item": "https://www.uniadvisorai.com/scholarships"
        }, {
            "@type": "ListItem",
            "position": 3,
            "name": scholarship.title
        }]
    };

    const combinedSchema = [scholarshipSchema, breadcrumbSchema];

    const canonicalUrl = `${window.location.origin}/scholarships/${id}`;

    return (
        <>
            <SEO
                title={`${scholarship.title} 2026: Eligibility, Deadlines & Application`}
                description={scholarship.objective?.slice(0, 160) || `Apply for ${scholarship.title}. Check eligibility, deadline and benefits.`}
                canonical={canonicalUrl}
                schema={combinedSchema}
            />

            <div className="page-container py-8 max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/scholarships')}
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Scholarships
                </Button>

                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-surface-100 dark:border-surface-700 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-surface-100 dark:border-surface-700">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-4">
                                    {scholarship.title}
                                </h1>
                                <div className="flex flex-wrap gap-4 text-sm text-surface-600 dark:text-surface-400">
                                    {scholarship.duration && (
                                        <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-full">
                                            <Clock className="w-4 h-4 text-surface-400" />
                                            <span>{scholarship.duration}</span>
                                        </div>
                                    )}
                                    {scholarship.deadline && (
                                        <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-full">
                                            <Calendar className="w-4 h-4 text-surface-400" />
                                            <span>Deadline: {scholarship.deadline}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    variant="secondary"
                                    onClick={handleShare}
                                    title="Share scholarship"
                                >
                                    <Share2 className="w-4 h-4 md:mr-2" />
                                    <span className="hidden md:inline">
                                        {isCopied ? 'Copied!' : 'Share'}
                                    </span>
                                </Button>
                                {scholarship.link && (
                                    <a
                                        href={scholarship.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="primary">
                                            <ExternalLink className="w-4 h-4 md:mr-2" />
                                            <span className="hidden md:inline">Apply Now</span>
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {scholarship.value_benefits && (
                                <div className="p-6 rounded-xl bg-success-50/50 dark:bg-success-900/10 border border-success-100 dark:border-success-800/30">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-success-800 dark:text-success-400 mb-3">
                                        <CheckCircle className="w-5 h-5" />
                                        Value & Benefits
                                    </h3>
                                    <p className="text-success-700 dark:text-success-300 whitespace-pre-line leading-relaxed">
                                        {scholarship.value_benefits}
                                    </p>
                                </div>
                            )}

                            {scholarship.eligibility && (
                                <div className="p-6 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-800 dark:text-primary-400 mb-3">
                                        <Users className="w-5 h-5" />
                                        Eligibility
                                    </h3>
                                    <p className="text-primary-700 dark:text-primary-300 whitespace-pre-line leading-relaxed">
                                        {scholarship.eligibility}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Detailed Description */}
                        {scholarship.objective && (
                            <div>
                                <h3 className="flex items-center gap-2 text-xl font-semibold text-surface-900 dark:text-white mb-4">
                                    <Info className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                                    About the Scholarship
                                </h3>
                                <div className="prose prose-surface max-w-none text-surface-600 dark:text-surface-400 whitespace-pre-line">
                                    {scholarship.objective}
                                </div>
                            </div>
                        )}

                        {scholarship.selection_criteria && (
                            <div>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">
                                    Selection Criteria
                                </h3>
                                <p className="text-surface-600 dark:text-surface-400 whitespace-pre-line">
                                    {scholarship.selection_criteria}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Programs Widget */}
                {relatedPrograms && relatedPrograms.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">
                            Related Programs
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                            {relatedPrograms.map((program) => (
                                <ProgramCard key={program.id} program={program} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
