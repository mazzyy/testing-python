import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, CheckCircle, AlertTriangle, ArrowRight, Building2, GraduationCap, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { getCountryBySlug } from '../../data/countries';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';
import TermTooltip from '../../components/ui/TermTooltip';

// Helper to wrap known terms in tooltips
const renderWithTooltips = (text: string) => {
    const terms = ['APS Certificate', 'APS', 'HEC Attestation', 'HEC', 'IBCC', 'MEA Apostille', 'MEA', 'MOFA Attestation', 'MOFA', 'Uni-Assist', 'VFS Global', 'VFS', 'Blocked Account', 'Sperrkonto'];

    // Create a generic regex pattern
    const pattern = new RegExp(`(${terms.join('|')})`, 'g');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
        if (terms.includes(part)) {
            return <TermTooltip key={i} term={part}>{part}</TermTooltip>;
        }
        return part;
    });
};

export default function CountryGuidePage() {
    const { country } = useParams<{ country: string }>();
    const countryData = getCountryBySlug(country || '');
    const [activeSection, setActiveSection] = useState<string>('requirements');

    // Scroll-spy: track which section is currently visible
    useEffect(() => {
        if (!countryData?.applicationPhases) return;

        const sectionIds = [
            'requirements',
            ...countryData.applicationPhases.map(p => `phase-${p.id}`),
            'grade-conversion',
            'embassy',
            'faq'
        ];

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );

        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [countryData]);

    if (!countryData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Country Not Found</h1>
                    <Link to="/" className="text-primary-600 hover:underline">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const pageTitle = `Study in Germany from ${countryData.name} | Complete Guide 2025`;
    const pageDescription = `Step-by-step guide for ${countryData.name} students: visa (${countryData.visaWaitTime}), blocked account (€11,904), grade conversion (${countryData.gradeConversion.systemName}), APS, scholarships & more.`;

    // FAQ entries for AEO (AI Engine Optimization) — real questions people search for
    const faqEntries = [
        { q: `How do I study in Germany from ${countryData.name}?`, a: `Apply to German universities via Uni-Assist or directly. You need a recognized degree, language proficiency (IELTS 6.0+ or TestDaF), a blocked account with €11,904, and a student visa. The process takes ${countryData.visaWaitTime} for visa processing.` },
        { q: `How much does it cost to study in Germany from ${countryData.name}?`, a: `Public German universities are tuition-free. You need €11,904/year in a blocked account (approx. ${(11904 * 90).toLocaleString()} ${countryData.currency}), plus a semester contribution of €150–€400. Total living cost is roughly €10,000–€12,000/year.` },
        { q: `What GPA do I need to study in Germany from ${countryData.name}?`, a: `Using the ${countryData.gradeConversion.systemName}: ${countryData.gradeConversion.germanEquivalent}` },
        { q: `How long does the German student visa take from ${countryData.name}?`, a: `Visa processing from ${countryData.name} typically takes ${countryData.visaWaitTime}. Apply at the German Embassy/Consulate in ${countryData.embassyLocations.slice(0, 3).join(', ')}.` },
        { q: `What documents do ${countryData.name} students need for Germany?`, a: `Key documents: passport, academic transcripts, degree certificate, language certificates (IELTS/TestDaF), blocked account proof, health insurance, motivation letter, CV, and recommendation letters. ${countryData.specificRequirements.join(' ')}` },
    ];

    // Rich structured data: Article + FAQ + BreadcrumbList + HowTo
    const schema = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `How to Study in Germany from ${countryData.name} — Complete Guide 2025`,
            "description": pageDescription,
            "author": { "@type": "Organization", "name": "CampusConsult" },
            "publisher": {
                "@type": "Organization",
                "name": "CampusConsult",
                "logo": { "@type": "ImageObject", "url": "https://www.uniadvisorai.com/logo.png" }
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": `https://www.uniadvisorai.com/study-in-germany/from/${countryData.slug}` },
            "datePublished": "2025-01-01",
            "dateModified": new Date().toISOString().split('T')[0]
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqEntries.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.uniadvisorai.com/" },
                { "@type": "ListItem", "position": 2, "name": "Study in Germany", "item": "https://www.uniadvisorai.com/study-in-germany" },
                { "@type": "ListItem", "position": 3, "name": countryData.name, "item": `https://www.uniadvisorai.com/study-in-germany/from/${countryData.slug}` }
            ]
        },
        ...(countryData.applicationPhases ? [{
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": `How to Apply to German Universities from ${countryData.name}`,
            "description": `Step-by-step application process for students from ${countryData.name} to study in Germany.`,
            "step": countryData.applicationPhases.map((phase, i) => ({
                "@type": "HowToStep",
                "position": i + 1,
                "name": phase.title,
                "text": phase.description
            }))
        }] : [])
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-surface-800/50">
            <SEO
                title={pageTitle}
                description={pageDescription}
                keywords={[
                    `study in germany from ${countryData.name}`,
                    `german student visa ${countryData.name}`,
                    `german university admission for ${countryData.name} students`,
                    `${countryData.name} to germany study`,
                    `aps certificate ${countryData.name}`,
                    `german grade conversion ${countryData.name}`,
                    `blocked account germany ${countryData.name}`,
                    `study in germany requirements ${countryData.name}`,
                    `germany scholarship ${countryData.name} students`,
                    `how to apply german university from ${countryData.name}`
                ]}
                schema={schema}
            />

            {/* Breadcrumb for SEO */}
            <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <ol className="flex items-center gap-2 text-sm text-slate-500 dark:text-surface-400" itemScope itemType="https://schema.org/BreadcrumbList">
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                        <Link to="/" itemProp="item" className="hover:text-primary-600 transition-colors"><span itemProp="name">Home</span></Link>
                        <meta itemProp="position" content="1" />
                    </li>
                    <li className="text-slate-300">/</li>
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                        <span itemProp="name" className="text-slate-700 dark:text-surface-300 font-medium">Study from {countryData.name}</span>
                        <meta itemProp="position" content="2" />
                    </li>
                </ol>
            </nav>

            {/* Hero Section */}
            <header className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                            <span className="text-2xl">{countryData.flag}</span>
                            <span className="text-sm font-medium text-primary-100">
                                Guide for Students from {countryData.name}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                            Study in Germany from <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{countryData.name}</span>
                        </h1>
                        <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Everything you need to know about university applications, visa requirements,
                            blocked accounts, and moving to Germany from {countryData.name}.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" onClick={() => document.getElementById('requirements')?.scrollIntoView({ behavior: 'smooth' })}>
                                Check Requirements
                            </Button>
                            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10" onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })}>
                                Application Steps
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-surface-800 rounded-xl shadow-xl p-6 border border-slate-100 dark:border-surface-700"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-surface-400">Avg. Visa Wait Time</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{countryData.visaWaitTime}</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-surface-300 border-t pt-4">
                            Varies by consulate location in {countryData.name}.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-surface-800 rounded-xl shadow-xl p-6 border border-slate-100 dark:border-surface-700"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-surface-400">Blocked Account</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">€11,904 / year</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-surface-300 border-t pt-4">
                            Roughly {(11904 * 90).toLocaleString()} {countryData.currency} (Subject to exchange rate).
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-surface-800 rounded-xl shadow-xl p-6 border border-slate-100 dark:border-surface-700"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-surface-400">Students in Germany</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{countryData.studentCount}</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-surface-300 border-t pt-4">
                            Join a growing community of students from {countryData.name}.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content — 3 columns: left nav | content | right sidebar */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-[220px_1fr_280px] gap-8">

                    {/* LEFT: Sticky Phase Index */}
                    {countryData.applicationPhases && countryData.applicationPhases.length > 0 && (
                        <nav aria-label="Page sections" className="hidden lg:block">
                            <div className="sticky top-24">
                                <div className="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider px-2">On This Page</h3>
                                    <ul className="space-y-0.5">
                                        <li>
                                            <a
                                                href="#requirements"
                                                onClick={(e) => { e.preventDefault(); document.getElementById('requirements')?.scrollIntoView({ behavior: 'smooth' }); }}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeSection === 'requirements'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold border-l-2 border-primary-500'
                                                    : 'text-slate-500 dark:text-surface-400 hover:bg-slate-50 dark:hover:bg-surface-800/50 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <span>⚠️</span>
                                                <span>Requirements</span>
                                            </a>
                                        </li>
                                        {countryData.applicationPhases.map((phase) => (
                                            <li key={phase.id}>
                                                <a
                                                    href={`#phase-${phase.id}`}
                                                    onClick={(e) => { e.preventDefault(); document.getElementById(`phase-${phase.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeSection === `phase-${phase.id}`
                                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold border-l-2 border-primary-500'
                                                        : 'text-slate-500 dark:text-surface-400 hover:bg-slate-50 dark:hover:bg-surface-800/50 hover:text-slate-900 dark:hover:text-white'
                                                        }`}
                                                >
                                                    <span>{phase.icon}</span>
                                                    <span>{phase.title}</span>
                                                </a>
                                            </li>
                                        ))}
                                        <li>
                                            <a
                                                href="#grade-conversion"
                                                onClick={(e) => { e.preventDefault(); document.getElementById('grade-conversion')?.scrollIntoView({ behavior: 'smooth' }); }}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeSection === 'grade-conversion'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold border-l-2 border-primary-500'
                                                    : 'text-slate-500 dark:text-surface-400 hover:bg-slate-50 dark:hover:bg-surface-800/50 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <span>🎓</span>
                                                <span>Grade Conversion</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#embassy"
                                                onClick={(e) => { e.preventDefault(); document.getElementById('embassy')?.scrollIntoView({ behavior: 'smooth' }); }}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeSection === 'embassy'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold border-l-2 border-primary-500'
                                                    : 'text-slate-500 dark:text-surface-400 hover:bg-slate-50 dark:hover:bg-surface-800/50 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <span>🏢</span>
                                                <span>Embassy & Consulates</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#faq"
                                                onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeSection === 'faq'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold border-l-2 border-primary-500'
                                                    : 'text-slate-500 dark:text-surface-400 hover:bg-slate-50 dark:hover:bg-surface-800/50 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <span>❓</span>
                                                <span>FAQ</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </nav>
                    )}

                    {/* CENTER: Main Content */}
                    <article className="space-y-16 min-w-0">

                        {/* Country Specific Requirements */}
                        <section id="requirements">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                    <AlertTriangle className="w-6 h-6" />
                                </span>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Requirements for {countryData.name}</h2>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700">
                                <div className="p-8">
                                    <h3 className="text-lg font-semibold mb-4">Mandatory Checklist</h3>
                                    <ul className="space-y-4">
                                        {countryData.specificRequirements.map((req, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                                <span className="text-slate-700 dark:text-surface-300">{renderWithTooltips(req)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-slate-50 dark:bg-surface-800/50 px-8 py-4 border-t border-slate-200 dark:border-surface-700">
                                    <p className="text-sm text-slate-500 dark:text-surface-400">
                                        * These are in addition to standard university requirements.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Application Phases (New Phase-Based View) */}
                        {countryData.applicationPhases && countryData.applicationPhases.length > 0 ? (
                            <section id="steps">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <Clock className="w-6 h-6" />
                                    </span>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Complete Application Process</h2>
                                </div>

                                {/* Phase Navigation Pills */}
                                <div className="flex flex-wrap gap-2 mb-8 p-3 bg-white dark:bg-surface-800 rounded-xl border border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50">
                                    {countryData.applicationPhases.map((phase, idx) => (
                                        <a
                                            key={phase.id}
                                            href={`#phase-${phase.id}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-50 dark:bg-surface-800/50 text-slate-700 dark:text-surface-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-colors border border-slate-100 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800/50"
                                        >
                                            <span>{phase.icon}</span>
                                            <span className="hidden sm:inline">{phase.title}</span>
                                            <span className="sm:hidden">{idx + 1}</span>
                                        </a>
                                    ))}
                                </div>

                                {/* Phases */}
                                <div className="space-y-8">
                                    {countryData.applicationPhases.map((phase, phaseIdx) => (
                                        <motion.div
                                            key={phase.id}
                                            id={`phase-${phase.id}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            transition={{ delay: 0.05 * phaseIdx }}
                                            className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700 overflow-hidden scroll-mt-24"
                                        >
                                            {/* Phase Header */}
                                            <div className="bg-gradient-to-r from-slate-50 to-white dark:from-surface-900 dark:to-surface-900 p-6 border-b border-slate-100 dark:border-surface-700">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                                                        {phase.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                                                                Phase {phaseIdx + 1}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{phase.title}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-surface-400 mt-0.5">{phase.description}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Phase Items */}
                                            <div className="p-6">
                                                <div className="space-y-3">
                                                    {phase.items.map((item, itemIdx) => (
                                                        <div
                                                            key={itemIdx}
                                                            className={`p-4 rounded-lg border transition-colors ${item.important
                                                                ? 'border-l-4 border-l-red-400 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10'
                                                                : 'border-slate-100 dark:border-surface-700 bg-slate-50/50 dark:bg-surface-800/30 hover:bg-slate-50 dark:hover:bg-surface-800/50'
                                                                }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${item.important ? 'text-red-500' : 'text-green-500'
                                                                    }`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                                                        {renderWithTooltips(item.name)}
                                                                        {item.important && (
                                                                            <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                                                                                REQUIRED
                                                                            </span>
                                                                        )}
                                                                    </h4>
                                                                    <p className="text-sm text-slate-600 dark:text-surface-300 mt-1">{renderWithTooltips(item.description)}</p>
                                                                    {item.link && (
                                                                        <a
                                                                            href={item.link}
                                                                            target={item.link.startsWith('/') ? '_self' : '_blank'}
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline mt-2"
                                                                        >
                                                                            {item.linkText || 'Learn More'}
                                                                            <ExternalLink className="w-3 h-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Tips */}
                                                {phase.tips && phase.tips.length > 0 && (
                                                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                                                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-2 flex items-center gap-2">
                                                            💡 Pro Tips
                                                        </h4>
                                                        <ul className="space-y-1.5">
                                                            {phase.tips.map((tip, tipIdx) => (
                                                                <li key={tipIdx} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                                                    <span className="text-amber-500 dark:text-amber-600 mt-1 flex-shrink-0">•</span>
                                                                    {tip}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        ) : countryData.applicationSteps && (
                            <section id="steps">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <Clock className="w-6 h-6" />
                                    </span>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Step-by-Step Process</h2>
                                </div>

                                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700">
                                    <div className="p-8">
                                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                            {countryData.applicationSteps.map((step, idx) => (
                                                <div key={idx} className="relative flex items-start gap-6 group is-active">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 dark:bg-surface-800 group-[.is-active]:bg-blue-600 text-slate-500 dark:text-surface-400 group-[.is-active]:text-white shadow shrink-0 z-10 transition-colors">
                                                        <span className="font-bold">{idx + 1}</span>
                                                    </div>
                                                    <div className="flex-1 pt-1.5">
                                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{renderWithTooltips(step.title)}</h4>
                                                        <p className="text-slate-600 dark:text-surface-300 mb-2">{renderWithTooltips(step.description)}</p>
                                                        {step.link && (
                                                            <a
                                                                href={step.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                            >
                                                                {step.linkText || 'Visit Portal'}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Grade Conversion */}
                        <section id="grade-conversion">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <GraduationCap className="w-6 h-6" />
                                </span>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Grade Conversion</h2>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700 p-8">
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">From {countryData.gradeConversion.systemName}</h3>
                                        <p className="text-slate-600 dark:text-surface-300 mb-6">To German Grade (1.0 - 5.0)</p>

                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
                                                {countryData.gradeConversion.germanEquivalent}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-20 transform rotate-3"></div>
                                        <div className="relative bg-white dark:bg-surface-800 p-6 rounded-xl border border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50 text-center">
                                            <p className="text-sm font-semibold text-slate-500 dark:text-surface-400 mb-2">Try our Calculator</p>
                                            <p className="text-slate-600 dark:text-surface-300 text-sm mb-4">Get an exact conversion for your grades.</p>
                                            <Link to="/german-grade-calculator">
                                                <Button size="sm" className="w-full">Open Calculator</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Consulates */}
                        <section id="embassy">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                    <Building2 className="w-6 h-6" />
                                </span>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Embassy & Consulates</h2>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700 p-8">
                                <p className="text-slate-600 dark:text-surface-300 mb-6">
                                    German missions in {countryData.name} are located in:
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {countryData.embassyLocations.map(loc => (
                                        <span key={loc} className="px-4 py-2 bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-surface-300 rounded-full font-medium">
                                            📍 {loc}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-8">
                                    <Link to="/visa-guide">
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            Read Full Visa Guide <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* FAQ Section for AEO — visible to users AND crawlers */}
                        <section id="faq" itemScope itemType="https://schema.org/FAQPage">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
                                    <Globe className="w-6 h-6" />
                                </span>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                            </div>
                            <div className="space-y-4">
                                {faqEntries.map((faq, idx) => (
                                    <details
                                        key={idx}
                                        className="bg-white dark:bg-surface-800 rounded-xl border border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50 group"
                                        itemScope
                                        itemProp="mainEntity"
                                        itemType="https://schema.org/Question"
                                    >
                                        <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-slate-900 dark:text-white hover:text-primary-700 transition-colors" itemProp="name">
                                            {faq.q}
                                            <ArrowRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90 flex-shrink-0 ml-4" />
                                        </summary>
                                        <div className="px-5 pb-5 text-slate-600 dark:text-surface-300 leading-relaxed border-t border-slate-100 dark:border-surface-700 pt-4" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                            <p itemProp="text">{faq.a}</p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>

                    </article>

                    {/* RIGHT: Sidebar — tools & help */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800/30">
                                <h3 className="font-bold text-primary-900 dark:text-primary-400 mb-4">Need Help?</h3>
                                <p className="text-primary-700 dark:text-primary-300 text-sm mb-6">
                                    Get personalized guidance for your application from {countryData.name}.
                                </p>
                                <Button className="w-full">Chat with AI Advisor</Button>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-slate-200 dark:border-surface-700 shadow-sm dark:shadow-surface-900/50">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Popular Tools</h3>
                                <ul className="space-y-3">
                                    <li>
                                        <Link to="/tools/sop-generator" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors group">
                                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-surface-300">SOP Generator</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/tools/cv-generator" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors group">
                                            <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                <GraduationCap className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-surface-300">CV Generator</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
