import { useState, useEffect, useRef } from 'react';
import {
    Home, FileCheck, Building2, AlertTriangle, ShieldCheck, Mail,
    CheckCircle2, ArrowRight, Clock, BookOpen, Globe, CreditCard,
    Search, MapPin, Shield, FileText, ChevronUp,
    Lightbulb, Landmark, GraduationCap, HeartPulse, Banknote
} from 'lucide-react';
import SEO from '../../components/common/SEO';
import { Link } from 'react-router-dom';

const TOC_SECTIONS = [
    { id: 'housing', label: 'Housing Guide', icon: Home },
    { id: 'scams', label: 'Avoiding Scams', icon: Shield },
    { id: 'rent', label: 'Rent Explained', icon: CreditCard },
    { id: 'platforms', label: 'Where to Search', icon: Search },
    { id: 'wg-template', label: 'WG Message Template', icon: Mail },
    { id: 'anmeldung', label: 'The Anmeldung Catch-22', icon: MapPin },
    { id: 'auslanderbehorde', label: 'Ausländerbehörde', icon: Building2 },
    { id: 'documents', label: 'Document Checklist', icon: FileCheck },
    { id: 'appointment', label: 'Getting an Appointment', icon: Clock },
    { id: 'at-appointment', label: 'At the Appointment', icon: Landmark },
    { id: 'insurance', label: 'Health Insurance Trap', icon: HeartPulse },
    { id: 'uni-assist', label: 'Uni-Assist Bypass', icon: GraduationCap },
    { id: 'direct-universities', label: 'Direct Application Unis', icon: Globe },
    { id: 'vpd', label: 'VPD Explained', icon: FileText },
];

