import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import SEO from '../../components/common/SEO';
import {
    FileText, RefreshCw, Edit3, Eye,
    Plus, Trash2, ChevronDown, AlertCircle,
    FileType, File as FileIcon, Upload, CheckCircle, AlertTriangle,
    Lightbulb, MessageSquare, Target, XCircle, X,
    HelpCircle, Linkedin, Github, Sparkles, ArrowLeft,
    ArrowRight, GraduationCap, Briefcase, Award as AwardIcon, Save,
    Type, Palette, Move, Layout, Maximize2, Minimize2, GripVertical,
    Settings2, PlusCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { vaultApi } from '../../api/vault';
import { DocumentCategory } from '../../types/vault';

// =============================================================================
// TYPES
// =============================================================================
interface PersonalInfo {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    linkedin: string;
    github: string;
    nationality: string;
    date_of_birth: string;
    place_of_birth: string;
    photo_base64?: string;
}

interface Education {
    degree: string;
    institution: string;
    location: string;
    start_date: string;
    end_date: string;
    thesis_title: string;
    grade: string;
    description: string;
}

interface Experience {
    position: string;
    organization: string;
    location: string;
    start_date: string;
    end_date: string;
    description: string;
}

interface Publication {
    title: string;
    authors: string;
    journal_conference: string;
    year: string;
    doi: string;
}

interface Award {
    title: string;
    issuer: string;
    year: string;
    description: string;
}

interface Language {
    language: string;
    proficiency: string;
}

interface CVFormatSettings {
    font_size: 'small' | 'medium' | 'large';
    font_family: 'serif' | 'sans-serif' | 'modern';
    accent_color: string;
    sidebar_color: string;
    spacing: 'compact' | 'normal' | 'relaxed';
    margins: 'narrow' | 'normal' | 'wide';
}

interface CustomSection {
    title: string;
    content: string;
}

interface CVData {
    personal_info: PersonalInfo;
    profile_summary: string;
    education: Education[];
    research_experience: Experience[];
    work_experience: Experience[];
    publications: Publication[];
    awards: Award[];
    skills: string[];
    languages: Language[];
    certifications: string[];
    references: string;
    template_id?: string;
    format_settings?: CVFormatSettings;
    custom_sections: CustomSection[];
    section_order: string[];
}

interface CVResponse {
    cv_data: CVData;
    formatted_cv: string;
    suggestions?: string[];
}

interface CVStrengthItem {
    section: string;
    point: string;
    explanation: string;
}

interface CVImprovementItem {
    section: string;
    issue: string;
    suggestion: string;
    priority: string;
}

interface CVMissingItem {
    item: string;
    importance: string;
    reason: string;
}

interface CVFeedback {
    overall_score: number;
    alignment_score?: number;
    summary: string;
    strengths: CVStrengthItem[];
    improvements: CVImprovementItem[];
    missing_items: CVMissingItem[];
}

interface CVFeedbackResponse {
    feedback: CVFeedback;
    quick_tips: string[];
}

// =============================================================================
// EMPTY TEMPLATES
// =============================================================================
const emptyPersonalInfo: PersonalInfo = {
    full_name: '', email: '', phone: '', address: '',
    linkedin: '', github: '', nationality: '', date_of_birth: '',
    place_of_birth: '', photo_base64: ''
};

const emptyEducation: Education = {
    degree: '', institution: '', location: '',
    start_date: '', end_date: '', thesis_title: '',
    grade: '', description: ''
};

const emptyExperience: Experience = {
    position: '', organization: '', location: '',
    start_date: '', end_date: '', description: ''
};

const emptyPublication: Publication = {
    title: '', authors: '', journal_conference: '', year: '', doi: ''
};

const emptyAward: Award = {
    title: '', issuer: '', year: '', description: ''
};

const emptyLanguage: Language = {
    language: '', proficiency: ''
};

const DEFAULT_SECTION_ORDER = ['profile', 'education', 'research', 'work', 'publications', 'skills', 'awards', 'certifications', 'references', 'custom'];

const DEFAULT_FORMAT_SETTINGS: CVFormatSettings = {
    font_size: 'medium',
    font_family: 'serif',
    accent_color: '#1a1a1a',
    sidebar_color: '#2c3e50',
    spacing: 'normal',
    margins: 'normal'
};

const emptyCVData: CVData = {
    personal_info: { ...emptyPersonalInfo },
    profile_summary: '',
    education: [],
    research_experience: [],
    work_experience: [],
    publications: [],
    awards: [],
    skills: [],
    languages: [],
    certifications: [],
    references: '',
    template_id: 'academic',
    custom_sections: [],
    section_order: [...DEFAULT_SECTION_ORDER]
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50';
    if (score >= 50) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50';
};

const getScoreGradient = (score: number) => {
    if (score >= 75) return 'from-emerald-500 to-teal-500';
    if (score >= 50) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
};

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'high': return 'bg-rose-100 text-rose-700 border border-rose-200';
        case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
        case 'low': return 'bg-sky-100 text-sky-700 border border-sky-200';
        default: return 'bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-surface-300 border border-slate-200 dark:border-surface-700';
    }
};

const getImportanceColor = (importance: string) => {
    switch (importance.toLowerCase()) {
        case 'required': return 'bg-rose-100 text-rose-700 border border-rose-200';
        case 'recommended': return 'bg-amber-100 text-amber-700 border border-amber-200';
        case 'optional': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        default: return 'bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-surface-300 border border-slate-200 dark:border-surface-700';
    }
};

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

