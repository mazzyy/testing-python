import { useState, useEffect, useCallback } from 'react';
import novaToast from '../../components/nova/NovaToast';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Loader2, Sparkles, BookOpen, GraduationCap, Target, Award, Copy, Check, School, ArrowRight, ArrowLeft, Download, FileText, HelpCircle, PenTool, CheckCircle2, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import SEO from '../../components/common/SEO';

import axios from 'axios';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { vaultApi } from '../../api/vault';
import { DocumentCategory } from '../../types/vault';
import clsx from 'clsx';

// Simple debounce implementation if lodash not available
function simpleDebounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

interface Program {
    program_id: string;
    program_name: string;
    university_name: string;
    degree: string;
}

interface UniversityOption {
    value: string;
    label: string;
    program_count?: number;
}

const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "UniAdvisorAI SOP Generator",
    "url": "https://www.uniadvisorai.com/tools/sop-generator",
    "description": "Free AI-powered Statement of Purpose generator tailored for German university applications. Generates personalized, human-like SOPs in 60 seconds.",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "author": {
        "@type": "Organization",
        "name": "UniAdvisorAI",
        "url": "https://www.uniadvisorai.com"
    }
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "How does the AI SOP Generator work?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our AI analyzes your profile, academic background, and the specific requirements of your target German university program to generate a highly personalized Statement of Purpose. You fill in a short form with your details, select your target university and program, and the AI creates a structured, human-like SOP in under 60 seconds."
            }
        },
        {
            "@type": "Question",
            "name": "Is this SOP generator free?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, the UniAdvisorAI SOP Generator is completely free to use for international students applying to German universities. There is no sign-up required for basic usage, and you can generate unlimited SOPs."
            }
        },
        {
            "@type": "Question",
            "name": "Can I use this for scholarship applications?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely. The generated SOP follows structured formatting (Introduction, Academic Background, Motivation, Career Goals) which aligns perfectly with DAAD, Erasmus+, Deutschlandstipendium, and other German scholarship requirements."
            }
        },
        {
            "@type": "Question",
            "name": "What is the difference between a Statement of Purpose and a Motivation Letter?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "In the context of German university applications, SOP (Statement of Purpose) and Motivation Letter are often used interchangeably. Both explain why you chose the program, your academic background, and career goals. German universities typically call it a 'Motivationsschreiben'. Our generator creates content suitable for both formats."
            }
        },
        {
            "@type": "Question",
            "name": "How long should my SOP be for a German university?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most German universities expect an SOP between 500-1000 words (1-2 pages). Our generator lets you set a target word count (default 750 words) and tailors the output accordingly. Always check your specific university's requirements, as some programs specify exact page limits."
            }
        },
        {
            "@type": "Question",
            "name": "Will universities detect that my SOP was written by AI?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our AI generates unique, personalized content based on your specific details — not generic templates. The output is designed to sound natural and human-written. We recommend reviewing and personalizing the generated SOP with your own voice and specific anecdotes before submitting."
            }
        },
        {
            "@type": "Question",
            "name": "Can I edit the generated SOP after creation?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. After generation, you can copy the full text, download it as PDF or DOCX, and edit it freely. We strongly recommend personalizing the SOP with specific experiences and details that only you can provide. You can also save drafts to your account for later editing."
            }
        }
    ]
};

const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [schema, faqSchema]
};