export default function SurvivalGuidesPage() {
    const [activeSection, setActiveSection] = useState('housing');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [tocOpen, setTocOpen] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll);

        // Intersection Observer for active section tracking
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );

        TOC_SECTIONS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observerRef.current?.observe(el);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const yOffset = -100;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setTocOpen(false);
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.uniadvisorai.com/" },
            { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://www.uniadvisorai.com/tools" },
            { "@type": "ListItem", "position": 3, "name": "Survival Guides" }
        ]
    };

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "The Ultimate Survival Guide for International Students in Germany (2025)",
        "description": "The complete guide to beating the German housing crisis, surviving the Ausländerbehörde, navigating health insurance, and finding direct application universities without Uni-Assist fees.",
        "author": { "@type": "Organization", "name": "CampusConsult" },
        "datePublished": "2025-01-15",
        "dateModified": "2025-06-01"
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is the difference between Kaltmiete and Warmmiete in Germany?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kaltmiete (cold rent) is the base rent for the room or apartment without any utilities. Warmmiete (warm rent) includes Nebenkosten such as water, heating, and trash removal. Electricity and internet are usually billed separately even with Warmmiete."
                }
            },
            {
                "@type": "Question",
                "name": "What is a Fiktionsbescheinigung and when do I need one?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Fiktionsbescheinigung (fiction certificate) is a document that legally extends your current visa status when your visa is about to expire and you cannot get an Ausländerbehörde appointment in time. You request it by emailing or visiting your local Ausländerbehörde."
                }
            },
            {
                "@type": "Question",
                "name": "How can I apply to German universities without Uni-Assist?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Many top German universities like TU Munich, RWTH Aachen, University of Stuttgart, and KIT handle international admissions directly through their own portals (e.g. TUMonline, RWTHonline). You can apply to these universities for free without going through Uni-Assist."
                }
            },
            {
                "@type": "Question",
                "name": "What documents do I need for the Ausländerbehörde appointment?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You need your valid passport with entrance visa, biometric passport photo, Meldebescheinigung (city registration), Immatrikulationsbescheinigung (enrollment certificate), proof of health insurance, proof of financial means (blocked account), current bank statements, completed application form, and the fee of approximately €100."
                }
            },
            {
                "@type": "Question",
                "name": "What is a VPD from Uni-Assist?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A VPD (Vorprüfungsdokumentation) is a preliminary review document from Uni-Assist that confirms your academic credentials are valid for studying in Germany. Some universities that handle direct applications still require a VPD, which costs €75 and takes 4-6 weeks to process."
                }
            }
        ]
    };

    const combinedSchema = [breadcrumbSchema, articleSchema, faqSchema];

    return (
        <>
            <SEO
                title="Germany Survival Guide 2025 | Housing, Visas, Uni-Assist & More"
                description="The complete survival guide for international students in Germany. Beat the housing crisis, navigate the Ausländerbehörde, understand health insurance, and bypass Uni-Assist fees. Updated for 2025."
                keywords={[
                    'german housing crisis international students',
                    'WG-Gesucht scam warning',
                    'Kaltmiete vs Warmmiete',
                    'Ausländerbehörde appointment tips',
                    'Fiktionsbescheinigung guide',
                    'Uni-Assist alternative',
                    'direct application germany university',
                    'VPD Uni-Assist',
                    'Anmeldung Germany registration',
                    'blocked account Germany',
                    'student visa Germany',
                    'residence permit Germany students'
                ]}
                schema={combinedSchema}
            />

            <div className="min-h-screen bg-gray-50 dark:bg-surface-900 pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ─── Hero Header ─── */}
                    <header className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-full font-medium text-sm mb-6 border border-primary-100 dark:border-primary-800/30">
                            <ShieldCheck className="w-4 h-4" />
                            Updated for 2025 — Expert Insider Strategies
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            The Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-500">Survival Guide</span> for International Students in Germany
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                            Everything you need to know about housing, visa bureaucracy, health insurance, and university applications — in one no-nonsense, step-by-step guide built by people who've been through it.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 25 min read</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> 14 Sections</span>
                            <span>•</span>
                            <span>Last updated June 2025</span>
                        </div>
                    </header>

                    {/* ─── Layout: Sticky TOC + Content ─── */}
                    <div className="flex gap-10 relative">

                        {/* Sidebar TOC — Desktop */}
                        <aside className="hidden lg:block w-72 shrink-0">
                            <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-12 custom-scrollbar" aria-label="Table of contents">
                                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-4 px-3">On this page</p>
                                <ul className="space-y-1">
                                    {TOC_SECTIONS.map(({ id, label, icon: Icon }) => (
                                        <li key={id}>
                                            <button
                                                onClick={() => scrollToSection(id)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${activeSection === id
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 hover:text-gray-700 dark:hover:text-gray-300'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 shrink-0" />
                                                {label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>

                        {/* Mobile TOC Toggle */}
                        <div className="lg:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                            {tocOpen && (
                                <nav className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-surface-700 p-4 max-h-[60vh] overflow-y-auto w-72 animate-fadeIn">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Jump to</p>
                                    <ul className="space-y-1">
                                        {TOC_SECTIONS.map(({ id, label, icon: Icon }) => (
                                            <li key={id}>
                                                <button
                                                    onClick={() => scrollToSection(id)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${activeSection === id
                                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4 shrink-0" />
                                                    {label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            )}
                            <button
                                onClick={() => setTocOpen(!tocOpen)}
                                className="w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-700 transition-colors"
                                aria-label="Table of contents"
                            >
                                <BookOpen className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ─── Main Content ─── */}
                        <main className="flex-1 min-w-0 space-y-16">

                            {/* ═══════════════════════════════════════════ */}
                            {/* PART 1: HOUSING */}
                            {/* ═══════════════════════════════════════════ */}
                            <article>
                                <SectionAnchor id="housing" />
                                <PartBadge number="1" label="Housing" />
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    Beating the German Housing Crisis
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Finding a flat or a room in a shared apartment (WG) in cities like Munich, Berlin, or Hamburg from abroad is one of the hardest parts of moving to Germany. Vacancy rates in major German cities are below 1%, landlords receive hundreds of applications per listing, and international students are at a massive disadvantage without a German credit history (Schufa) or local references.
                                </p>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl">
                                    This section breaks down the exact playbook — from understanding how German rent works, to the best platforms, to the message template that actually gets responses, to the critical Anmeldung catch-22 that nobody tells you about until it's too late.
                                </p>

                                {/* Scams */}
                                <SectionAnchor id="scams" />
                                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 md:p-8 rounded-r-2xl mb-10">
                                    <h3 className="flex items-center gap-2 text-xl font-bold text-amber-900 dark:text-amber-400 mb-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        The Golden Rule: Avoiding Housing Scams
                                    </h3>
                                    <p className="text-amber-800 dark:text-amber-300 mb-4">
                                        The German housing market is a breeding ground for scams targeting international students. If a landlord says they are "currently out of the country" and will "mail you the keys after you transfer the deposit via Western Union, Wise, or Airbnb," <strong>it is a 100% scam.</strong>
                                    </p>
                                    <div className="space-y-3 text-amber-800 dark:text-amber-300">
                                        <p className="flex items-start gap-2"><span className="font-bold shrink-0">Rule 1:</span> Never transfer a deposit (Kaution) before signing a contract and seeing the apartment in person — or having a trusted friend physically visit it for you.</p>
                                        <p className="flex items-start gap-2"><span className="font-bold shrink-0">Rule 2:</span> Be suspicious of any listing that is dramatically below market price. If a 30m² apartment in central Munich is listed at €300 warm, it's not real.</p>
                                        <p className="flex items-start gap-2"><span className="font-bold shrink-0">Rule 3:</span> Legitimate German landlords never ask for payment through Western Union, cryptocurrency, gift cards, or unusual payment platforms. They use standard bank transfers (Überweisung) to a German IBAN.</p>
                                        <p className="flex items-start gap-2"><span className="font-bold shrink-0">Rule 4:</span> Check if the listing photos appear on other websites using a reverse image search. Scammers frequently steal photos from legitimate rental or real estate listings.</p>
                                        <p className="flex items-start gap-2"><span className="font-bold shrink-0">Rule 5:</span> Your deposit (Kaution) is legally capped at 3 months of cold rent (Kaltmiete). Any landlord asking for more is either uninformed or trying to take advantage of you.</p>
                                    </div>
                                </div>

                                {/* Kaltmiete vs Warmmiete */}
                                <SectionAnchor id="rent" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={1} />
                                    Kaltmiete vs. Warmmiete: How German Rent Works
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Every German rental listing shows one of two prices. Understanding this distinction will save you from nasty budget surprises in your first month.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-5 mb-6">
                                    <InfoCard
                                        title="Kaltmiete (Cold Rent)"
                                        variant="neutral"
                                        content="The base price for just the empty room or apartment. This covers the physical space — nothing else. No heating, no water, no electricity, no internet, and often no kitchen appliances (many German apartments don't come with a kitchen)."
                                    />
                                    <InfoCard
                                        title="Warmmiete (Warm Rent)"
                                        variant="primary"
                                        content="Cold rent plus Nebenkosten (ancillary costs) like water, heating, building maintenance, and trash removal. However, electricity and internet are almost always billed separately! Always ask the landlord exactly what is included in the Warmmiete before signing."
                                    />
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-10">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 shrink-0" /> Real-World Budget Example
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        A listing says "450€ warm" for a WG room in Berlin. That means your monthly transfer to the landlord is €450. On top of that, expect roughly €30–50/month for electricity (your share) and €10–15/month for internet (split with flatmates). Your true all-in monthly cost is closer to <strong>€490–515</strong>. In Munich, add roughly 30–40% on top of Berlin prices.
                                    </p>
                                </div>

                                <Link to="/costofliving" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline mb-10">
                                    Check actual rent prices by city in our Cost of Living Calculator <ArrowRight className="w-4 h-4" />
                                </Link>

                                {/* Platforms */}
                                <SectionAnchor id="platforms" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={2} />
                                    Where to Search: The Complete Platform Guide
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Do not rely on a single platform. The best strategy is to cast a wide net and check multiple sources simultaneously. Here's every platform worth using, ranked by effectiveness for international students.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                                    <PlatformCard
                                        name="WG-Gesucht"
                                        url="wg-gesucht.de"
                                        desc="The #1 platform for shared apartments (WGs). This is where you'll spend most of your time. Free to use, but you can pay for a premium membership that puts your profile at the top of results."
                                        tier="Essential"
                                        tierColor="emerald"
                                    />
                                    <PlatformCard
                                        name="Immobilienscout24"
                                        url="immobilienscout24.de"
                                        desc="Germany's largest general rental platform. Better for solo apartments than WGs. Premium membership (ImmobilienscoutPlus) significantly increases your response rate."
                                        tier="Essential"
                                        tierColor="emerald"
                                    />
                                    <PlatformCard
                                        name="eBay Kleinanzeigen"
                                        url="kleinanzeigen.de"
                                        desc="Germany's classifieds platform. Hidden gem for sublets (Zwischenmiete) and short-term rooms. Many listings here never appear on WG-Gesucht. Search for 'WG Zimmer' or 'Zwischenmiete'."
                                        tier="Highly Recommended"
                                        tierColor="blue"
                                    />
                                    <PlatformCard
                                        name="Studierendenwerk (Student Union)"
                                        url="studentenwerk.de"
                                        desc="Apply for a Studentenwohnheim (student dorm) as soon as you get your admission letter — waitlists can be 1–3 semesters. Cheapest option at €200–400/month, but rooms are limited."
                                        tier="Apply ASAP"
                                        tierColor="amber"
                                    />
                                    <PlatformCard
                                        name="Facebook Groups"
                                        url="facebook.com/groups"
                                        desc="Search for '[City Name] WG' or '[City] Housing for Students'. Surprisingly effective, especially for sublets. Groups like 'Berlin WG Zimmer' or 'Munich Apartments' have thousands of active posts."
                                        tier="Highly Recommended"
                                        tierColor="blue"
                                    />
                                    <PlatformCard
                                        name="Zwischenmiete.de"
                                        url="zwischenmiete.de"
                                        desc="Specializes in temporary sublets and furnished rooms. Ideal for your first 1–3 months while you search for permanent housing. Much less competitive than permanent listings."
                                        tier="Temporary Strategy"
                                        tierColor="violet"
                                    />
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mb-10">
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 shrink-0" /> Pro Tip: The Zwischenmiete Strategy
                                    </h4>
                                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                                        Don't try to find permanent housing from abroad. Instead, book a <strong>Zwischenmiete (temporary sublet)</strong> for your first 1–3 months. This gives you a legal address for your Anmeldung (city registration), removes the desperation of needing immediate housing, and lets you attend WG viewings in person — which massively increases your chances. Searching from within Germany is 10x easier than searching from abroad.
                                    </p>
                                </div>

                                {/* WG Template */}
                                <SectionAnchor id="wg-template" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={3} />
                                    The WG-Gesucht Message Template That Gets Replies
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Germans value directness and compatibility in a shared flat. A generic "Is the room still available?" will be ignored among hundreds of identical messages. This template hits every point WG residents look for: who you are, what you're like to live with, and that you can pay.
                                </p>

                                <div className="bg-surface-900 text-gray-300 p-6 md:p-8 rounded-2xl font-mono text-sm shadow-xl relative mb-4">
                                    <p className="text-gray-500 mb-4">// German version — use this one for maximum response rate</p>
                                    <p>Hallo WG!</p>
                                    <br />
                                    <p>Ich bin <span className="text-primary-400">[Your Name]</span>, <span className="text-primary-400">[Age]</span> Jahre alt, und beginne meinen Master in <span className="text-primary-400">[Program]</span> an der <span className="text-primary-400">[University]</span>. Ich habe eure Anzeige auf WG-Gesucht gesehen und finde das Zimmer super!</p>
                                    <br />
                                    <p>Ich bin ein ruhiger, ordentlicher Mitbewohner. In meiner Freizeit mache ich gerne <span className="text-primary-400">[Hobby 1]</span> und <span className="text-primary-400">[Hobby 2]</span>. Ich bin kein Zweck-WG-Fan und koche abends gerne mal zusammen, brauche aber auch Zeit für mein Studium.</p>
                                    <br />
                                    <p>Ich bringe eine gesicherte Finanzierung (Sperrkonto) mit. Da ich aktuell noch in <span className="text-primary-400">[Country]</span> bin, wäre ein kurzes Online-Kennenlernen (Skype/Zoom) perfekt.</p>
                                    <br />
                                    <p>Liebe Grüße,<br /><span className="text-primary-400">[Your Name]</span></p>
                                </div>
                                <div className="bg-gray-50 dark:bg-surface-800 p-5 rounded-2xl border border-gray-100 dark:border-surface-700 mb-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Why this template works:</h4>
                                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Opens with your name and age — basic but expected</p>
                                        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> States your university — establishes legitimacy</p>
                                        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Mentions hobbies — shows you're a real person</p>
                                        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Addresses "Zweck-WG" fear — you actually want community</p>
                                        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Blocked account proof — removes financial doubt</p>
                                        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Offers video call — practical solution for distance</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-10">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 shrink-0" /> Personalize Every Message
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        Don't copy-paste this template blindly. Read the WG listing carefully and reference something specific — maybe they mentioned they love cooking, have a cat, or enjoy board game nights. A single personalized sentence like "Ich habe gesehen, dass ihr gerne zusammen kocht — das würde ich auch super finden!" dramatically increases your response rate.
                                    </p>
                                </div>

                                {/* Anmeldung */}
                                <SectionAnchor id="anmeldung" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={4} />
                                    The Anmeldung Catch-22 (City Registration)
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Within 14 days of moving into your apartment, you are legally required to register your address at the local Bürgeramt (citizens' office). This is called the <strong>Anmeldung</strong>, and the confirmation you receive is the <strong>Meldebescheinigung</strong> — arguably the most important piece of paper in Germany.
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Here's the catch-22: you need the Meldebescheinigung to open a German bank account, get a phone contract, enroll at university, sign up for health insurance, and get your residence permit. But to get it, you need a fixed address and a <strong>Wohnungsgeberbestätigung</strong> (landlord confirmation form) signed by your landlord.
                                </p>
                                <div className="bg-gray-50 dark:bg-surface-800 p-6 rounded-2xl border border-gray-100 dark:border-surface-700 mb-6">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">What you need for the Anmeldung:</h4>
                                    <div className="space-y-3">
                                        {[
                                            'Your passport (or national ID for EU citizens)',
                                            'A completed Anmeldung registration form (Anmeldeformular) — available at the Bürgeramt or downloadable from your city\'s website',
                                            'Wohnungsgeberbestätigung — a landlord confirmation form signed by your landlord or main tenant. This is the critical document. Ask for it before you move in.',
                                            'Marriage certificate (only if registering with a spouse)'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-10">
                                    <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" /> Bürgeramt Appointments
                                    </h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        In Berlin, Bürgeramt appointments can be booked out for weeks. Start trying to book one <strong>before</strong> you arrive. Berlin releases new appointment slots every midnight and at random intervals. Use services like <strong>allhier.de</strong> or <strong>service.berlin.de</strong> and refresh frequently. Some cities like Munich are easier — you can often walk in with minimal wait.
                                    </p>
                                </div>
                            </article>

                            {/* ═══════════════════════════════════════════ */}
                            {/* PART 2: AUSLÄNDERBEHÖRDE */}
                            {/* ═══════════════════════════════════════════ */}
                            <article>
                                <SectionAnchor id="auslanderbehorde" />
                                <PartBadge number="2" label="Visa & Residence Permit" />
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    Surviving the Ausländerbehörde
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Your entrance visa (the one pasted in your passport) is typically only valid for 3 to 6 months. To legally stay in Germany as a student, you need to convert it into a <strong>Residence Permit (Aufenthaltstitel)</strong> by visiting the Ausländerbehörde (Foreigners' Authority) in your city.
                                </p>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl">
                                    This process is notoriously frustrating — long wait times, hard-to-get appointments, and a mountain of documents. But if you go in prepared, it can be surprisingly smooth. Here's everything you need.
                                </p>

                                {/* Document Checklist */}
                                <SectionAnchor id="documents" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <NumberBadge n={1} />
                                    The Ironclad Document Checklist
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Missing even one document can mean a wasted appointment and months of additional waiting. Print everything. Bring originals AND copies. Organize them in a folder in the order below.
                                </p>
                                <div className="space-y-3 mb-10">
                                    {[
                                        { doc: "Valid Passport with your entrance visa", note: "Must be valid for at least 6 months beyond your intended stay" },
                                        { doc: "1 Biometric Passport Photo", note: "Must be recent, 35x45mm, and strictly German biometric format. Get these from any photo booth in a train station or a Rossmann/DM store." },
                                        { doc: "Meldebescheinigung (City Registration)", note: "The paper you received from the Bürgeramt after your Anmeldung. Must show your current address." },
                                        { doc: "Immatrikulationsbescheinigung (Enrollment Certificate)", note: "The official certificate from your university confirming you are enrolled for the current semester." },
                                        { doc: "Proof of Health Insurance", note: "A confirmation letter from a German statutory insurer (TK, AOK, Barmer, DAK). Private insurance may cause complications — see the health insurance section below." },
                                        { doc: "Proof of Financial Means (Blocked Account)", note: "Your Sperrkonto confirmation from Expatrio, Fintiba, or Deutsche Bank showing the required minimum (currently €11,904/year as of 2025)." },
                                        { doc: "Current Bank Statements", note: "The last 3 months of statements from your German checking account (Girokonto). This shows regular monthly withdrawals from your blocked account." },
                                        { doc: "Completed Application Form", note: "Download from your city's Ausländerbehörde website. Print, fill out, and sign it before your appointment. Bring a pen in case corrections are needed." },
                                        { doc: "Previous Degrees & Transcripts", note: "Some offices ask for your bachelor's degree certificate and transcript. Bring certified/notarized copies to be safe." },
                                        { doc: "Fee: Approximately €100", note: "Bring an EC/Girocard or cash. Most Ausländerbehörde offices do NOT accept Visa or Mastercard." }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 bg-gray-50 dark:bg-surface-900 p-4 rounded-xl border border-gray-100 dark:border-surface-700">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                                            <div>
                                                <span className="text-gray-900 dark:text-white font-semibold">{item.doc}</span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.note}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Getting an Appointment */}
                                <SectionAnchor id="appointment" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={2} />
                                    Getting an Appointment (The Hardest Part)
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    In cities like Berlin and Munich, getting an Ausländerbehörde appointment can feel impossible. Slots are released sporadically and snapped up within seconds. Here are the strategies that work.
                                </p>
                                <div className="grid md:grid-cols-2 gap-5 mb-6">
                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                        <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
                                            <Clock className="w-5 h-5 shrink-0" /> The Morning Refresh Strategy
                                        </h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            Berlin and Munich release cancelled or newly available appointment slots early in the morning, usually between <strong>7:00 AM and 8:30 AM</strong>. Open the booking portal before 7 AM and refresh aggressively (every 30–60 seconds) throughout this window. Some students report success right at midnight as well.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                                        <h4 className="font-bold text-violet-900 dark:text-violet-400 mb-2 flex items-center gap-2">
                                            <Globe className="w-5 h-5 shrink-0" /> Automated Booking Tools
                                        </h4>
                                        <p className="text-sm text-violet-800 dark:text-violet-300">
                                            Browser extensions and bots exist that auto-refresh the booking portal and notify you when a slot opens. Search GitHub for Ausländerbehörde appointment bots for your specific city. Be aware that some cities have started implementing CAPTCHAs to prevent this.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 mb-10">
                                    <h4 className="font-bold text-red-900 dark:text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" /> Emergency: The Fiktionsbescheinigung
                                    </h4>
                                    <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                                        If your visa is about to expire and you absolutely cannot get an appointment in time, you have a legal safety net. Email your local Ausländerbehörde (find their email on their website) and formally request a <strong>Fiktionsbescheinigung</strong> (fiction certificate).
                                    </p>
                                    <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                                        This document legally extends your current visa status — meaning you can continue to live, study, and work (if applicable) in Germany while waiting for your appointment. It is a legal bridge, not a permanent solution.
                                    </p>
                                    <p className="text-sm text-red-800 dark:text-red-300 font-semibold">
                                        Keep the printed email exchange as proof. Carry it with your passport at all times until your actual appointment.
                                    </p>
                                </div>

                                {/* At the Appointment */}
                                <SectionAnchor id="at-appointment" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={3} />
                                    What Happens at the Appointment
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    The Ausländerbehörde has a reputation for being stressful, but knowing what to expect makes a huge difference. Here's a step-by-step of what actually happens.
                                </p>
                                <div className="space-y-4 mb-6">
                                    {[
                                        { step: "Arrive 15–30 minutes early", desc: "You'll need to find your room number, navigate the building, and potentially wait in a queue. Bring something to read — delays are common." },
                                        { step: "Your ticket/queue number is called", desc: "You'll be called to a window or office. The case worker (Sachbearbeiter) will ask for your documents. Hand them over in an organized folder." },
                                        { step: "Document review", desc: "The case worker checks every document against their requirements. If anything is missing, they may send you home to come back later (with another months-long wait). This is why preparation is critical." },
                                        { step: "Biometric data collection", desc: "They'll take your fingerprints and your biometric photo for the electronic residence permit card (eAT)." },
                                        { step: "Payment", desc: "You pay the fee (~€100) on site. Have your EC/Girocard or cash ready." },
                                        { step: "Temporary sticker or Fiktionsbescheinigung", desc: "In most cases, you won't get your eAT card on the same day. They'll either put a temporary sticker in your passport or issue a Fiktionsbescheinigung. Your actual eAT card arrives by mail in 4–8 weeks." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 bg-gray-50 dark:bg-surface-900 p-5 rounded-xl border border-gray-100 dark:border-surface-700">
                                            <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                                            <div>
                                                <span className="text-gray-900 dark:text-white font-semibold">{item.step}</span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mb-10">
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 shrink-0" /> Language Tip
                                    </h4>
                                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                                        Many Ausländerbehörde case workers speak some English, but it's not guaranteed. If your German is limited, bring a German-speaking friend or contact your university's International Office — many offer to send a volunteer to accompany you. Some cities also allow you to bring a professional translator.
                                    </p>
                                </div>

                                {/* Health Insurance */}
                                <SectionAnchor id="insurance" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={4} />
                                    The Health Insurance Trap
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Germany requires every student to have health insurance — no exceptions. There are two types, and choosing wrong can cause serious problems at the Ausländerbehörde.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-5 mb-6">
                                    <InfoCard
                                        title="Statutory Insurance (GKV) — Recommended"
                                        variant="primary"
                                        content="Public insurance through providers like TK (Techniker Krankenkasse), AOK, Barmer, or DAK. Costs around €110–120/month for students under 30. This is what the Ausländerbehörde expects and accepts without questions. TK is the most popular choice among international students."
                                    />
                                    <InfoCard
                                        title="Private Insurance (PKV) — Risky"
                                        variant="neutral"
                                        content="Private insurance can be cheaper for students over 30 or those from countries with qualifying private insurance. However, the Ausländerbehörde may reject your residence permit application if your private insurance doesn't meet German standards. If you go this route, get written confirmation that your plan meets the requirements."
                                    />
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-10">
                                    <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" /> Critical: Switch from Travel Insurance
                                    </h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        Travel insurance (the kind you used for your visa application) is NOT the same as German health insurance. You must switch to statutory or qualifying private insurance after arrival. Universities will not enroll you, and the Ausländerbehörde will not issue your residence permit, without proper German health insurance. Start the enrollment process with TK or AOK within your first week in Germany.
                                    </p>
                                </div>
                            </article>

                            {/* ═══════════════════════════════════════════ */}
                            {/* PART 3: UNI-ASSIST */}
                            {/* ═══════════════════════════════════════════ */}
                            <article>
                                <SectionAnchor id="uni-assist" />
                                <PartBadge number="3" label="University Applications" />
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    The Uni-Assist Bypass Strategy
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Uni-Assist is a centralized application service used by many German universities to pre-screen international applicants' documents. They charge <strong>€75 for the first application</strong> and <strong>€30 for each additional university</strong>. Processing can take up to 6–8 weeks — and if there's an issue with your documents, even longer.
                                </p>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl">
                                    The good news: many of Germany's best universities don't use Uni-Assist at all. They handle international applications directly through their own portals — usually for free and with faster processing. Here's how to find them and when you can't avoid Uni-Assist.
                                </p>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={1} />
                                    Why Bypass Uni-Assist?
                                </h3>
                                <div className="grid sm:grid-cols-3 gap-4 mb-10">
                                    {[
                                        { icon: Banknote, title: "High Fees", desc: "Applying to 5 universities through Uni-Assist costs €195. Direct applications are almost always free. That's €195 saved for your first month's groceries." },
                                        { icon: Clock, title: "Slow Processing", desc: "Uni-Assist can take 4–8 weeks to process your documents. By the time they forward your application, university deadlines may have passed or seats may be filled." },
                                        { icon: FileText, title: "Strict Requirements", desc: "They are extremely strict about notarized copies, document formats, and translation standards. Minor formatting issues can cause rejections and require resubmission." },
                                    ].map((item, i) => (
                                        <div key={i} className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                            <item.icon className="w-5 h-5 text-red-600 dark:text-red-400 mb-3" />
                                            <h4 className="font-bold text-red-900 dark:text-red-400 mb-2">{item.title}</h4>
                                            <p className="text-sm text-red-800 dark:text-red-300">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Direct Application Universities */}
                                <SectionAnchor id="direct-universities" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={2} />
                                    Universities That Accept Direct Applications
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Many of Germany's top-ranked universities manage their own international admissions. Here are well-known universities where you can typically apply directly for Master's programs without going through Uni-Assist.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                    {[
                                        { uni: "TU Munich (TUM)", portal: "TUMonline", note: "Germany's #1 ranked university. Fully direct application for almost all Master's programs." },
                                        { uni: "RWTH Aachen", portal: "RWTHonline", note: "Top engineering university. Direct application for most programs." },
                                        { uni: "University of Stuttgart", portal: "C@mpus Portal", note: "Strong for engineering, architecture, and natural sciences." },
                                        { uni: "KIT (Karlsruhe Institute of Technology)", portal: "KIT Application Portal", note: "One of Germany's leading technical universities." },
                                        { uni: "TU Berlin", portal: "TU Berlin Portal", note: "Direct application for many Master's programs. Check individual program pages." },
                                        { uni: "University of Mannheim", portal: "Mannheim Portal", note: "Top for business and social sciences. Direct application for most programs." },
                                        { uni: "TU Dresden", portal: "SelmaWeb", note: "Strong for engineering and science. Direct for many international Master's programs." },
                                        { uni: "LMU Munich", portal: "LMU Application Portal", note: "Some programs are direct, others require Uni-Assist. Always check the specific program." },
                                    ].map((item, i) => (
                                        <div key={i} className="p-5 bg-gray-50 dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-700">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.uni}</h4>
                                            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">Portal: {item.portal}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.note}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-primary-50 dark:bg-primary-900/10 p-6 md:p-8 rounded-2xl border border-primary-100 dark:border-primary-900/30 mb-10">
                                    <h4 className="font-bold text-primary-900 dark:text-primary-400 mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 shrink-0" />
                                        How to Check Any University
                                    </h4>
                                    <p className="text-primary-800 dark:text-primary-300 mb-3">
                                        The quickest way to check whether a specific program requires Uni-Assist or allows direct application:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-2 text-primary-800 dark:text-primary-300 font-medium ml-2">
                                        <li>Go to our <Link to="/programs" className="underline hover:text-primary-600">Programs Search</Link> and find your program.</li>
                                        <li>Check the application instructions on the program's detail page.</li>
                                        <li>If it says "Apply directly via University Portal" — you bypass Uni-Assist entirely.</li>
                                        <li>If it says "Apply via Uni-Assist" — check if a VPD-only route is available (see below).</li>
                                    </ol>
                                </div>

                                {/* VPD */}
                                <SectionAnchor id="vpd" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <NumberBadge n={3} />
                                    When You Can't Avoid Uni-Assist: Understanding VPD
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">
                                    Some universities that technically allow direct applications still require a <strong>VPD (Vorprüfungsdokumentation)</strong> from Uni-Assist. A VPD is a preliminary review of your academic credentials that confirms your qualifications are valid for studying in Germany. It's different from a full Uni-Assist application.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-5 mb-6">
                                    <InfoCard
                                        title="Full Uni-Assist Application"
                                        variant="neutral"
                                        content="Uni-Assist receives your complete application, evaluates your documents, and forwards everything to the university. You have no direct contact with the university's admissions office. Cost: €75 first, €30 each additional."
                                    />
                                    <InfoCard
                                        title="VPD Only"
                                        variant="primary"
                                        content="Uni-Assist only checks your credential equivalency and issues a VPD document. You then submit this VPD alongside your direct application to the university. You maintain control of your application. Cost: €75."
                                    />
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-8">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 shrink-0" /> VPD Timing Strategy
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        If any of your target universities require a VPD, request it as early as possible — ideally <strong>3–4 months before the application deadline</strong>. VPD processing takes 4–6 weeks under normal conditions, but during peak application seasons (May–July for winter semester), it can stretch to 8+ weeks. A single VPD can be used for multiple university applications, so you only need to request it once.
                                    </p>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-10">
                                    <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" /> Country-Specific Requirements: APS Certificate
                                    </h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        If you're from <strong>China, India, or Vietnam</strong>, you may need an <strong>APS (Akademische Prüfstelle) certificate</strong> before you can even submit your Uni-Assist application or apply to universities directly. The APS process involves document verification and (for some countries) an interview. It can take <strong>2–4 months</strong>, so start this process as early as your junior year of university. Check the APS website for your country's specific requirements.
                                    </p>
                                </div>
                            </article>

                            {/* ─── Final CTA ─── */}
                            <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white">
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Application?</h2>
                                <p className="text-primary-100 mb-8 max-w-xl mx-auto">
                                    Use our AI-powered tools to find the right programs, compare cities, and build your application timeline.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/programs"
                                        className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
                                    >
                                        <Search className="w-5 h-5" />
                                        Search Programs
                                    </Link>
                                    <Link
                                        to="/costofliving"
                                        className="inline-flex items-center gap-2 bg-white/15 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/25 transition-colors border border-white/20"
                                    >
                                        <Banknote className="w-5 h-5" />
                                        Cost of Living Calculator
                                    </Link>
                                </div>
                            </div>

                        </main>
                    </div>
                </div>

                {/* Back to top */}
                {showBackToTop && (
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-surface-800 text-gray-600 dark:text-gray-400 shadow-lg border border-gray-200 dark:border-surface-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors"
                        aria-label="Back to top"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                )}
            </div>
        </>
    );
}

// ═══════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════

function SectionAnchor({ id }: { id: string }) {
    return <div id={id} className="scroll-mt-28" />;
}

function PartBadge({ number, label }: { number: string | number; label: string }) {
    return (
        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-3 py-1.5 rounded-lg font-semibold text-xs uppercase tracking-wider mb-4 border border-primary-100 dark:border-primary-900/30">
            Part {number} — {label}
        </div>
    );
}

function NumberBadge({ n }: { n: string | number }) {
    return (
        <span className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-bold shrink-0">
            {n}
        </span>
    );
}

function InfoCard({ title, content, variant = 'neutral' }: { title: string; content: string; variant?: 'neutral' | 'primary' }) {
    const styles = {
        neutral: 'bg-gray-50 dark:bg-surface-900 border-gray-100 dark:border-surface-700 text-gray-900 dark:text-white',
        primary: 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30 text-primary-900 dark:text-primary-400',
    };
    const textStyle = {
        neutral: 'text-gray-600 dark:text-gray-400',
        primary: 'text-primary-800 dark:text-primary-300',
    };
    return (
        <div className={`p-6 rounded-2xl border ${styles[variant]}`}>
            <h4 className="font-bold mb-2">{title}</h4>
            <p className={`text-sm ${textStyle[variant]}`}>{content}</p>
        </div>
    );
}

function PlatformCard({ name, url, desc, tier, tierColor }: { name: string; url: string; desc: string; tier: string; tierColor: 'emerald' | 'blue' | 'amber' | 'violet' }) {
    const colorMap = {
        emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    };
    return (
        <div className="p-5 bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorMap[tierColor]}`}>{tier}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{url}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
        </div>
    );
}