// Progress Steps Component
const ProgressSteps: React.FC<{ currentStep: 'input' | 'edit'; onStepClick?: (step: 'input' | 'edit') => void }> = ({ currentStep, onStepClick }) => {
    const steps = [
        { id: 'input' as const, label: 'Upload & Configure', icon: Upload },
        { id: 'edit' as const, label: 'Edit & Export', icon: Edit3 }
    ];

    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isPast = currentStep === 'edit' && step.id === 'input';
                const isClickable = isPast && onStepClick;

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={`flex items-center ${isClickable ? 'cursor-pointer group' : ''}`}
                            onClick={() => isClickable && onStepClick(step.id)}
                        >
                            <div
                                className={`
                                    flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                                    ${isActive
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                                        : isPast
                                            ? 'bg-emerald-500 text-white group-hover:bg-indigo-500 group-hover:shadow-lg group-hover:shadow-indigo-200'
                                            : 'bg-slate-100 dark:bg-surface-800 text-slate-400'
                                    }
                                `}
                            >
                                {isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={`ml-3 font-medium text-sm hidden sm:block ${isActive ? 'text-slate-900 dark:text-white' : isPast ? 'text-slate-500 dark:text-surface-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'text-slate-500 dark:text-surface-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`w-16 sm:w-24 h-0.5 mx-4 ${isPast ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// Collapsible Section with improved design
const CollapsibleSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: React.ReactNode;
    badge?: number;
}> = ({ title, children, defaultOpen = false, icon, badge }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-slate-200 dark:border-surface-700 rounded-xl mb-4 overflow-hidden bg-white dark:bg-surface-800 shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex justify-between items-center hover:bg-slate-50 dark:bg-surface-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    <span className="font-semibold text-slate-800 dark:text-surface-100">{title}</span>
                    {badge !== undefined && badge > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-surface-700 bg-slate-50/50 dark:bg-surface-900/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Enhanced Input Field
const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    multiline?: boolean;
    rows?: number;
    icon?: React.ReactNode;
    hint?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', multiline = false, rows = 3, icon, hint }) => (
    <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-surface-300 mb-1.5">
            {icon && <span className="text-slate-400">{icon}</span>}
            {label}
        </label>
        {multiline ? (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-4 py-3 border border-slate-200 dark:border-surface-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all resize-none text-sm bg-white dark:bg-surface-800 placeholder:text-slate-400"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 border border-slate-200 dark:border-surface-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all text-sm bg-white dark:bg-surface-800 placeholder:text-slate-400"
            />
        )}
        {hint && <p className="mt-1 text-xs text-slate-500 dark:text-surface-400">{hint}</p>}
    </div>
);

// Card Item Component for array items (Education, Experience, etc.)
const CardItem: React.FC<{
    children: React.ReactNode;
    onRemove: () => void;
    title?: string;
}> = ({ children, onRemove, title }) => (
    <div className="relative bg-white dark:bg-surface-800 border border-slate-200 dark:border-surface-700 rounded-xl p-4 mb-4 shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
        {title && (
            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-3">{title}</div>
        )}
        <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
            aria-label="Remove item"
        >
            <Trash2 className="w-4 h-4" />
        </button>
        {children}
    </div>
);

// Add Button Component
const AddButton: React.FC<{
    onClick: () => void;
    label: string;
}> = ({ onClick, label }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-dashed border-indigo-300 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 w-full justify-center"
    >
        <Plus className="w-4 h-4" />
        {label}
    </button>
);

// =============================================================================
// FEEDBACK PANEL
// =============================================================================
const FeedbackPanel: React.FC<{
    feedback: CVFeedback;
    quickTips: string[];
    onClose: () => void;
}> = ({ feedback, quickTips, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'improvements' | 'missing'>('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', count: null },
        { id: 'strengths', label: 'Strengths', count: feedback.strengths.length },
        { id: 'improvements', label: 'To Improve', count: feedback.improvements.length },
        { id: 'missing', label: 'Missing', count: feedback.missing_items.length }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-slate-200 dark:border-surface-700 overflow-hidden mb-6"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            CV Analysis Report
                        </h3>
                        {feedback.summary && (
                            <p className="text-violet-100 text-sm mt-2 leading-relaxed">{feedback.summary}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Close feedback"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Scores */}
            <div className="p-5 border-b border-slate-100 dark:border-surface-700 bg-gradient-to-b from-slate-50 to-white dark:from-surface-900 dark:to-surface-900">
                <div className="flex gap-4">
                    <div className={`flex-1 p-4 rounded-xl border-2 ${getScoreColor(feedback.overall_score)} relative overflow-hidden`}>
                        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getScoreGradient(feedback.overall_score)}`} />
                        <div className="relative">
                            <div className="text-xs uppercase tracking-wider opacity-75 font-medium">Overall Score</div>
                            <div className="text-3xl font-bold mt-1">{feedback.overall_score}<span className="text-lg opacity-60">/100</span></div>
                        </div>
                    </div>
                    {feedback.alignment_score !== undefined && feedback.alignment_score !== null && (
                        <div className={`flex-1 p-4 rounded-xl border-2 ${getScoreColor(feedback.alignment_score)} relative overflow-hidden`}>
                            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getScoreGradient(feedback.alignment_score)}`} />
                            <div className="relative">
                                <div className="text-xs uppercase tracking-wider opacity-75 font-medium">Program Fit</div>
                                <div className="text-3xl font-bold mt-1">{feedback.alignment_score}<span className="text-lg opacity-60">/100</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${activeTab === tab.id
                            ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-surface-800'
                            : 'text-slate-600 dark:text-surface-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-700 bg-slate-50 dark:bg-surface-800/50'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== null && tab.count > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-surface-700 text-slate-600 dark:text-surface-300'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 max-h-[320px] overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4"
                        >
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center border border-emerald-100 dark:border-emerald-800/50">
                                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{feedback.strengths.length}</div>
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Strengths</div>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center border border-amber-100 dark:border-amber-800/50">
                                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{feedback.improvements.length}</div>
                                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">To Improve</div>
                                </div>
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center border border-rose-100 dark:border-rose-800/50">
                                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{feedback.missing_items.length}</div>
                                    <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Missing</div>
                                </div>
                            </div>

                            {/* Quick Tips */}
                            {quickTips.length > 0 && (
                                <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-sky-100 dark:border-sky-800/50">
                                    <h4 className="font-semibold text-sky-800 dark:text-sky-300 text-sm mb-3 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4" /> Quick Tips
                                    </h4>
                                    <ul className="space-y-2">
                                        {quickTips.map((tip, i) => (
                                            <li key={i} className="text-sm text-sky-700 dark:text-sky-300 flex items-start gap-2">
                                                <span className="text-sky-400 mt-0.5">→</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'strengths' && (
                        <motion.div
                            key="strengths"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-3"
                        >
                            {feedback.strengths.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-surface-400 text-sm">No specific strengths identified yet.</p>
                                </div>
                            ) : (
                                feedback.strengths.map((item, idx) => (
                                    <div key={idx} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-500 font-medium uppercase tracking-wide">{item.section}</div>
                                                <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5">{item.point}</div>
                                                <div className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">{item.explanation}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'improvements' && (
                        <motion.div
                            key="improvements"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-3"
                        >
                            {feedback.improvements.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-600 dark:text-surface-300 font-medium">No issues found!</p>
                                    <p className="text-slate-500 dark:text-surface-400 text-sm mt-1">Your CV looks great.</p>
                                </div>
                            ) : (
                                feedback.improvements.map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-surface-800 border border-slate-200 dark:border-surface-700 rounded-xl p-4 shadow-sm dark:shadow-surface-900/50">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-slate-500 dark:text-surface-400 font-medium">{item.section}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-semibold text-slate-800 dark:text-surface-100">{item.issue}</div>
                                                <div className="text-sm text-slate-600 dark:text-surface-300 mt-2 bg-slate-50 dark:bg-surface-900/50 p-3 rounded-lg border border-slate-100 dark:border-surface-700">
                                                    <span className="font-medium text-indigo-600 dark:text-indigo-400">Suggestion:</span> {item.suggestion}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'missing' && (
                        <motion.div
                            key="missing"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-3"
                        >
                            {feedback.missing_items.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-600 dark:text-surface-300 font-medium">Your CV is complete!</p>
                                    <p className="text-slate-500 dark:text-surface-400 text-sm mt-1">All essential sections are present.</p>
                                </div>
                            ) : (
                                feedback.missing_items.map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-surface-800 border border-slate-200 dark:border-surface-700 rounded-xl p-4 shadow-sm dark:shadow-surface-900/50">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                                <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-surface-100">{item.item}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getImportanceColor(item.importance)}`}>
                                                        {item.importance}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-600 dark:text-surface-300">{item.reason}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// ── Image compression helper ─────────────────────────────────────────────────
const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB (base64-encoded limit)
const compressImage = (file: File): Promise<{ dataUrl: string; compressed: boolean }> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => {
            const originalDataUrl = reader.result as string;

            // If already under limit, return as-is
            if (originalDataUrl.length <= MAX_PHOTO_BYTES) {
                resolve({ dataUrl: originalDataUrl, compressed: false });
                return;
            }

            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Scale down large images – cap at 800×800
                const MAX_DIM = 800;
                let { width, height } = img;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    } else {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                // Iteratively reduce quality until under 3 MB
                let quality = 0.85;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length > MAX_PHOTO_BYTES && quality > 0.2) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                if (dataUrl.length > MAX_PHOTO_BYTES) {
                    reject(new Error('Image is too large even after compression. Please use a smaller photo.'));
                } else {
                    resolve({ dataUrl, compressed: true });
                }
            };
            img.src = originalDataUrl;
        };
        reader.readAsDataURL(file);
    });

// Photo Upload Component
const PhotoUpload: React.FC<{
    photo: string | undefined;
    onChange: (base64: string) => void;
    onRemove: () => void;
}> = ({ photo, onChange, onRemove }) => {
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [wasCompressed, setWasCompressed] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setPhotoError(null);
        setWasCompressed(false);
        try {
            const { dataUrl, compressed } = await compressImage(file);
            setWasCompressed(compressed);
            onChange(dataUrl);
        } catch (err: any) {
            setPhotoError(err?.message || 'Failed to process image. Please try a different photo.');
        }
    }, [onChange]);

    const handleRemove = () => {
        setPhotoError(null);
        setWasCompressed(false);
        onRemove();
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        multiple: false,
        // We handle size ourselves after compression
    });

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-surface-300 mb-2">Profile Photo</label>
            <div className="flex items-start gap-4">
                {photo ? (
                    <div className="relative group">
                        <img
                            src={photo}
                            alt="Profile"
                            className="w-24 h-24 object-cover rounded-full border border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50"
                        />
                        {wasCompressed && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                                Optimized
                            </span>
                        )}
                        <button
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 p-1 bg-white dark:bg-surface-800 rounded-full shadow-md text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-surface-700 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={`
                            w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 dark:border-surface-600 hover:border-indigo-400 hover:bg-slate-50 dark:bg-surface-800/50'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500 dark:text-surface-400 font-medium">Upload</span>
                    </div>
                )}
                <div className="flex-1 text-xs text-slate-500 dark:text-surface-400 pt-1">
                    <p>Recommended: Professional headshot, clear background.</p>
                    <p className="mt-1">Format: JPG, PNG • Auto-optimized if large.</p>
                    {photoError && (
                        <p className="mt-2 text-rose-600 font-medium flex items-center gap-1">
                            <span>⚠</span> {photoError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// CV PREVIEW COMPONENT
// =============================================================================
const formatUrlDisplay = (url: string): string => {
    return url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
};

const ensureProtocol = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

const CVPreview: React.FC<{
    cvData: CVData;
    formatSettings: CVFormatSettings;
    sectionOrder: string[];
    template: CVTemplateType;
}> = ({ cvData, formatSettings, sectionOrder, template }) => {
    const { personal_info: pi } = cvData;
    const hasContent = pi.full_name || cvData.education.length > 0 || cvData.work_experience.length > 0;

    // --- Dynamic styles from formatSettings ---
    const fontFamilyMap: Record<string, string> = {
        'serif': "'Georgia', 'Times New Roman', serif",
        'sans-serif': "system-ui, -apple-system, 'Segoe UI', sans-serif",
        'modern': "'Outfit', 'Inter', system-ui, sans-serif",
    };
    const fontFamily = fontFamilyMap[formatSettings.font_family] || fontFamilyMap['serif'];

    const sizeClasses: Record<string, { name: string; body: string; heading: string; sub: string }> = {
        small: { name: 'text-xl md:text-2xl', body: 'text-xs', heading: 'text-xs', sub: 'text-[11px]' },
        medium: { name: 'text-2xl md:text-3xl', body: 'text-sm', heading: 'text-sm', sub: 'text-xs' },
        large: { name: 'text-3xl md:text-4xl', body: 'text-base', heading: 'text-base', sub: 'text-sm' },
    };
    const sz = sizeClasses[formatSettings.font_size] || sizeClasses['medium'];

    const spacingMap: Record<string, { section: string; item: string; leading: string }> = {
        compact: { section: 'mb-3', item: 'mb-2', leading: 'leading-snug' },
        normal: { section: 'mb-6', item: 'mb-4', leading: 'leading-relaxed' },
        relaxed: { section: 'mb-8', item: 'mb-5', leading: 'leading-loose' },
    };
    const sp = spacingMap[formatSettings.spacing] || spacingMap['normal'];

    const marginMap: Record<string, string> = {
        narrow: 'p-5 md:p-6',
        normal: 'p-8 md:p-10',
        wide: 'p-10 md:p-14',
    };
    const marginClass = marginMap[formatSettings.margins] || marginMap['normal'];

    const accentColor = formatSettings.accent_color || '#1a1a1a';
    const sidebarColor = formatSettings.sidebar_color || '#2c3e50';

    if (!hasContent) {
        return (
            <div className="bg-white dark:bg-surface-800 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-surface-700">
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-surface-300 mb-2">Your CV Preview</h3>
                    <p className="text-slate-500 dark:text-surface-400 text-sm">Start filling in your information to see the preview here.</p>
                </div>
            </div>
        );
    }

    const SectionHeading: React.FC<{ children: React.ReactNode, isSidebar?: boolean }> = ({ children, isSidebar }) => (
        <h2
            className={`${sz.heading} font-bold border-b-2 pb-1 mb-3 uppercase tracking-widest ${isSidebar ? 'text-white border-white/20' : 'text-slate-900 dark:text-white'}`}
            style={!isSidebar ? { borderColor: accentColor, color: accentColor === '#1a1a1a' ? undefined : accentColor } : undefined}
        >
            {children}
        </h2>
    );

    const renderProfile = (isSidebar: boolean = false) => cvData.profile_summary ? (
        <section key="profile" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Profile</SectionHeading>
            <p className={`${sz.body} ${sp.leading} text-justify ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>{cvData.profile_summary}</p>
        </section>
    ) : null;

    const renderEducation = (isSidebar: boolean = false) => cvData.education.length > 0 ? (
        <section key="education" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Education</SectionHeading>
            {cvData.education.map((edu, idx) => (
                <div key={idx} className={`${sp.item} last:mb-0`}>
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <span className={`font-bold ${sz.body} ${isSidebar ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{edu.degree}</span>
                        <span className={`${sz.sub} italic ${isSidebar ? 'text-white/70' : 'text-slate-500 dark:text-surface-400'}`}>{edu.start_date} – {edu.end_date}</span>
                    </div>
                    <div className={`${sz.body} italic ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>{edu.institution}{edu.location && `, ${edu.location}`}</div>
                    {edu.grade && <div className={`${sz.body} mt-0.5 ${isSidebar ? 'text-white/80' : 'text-slate-700 dark:text-surface-300'}`}>Grade: {edu.grade}</div>}
                    {edu.thesis_title && <div className={`${sz.body} mt-1 ${isSidebar ? 'text-white/80' : 'text-slate-700 dark:text-surface-300'}`}>Thesis: <em>"{edu.thesis_title}"</em></div>}
                    {edu.description && <div className={`${sz.body} mt-0.5 whitespace-pre-line ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>{edu.description}</div>}
                </div>
            ))}
        </section>
    ) : null;

    const renderResearch = (isSidebar: boolean = false) => cvData.research_experience.length > 0 ? (
        <section key="research" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Research Experience</SectionHeading>
            {cvData.research_experience.map((exp, idx) => (
                <div key={idx} className={`${sp.item} last:mb-0`}>
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <span className={`font-bold ${sz.body} ${isSidebar ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{exp.position}</span>
                        <span className={`${sz.sub} italic ${isSidebar ? 'text-white/70' : 'text-slate-500 dark:text-surface-400'}`}>{exp.start_date} – {exp.end_date}</span>
                    </div>
                    <div className={`${sz.body} italic ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>{exp.organization}{exp.location && `, ${exp.location}`}</div>
                    {exp.description && <p className={`${sz.body} mt-1.5 text-justify ${sp.leading} ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>{exp.description}</p>}
                </div>
            ))}
        </section>
    ) : null;

    const renderWork = (isSidebar: boolean = false) => cvData.work_experience.length > 0 ? (
        <section key="work" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Work Experience</SectionHeading>
            {cvData.work_experience.map((exp, idx) => (
                <div key={idx} className={`${sp.item} last:mb-0`}>
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <span className={`font-bold ${sz.body} ${isSidebar ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{exp.position}</span>
                        <span className={`${sz.sub} italic ${isSidebar ? 'text-white/70' : 'text-slate-500 dark:text-surface-400'}`}>{exp.start_date} – {exp.end_date}</span>
                    </div>
                    <div className={`${sz.body} italic ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>{exp.organization}{exp.location && `, ${exp.location}`}</div>
                    {exp.description && <p className={`${sz.body} mt-1.5 text-justify ${sp.leading} ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>{exp.description}</p>}
                </div>
            ))}
        </section>
    ) : null;

    const renderPublications = (isSidebar: boolean = false) => cvData.publications.length > 0 ? (
        <section key="publications" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Publications</SectionHeading>
            {cvData.publications.map((pub, idx) => (
                <p key={idx} className={`${sz.body} mb-2 ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>
                    {pub.authors} ({pub.year}). <em>{pub.title}</em>. {pub.journal_conference}.
                    {pub.doi && <span className={isSidebar ? 'text-white/70' : 'text-slate-500 dark:text-surface-400'}> DOI: {pub.doi}</span>}
                </p>
            ))}
        </section>
    ) : null;

    const renderSkills = (isSidebar: boolean = false) => (cvData.skills.length > 0 || cvData.languages.length > 0) ? (
        <section key="skills" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Skills & Languages</SectionHeading>
            {cvData.skills.length > 0 && (
                <p className={`${sz.body} mb-1 ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>
                    <strong>Skills:</strong> {cvData.skills.join(' • ')}
                </p>
            )}
            {cvData.languages.length > 0 && (
                <p className={`${sz.body} ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>
                    <strong>Languages:</strong> {cvData.languages.map(l => `${l.language} (${l.proficiency})`).join(' • ')}
                </p>
            )}
        </section>
    ) : null;

    const renderAwards = (isSidebar: boolean = false) => cvData.awards.length > 0 ? (
        <section key="awards" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Awards & Scholarships</SectionHeading>
            {cvData.awards.map((award, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <span className={`font-bold ${sz.body} ${isSidebar ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{award.title}</span>
                        <span className={`${sz.sub} italic ${isSidebar ? 'text-white/70' : 'text-slate-500 dark:text-surface-400'}`}>{award.year}</span>
                    </div>
                    <div className={`${sz.body} ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>{award.issuer}</div>
                    {award.description && <div className={`${sz.body} mt-0.5 ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>{award.description}</div>}
                </div>
            ))}
        </section>
    ) : null;

    const renderCertifications = (isSidebar: boolean = false) => cvData.certifications.length > 0 ? (
        <section key="certifications" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>Certifications</SectionHeading>
            <div className={`${sz.body} ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>
                {cvData.certifications.map((cert, idx) => (
                    <div key={idx}>• {cert}</div>
                ))}
            </div>
        </section>
    ) : null;

    const renderReferences = (isSidebar: boolean = false) => cvData.references ? (
        <section key="references" className={sp.section}>
            <SectionHeading isSidebar={isSidebar}>References</SectionHeading>
            <p className={`${sz.body} ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>{cvData.references}</p>
        </section>
    ) : null;

    const renderCustom = (isSidebar: boolean = false) => cvData.custom_sections.length > 0 ? (
        <>
            {cvData.custom_sections.filter(cs => cs.title && cs.content).map((cs, idx) => (
                <section key={`custom-${idx}`} className={sp.section}>
                    <SectionHeading isSidebar={isSidebar}>{cs.title}</SectionHeading>
                    <p className={`${sz.body} ${sp.leading} text-justify whitespace-pre-line ${isSidebar ? 'text-white/90' : 'text-slate-700 dark:text-surface-300'}`}>{cs.content}</p>
                </section>
            ))}
        </>
    ) : null;

    const sectionRenderers: Record<string, (isSidebar?: boolean) => React.ReactNode> = {
        profile: renderProfile,
        education: renderEducation,
        research: renderResearch,
        work: renderWork,
        publications: renderPublications,
        skills: renderSkills,
        awards: renderAwards,
        certifications: renderCertifications,
        references: renderReferences,
        custom: renderCustom,
    };

    const isModern = template === 'modern';

    const renderHeaderContent = (isSidebar: boolean = false) => {
        let nameSizeClass = sz.name;
        let trackingClass = 'tracking-[0.2em]';

        if (isSidebar && pi.full_name) {
            const maxWordLen = Math.max(...pi.full_name.split(' ').map(w => w.length));
            if (maxWordLen > 10 || pi.full_name.length > 20) {
                trackingClass = 'tracking-normal';
                nameSizeClass = sz.name === 'text-4xl' ? 'text-lg' : (sz.name === 'text-3xl' ? 'text-base' : 'text-sm');
            } else if (maxWordLen > 6 || pi.full_name.length > 14) {
                trackingClass = 'tracking-wider';
                nameSizeClass = sz.name === 'text-4xl' ? 'text-xl' : (sz.name === 'text-3xl' ? 'text-lg' : 'text-base');
            }
        }

        return (
            <div className={`flex justify-between items-start gap-6 ${isModern ? 'flex-col items-center text-center w-full' : ''}`}>
                <div className={`flex-1 w-full text-center`}>
                    {pi.full_name && (
                        <h1 className={`${nameSizeClass} font-bold ${trackingClass} uppercase mb-3 break-normal text-center ${isSidebar ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {pi.full_name}
                        </h1>
                    )}
                    <div className={`${sz.body} space-y-1 mb-3 break-normal ${isSidebar ? 'text-white/80' : 'text-slate-600 dark:text-surface-300'}`}>
                        {[pi.email, pi.phone, pi.address].filter(Boolean).length > 0 && (
                            <p>{[pi.email, pi.phone, pi.address].filter(Boolean).join(' • ')}</p>
                        )}
                    </div>
                    {(pi.linkedin || pi.github) && (
                        <div className={`flex flex-wrap justify-center items-center gap-4 ${sz.body} mb-3`}>
                            {pi.linkedin && (
                                <a href={ensureProtocol(pi.linkedin)} target="_blank" rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 hover:underline transition-colors ${isSidebar ? 'text-white/90 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}>
                                    <Linkedin className="w-4 h-4 shrink-0" /><span>{formatUrlDisplay(pi.linkedin)}</span>
                                </a>
                            )}
                            {pi.github && (
                                <a href={ensureProtocol(pi.github)} target="_blank" rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 hover:underline transition-colors ${isSidebar ? 'text-white/90 hover:text-white' : 'text-slate-700 dark:text-surface-300 hover:text-slate-900 dark:text-white'}`}>
                                    <Github className="w-4 h-4 shrink-0" /><span>{formatUrlDisplay(pi.github)}</span>
                                </a>
                            )}
                        </div>
                    )}
                    {(pi.nationality || pi.date_of_birth || pi.place_of_birth) && (
                        <div className={`${sz.sub} ${isSidebar ? 'text-white/70' : 'text-slate-500 dark:text-surface-400'}`}>
                            {[
                                pi.nationality && `Nationality: ${pi.nationality}`,
                                pi.date_of_birth && `Born: ${pi.date_of_birth}`,
                                pi.place_of_birth && `in ${pi.place_of_birth}`
                            ].filter(Boolean).join(' • ')}
                        </div>
                    )}
                </div>
                {pi.photo_base64 && (
                    <div className="flex-shrink-0">
                        <img src={pi.photo_base64} alt="Profile"
                            className={`object-cover rounded-full border-2 border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50 ${isModern ? 'w-40 h-40 mx-auto mb-4 border-4 border-slate-300 dark:border-surface-600' : 'w-32 h-32'}`} />
                    </div>
                )}
            </div>
        );
    };

    if (isModern) {
        // Two-column layout
        const SIDEBAR_SECTIONS = ['skills', 'languages', 'awards', 'references', 'certifications'];
        const sidebarKeys = sectionOrder.filter(k => SIDEBAR_SECTIONS.includes(k));
        const mainKeys = sectionOrder.filter(k => !SIDEBAR_SECTIONS.includes(k));

        return (
            <div className="bg-white dark:bg-surface-800 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-surface-700">
                <div className="flex flex-col md:flex-row min-h-[800px]" style={{ fontFamily }}>

                    {/* Modern Sidebar */}
                    <div className="w-full md:w-1/3 border-r p-6 md:p-8 flex flex-col gap-6 !text-white" style={{ backgroundColor: sidebarColor, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <header className="pb-6 border-b-2" style={{ borderColor: accentColor === '#1a1a1a' ? 'rgba(255,255,255,0.2)' : accentColor }}>
                            {renderHeaderContent(true)}
                        </header>

                        {sidebarKeys.map(key => {
                            const renderer = sectionRenderers[key];
                            return renderer ? <React.Fragment key={key}>{renderer(true)}</React.Fragment> : null;
                        })}
                    </div>

                    {/* Modern Main Content */}
                    <div className={`w-full md:w-2/3 ${marginClass}`}>
                        {mainKeys.map(key => {
                            const renderer = sectionRenderers[key];
                            return renderer ? <React.Fragment key={key}>{renderer(false)}</React.Fragment> : null;
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Classic / Academic single-column layout
    return (
        <div className="bg-white dark:bg-surface-800 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-surface-700">
            <div className={marginClass} style={{ fontFamily }}>
                {/* Header Section */}
                <header className="mb-8 pb-6 border-b-2" style={{ borderColor: accentColor }}>
                    {renderHeaderContent()}
                </header>

                {/* Render sections in order */}
                {sectionOrder.map(key => {
                    const renderer = sectionRenderers[key];
                    return renderer ? <React.Fragment key={key}>{renderer(false)}</React.Fragment> : null;
                })}
            </div>
        </div>
    );
};

// =============================================================================
// TEMPLATE SELECTOR
// =============================================================================
type CVTemplateType = 'academic' | 'modern';

const TemplateSelector: React.FC<{
    value: CVTemplateType;
    onChange: (value: CVTemplateType) => void;
}> = ({ value, onChange }) => {
    const templates = [
        { id: 'academic' as const, label: 'Academic', icon: GraduationCap, desc: 'Standard university format', color: 'indigo' },
        { id: 'modern' as const, label: 'Modern', icon: Briefcase, desc: 'Two-column with photo sidebar', color: 'emerald' }
    ];

    const colorClasses = {
        indigo: { active: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-indigo-100 dark:shadow-none', icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' },
        emerald: { active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-emerald-100 dark:shadow-none', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
        amber: { active: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-amber-100 dark:shadow-none', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => {
                const Icon = template.icon;
                const isActive = value === template.id;
                const colors = colorClasses[template.color as keyof typeof colorClasses];

                return (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => onChange(template.id)}
                        className={`
                            relative p-5 rounded-xl border-2 text-left transition-all duration-200
                            ${isActive
                                ? `${colors.active} shadow-lg`
                                : 'border-slate-200 dark:border-surface-700 hover:border-slate-300 dark:border-surface-600 hover:bg-slate-50 dark:bg-surface-800/50'
                            }
                        `}
                    >
                        {isActive && (
                            <div className="absolute top-3 right-3">
                                <CheckCircle className="w-5 h-5 text-current opacity-60" />
                            </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isActive ? colors.icon : 'bg-slate-100 dark:bg-surface-800 text-slate-500 dark:text-surface-400'}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className={`font-semibold text-sm ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-surface-300'}`}>
                            {template.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-surface-400 mt-1">{template.desc}</div>
                    </button>
                );
            })}
        </div>
    );
};

// =============================================================================
// CV SETTINGS TOOLBAR
// =============================================================================

const ACCENT_COLORS = [
    { name: 'Slate', hex: '#1a1a1a' },
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Rose', hex: '#e11d48' },
    { name: 'Amber', hex: '#d97706' },
    { name: 'Violet', hex: '#7c3aed' },
    { name: 'Teal', hex: '#0d9488' },
    { name: 'Sky', hex: '#0284c7' },
];

const SECTION_LABELS: Record<string, string> = {
    profile: 'Profile Summary',
    education: 'Education',
    research: 'Research Experience',
    work: 'Work Experience',
    publications: 'Publications',
    skills: 'Skills & Languages',
    awards: 'Awards',
    certifications: 'Certifications',
    references: 'References',
    custom: 'Custom Sections',
};

const CVSettingsToolbar: React.FC<{
    formatSettings: CVFormatSettings;
    onSettingsChange: (settings: CVFormatSettings) => void;
    sectionOrder: string[];
    onSectionOrderChange: (order: string[]) => void;
    template: CVTemplateType;
}> = ({ formatSettings, onSettingsChange, sectionOrder, onSectionOrderChange, template }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    const update = (key: keyof CVFormatSettings, value: string) => {
        onSettingsChange({ ...formatSettings, [key]: value });
    };

    const handleDragStart = (idx: number) => setDragIdx(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        const newOrder = [...sectionOrder];
        const [moved] = newOrder.splice(dragIdx, 1);
        newOrder.splice(idx, 0, moved);
        onSectionOrderChange(newOrder);
        setDragIdx(idx);
    };
    const handleDragEnd = () => setDragIdx(null);

    const SegmentedControl: React.FC<{
        options: { value: string; label: string; icon?: React.ReactNode }[];
        selected: string;
        onChange: (v: string) => void;
    }> = ({ options, selected, onChange }) => (
        <div className="flex bg-slate-100 dark:bg-surface-800 rounded-lg p-0.5">
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5
                        ${selected === opt.value
                            ? 'bg-white dark:bg-surface-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 dark:text-surface-400 hover:text-slate-700 dark:hover:text-surface-300'
                        }`}
                >
                    {opt.icon}{opt.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="mb-4">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-800 border border-slate-200 dark:border-surface-700 rounded-xl hover:bg-slate-50 dark:hover:bg-surface-700 transition-all w-full shadow-sm"
            >
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-surface-300">CV Formatting</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-surface-500">
                        {formatSettings.font_family} · {formatSettings.font_size} · {formatSettings.spacing}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-surface-800 border border-t-0 border-slate-200 dark:border-surface-700 rounded-b-xl p-5 space-y-5">
                            {/* Row 1: Font Size + Font Family */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Type className="w-3.5 h-3.5" /> Font Size
                                    </label>
                                    <SegmentedControl
                                        options={[
                                            { value: 'small', label: 'Small', icon: <span className="text-[10px] font-bold">A</span> },
                                            { value: 'medium', label: 'Medium', icon: <span className="text-xs font-bold">A</span> },
                                            { value: 'large', label: 'Large', icon: <span className="text-sm font-bold">A</span> },
                                        ]}
                                        selected={formatSettings.font_size}
                                        onChange={v => update('font_size', v)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Type className="w-3.5 h-3.5" /> Font Family
                                    </label>
                                    <SegmentedControl
                                        options={[
                                            { value: 'serif', label: 'Serif' },
                                            { value: 'sans-serif', label: 'Sans' },
                                            { value: 'modern', label: 'Modern' },
                                        ]}
                                        selected={formatSettings.font_family}
                                        onChange={v => update('font_family', v)}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Colors */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Palette className="w-3.5 h-3.5" /> Accent Color
                                    </label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {ACCENT_COLORS.map(color => (
                                            <button
                                                key={`accent-${color.hex}`}
                                                type="button"
                                                onClick={() => update('accent_color', color.hex)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formatSettings.accent_color === color.hex
                                                    ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800 scale-110'
                                                    : 'border-slate-200 dark:border-surface-600'
                                                    }`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {template === 'modern' && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Palette className="w-3.5 h-3.5" /> Sidebar Color
                                        </label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {[
                                                { name: 'Navy', hex: '#2c3e50' },
                                                { name: 'Charcoal', hex: '#374151' },
                                                { name: 'Dark Emerald', hex: '#064e3b' },
                                                { name: 'Dark Indigo', hex: '#312e81' },
                                                { name: 'Burgundy', hex: '#831843' },
                                                { name: 'Dark Brown', hex: '#451a03' }
                                            ].map(color => (
                                                <button
                                                    key={`sidebar-${color.hex}`}
                                                    type="button"
                                                    onClick={() => update('sidebar_color', color.hex)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formatSettings.sidebar_color === color.hex
                                                        ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800 scale-110'
                                                        : 'border-slate-200 dark:border-surface-600'
                                                        }`}
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Spacing + Margins */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Layout className="w-3.5 h-3.5" /> Spacing
                                    </label>
                                    <SegmentedControl
                                        options={[
                                            { value: 'compact', label: 'Compact', icon: <Minimize2 className="w-3 h-3" /> },
                                            { value: 'normal', label: 'Normal' },
                                            { value: 'relaxed', label: 'Relaxed', icon: <Maximize2 className="w-3 h-3" /> },
                                        ]}
                                        selected={formatSettings.spacing}
                                        onChange={v => update('spacing', v)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Layout className="w-3.5 h-3.5" /> Page Margins
                                    </label>
                                    <SegmentedControl
                                        options={[
                                            { value: 'narrow', label: 'Narrow' },
                                            { value: 'normal', label: 'Normal' },
                                            { value: 'wide', label: 'Wide' },
                                        ]}
                                        selected={formatSettings.margins}
                                        onChange={v => update('margins', v)}
                                    />
                                </div>
                            </div>

                            {/* Row 4: Section Order */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Move className="w-3.5 h-3.5" /> Section Order
                                    <span className="text-[10px] font-normal normal-case text-slate-400 dark:text-surface-500 ml-1">(drag to reorder)</span>
                                </label>
                                <div className="space-y-1.5 mt-1">
                                    {sectionOrder.map((key, idx) => (
                                        <div
                                            key={key}
                                            draggable
                                            onDragStart={() => handleDragStart(idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${dragIdx === idx
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 shadow-sm'
                                                : 'bg-white dark:bg-surface-800 border-slate-200 dark:border-surface-700 hover:bg-slate-50 dark:hover:bg-surface-700'
                                                }`}
                                        >
                                            <GripVertical className="w-4 h-4 text-slate-300 dark:text-surface-600 flex-shrink-0" />
                                            <span className="text-sm text-slate-700 dark:text-surface-300">{SECTION_LABELS[key] || key}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-surface-500 ml-auto">{idx + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const CV_STORAGE_KEY = 'uniAdvisor_cv_generator_state_v1';

const CVGeneratorPage: React.FC = () => {
    // State
    const [step, setStep] = useState<'input' | 'edit'>('input');
    const [userInput, setUserInput] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [targetProgram, setTargetProgram] = useState('');
    const [targetUniversity, setTargetUniversity] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cvData, setCvData] = useState<CVData>({ ...emptyCVData });
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<'edit' | 'preview'>('preview');
    const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [templateType, setTemplateType] = useState<CVTemplateType>('academic');
    const [cvFeedback, setCvFeedback] = useState<CVFeedback | null>(null);
    const [quickTips, setQuickTips] = useState<string[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [userNotes, setUserNotes] = useState('');
    const [formatSettings, setFormatSettings] = useState<CVFormatSettings>({ ...DEFAULT_FORMAT_SETTINGS });
    const [sectionOrder, setSectionOrder] = useState<string[]>([...DEFAULT_SECTION_ORDER]);

    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const returnToAppId = searchParams.get('returnTo');
    const paramUniversity = searchParams.get('university');
    const paramProgram = searchParams.get('program');

    // Load from local storage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(CV_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.cvData && parsed.step) {
                    setCvData(parsed.cvData);
                    setStep(parsed.step);
                    if (parsed.templateType) setTemplateType(parsed.templateType);
                    if (parsed.formatSettings) setFormatSettings(parsed.formatSettings);
                    if (parsed.sectionOrder) setSectionOrder(parsed.sectionOrder);
                    if (parsed.userInput) setUserInput(parsed.userInput);
                }
            }
        } catch (e) {
            console.error('Failed to load CV state from local storage', e);
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        // Only save if there's meaningful data or we are actively editing
        if (step === 'edit' || userInput.trim() || cvData.personal_info.full_name) {
            const stateToSave = {
                step,
                cvData,
                templateType,
                formatSettings,
                sectionOrder,
                userInput
            };
            localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [step, cvData, templateType, formatSettings, sectionOrder, userInput]);

    useEffect(() => {
        if (paramUniversity) setTargetUniversity(paramUniversity);
        if (paramProgram) setTargetProgram(paramProgram);
    }, [paramUniversity, paramProgram]);

    const handleBackToApp = () => {
        if (returnToAppId) {
            navigate(`/applications/${returnToAppId}`);
        }
    };

    const handleSaveToVault = async () => {
        setIsExporting(true);
        setError(null);
        try {
            // Generate PDF blob
            const exportData = { ...cvData, format_settings: formatSettings, section_order: sectionOrder, template_id: templateType };
            const response = await api.post('/cv-generator/export/pdf', exportData, { responseType: 'blob' });
            const file = new File([response.data], `CV_${cvData.personal_info.full_name || 'Generated'}.pdf`, { type: 'application/pdf' });

            // Upload to Vault
            await vaultApi.uploadDocument(file, DocumentCategory.CV, `Generated CV for ${targetProgram || 'General Application'}`);

            alert('✅ CV saved to Vault successfully!');
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 413) {
                setError('Your photo is too large. Please remove or replace the profile photo (the auto-optimizer should handle most cases — try re-uploading it), then save again.');
            } else {
                setError(err.response?.data?.detail || 'Failed to save CV to Vault. Please try again.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    // File upload handler
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        setUploadedFile(file);
        setIsUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post<{ content: string; filename: string; message: string }>(
                '/cv-generator/upload',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setUserInput(response.data.content);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to parse file. Please try again or paste your CV manually.');
            setUploadedFile(null);
        } finally {
            setIsUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024
    });

    // API Handlers
    const handleGenerate = async () => {
        if (!userInput.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post<CVResponse>('/cv-generator/generate', {
                user_input: userInput,
                job_description: jobDescription || null,
                target_program: targetProgram || null,
                target_university: targetUniversity || null,
                template_type: templateType
            });
            setCvData(response.data.cv_data);
            setSuggestions(response.data.suggestions || []);
            setStep('edit');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate CV. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async () => {
        setIsRefining(true);
        setError(null);
        try {
            const response = await api.post<CVResponse>('/cv-generator/refine', {
                cv_data: cvData,
                user_notes: userNotes || null,
                job_description: jobDescription || null,
                target_program: targetProgram || null,
                target_university: targetUniversity || null
            });
            setCvData(response.data.cv_data);
            setSuggestions(response.data.suggestions || []);
            setUserNotes('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to refine CV. Please try again.');
        } finally {
            setIsRefining(false);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await api.post<CVFeedbackResponse>('/cv-generator/analyze', {
                cv_data: cvData,
                user_questions: userNotes || null,
                job_description: jobDescription || null,
                target_program: targetProgram || null,
                target_university: targetUniversity || null
            });
            setCvFeedback(response.data.feedback);
            setQuickTips(response.data.quick_tips || []);
            setShowFeedback(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to analyze CV. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const exportData = { ...cvData, format_settings: formatSettings, section_order: sectionOrder, template_id: templateType };
            const response = await api.post('/cv-generator/export/pdf', exportData, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CV_${cvData.personal_info.full_name || 'document'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            if (err.response?.status === 413) {
                setError('Your photo is too large for the server to process. Please remove or replace the photo with a smaller one, then try again.');
            } else {
                setError(err.response?.data?.detail || 'Failed to export PDF. Please try again.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportDOCX = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const exportData = { ...cvData, format_settings: formatSettings, section_order: sectionOrder, template_id: templateType };
            const response = await api.post('/cv-generator/export/docx', exportData, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CV_${cvData.personal_info.full_name || 'document'}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            if (err.response?.status === 413) {
                setError('Your photo is too large for the server to process. Please remove or replace the photo with a smaller one, then try again.');
            } else {
                setError(err.response?.data?.detail || 'Failed to export Word document. Please try again.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleStartFresh = () => {
        if (window.confirm('Are you sure you want to start fresh? All current CV data will be cleared.')) {
            localStorage.removeItem(CV_STORAGE_KEY);
            setCvData({ ...emptyCVData });
            setStep('input');
            setUserInput('');
            setJobDescription('');
            setTargetProgram('');
            setTargetUniversity('');
            setTemplateType('academic');
            setFormatSettings({ ...DEFAULT_FORMAT_SETTINGS });
            setSectionOrder([...DEFAULT_SECTION_ORDER]);
            setCvFeedback(null);
            setShowFeedback(false);
        }
    };

    // CV Data update handlers
    const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
        setCvData(prev => ({ ...prev, personal_info: { ...prev.personal_info, [field]: value } }));
    };

    const updateEducation = (index: number, field: keyof Education, value: string) => {
        setCvData(prev => ({
            ...prev,
            education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
        }));
    };

    const addEducation = () => setCvData(prev => ({ ...prev, education: [...prev.education, { ...emptyEducation }] }));
    const removeEducation = (index: number) => setCvData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));

    const updateExperience = (type: 'research_experience' | 'work_experience', index: number, field: keyof Experience, value: string) => {
        setCvData(prev => ({
            ...prev,
            [type]: prev[type].map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
        }));
    };

    const addExperience = (type: 'research_experience' | 'work_experience') => {
        setCvData(prev => ({ ...prev, [type]: [...prev[type], { ...emptyExperience }] }));
    };

    const removeExperience = (type: 'research_experience' | 'work_experience', index: number) => {
        setCvData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
    };

    const updatePublication = (index: number, field: keyof Publication, value: string) => {
        setCvData(prev => ({
            ...prev,
            publications: prev.publications.map((pub, i) => i === index ? { ...pub, [field]: value } : pub)
        }));
    };

    const addPublication = () => setCvData(prev => ({ ...prev, publications: [...prev.publications, { ...emptyPublication }] }));
    const removePublication = (index: number) => setCvData(prev => ({ ...prev, publications: prev.publications.filter((_, i) => i !== index) }));

    const updateAward = (index: number, field: keyof Award, value: string) => {
        setCvData(prev => ({
            ...prev,
            awards: prev.awards.map((award, i) => i === index ? { ...award, [field]: value } : award)
        }));
    };

    const addAward = () => setCvData(prev => ({ ...prev, awards: [...prev.awards, { ...emptyAward }] }));
    const removeAward = (index: number) => setCvData(prev => ({ ...prev, awards: prev.awards.filter((_, i) => i !== index) }));

    const updateLanguage = (index: number, field: keyof Language, value: string) => {
        setCvData(prev => ({
            ...prev,
            languages: prev.languages.map((lang, i) => i === index ? { ...lang, [field]: value } : lang)
        }));
    };

    const addLanguage = () => setCvData(prev => ({ ...prev, languages: [...prev.languages, { ...emptyLanguage }] }));
    const removeLanguage = (index: number) => setCvData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));

    const updateSkills = (skillsString: string) => {
        setCvData(prev => ({ ...prev, skills: skillsString.split('\n') }));
    };

    const updateCertifications = (certsString: string) => {
        setCvData(prev => ({ ...prev, certifications: certsString.split('\n').map(s => s.trim()).filter(Boolean) }));
    };

    // ==========================================================================
    // RENDER: INPUT STEP
    // ==========================================================================
    const renderInputStep = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700 overflow-hidden"
        >
            <div className="p-6 md:p-8">
                {/* Input Mode Toggle */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-800 dark:text-surface-100 mb-3">
                        Your Current CV / Resume Content
                    </label>
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-surface-800 rounded-xl mb-4">
                        <button
                            type="button"
                            onClick={() => setInputMode('paste')}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === 'paste'
                                ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm dark:shadow-surface-900/50'
                                : 'text-slate-600 dark:text-surface-300 hover:text-slate-900 dark:text-white'
                                }`}
                        >
                            <Edit3 className="w-4 h-4 inline mr-2" />
                            Paste Text
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMode('upload')}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === 'upload'
                                ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm dark:shadow-surface-900/50'
                                : 'text-slate-600 dark:text-surface-300 hover:text-slate-900 dark:text-white'
                                }`}
                        >
                            <Upload className="w-4 h-4 inline mr-2" />
                            Upload File
                        </button>
                    </div>

                    {inputMode === 'paste' ? (
                        <textarea
                            rows={10}
                            className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-surface-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all resize-none text-sm bg-slate-50 dark:bg-surface-900/50 focus:bg-white dark:focus:bg-surface-800 placeholder:text-slate-400 text-slate-900 dark:text-white"
                            placeholder="Paste your current resume content here. Include your education, work experience, skills, publications (if any), and any other relevant information..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div
                                {...getRootProps()}
                                className={`
                                    relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                                    ${isDragActive
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-300 dark:border-surface-600 hover:border-indigo-400 hover:bg-slate-50 dark:bg-surface-800/50'
                                    }
                                `}
                            >
                                <input {...getInputProps()} />
                                {isUploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                        <p className="text-slate-600 dark:text-surface-300 font-medium">Parsing your CV...</p>
                                        <p className="text-sm text-slate-500 dark:text-surface-400 mt-1">This may take a few seconds</p>
                                    </div>
                                ) : uploadedFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                                            <FileText className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <p className="text-slate-800 dark:text-surface-100 font-semibold">{uploadedFile.name}</p>
                                        <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> File uploaded successfully
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadedFile(null);
                                                setUserInput('');
                                            }}
                                            className="mt-4 px-4 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 bg-slate-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mb-4">
                                            <Upload className="w-7 h-7 text-slate-400" />
                                        </div>
                                        {isDragActive ? (
                                            <p className="text-indigo-600 font-semibold text-lg">Drop your CV here...</p>
                                        ) : (
                                            <>
                                                <p className="text-slate-700 dark:text-surface-300 font-medium">Drag and drop your CV here</p>
                                                <p className="text-sm text-slate-500 dark:text-surface-400 mt-1">or click to browse files</p>
                                                <p className="text-xs text-slate-400 mt-3 bg-slate-100 dark:bg-surface-800 px-3 py-1.5 rounded-full">
                                                    PDF, DOCX, TXT • Max 10MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {userInput && (
                                <div className="bg-slate-50 dark:bg-surface-800/50 rounded-xl p-4 border border-slate-200 dark:border-surface-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-700 dark:text-surface-300">Extracted Content</p>
                                        <span className="text-xs text-slate-500 dark:text-surface-400 bg-slate-200 px-2 py-1 rounded-full">Editable</span>
                                    </div>
                                    <textarea
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-surface-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all resize-none text-sm bg-white dark:bg-surface-800"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Target Info Fields */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <InputField
                        label="Target Program"
                        value={targetProgram}
                        onChange={setTargetProgram}
                        placeholder="e.g., M.Sc. Computer Science"
                        hint="Optional - helps tailor your CV"
                    />
                    <InputField
                        label="Target University"
                        value={targetUniversity}
                        onChange={setTargetUniversity}
                        placeholder="e.g., Technical University of Munich"
                        hint="Optional - for location-specific formatting"
                    />
                </div>

                <div className="mb-8">
                    <InputField
                        label="Job/Program Description"
                        value={jobDescription}
                        onChange={setJobDescription}
                        placeholder="Paste the program or job description to tailor your CV accordingly..."
                        multiline
                        rows={4}
                        hint="Optional - we'll highlight relevant skills and experience"
                    />
                </div>

                {/* Template Type Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-slate-800 dark:text-surface-100 mb-3">
                        Choose CV Template
                    </label>
                    <TemplateSelector value={templateType} onChange={setTemplateType} />
                </div>

                {/* Tips Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Tips for {templateType.charAt(0).toUpperCase() + templateType.slice(1)} CVs
                    </h3>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-300/80 space-y-2">
                        {templateType === 'academic' && (
                            <>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Education section is prioritized for academic applications</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Include thesis titles and relevant coursework</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Highlight research experience and publications</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Keep it to 1-2 pages unless you have extensive publications</li>
                            </>
                        )}
                        {templateType === 'modern' && (
                            <>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> visual layout with sidebar for skills and contact</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Great for industry and startup roles</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Use a professional photo</li>
                                <li className="flex items-start gap-2"><span className="text-indigo-400">→</span> Keep it concise - 1-2 pages max</li>
                            </>
                        )}

                    </ul>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !userInput.trim()}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 disabled:shadow-none font-medium"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Generating CV...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Generate {templateType.charAt(0).toUpperCase() + templateType.slice(1)} CV</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );

    // ==========================================================================
    // RENDER: EDIT STEP
    // ==========================================================================
    const renderEditStep = () => (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Editor Panel */}
            <div className="lg:w-2/5">
                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700 p-5 sticky top-4">
                    {/* Start Over Button */}
                    <button
                        onClick={() => { setStep('input'); setCvFeedback(null); setShowFeedback(false); }}
                        className="group flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-surface-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Start Over — Upload New Resume
                    </button>

                    {/* Header with view toggle */}
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-surface-700">
                        <div className="inline-flex p-1 bg-slate-100 dark:bg-surface-800 rounded-lg">
                            <button
                                onClick={() => setActiveView('edit')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'edit' ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm dark:shadow-surface-900/50' : 'text-slate-600 dark:text-surface-300 hover:text-slate-900 dark:text-white'
                                    }`}
                            >
                                <Edit3 className="w-4 h-4 inline mr-1.5" /> Edit
                            </button>
                            <button
                                onClick={() => setActiveView('preview')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all lg:hidden ${activeView === 'preview' ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm dark:shadow-surface-900/50' : 'text-slate-600 dark:text-surface-300 hover:text-slate-900 dark:text-white'
                                    }`}
                            >
                                <Eye className="w-4 h-4 inline mr-1.5" /> Preview
                            </button>
                        </div>
                        <button
                            onClick={handleRefine}
                            disabled={isRefining}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/50 disabled:opacity-50 transition-colors border border-emerald-200 dark:border-emerald-800/50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefining ? 'animate-spin' : ''}`} />
                            {isRefining ? 'Refining...' : 'AI Refine'}
                        </button>
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-5">
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" /> Suggestions
                            </h4>
                            <ul className="text-sm text-amber-700 dark:text-amber-300/80 space-y-1.5">
                                {suggestions.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">→</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* CV Analysis Panel */}
                    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4 mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-violet-800 dark:text-violet-300 text-sm flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Get AI Feedback
                            </h4>
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Analyze</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            rows={2}
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="Any specific questions? E.g., 'Is this good for scholarships?' or 'Focus on research'"
                            className="w-full px-3 py-2.5 text-sm border border-violet-200 dark:border-violet-800/50 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 transition-all resize-none bg-white dark:bg-surface-800 text-slate-900 dark:text-white placeholder:text-violet-400"
                        />
                    </div>

                    {/* Feedback Panel */}
                    <AnimatePresence>
                        {showFeedback && cvFeedback && (
                            <FeedbackPanel
                                feedback={cvFeedback}
                                quickTips={quickTips}
                                onClose={() => setShowFeedback(false)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Edit Form */}
                    <div className={`max-h-[55vh] overflow-y-auto pr-1 ${activeView === 'preview' ? 'hidden lg:block' : ''}`}>
                        {/* Personal Information */}
                        <CollapsibleSection title="Personal Information" defaultOpen={true} icon={<FileText className="w-4 h-4" />}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <InputField label="Full Name" value={cvData.personal_info.full_name}
                                        onChange={(v) => updatePersonalInfo('full_name', v)} placeholder="John Doe" />
                                </div>
                                <InputField label="Email" value={cvData.personal_info.email} type="email"
                                    onChange={(v) => updatePersonalInfo('email', v)} placeholder="john@example.com" />
                                <InputField label="Phone" value={cvData.personal_info.phone}
                                    onChange={(v) => updatePersonalInfo('phone', v)} placeholder="+49 123 456789" />
                                <div className="col-span-2">
                                    <InputField label="Address" value={cvData.personal_info.address}
                                        onChange={(v) => updatePersonalInfo('address', v)} placeholder="Berlin, Germany" />
                                </div>
                                <InputField label="LinkedIn" value={cvData.personal_info.linkedin}
                                    onChange={(v) => updatePersonalInfo('linkedin', v)} placeholder="linkedin.com/in/johndoe" />
                                <InputField label="GitHub" value={cvData.personal_info.github}
                                    onChange={(v) => updatePersonalInfo('github', v)} placeholder="github.com/johndoe" />
                                <InputField label="Nationality" value={cvData.personal_info.nationality}
                                    onChange={(v) => updatePersonalInfo('nationality', v)} placeholder="German" />
                                <InputField label="Date of Birth" value={cvData.personal_info.date_of_birth}
                                    onChange={(v) => updatePersonalInfo('date_of_birth', v)} placeholder="01.01.1995" />
                                <InputField label="Place of Birth" value={cvData.personal_info.place_of_birth}
                                    onChange={(v) => updatePersonalInfo('place_of_birth', v)} placeholder="Berlin, Germany" />
                                <div className="col-span-2">
                                    <PhotoUpload
                                        photo={cvData.personal_info.photo_base64}
                                        onChange={(v) => updatePersonalInfo('photo_base64', v)}
                                        onRemove={() => updatePersonalInfo('photo_base64', '')}
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Profile Summary */}
                        <CollapsibleSection title="Profile Summary" defaultOpen={true} icon={<MessageSquare className="w-4 h-4" />}>
                            <InputField label="Summary" value={cvData.profile_summary} multiline rows={4}
                                onChange={(v) => setCvData(prev => ({ ...prev, profile_summary: v }))}
                                placeholder="A brief professional summary highlighting your key qualifications..." />
                        </CollapsibleSection>

                        {/* Education */}
                        <CollapsibleSection title="Education" icon={<GraduationCap className="w-4 h-4" />} badge={cvData.education.length}>
                            {cvData.education.map((edu, idx) => (
                                <CardItem key={idx} onRemove={() => removeEducation(idx)} title={`Education ${idx + 1}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <InputField label="Degree" value={edu.degree} onChange={(v) => updateEducation(idx, 'degree', v)} placeholder="M.Sc. Computer Science" />
                                        </div>
                                        <InputField label="Institution" value={edu.institution} onChange={(v) => updateEducation(idx, 'institution', v)} placeholder="Technical University" />
                                        <InputField label="Location" value={edu.location} onChange={(v) => updateEducation(idx, 'location', v)} placeholder="Munich, Germany" />
                                        <InputField label="Start Date" value={edu.start_date} onChange={(v) => updateEducation(idx, 'start_date', v)} placeholder="Oct 2020" />
                                        <InputField label="End Date" value={edu.end_date} onChange={(v) => updateEducation(idx, 'end_date', v)} placeholder="Sep 2022" />
                                        <div className="col-span-2">
                                            <InputField label="Thesis Title" value={edu.thesis_title} onChange={(v) => updateEducation(idx, 'thesis_title', v)} placeholder="Your thesis title" />
                                        </div>
                                        <InputField label="Grade" value={edu.grade} onChange={(v) => updateEducation(idx, 'grade', v)} placeholder="1.5" />
                                        <div className="col-span-2">
                                            <InputField label="Description" value={edu.description} onChange={(v) => updateEducation(idx, 'description', v)} placeholder="Brief description of coursework, achievements, or bullet points" multiline rows={3} />
                                        </div>
                                    </div>
                                </CardItem>
                            ))}
                            <AddButton onClick={addEducation} label="Add Education" />
                        </CollapsibleSection>

                        {/* Research Experience */}
                        <CollapsibleSection title="Research Experience" icon={<Lightbulb className="w-4 h-4" />} badge={cvData.research_experience.length}>
                            {cvData.research_experience.map((exp, idx) => (
                                <CardItem key={idx} onRemove={() => removeExperience('research_experience', idx)} title={`Research ${idx + 1}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputField label="Position" value={exp.position} onChange={(v) => updateExperience('research_experience', idx, 'position', v)} placeholder="Research Assistant" />
                                        <InputField label="Organization" value={exp.organization} onChange={(v) => updateExperience('research_experience', idx, 'organization', v)} placeholder="Max Planck Institute" />
                                        <InputField label="Location" value={exp.location} onChange={(v) => updateExperience('research_experience', idx, 'location', v)} placeholder="Berlin, Germany" />
                                        <InputField label="Start Date" value={exp.start_date} onChange={(v) => updateExperience('research_experience', idx, 'start_date', v)} placeholder="Jan 2021" />
                                        <InputField label="End Date" value={exp.end_date} onChange={(v) => updateExperience('research_experience', idx, 'end_date', v)} placeholder="Present" />
                                        <div className="col-span-2">
                                            <InputField label="Description" value={exp.description} multiline onChange={(v) => updateExperience('research_experience', idx, 'description', v)} placeholder="Describe your research..." />
                                        </div>
                                    </div>
                                </CardItem>
                            ))}
                            <AddButton onClick={() => addExperience('research_experience')} label="Add Research Experience" />
                        </CollapsibleSection>

                        {/* Work Experience */}
                        <CollapsibleSection title="Work Experience" icon={<Briefcase className="w-4 h-4" />} badge={cvData.work_experience.length}>
                            {cvData.work_experience.map((exp, idx) => (
                                <CardItem key={idx} onRemove={() => removeExperience('work_experience', idx)} title={`Position ${idx + 1}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputField label="Position" value={exp.position} onChange={(v) => updateExperience('work_experience', idx, 'position', v)} placeholder="Software Developer" />
                                        <InputField label="Organization" value={exp.organization} onChange={(v) => updateExperience('work_experience', idx, 'organization', v)} placeholder="Company Name" />
                                        <InputField label="Location" value={exp.location} onChange={(v) => updateExperience('work_experience', idx, 'location', v)} placeholder="Frankfurt, Germany" />
                                        <InputField label="Start Date" value={exp.start_date} onChange={(v) => updateExperience('work_experience', idx, 'start_date', v)} placeholder="Jun 2019" />
                                        <InputField label="End Date" value={exp.end_date} onChange={(v) => updateExperience('work_experience', idx, 'end_date', v)} placeholder="Sep 2020" />
                                        <div className="col-span-2">
                                            <InputField label="Description" value={exp.description} multiline onChange={(v) => updateExperience('work_experience', idx, 'description', v)} placeholder="Describe your work..." />
                                        </div>
                                    </div>
                                </CardItem>
                            ))}
                            <AddButton onClick={() => addExperience('work_experience')} label="Add Work Experience" />
                        </CollapsibleSection>

                        {/* Publications */}
                        <CollapsibleSection title="Publications" icon={<FileText className="w-4 h-4" />} badge={cvData.publications.length}>
                            {cvData.publications.map((pub, idx) => (
                                <CardItem key={idx} onRemove={() => removePublication(idx)} title={`Publication ${idx + 1}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <InputField label="Title" value={pub.title} onChange={(v) => updatePublication(idx, 'title', v)} placeholder="Publication Title" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="Authors" value={pub.authors} onChange={(v) => updatePublication(idx, 'authors', v)} placeholder="Doe, J., Smith, A." />
                                        </div>
                                        <InputField label="Journal/Conference" value={pub.journal_conference} onChange={(v) => updatePublication(idx, 'journal_conference', v)} placeholder="IEEE Conference" />
                                        <InputField label="Year" value={pub.year} onChange={(v) => updatePublication(idx, 'year', v)} placeholder="2023" />
                                        <div className="col-span-2">
                                            <InputField label="DOI" value={pub.doi} onChange={(v) => updatePublication(idx, 'doi', v)} placeholder="10.1000/xyz123" />
                                        </div>
                                    </div>
                                </CardItem>
                            ))}
                            <AddButton onClick={addPublication} label="Add Publication" />
                        </CollapsibleSection>

                        {/* Awards */}
                        <CollapsibleSection title="Awards & Scholarships" icon={<AwardIcon className="w-4 h-4" />} badge={cvData.awards.length}>
                            {cvData.awards.map((award, idx) => (
                                <CardItem key={idx} onRemove={() => removeAward(idx)} title={`Award ${idx + 1}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputField label="Title" value={award.title} onChange={(v) => updateAward(idx, 'title', v)} placeholder="Scholarship Award" />
                                        <InputField label="Issuer" value={award.issuer} onChange={(v) => updateAward(idx, 'issuer', v)} placeholder="Funding Organization" />
                                        <InputField label="Year" value={award.year} onChange={(v) => updateAward(idx, 'year', v)} placeholder="2022" />
                                        <div className="col-span-2">
                                            <InputField label="Description" value={award.description} onChange={(v) => updateAward(idx, 'description', v)} placeholder="Brief description" />
                                        </div>
                                    </div>
                                </CardItem>
                            ))}
                            <AddButton onClick={addAward} label="Add Award" />
                        </CollapsibleSection>

                        {/* Skills */}
                        <CollapsibleSection title="Skills" icon={<CheckCircle className="w-4 h-4" />}>
                            <InputField
                                label="Skills"
                                value={cvData.skills.join('\n')}
                                onChange={updateSkills}
                                multiline
                                rows={5}
                                placeholder="Python, Machine Learning, Data Analysis&#10;Agile/Scrum, Project Management"
                                hint="One skill per line. You can include commas and spaces within each line."
                            />
                        </CollapsibleSection>

                        {/* Languages */}
                        <CollapsibleSection title="Languages" icon={<MessageSquare className="w-4 h-4" />} badge={cvData.languages.length}>
                            {cvData.languages.map((lang, idx) => (
                                <CardItem key={idx} onRemove={() => removeLanguage(idx)}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputField label="Language" value={lang.language} onChange={(v) => updateLanguage(idx, 'language', v)} placeholder="German" />
                                        <InputField label="Proficiency" value={lang.proficiency} onChange={(v) => updateLanguage(idx, 'proficiency', v)} placeholder="Native / B2" />
                                    </div>
                                </CardItem>
                            ))}
                            <AddButton onClick={addLanguage} label="Add Language" />
                        </CollapsibleSection>

                        {/* Certifications */}
                        <CollapsibleSection title="Certifications" icon={<AwardIcon className="w-4 h-4" />}>
                            <InputField
                                label="Certifications"
                                value={cvData.certifications.join('\n')}
                                multiline
                                rows={3}
                                onChange={updateCertifications}
                                placeholder="AWS Certified&#10;Google Cloud Professional"
                                hint="One certification per line"
                            />
                        </CollapsibleSection>

                        {/* References */}
                        <CollapsibleSection title="References" icon={<FileText className="w-4 h-4" />}>
                            <InputField
                                label="References"
                                value={cvData.references}
                                onChange={(v) => setCvData(prev => ({ ...prev, references: v }))}
                                placeholder="Available upon request"
                            />
                        </CollapsibleSection>

                        {/* Custom Sections */}
                        <CollapsibleSection title="Custom Sections" icon={<PlusCircle className="w-4 h-4" />}>
                            {cvData.custom_sections.map((cs, idx) => (
                                <div key={idx} className="mb-4 p-3 bg-slate-50 dark:bg-surface-800 rounded-lg border border-slate-200 dark:border-surface-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={cs.title}
                                            onChange={e => {
                                                const updated = [...cvData.custom_sections];
                                                updated[idx] = { ...updated[idx], title: e.target.value };
                                                setCvData(prev => ({ ...prev, custom_sections: updated }));
                                            }}
                                            placeholder="Section Title"
                                            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = cvData.custom_sections.filter((_, i) => i !== idx);
                                                setCvData(prev => ({ ...prev, custom_sections: updated }));
                                            }}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <textarea
                                        value={cs.content}
                                        onChange={e => {
                                            const updated = [...cvData.custom_sections];
                                            updated[idx] = { ...updated[idx], content: e.target.value };
                                            setCvData(prev => ({ ...prev, custom_sections: updated }));
                                        }}
                                        placeholder="Section content..."
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setCvData(prev => ({ ...prev, custom_sections: [...prev.custom_sections, { title: '', content: '' }] }))}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all w-full justify-center"
                            >
                                <Plus className="w-4 h-4" /> Add Custom Section
                            </button>
                        </CollapsibleSection>
                    </div>

                    {/* Export Buttons */}
                    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-surface-700">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors font-medium shadow-sm dark:shadow-surface-900/50"
                            >
                                <FileIcon className="w-4 h-4" />
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={handleExportDOCX}
                                disabled={isExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm dark:shadow-surface-900/50"
                            >
                                <FileType className="w-4 h-4" />
                                <span>Word</span>
                            </button>
                            <button
                                onClick={() => { setStep('input'); setCvFeedback(null); setShowFeedback(false); }}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-surface-300 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Start Over</span>
                            </button>
                            <button
                                onClick={handleSaveToVault}
                                disabled={isExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium shadow-sm dark:shadow-surface-900/50"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save to Vault</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Panel */}
            <div className={`lg:w-3/5 ${activeView === 'edit' ? 'hidden lg:block' : ''}`}>
                <div className="sticky top-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-surface-400 mb-3">
                        <Eye className="w-4 h-4" />
                        <span>Live Preview</span>
                    </div>
                    <CVSettingsToolbar
                        formatSettings={formatSettings}
                        onSettingsChange={setFormatSettings}
                        sectionOrder={sectionOrder}
                        onSectionOrderChange={setSectionOrder}
                        template={templateType}
                    />
                    <CVPreview cvData={cvData} formatSettings={formatSettings} sectionOrder={sectionOrder} template={templateType} />
                </div>
            </div>
        </div>
    );

    // ==========================================================================
    // MAIN RENDER
    // ==========================================================================
    const toolsSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CampusConsult Lebenslauf Generator",
        "url": "https://www.uniadvisorai.com/tools/cv-generator",
        "description": "Free AI-powered German academic CV (Lebenslauf) generator. Creates DIN 5008-compliant CVs for university applications, job applications, and scholarship submissions.",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": {
            "@type": "Organization",
            "name": "CampusConsult",
            "url": "https://www.uniadvisorai.com"
        }
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is a German academic CV (Lebenslauf)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A German academic CV, or Lebenslauf, is a tabular, reverse-chronological summary of your education, research, work experience, and skills. Unlike American resumes, German CVs typically include a professional photo, date and place of birth, and nationality. They follow a structured format that is standard across German universities and employers."
                }
            },
            {
                "@type": "Question",
                "name": "Should I include a photo on my German CV?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, it is standard practice in Germany to include a professional passport-style photo on your CV. While not legally required (due to the AGG anti-discrimination law), most German employers and universities expect a photo. Our generator includes an optional photo upload feature."
                }
            },
            {
                "@type": "Question",
                "name": "What is the DIN 5008 format for German CVs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "DIN 5008 is a German standard for business correspondence that specifies formatting rules for documents including CVs. It covers margins, font sizes, spacing, and layout. Our generator automatically formats your CV according to DIN 5008 standards so you don't need to worry about compliance."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a Lebenslauf and a Europass CV?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Lebenslauf is the traditional German CV format, which is more detailed and structured than a Europass CV. The Europass is an EU-standardized format accepted across Europe. For German university applications, a Lebenslauf is generally preferred, though some programs accept Europass. Our generator creates the traditional German Lebenslauf format."
                }
            },
            {
                "@type": "Question",
                "name": "How long should my German academic CV be?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For students and recent graduates, a German academic CV should typically be 1-2 pages. For researchers with extensive publications and experience, it can extend to 3+ pages. Unlike American resumes, German CVs are expected to be comprehensive — do not omit relevant education or experience to save space."
                }
            },
            {
                "@type": "Question",
                "name": "Can I download my CV as PDF?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our generator lets you download your finished CV as both PDF and DOCX formats. The PDF export is professionally formatted and print-ready. You can also save your CV data to your account and return to edit it later."
                }
            },
            {
                "@type": "Question",
                "name": "Is this CV generator really free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, the CampusConsult Lebenslauf Generator is 100% free. You can generate, edit, and download your CV without any charges or hidden fees. We also offer AI-powered feedback and improvement suggestions at no cost."
                }
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <SEO
                    title="Free AI Lebenslauf Generator 2025 — German Academic CV Builder | CampusConsult"
                    description="Create a professional German Lebenslauf (CV) for university & job applications. AI formats your resume to DIN 5008 standards — download as PDF instantly, 100% free."
                    keywords={['german cv generator', 'lebenslauf maker', 'academic cv germany', 'german cv format', 'lebenslauf generator', 'DIN 5008 cv', 'german resume builder']}
                    schema={[toolsSchema, faqSchema]}
                    canonical="https://www.uniadvisorai.com/tools/cv-generator"
                />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    {/* Header */}
                    <div className="mb-8 text-center relative">
                        {returnToAppId && (
                            <button
                                onClick={handleBackToApp}
                                className="absolute left-0 top-0 flex items-center gap-2 text-slate-500 dark:text-surface-400 hover:text-slate-900 dark:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Back to Application</span>
                            </button>
                        )}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-5 shadow-lg shadow-indigo-200"
                        >
                            <FileText className="w-8 h-8 text-white" />
                        </motion.div>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                                Academic CV Generator
                            </h1>
                            {(step === 'edit' || userInput.trim() || cvData.personal_info.full_name) && (
                                <button
                                    onClick={handleStartFresh}
                                    className="text-sm px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/30"
                                    title="Clear all saved data and start fresh"
                                >
                                    <Trash2 className="w-4 h-4" /> Start Fresh
                                </button>
                            )}
                        </div>
                        <p className="text-slate-600 dark:text-surface-300 max-w-xl mx-auto">
                            Create a professional academic CV for European & German university applications
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <ProgressSteps
                        currentStep={step}
                        onStepClick={(clickedStep) => {
                            if (clickedStep === 'input') {
                                setStep('input');
                                setCvFeedback(null);
                                setShowFeedback(false);
                            }
                        }}
                    />

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3"
                            >
                                <div className="p-1 bg-rose-100 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-rose-700 font-medium">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Content */}
                    <AnimatePresence mode="wait">
                        {step === 'input' ? (
                            <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                {renderInputStep()}
                            </motion.div>
                        ) : (
                            <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                {renderEditStep()}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* FAQ Section */}
                    <div className="mt-20 border-t border-slate-200 dark:border-surface-700 pt-12">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    q: 'What is a German CV (Lebenslauf)?',
                                    a: 'A Lebenslauf is the German format for a Curriculum Vitae. It is typically tabular, reverse-chronological, and fact-based—focusing on clear presentation rather than "selling" yourself.'
                                },
                                {
                                    q: 'Do I need a photo?',
                                    a: 'Traditionally, yes. A professional "Bewerbungsfoto" is standard in Germany. However, for international English-speaking programs, it\'s often optional.'
                                },
                                {
                                    q: 'How does the AI refinement work?',
                                    a: 'Our AI analyzes your input and restructures it to match European academic standards, ensuring professional phrasing and highlighting relevant skills.'
                                },
                                {
                                    q: 'Is this suitable for scholarship applications?',
                                    a: 'Yes! The generated format follows the tabular "Europass" style preferred by German scholarship organizations and most German admission committees.'
                                }
                            ].map((faq, idx) => (
                                <div key={idx} className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700 hover:shadow-md transition-shadow">
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-start gap-2">
                                        <HelpCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                        {faq.q}
                                    </h4>
                                    <p className="text-slate-600 dark:text-surface-300 text-sm leading-relaxed pl-7">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CVGeneratorPage;