export default function SOPGeneratorPage() {

    // State
    const [step, setStep] = useState<1 | 2>(1);
    const [universities, setUniversities] = useState<UniversityOption[]>([]);
    const [isSearchingUni, setIsSearchingUni] = useState(false);
    const [selectedUniversity, setSelectedUniversity] = useState('');

    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSOP, setGeneratedSOP] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const [templateType, setTemplateType] = useState('course');
    const [targetWordCount, setTargetWordCount] = useState(750);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

    const [userProfile, setUserProfile] = useState<any>(null);


    const hasAcademicInfo = userProfile?.current_degree && userProfile?.field_of_study && userProfile?.university;
    const hasGoalsInfo = userProfile?.desired_degree && userProfile?.desired_fields && userProfile?.desired_fields?.length > 0;
    const hasAchievementsInfo = userProfile?.work_experience || userProfile?.research_experience || userProfile?.honors_awards;

    const { token } = useAuthStore();

    useEffect(() => {
        if (token) {
            const fetchProfile = async () => {
                try {
                    const profile = await import('../../api/profile').then(m => m.profileApi.getProfile());
                    setUserProfile(profile);
                } catch (error) {
                    console.error('Failed to fetch profile', error);
                }
            };
            fetchProfile();
        }
    }, [token]);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const returnToAppId = searchParams.get('returnTo');
    const paramUniversity = searchParams.get('university');
    const paramProgramId = searchParams.get('programId');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            program_id: '',
            why_this_program: '',
            academic_background: '',
            future_goals: '',
            key_achievements: ''
        }
    });

    const selectedProgramId = watch('program_id');
    const selectedProgram = programs.find(p => p.program_id === selectedProgramId);

    useEffect(() => {
        if (paramUniversity && !selectedUniversity) {
            setUniversities([{ value: paramUniversity, label: paramUniversity }]);
            setSelectedUniversity(paramUniversity);
        }
    }, [paramUniversity, selectedUniversity]);

    useEffect(() => {
        if (paramProgramId && programs.length > 0) {
            const prog = programs.find(p => p.program_id === paramProgramId);
            if (prog) {
                setValue('program_id', paramProgramId);
            }
        }
    }, [paramProgramId, programs, setValue]);

    useEffect(() => {
        if (selectedUniversity) {
            const fetchPrograms = async () => {
                setIsLoadingPrograms(true);
                try {
                    const encodedName = encodeURIComponent(selectedUniversity);
                    const response = await api.get(`/programs/universities/${encodedName}/programs`, {
                        params: { page_size: 1000 }
                    });
                    setPrograms(response.data.programs || []);
                } catch (error) {
                    console.error('Failed to fetch programs', error);
                } finally {
                    setIsLoadingPrograms(false);
                }
            };
            fetchPrograms();
        } else {
            setPrograms([]);
        }
    }, [selectedUniversity]);

    const onSubmit = async (data: any) => {
        if (!token) {
            navigate('/login', { state: { from: location } });
            return;
        }
        setIsGenerating(true);
        setGeneratedSOP('');

        const requestData = {
            ...data,
            template_type: templateType,
            target_word_count: targetWordCount,
            save_draft: true
        };

        try {
            const response = await api.post('/sop/generate', requestData);
            setGeneratedSOP(response.data.sop_content);
            setStep(2);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to generate SOP', error);
            if (axios.isAxiosError(error) && error.response) {
                novaToast.error(`Error: ${error.response.data.detail}`);
            } else {
                novaToast.error('Failed to generate SOP. Please try again.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchDrafts = async () => {
        if (!token) return;
        setIsLoadingDrafts(true);
        try {
            const response = await api.get('/sop/drafts', {
                params: { program_id: selectedProgramId }
            });
            setDrafts(response.data.drafts || []);
        } catch (error) {
            console.error('Failed to fetch drafts', error);
        } finally {
            setIsLoadingDrafts(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchDrafts();
        }
    }, [token, selectedProgramId]);

    const handleRestoreDraft = (draft: any) => {
        setGeneratedSOP(draft.content);
        setValue('why_this_program', draft.generation_params?.why_this_program || '');
        setValue('academic_background', draft.generation_params?.academic_background || '');
        setValue('future_goals', draft.generation_params?.future_goals || '');
        setValue('key_achievements', draft.generation_params?.key_achievements || '');
        if (draft.template_type) setTemplateType(draft.template_type);
        if (draft.target_word_count) setTargetWordCount(draft.target_word_count);
        setShowHistory(false);
    };

    const handleDeleteDraft = async (draftId: number) => {
        if (!confirm('Are you sure you want to delete this draft?')) return;
        try {
            await api.delete(`/sop/drafts/${draftId}`);
            setDrafts(drafts.filter(d => d.id !== draftId));
        } catch (error) {
            console.error('Failed to delete draft', error);
        }
    };

    const handleToggleFavorite = async (draftId: number) => {
        try {
            const response = await api.put(`/sop/drafts/${draftId}/favorite`, {});
            setDrafts(drafts.map(d => d.id === draftId ? response.data : d));
        } catch (error) {
            console.error('Failed to update favorite', error);
        }
    };

    const fetchUniversities = async (query: string) => {
        if (!query) return;
        setIsSearchingUni(true);
        try {
            const response = await api.get(`/programs/universities`, {
                params: { search: query, limit: 10 }
            });
            const options = response.data.universities.map((uni: any) => ({
                value: uni.name,
                label: uni.name,
                program_count: uni.program_count
            }));
            setUniversities(options);
        } catch (error) {
            console.error('Failed to fetch universities', error);
        } finally {
            setIsSearchingUni(false);
        }
    };

    const debouncedFetchUniversities = useCallback(simpleDebounce(fetchUniversities, 500), []);

    const copyToClipboard = async () => {
        if (!generatedSOP) return;
        try {
            await navigator.clipboard.writeText(generatedSOP);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const generateSOPPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;
        const lineHeight = 7;
        const headingLineHeight = 10;
        const titleFontSize = 18;
        const headingFontSize = 14;
        const bodyFontSize = 12;

        let cursorY = margin;

        // Title
        doc.setFontSize(titleFontSize);
        doc.setFont("helvetica", "bold");
        doc.text('Statement of Purpose', pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 20;

        // Process content line by line to handle formatting
        const lines = (generatedSOP || '').split('\n');

        lines.forEach((line) => {
            const cleanLine = line.trim();
            if (!cleanLine) {
                cursorY += lineHeight; // Empty line spacing
                return;
            }

            // Check if it's a heading
            if (cleanLine.startsWith('## ')) {
                // Add spacing before heading if not at top
                if (cursorY > margin) cursorY += 5;

                // Check page break for heading
                if (cursorY + headingLineHeight > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }

                doc.setFontSize(headingFontSize);
                doc.setFont("helvetica", "bold");
                const headingText = cleanLine.replace(/^##\s+/, '');
                doc.text(headingText, margin, cursorY);
                cursorY += headingLineHeight;
            } else {
                // Body text
                doc.setFontSize(bodyFontSize);
                doc.setFont("helvetica", "normal");

                const splitText = doc.splitTextToSize(cleanLine, maxLineWidth);

                splitText.forEach((splitLine: string) => {
                    if (cursorY + lineHeight > pageHeight - margin) {
                        doc.addPage();
                        cursorY = margin;
                    }
                    doc.text(splitLine, margin, cursorY);
                    cursorY += lineHeight;
                });

                // Add paragraph spacing
                cursorY += 2;
            }
        });

        return doc;
    };

    const handleDownloadPDF = () => {
        if (!generatedSOP) return;

        try {
            const doc = generateSOPPDF();
            // Force download instead of opening in browser
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SOP_${selectedUniversity || 'UniAdvisorAI'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to generate PDF', error);
            novaToast.error('PDF generation failed. Try again?');
        }
    };

    const handleDownloadWord = async () => {
        if (!generatedSOP) return;
        const paragraphs = generatedSOP.split('\n').map(line => {
            if (line.startsWith('## ')) {
                return new Paragraph({
                    text: line.replace('## ', ''),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                });
            }
            return new Paragraph({
                children: [new TextRun(line)],
                spacing: { before: 200, after: 200 },
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Statement of Purpose",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    ...paragraphs
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "SOP_UniAdvisorAI.docx");
    };

    const handleSaveToVault = async () => {
        if (!generatedSOP || !token) return;

        try {
            // Generate PDF blob
            const doc = generateSOPPDF();
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], `SOP_${selectedUniversity || 'Generated'}.pdf`, { type: 'application/pdf' });

            // Upload to Vault
            await vaultApi.uploadDocument(
                file,
                DocumentCategory.SOP,
                `SOP for ${selectedUniversity} - ${selectedProgram?.program_name || 'Program'}`
            );

            novaToast.success('SOP saved to your Vault!');
        } catch (error) {
            console.error('Failed to save to Vault', error);
            novaToast.error('Failed to save to Vault. Please try again.');
        }
    };

    return (
        <>
            <SEO
                title="Free AI SOP Generator 2025 — Statement of Purpose for German Universities | UniAdvisorAI"
                description="Generate a professional, human-like Statement of Purpose in 60 seconds. Tailored for TU9, TU Munich, RWTH Aachen & 400+ German universities — free, no sign-up required."
                keywords={['SOP generator', 'statement of purpose Germany', 'SOP for German university', 'scholarship SOP', 'statement of purpose AI', 'university application essay', 'motivation letter generator', 'motivationsschreiben generator']}
                schema={combinedSchema}
                canonical="https://www.uniadvisorai.com/tools/sop-generator"
            />

            <div className="min-h-screen bg-[#f8fafc] dark:bg-surface-900">
                <div className="max-w-6xl mx-auto px-4 py-8">

                    {/* Back Button */}
                    {returnToAppId && (
                        <div className="mb-6">
                            <button
                                onClick={() => navigate(`/applications/${returnToAppId}`)}
                                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Application
                            </button>
                        </div>
                    )}

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-10">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                step === 1
                                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"
                                    : "bg-violet-100 text-violet-600"
                            )}>
                                <PenTool className="w-5 h-5" />
                            </div>
                            <span className={clsx(
                                "font-medium transition-colors",
                                step === 1 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                            )}>
                                Configure & Generate
                            </span>
                        </div>

                        <div className="w-24 h-[2px] bg-gray-200 rounded-full">
                            <div className={clsx(
                                "h-full bg-violet-500 rounded-full transition-all duration-500",
                                step === 2 ? "w-full" : "w-0"
                            )} />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                step === 2
                                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"
                                    : "bg-gray-100 text-gray-400"
                            )}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className={clsx(
                                "font-medium transition-colors",
                                step === 2 ? "text-gray-900 dark:text-white" : "text-gray-400"
                            )}>
                                Export
                            </span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6 items-start">

                        {/* Left Column: Form */}
                        <div className="lg:col-span-5 xl:col-span-4 space-y-6">

                            {/* Target Program Card */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                    <School className="w-5 h-5 text-violet-600" />
                                    Target Program
                                </h3>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            University
                                        </label>
                                        <SearchableSelect
                                            placeholder="e.g., Technical University of Munich"
                                            value={selectedUniversity}
                                            onChange={(val) => {
                                                setSelectedUniversity(val);
                                                setValue('program_id', '');
                                            }}
                                            onSearch={debouncedFetchUniversities}
                                            options={universities}
                                            isLoading={isSearchingUni}
                                        />
                                        <p className="text-xs text-gray-400 mt-1.5">Required - select your target university</p>
                                    </div>

                                    <div className={clsx(
                                        "transition-all duration-300",
                                        selectedUniversity ? "opacity-100" : "opacity-50 pointer-events-none"
                                    )}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Program
                                        </label>
                                        <SearchableSelect
                                            placeholder={isLoadingPrograms ? "Loading programs..." : "e.g., M.Sc. Computer Science"}
                                            value={selectedProgramId}
                                            onChange={(val) => setValue('program_id', val)}
                                            options={programs.map(p => ({
                                                value: p.program_id,
                                                label: p.program_name,
                                                subLabel: p.degree
                                            }))}
                                            disabled={!selectedUniversity}
                                            isLoading={isLoadingPrograms}
                                            error={errors.program_id?.message as string}
                                        />
                                        <p className="text-xs text-gray-400 mt-1.5">Required - helps tailor your SOP</p>
                                    </div>
                                </div>
                            </div>

                            {/* Your Story Card */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-violet-600" />
                                    Your Story
                                </h3>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    {/* Motivation */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Motivation <span className="text-violet-500">*</span>
                                        </label>
                                        <textarea
                                            {...register('why_this_program', { required: 'Please tell us why you chose this program' })}
                                            rows={3}
                                            placeholder="Why this specific program? What matches your interests?"
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm placeholder:text-gray-400 transition-all bg-white dark:bg-surface-900 text-slate-900 dark:text-white"
                                        />
                                        {errors.why_this_program && <p className="text-red-500 text-xs mt-1">{errors.why_this_program.message as string}</p>}
                                    </div>

                                    {/* Academic Background */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Academic Background
                                            {hasAcademicInfo ?
                                                <span className="text-gray-400 font-normal ml-1">(Optional)</span> :
                                                <span className="text-violet-500 ml-1">*</span>
                                            }
                                        </label>
                                        <textarea
                                            {...register('academic_background', { required: hasAcademicInfo ? false : 'Please summarize your academic background' })}
                                            rows={3}
                                            placeholder={hasAcademicInfo ? "Using your profile data (Degree, Major, CGPA...)" : "Your previous degree, major subjects, thesis topic..."}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm placeholder:text-gray-400 transition-all bg-white dark:bg-surface-900 text-slate-900 dark:text-white"
                                        />
                                        {hasAcademicInfo && <p className="text-xs text-gray-400 mt-1.5">Using your profile data</p>}
                                        {errors.academic_background && <p className="text-red-500 text-xs mt-1">{errors.academic_background.message as string}</p>}
                                    </div>

                                    {/* Future Goals */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Future Goals
                                            {hasGoalsInfo ?
                                                <span className="text-gray-400 font-normal ml-1">(Optional)</span> :
                                                <span className="text-violet-500 ml-1">*</span>
                                            }
                                        </label>
                                        <textarea
                                            {...register('future_goals', { required: hasGoalsInfo ? false : 'Please share your future career goals' })}
                                            rows={2}
                                            placeholder={hasGoalsInfo ? "Using your profile data (Desired Degree, Fields...)" : "Where do you see yourself in 5 years?"}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm placeholder:text-gray-400 transition-all bg-white dark:bg-surface-900 text-slate-900 dark:text-white"
                                        />
                                        {hasGoalsInfo && <p className="text-xs text-gray-400 mt-1.5">Using your profile data</p>}
                                        {errors.future_goals && <p className="text-red-500 text-xs mt-1">{errors.future_goals.message as string}</p>}
                                    </div>

                                    {/* Key Achievements */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Key Achievements
                                            {hasAchievementsInfo ?
                                                <span className="text-gray-400 font-normal ml-1">(Optional)</span> :
                                                <span className="text-violet-500 ml-1">*</span>
                                            }
                                        </label>
                                        <textarea
                                            {...register('key_achievements', { required: hasAchievementsInfo ? false : 'Please mention key achievements' })}
                                            rows={2}
                                            placeholder={hasAchievementsInfo ? "Using your profile data (Work Exp, Awards...)" : "Research papers, internships, awards..."}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm placeholder:text-gray-400 transition-all bg-white dark:bg-surface-900 text-slate-900 dark:text-white"
                                        />
                                        {hasAchievementsInfo && <p className="text-xs text-gray-400 mt-1.5">Using your profile data</p>}
                                        {errors.key_achievements && <p className="text-red-500 text-xs mt-1">{errors.key_achievements.message as string}</p>}
                                    </div>

                                    {/* Template Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Choose SOP Template</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'course', label: 'Career', description: 'Industry-focused goals', icon: Target },
                                                { id: 'research', label: 'Research', description: 'Academic pursuits', icon: BookOpen },
                                                { id: 'daad', label: 'Scholarship', description: 'Scholarship format', icon: Award },
                                            ].map((template) => (
                                                <button
                                                    key={template.id}
                                                    type="button"
                                                    onClick={() => setTemplateType(template.id)}
                                                    className={clsx(
                                                        "relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                                                        templateType === template.id
                                                            ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-800"
                                                    )}
                                                >
                                                    {templateType === template.id && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle2 className="w-5 h-5 text-violet-600 fill-violet-100" />
                                                        </div>
                                                    )}
                                                    <div className={clsx(
                                                        "w-9 h-9 rounded-lg flex items-center justify-center mb-2",
                                                        templateType === template.id ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" : "bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-surface-700"
                                                    )}>
                                                        <template.icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={clsx(
                                                        "text-sm font-semibold",
                                                        templateType === template.id ? "text-violet-900 dark:text-violet-300" : "text-gray-900 dark:text-white"
                                                    )}>
                                                        {template.label}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Word Count Slider */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Word Count</label>
                                            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg">
                                                {targetWordCount} words
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="400"
                                            max="1200"
                                            step="50"
                                            value={targetWordCount}
                                            onChange={(e) => setTargetWordCount(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                                            <span>Brief (400)</span>
                                            <span>Standard (750)</span>
                                            <span>Detailed (1200)</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full py-3.5 text-base font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all"
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                    Crafting your SOP...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5 mr-2" />
                                                    Generate SOP
                                                </>
                                            )}
                                        </Button>

                                        {token && generatedSOP && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleSaveToVault}
                                                className="w-full mt-3 py-3 text-base font-semibold border-2 border-violet-100 bg-violet-50/50 text-violet-700 hover:bg-violet-100 hover:border-violet-200 transition-all"
                                            >
                                                <Save className="w-5 h-5 mr-2" />
                                                Save to Vault
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Right Column: Output */}
                        <div className="lg:col-span-7 xl:col-span-8">
                            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-full min-h-[600px] flex flex-col relative overflow-hidden">

                                {/* Draft History Toggle */}
                                <div className={clsx(
                                    "absolute top-20 z-20 transition-all duration-300",
                                    showHistory ? "right-80" : "right-0"
                                )}>
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="bg-white dark:bg-surface-800 text-gray-600 dark:text-gray-400 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-lg p-2 shadow-sm dark:shadow-surface-900/50 hover:text-violet-600 transition-colors"
                                        title="View Draft History"
                                    >
                                        <div className="flex items-center gap-2 writing-mode-vertical text-xs font-medium">
                                            <FileText className="w-4 h-4" />
                                            <span>History</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Draft History Panel */}
                                <div className={clsx(
                                    "absolute inset-y-0 right-0 w-80 bg-white dark:bg-surface-800 border-l border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-300 z-30 flex flex-col rounded-r-2xl",
                                    showHistory ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                                )}>
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-surface-900 rounded-tr-2xl">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-violet-500" />
                                            Draft History
                                        </h3>
                                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex-1 p-4 space-y-3">
                                        {isLoadingDrafts ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                <p className="text-sm">Loading drafts...</p>
                                            </div>
                                        ) : drafts.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                    <FileText className="w-6 h-6 text-gray-300" />
                                                </div>
                                                <p className="text-sm">No drafts yet.</p>
                                                <p className="text-xs mt-1">Generate an SOP to save a draft.</p>
                                            </div>
                                        ) : (
                                            drafts.map((draft) => (
                                                <div key={draft.id} className={clsx(
                                                    "p-3 rounded-xl border transition-all hover:shadow-sm dark:shadow-surface-900/50 cursor-pointer group",
                                                    draft.is_favorite ? "border-amber-200 bg-amber-50/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-800 hover:border-violet-200"
                                                )}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div onClick={() => handleRestoreDraft(draft)} className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">v{draft.version}</span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 capitalize">
                                                                    {draft.template_type}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-40">
                                                                {new Date(draft.created_at).toLocaleDateString()} • {draft.word_count} words
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(draft.id); }}
                                                                className={clsx("p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors", draft.is_favorite ? "text-amber-400" : "text-gray-300 group-hover:text-gray-400")}
                                                                title="Favorite"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteDraft(draft.id); }}
                                                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                title="Delete"
                                                            >
                                                                <div className="w-3.5 h-3.5 flex items-center justify-center font-bold">×</div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRestoreDraft(draft)}
                                                        className="w-full text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 py-1.5 rounded-lg transition-colors text-left pl-2 flex items-center gap-1"
                                                    >
                                                        <ArrowLeft className="w-3 h-3" />
                                                        Load this version
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {!generatedSOP ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-surface-900/50 rounded-2xl">
                                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-surface-800 shadow-xl shadow-violet-500/10 mb-6 flex items-center justify-center">
                                            <BookOpen className="w-10 h-10 text-violet-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Write</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                            Fill in your details on the left. We'll combine your story with the program's requirements to create a powerful Statement of Purpose.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-white dark:bg-surface-800 sticky top-0 z-10 flex items-center justify-between rounded-t-2xl">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Generated SOP</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        ~{generatedSOP.split(/\s+/).length} words
                                                    </p>
                                                    <span className="text-gray-300 text-[10px]">•</span>
                                                    <span className="text-xs text-violet-600 font-medium capitalize flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        {templateType} Template
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" className="text-gray-600 dark:text-gray-400" onClick={() => setGeneratedSOP('')}>
                                                    Clear
                                                </Button>

                                                <div className="h-4 w-px bg-gray-200 mx-1 self-center" />

                                                <Button size="sm" variant="secondary" onClick={handleDownloadPDF} title="Download PDF">
                                                    <FileText className="w-4 h-4 mr-1.5" />
                                                    PDF
                                                </Button>

                                                {token && (
                                                    <Button size="sm" variant="secondary" onClick={handleSaveToVault} title="Save to Vault">
                                                        <Save className="w-4 h-4 mr-1.5" />
                                                        Save to Vault
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="secondary" onClick={handleDownloadWord} title="Download Word">
                                                    <Download className="w-4 h-4 mr-1.5" />
                                                    DOCX
                                                </Button>
                                                <Button size="sm" onClick={copyToClipboard} className={isCopied ? "bg-green-600 hover:bg-green-700" : "bg-violet-600 hover:bg-violet-700"}>
                                                    {isCopied ? (
                                                        <>
                                                            <Check className="w-4 h-4 mr-1.5" />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4 mr-1.5" />
                                                            Copy Text
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-8">
                                            <div className="prose prose-violet max-w-none text-gray-800 dark:text-gray-100 leading-7">
                                                {selectedProgram && (
                                                    <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-4 text-center">
                                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProgram.university_name}</h2>
                                                        <h3 className="text-xl text-gray-600 dark:text-gray-400">{selectedProgram.program_name}</h3>
                                                    </div>
                                                )}

                                                {generatedSOP.split('\n').map((paragraph, i) => {
                                                    if (paragraph.trim().startsWith('## ')) {
                                                        return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">{paragraph.replace('## ', '')}</h3>;
                                                    }
                                                    return paragraph.trim() && <p key={i} className="mb-4">{paragraph}</p>;
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-20 max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
                            <p className="text-gray-600 dark:text-gray-400">Common questions about writing a Statement of Purpose for Germany</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-violet-500" />
                                    How long should my SOP be?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Ideally between 500-800 words (1-2 pages). Our generator produces a concise ~750 word essay that fits perfectly within standard limits.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-violet-500" />
                                    Can I edit the generated SOP?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Yes! You can copy the text or download the Word document to make final tweaks. We recommend adding specific details about your projects.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-violet-500" />
                                    Is this suitable for scholarship applications?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Yes, the strict structure (headings, clear motivation) is designed to meet German academic standards, including those for Scholarships.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-violet-500" />
                                    How detailed should I be?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Be specific! Mentioning particular modules or professors at the target university (which our tool helps with) significantly boosts your chances.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}