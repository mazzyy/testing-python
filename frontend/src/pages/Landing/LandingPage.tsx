import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Sparkles,
  FileText,
  Target,
  ArrowRight,
  Building2,
  Check,
  Award,
  Menu,
  X,
  ChevronDown,
  Calculator,
  Coins,
  CreditCard,
  FileEdit,
  Users,
  BookOpen,
  Briefcase,
  FileSearch,
  ClipboardList,
  HelpCircle,
  GraduationCap,
  MapPin,
  ChevronRight,
  Plane,
  Zap,
  Globe,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '../../api';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';
import Footer from '../../components/layout/Footer';

// ─── Animated Section Wrapper ───────────────────────────────────────
function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ───────────────────────────────────────────────
function AnimatedCounter({ value, suffix = '+' }: { value: number, suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || !value) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Section Header Component ───────────────────────────────────────
function SectionHeader({ badge, badgeIcon: BadgeIcon, badgeColor = 'bg-primary-100 text-primary-700', title, highlight, description }: { badge?: string | React.ReactNode, badgeIcon?: React.ElementType, badgeColor?: string, title: string | React.ReactNode, highlight?: string | React.ReactNode, description?: string | React.ReactNode }) {
  return (
    <div className="text-center mb-16 md:mb-20">
      {badge && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5 ${badgeColor}`}>
          {BadgeIcon && <BadgeIcon className="w-4 h-4" />}
          {badge}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-surface-900 mb-5 leading-tight tracking-tight">
        {title}{' '}
        {highlight && <span className="gradient-text">{highlight}</span>}
      </h2>
      {description && (
        <p className="text-lg text-surface-500 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

// ─── FAQ Accordion Item ─────────────────────────────────────────────
function FAQItem({ question, answer, index }: { question: string, answer: React.ReactNode, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-6 text-left rounded-2xl border transition-all duration-300 ${isOpen
          ? 'bg-primary-50 border-primary-200 shadow-md shadow-primary-500/5'
          : 'bg-white border-surface-100 hover:border-surface-200 hover:shadow-sm'
          }`}
        aria-expanded={isOpen}
      >
        <h3 className={`font-semibold pr-4 transition-colors ${isOpen ? 'text-primary-700' : 'text-surface-900'}`}>
          {question}
        </h3>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-primary-600 rotate-180' : 'bg-surface-100 group-hover:bg-surface-200'
          }`}>
          <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-white' : 'text-surface-500'}`} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pt-2 pb-4">
              <p className="text-surface-600 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  // Track scroll for header styling
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['program-stats'],
    queryFn: programsApi.getStatistics,
    staleTime: 1000 * 60 * 30,
  });

  // ─── Data ──────────────────────────────────────────────────────

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Recommendations',
      description: 'Get personalized program suggestions based on your academic profile and career goals.',
      color: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
    },
    {
      icon: Award,
      title: 'Scholarship Finder',
      description: 'Discover scholarships and German funding organizations matched to your profile.',
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
    },
    {
      icon: Target,
      title: 'Match Scoring',
      description: 'See how well you match each program with detailed compatibility breakdowns.',
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
    },
    {
      icon: FileText,
      title: 'Smart Document Parsing',
      description: 'Upload your transcripts and CVs — our AI extracts and organizes your information automatically.',
      color: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-blue-50',
    },
  ];

  const aiTools = [
    {
      icon: FileEdit,
      title: 'AI SOP Generator',
      description: 'Create tailored Statements of Purpose in minutes. AI-powered writing with university-specific customization.',
      link: '/tools/sop-generator',
      color: 'from-violet-500 to-purple-600',
      features: ['Program-specific SOPs', 'PDF & Word export', 'Draft history', 'AI suggestions'],
    },
    {
      icon: Briefcase,
      title: 'AI CV Generator',
      description: 'Build professional German-style CVs (Lebenslauf) with AI feedback and improvement suggestions.',
      link: '/tools/cv-generator',
      color: 'from-blue-500 to-cyan-600',
      features: ['File upload support', 'AI feedback', 'Professional format', 'Instant download'],
    },
    {
      icon: FileSearch,
      title: 'Document Parser',
      description: 'Upload transcripts and certificates — AI extracts your grades, courses, and qualifications automatically.',
      link: '/profile',
      color: 'from-emerald-500 to-teal-600',
      features: ['OCR technology', 'Auto-fill profile', 'Multiple formats', 'Secure storage'],
    },
  ];

  const planningTools = [
    {
      icon: Calculator,
      title: 'German Grade Calculator',
      description: 'Convert your local grades to German scale using the Modified Bavarian Formula.',
      link: '/german-grade-calculator',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderHover: 'hover:border-orange-200',
    },
    {
      icon: Coins,
      title: 'Cost of Living Calculator',
      description: 'Compare living costs across 10+ German cities with detailed expense breakdowns.',
      link: '/costofliving',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderHover: 'hover:border-green-200',
    },
    {
      icon: Plane,
      title: 'Visa Guide',
      description: 'Step-by-step visa application guidance with interview preparation and document checklists.',
      link: '/visa-guide',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderHover: 'hover:border-blue-200',
    },
    {
      icon: ClipboardList,
      title: 'Application Tracker',
      description: 'Kanban-style board to manage applications, deadlines, and document requirements.',
      link: '/applications',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderHover: 'hover:border-purple-200',
    },
  ];

  const featureShowcase = [
    {
      title: 'AI Program Matching',
      description: 'Our AI analyzes your academic profile, skills, and career goals to find programs with the highest compatibility. Get match scores with detailed reasoning.',
      image: '/features/ai-matching.webp',
      link: '/recommendations',
      badge: 'AI-Powered',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      title: 'Application Tracker',
      description: 'Manage all your applications with our Kanban-style board. Track deadlines, required documents, and application status in one place.',
      image: '/features/application-tracker.webp',
      link: '/applications',
      badge: 'Free Tool',
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      title: 'AI SOP Generator',
      description: 'Create tailored Statements of Purpose in minutes. Our AI adapts to each university and program, with PDF and Word export.',
      image: '/features/sop-generator.webp',
      link: '/tools/sop-generator',
      badge: 'Most Popular',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Scholarship Finder',
      description: 'German scholarships matched to your profile. See eligibility percentages and apply directly.',
      image: '/features/scholarship-finder.webp',
      link: '/scholarships',
      badge: 'Scholarships Included',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
  ];

  const faqItems = [
    {
      question: 'How can I study in Germany for free?',
      answer: 'Most public universities in Germany charge no tuition fees for international students. You only pay a semester contribution (€150-350) which includes public transport tickets. Our platform helps you find tuition-free programs and matching scholarships.',
    },
    {
      question: 'What is the German blocked account requirement?',
      answer: 'A blocked account (Sperrkonto) is required for student visas, proving you have €11,904 for one year (€992/month). You can open one through providers like Expatrio or Fintiba. This amount is released monthly after you arrive in Germany.',
    },
    {
      question: 'How do I convert my GPA to German grades?',
      answer: 'Germany uses the Modified Bavarian Formula to convert foreign grades. Our German Grade Calculator automatically converts your GPA from any grading scale (4.0, 10.0, percentage) to the German 1.0-5.0 scale used by universities.',
    },

    {
      question: 'How to write a Statement of Purpose for German universities?',
      answer: 'A strong SOP should cover your academic background, motivation for the program, relevant experience, and career goals. Our AI SOP Generator creates personalized SOPs based on your profile and target university requirements.',
    },
    {
      question: 'What is the cost of living in Germany for students?',
      answer: 'Monthly costs vary by city: Munich €1,200-1,500, Berlin €900-1,100, smaller cities €700-900. Our Cost of Living Calculator provides detailed breakdowns for rent, food, transport, and insurance across 10+ German cities.',
    },
    {
      question: 'What is UniAdvisorAI and how does it help students?',
      answer: 'UniAdvisorAI is a free AI-powered platform that provides personalized university and scholarship recommendations and helps students track their applications.',
    },
    {
      question: 'Is UniAdvisorAI free to use for students?',
      answer: 'Yes, UniAdvisorAI offers its AI University advisor and scholarship tracking services completely free for students.',
    },
    {
      question: 'How does the AI bot advisor recommend scholarships?',
      answer: 'The AI bot analyzes student profiles and preferences to suggest relevant scholarships and college opportunities tailored to each student.',
    },
    {
      question: 'Does UniAdvisorAI support students from all locations?',
      answer: 'Yes, UniAdvisorAI is location-independent and provides AI recommendations and tracking services to students regardless of their location.',
    },
  ];

  const steps = [
    { step: 1, title: 'Create Profile', description: 'Tell us about your academic background and goals', icon: GraduationCap },
    { step: 2, title: 'Get Recommendations', description: 'Our AI matches you with ideal programs', icon: Sparkles },
    { step: 3, title: 'Track Applications', description: 'Manage your applications in one place', icon: ClipboardList },
  ];

  const resources = [
    { title: 'Academic Programs', description: 'Search through thousands of Bachelor and Master degrees.', link: '/programs', icon: BookOpen, color: 'bg-blue-50 text-blue-600', borderColor: 'hover:border-blue-200' },
    { title: 'Universities', description: 'Detailed profiles of top German universities and rankings.', link: '/universities', icon: Building2, color: 'bg-purple-50 text-purple-600', borderColor: 'hover:border-purple-200' },
    { title: 'Scholarships', description: 'Find funding opportunities and financial aid.', link: '/scholarships', icon: Award, color: 'bg-amber-50 text-amber-600', borderColor: 'hover:border-amber-200' },
    { title: 'Survival Guides', description: 'Step-by-step survival guides for students from India, Pakistan, and more.', link: '/tools/survival-guides', icon: Globe, color: 'bg-teal-50 text-teal-600', borderColor: 'hover:border-teal-200' },
    { title: 'Student Community', description: 'Connect with peers, ask questions, and share experiences.', link: '/community', icon: Users, color: 'bg-green-50 text-green-600', borderColor: 'hover:border-green-200' },
    { title: 'Student Tools', description: 'Visa guides, grade calculator, cost of living, and more.', link: '/german-grade-calculator', icon: Calculator, color: 'bg-rose-50 text-rose-600', borderColor: 'hover:border-rose-200' },
  ];

  // ─── Testimonials (E-E-A-T) ────────────────────────────────────
  // Add REAL student testimonials here — the section below renders automatically
  // once this array is non-empty. Do NOT add fabricated reviews: Google penalizes
  // fake review content and it erodes trust. Format example is commented out.
  const testimonials: { quote: string; name: string; detail: string }[] = [
    // { quote: 'UniAdvisorAI matched me to three tuition-free Masters in a weekend.', name: 'A. Khan', detail: 'MSc Computer Science · applied from Pakistan' },
  ];

  // ─── SEO Schemas ───────────────────────────────────────────────

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UniAdvisorAI',
    url: 'https://www.uniadvisorai.com',
    description: 'AI-powered platform to find German university programs, scholarships, and manage study abroad applications',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.uniadvisorai.com/programs?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UniAdvisorAI',
    url: 'https://www.uniadvisorai.com',
    logo: 'https://www.uniadvisorai.com/logo.png',
    description: 'AI-powered study-abroad platform helping international students find German university programs, scholarships, and application tools — for free.',
    // TODO: add your REAL social profile URLs (LinkedIn, Instagram, X, YouTube).
    // Filling sameAs strengthens your brand entity and how AI answer engines cite you.
    sameAs: [
      // 'https://www.linkedin.com/company/uniadvisorai',
      // 'https://www.instagram.com/uniadvisorai',
      // 'https://twitter.com/uniadvisorai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'German'],
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'UniAdvisorAI',
    url: 'https://www.uniadvisorai.com',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to find and apply to German university programs with UniAdvisorAI',
    description: 'Create your profile, get AI-matched program recommendations, and track your applications — all in one free platform.',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.description,
    })),
  };

  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [websiteSchema, organizationSchema, faqSchema, webAppSchema, howToSchema],
  };

  const navLinks = [
    { name: 'Programs', path: '/programs' },
    { name: 'Universities', path: '/universities' },
    { name: 'Scholarships', path: '/scholarships' },
    { name: 'Community', path: '/community' },
  ];

  const toolsLinks = [
    { name: 'Country Guides', path: '/tools/survival-guides', icon: Globe },
    { name: 'Grade Calculator', path: '/german-grade-calculator', icon: Calculator },
    { name: 'Cost of Living', path: '/costofliving', icon: Coins },
    { name: 'Visa Guide', path: '/visa-guide', icon: CreditCard },
    { name: 'SOP Generator', path: '/tools/sop-generator', icon: FileEdit },
    { name: 'CV Generator', path: '/tools/cv-generator', icon: Briefcase },
  ];

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="overflow-hidden bg-white">
      <SEO
        title="Study in Germany 2026 — AI Program Finder & Free Tools | UniAdvisorAI"
        description="Discover 10,000+ Bachelor's & Master's programs at tuition-free German universities. AI-powered SOP Generator, Scholarship Matcher, Grade Calculator & Visa Guide — 100% free for international students."
        keywords={[
          'study in germany', 'german universities', 'scholarships germany', 'masters in germany',
          'free education germany', 'uni assist', 'sop generator', 'german grade calculator',
          'cost of living germany', 'student visa germany', 'blocked account', 'tum', 'rwth aachen',
          'study abroad', 'international students', 'study in germany from india', 'aps india',
          'mea apostille', 'vfs global germany', 'study in germany from pakistan', 'hec verification germany',
        ]}
        schema={combinedSchema}
      />

      {/* ─── Header / Navigation ──────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm shadow-surface-900/5 border-b border-surface-100'
          : 'bg-transparent'
          }`}
      >
        <div className="page-container flex items-center justify-between py-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
            role="link"
            tabIndex={0}
            aria-label="UniAdvisorAI Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 tracking-tight">UniAdvisorAI</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-primary-600 rounded-lg hover:bg-primary-50/60 transition-all"
                onClick={() => window.scrollTo(0, 0)}
              >
                {link.name}
              </Link>
            ))}
            {/* Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-surface-600 group-hover:text-primary-600 rounded-lg group-hover:bg-primary-50/60 transition-all">
                Tools
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full right-0 pt-2 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-white rounded-2xl shadow-2xl shadow-surface-900/10 border border-surface-100 p-2 overflow-hidden">
                  {toolsLinks.map((tool) => (
                    <Link
                      key={tool.name}
                      to={tool.path}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors group/item"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center group-hover/item:bg-primary-600 group-hover/item:text-white transition-all">
                        <tool.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-surface-700 group-hover/item:text-surface-900">
                        {tool.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/register')}>
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-b border-surface-100 overflow-hidden"
            >
              <div className="page-container py-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="flex items-center justify-between py-3 px-4 text-surface-700 font-medium rounded-xl hover:bg-surface-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                    <ChevronRight className="w-4 h-4 text-surface-300" />
                  </Link>
                ))}
                <div className="py-3 px-4">
                  <div className="text-xs font-semibold text-surface-400 mb-3 uppercase tracking-wider">
                    Tools
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {toolsLinks.map((tool) => (
                      <Link
                        key={tool.name}
                        to={tool.path}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-50 hover:bg-primary-50 text-center gap-2 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <tool.icon className="w-5 h-5 text-primary-600" />
                        <span className="text-xs font-medium text-surface-700">{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-surface-100">
                  <Button variant="ghost" onClick={() => navigate('/login')} className="w-full justify-center">
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')} className="w-full justify-center">
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex items-center pt-28 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(58%_45%_at_50%_-5%,rgba(99,102,241,0.16),transparent_70%)]" />
        <div className="absolute -top-28 right-[-12%] w-[620px] h-[620px] bg-gradient-to-br from-primary-300/30 to-violet-300/10 rounded-full blur-3xl floating" />
        <div className="absolute bottom-[-18%] left-[-10%] w-[520px] h-[520px] bg-gradient-to-tr from-blue-300/20 to-cyan-200/10 rounded-full blur-3xl floating-delayed" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(70%_55%_at_50%_25%,#000,transparent)]" />

        <div className="page-container relative z-10">
          <div className="grid lg:grid-cols-[1.04fr_0.96fr] gap-12 lg:gap-14 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-surface-200/70 shadow-sm text-sm font-semibold text-surface-700 mb-7">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-600 text-white text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> AI
                </span>
                Built for international students
              </div>

              {/* Headline */}
              <h1 className="text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-[4rem] lg:leading-[1.03] font-extrabold text-surface-900 tracking-[-0.02em] mb-6">
                Get into a top German university —{' '}
                <span className="gradient-text">for free.</span>
              </h1>

              {/* Subcopy */}
              <p className="text-lg lg:text-xl text-surface-500 leading-relaxed max-w-xl mb-8">
                Everything you need to study in Germany: AI-matched{' '}
                <span className="text-surface-800 font-semibold">tuition-free programs</span>, scholarships you actually qualify for, and an SOP drafted in minutes — not months.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3.5">
                <Button size="lg" onClick={() => navigate('/register')} className="group shadow-lg shadow-primary-600/20">
                  Get started free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/programs')}>
                  Browse programs
                </Button>
              </div>

              {/* Microcopy */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-5 text-sm text-surface-500">
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Free forever</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> No credit card</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> 2-minute setup</span>
              </div>

              {/* Trust stats */}
              <div className="flex items-center gap-8 sm:gap-12 mt-10 pt-8 border-t border-surface-200/70">
                {[
                  { value: stats?.total_programs, fallback: '10,000+', label: 'Programs' },
                  { value: stats?.unique_universities, fallback: '400+', label: 'Universities' },
                  { value: stats?.unique_cities, fallback: '90+', label: 'Cities' },
                ].map(({ value, label, fallback }) => (
                  <div key={label}>
                    <div className="text-2xl sm:text-3xl font-extrabold text-surface-900 tabular-nums tracking-tight">
                      {value?.toLocaleString() || fallback}
                    </div>
                    <div className="text-sm text-surface-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Product visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -inset-6 bg-gradient-to-tr from-primary-500/20 via-violet-500/10 to-transparent rounded-[2.5rem] blur-2xl" />
              <div className="relative rounded-[1.75rem] bg-white/80 backdrop-blur-sm p-2.5 ring-1 ring-surface-900/5 shadow-2xl shadow-primary-900/15">
                <div className="overflow-hidden rounded-[1.4rem] relative ring-1 ring-surface-900/5">
                  <img
                    src="/hero-image.webp"
                    alt="UniAdvisorAI — AI study-abroad advisor for German universities"
                    className="w-full h-auto object-cover"
                    width="800"
                    height="450"
                    fetchPriority="high"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/10 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Floating: Match score */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="hidden lg:block absolute -top-5 -left-5 z-20 floating"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-surface-900/10 p-4 border border-surface-100 min-w-[180px]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-surface-400">Profile match</p>
                    <span className="text-xs font-bold text-emerald-600">94%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ duration: 1, delay: 1 }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  </div>
                  <p className="text-xs text-surface-500 mt-2">TUM · M.Sc. Data Science</p>
                </div>
              </motion.div>

              {/* Floating: Scholarship */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="hidden lg:block absolute -bottom-6 -right-4 z-20 floating-delayed"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-surface-900/10 p-4 border border-surface-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 font-medium">Scholarship found</p>
                    <p className="font-bold text-surface-900 text-sm">DAAD · €992/mo</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating: Visa chip */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="hidden lg:flex absolute top-1/2 -right-6 z-20 floating"
              >
                <div className="bg-surface-900 text-white rounded-full shadow-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                  <Plane className="w-4 h-4 text-primary-300" /> Visa-ready
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Trusted by countries */}
          <div className="mt-16 lg:mt-20">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-surface-400 mb-5">
              Built for students applying from
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-surface-500">
              {['India', 'Pakistan', 'Nigeria', 'Bangladesh', 'Egypt', 'Indonesia', 'Turkey'].map((c) => (
                <span key={c} className="inline-flex items-center gap-2">
                  <Globe className="w-4 h-4 text-surface-300" /> {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ──────────────────────────────────────────── */}
      <section className="border-y border-surface-100 bg-white">
        <div className="page-container py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-surface-500">
            {['100% Free to use', 'No credit card required', 'Tuition-free German universities', 'AI-personalized to your profile'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────────────── */}
      <section className="py-24 bg-white relative">
        <div className="page-container">
          <RevealSection>
            <SectionHeader
              title="Everything You Need to"
              highlight="Study in Germany"
              description="Our platform combines AI technology with comprehensive university data to help you find and apply to your ideal program."
            />
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <RevealSection key={feature.title} delay={index * 0.1}>
                <div className="group relative h-full bg-white rounded-2xl p-7 border border-surface-100 hover:border-surface-200 hover:shadow-xl hover:shadow-surface-900/5 transition-all duration-500">
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                  <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="relative font-bold text-surface-900 mb-2.5 text-[1.05rem]">{feature.title}</h3>
                  <p className="relative text-sm text-surface-500 leading-relaxed">{feature.description}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works Section ─────────────────────────────────── */}
      <section className="py-24 bg-surface-50 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(99,102,241,0.06),transparent)]" />

        <div className="page-container relative">
          <RevealSection>
            <SectionHeader
              title="How It Works"
              description="Get started in three simple steps"
            />
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[4.5rem] left-[20%] right-[20%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 rounded-full" />
            </div>

            {steps.map((step, index) => (
              <RevealSection key={step.step} delay={index * 0.15}>
                <div className="relative bg-white rounded-2xl p-8 border border-surface-100 hover:shadow-xl hover:shadow-surface-900/5 transition-all duration-500 text-center group">
                  <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/20 group-hover:shadow-primary-500/30 group-hover:scale-105 transition-all duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600">{step.step}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-2">{step.title}</h3>
                  <p className="text-surface-500 leading-relaxed">{step.description}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase with Images ─────────────────────────── */}
      <section className="py-28 bg-gradient-to-b from-white via-white to-surface-50">
        <div className="page-container">
          <RevealSection>
            <SectionHeader
              badge="Platform Features"
              badgeIcon={Sparkles}
              title="See What You Can"
              highlight="Achieve"
              description="Explore our powerful features designed to make your study abroad journey seamless."
            />
          </RevealSection>

          <div className="space-y-28 lg:space-y-32">
            {featureShowcase.map((feature, index) => {
              const isReversed = index % 2 === 1;
              return (
                <RevealSection key={feature.title}>
                  <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
                    {/* Text */}
                    <div className={isReversed ? 'lg:order-2' : ''}>
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${feature.badgeColor}`}>
                        {feature.badge}
                      </span>
                      <h3 className="text-2xl md:text-3xl lg:text-[2rem] font-extrabold text-surface-900 mb-5 leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-surface-500 mb-8 leading-relaxed">
                        {feature.description}
                      </p>
                      <Link
                        to={feature.link}
                        onClick={() => window.scrollTo(0, 0)}
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 group"
                      >
                        Try Now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Image */}
                    <div className={isReversed ? 'lg:order-1' : ''}>
                      <motion.div
                        whileHover={{ scale: 1.015 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative rounded-2xl overflow-hidden shadow-2xl shadow-surface-900/8 border border-surface-200/80 group"
                      >
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/5 to-transparent pointer-events-none" />
                        {/* Subtle overlay on hover */}
                        <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/[0.02] transition-colors duration-500 pointer-events-none" />
                      </motion.div>
                    </div>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Explore Resources ────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="page-container">
          <RevealSection>
            <SectionHeader
              title="Explore Our"
              highlight="Resources"
              description="Everything you need to plan your studies in Germany, all in one place."
            />
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <RevealSection key={resource.title} delay={index * 0.08}>
                <Link
                  to={resource.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className={`block h-full bg-white rounded-2xl p-8 border border-surface-100 ${resource.borderColor} hover:shadow-xl hover:shadow-surface-900/5 transition-all duration-500 group`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${resource.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <resource.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-surface-500 leading-relaxed mb-6">
                    {resource.description}
                  </p>
                  <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Explore
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Section ────────────────────────────────────────── */}
      {stats && (
        <section className="py-20 relative overflow-hidden">
          {/* Gradient background with texture */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent)]" />

          <div className="page-container relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: stats.total_programs, label: 'Programs', icon: BookOpen },
                { value: stats.unique_universities, label: 'Universities', icon: Building2 },
                { value: stats.unique_cities, label: 'Cities', icon: MapPin },
                { value: stats.by_degree_type?.Masters || 0, label: 'Masters Programs', icon: GraduationCap },
              ].map((stat, index) => (
                <RevealSection key={stat.label} delay={index * 0.1}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                      <stat.icon className="w-6 h-6 text-white/80" />
                    </div>
                    <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tabular-nums">
                      <AnimatedCounter value={stat.value} />
                    </div>
                    <div className="text-primary-200 font-medium">{stat.label}</div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Section ──────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="page-container">
          <div className="relative bg-surface-900 rounded-[2rem] p-10 md:p-16 text-center overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/15 rounded-full blur-[80px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent)]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
                Ready to Find Your<br className="hidden sm:block" /> Dream Program?
              </h2>
              <p className="text-lg text-surface-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of students who found their perfect German university program with our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/register')} className="group">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10 border border-white/10"
                  onClick={() => navigate('/scholarships')}
                >
                  <Award className="w-5 h-5" />
                  Find Scholarships
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI Tools Spotlight ───────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-surface-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(99,102,241,0.05),transparent)]" />

        <div className="page-container relative">
          <RevealSection>
            <SectionHeader
              badge="AI-Powered Tools"
              badgeIcon={Zap}
              badgeColor="bg-violet-100 text-violet-700"
              title="Write Better,"
              highlight="Apply Smarter"
              description="Our AI tools help you create professional application documents in minutes, not hours."
            />
          </RevealSection>

          <div className="grid lg:grid-cols-3 gap-6">
            {aiTools.map((tool, index) => (
              <RevealSection key={tool.title} delay={index * 0.12}>
                <Link
                  to={tool.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className="block h-full bg-white rounded-2xl p-8 border border-surface-100 hover:border-surface-200 hover:shadow-2xl hover:shadow-surface-900/8 transition-all duration-500 group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-surface-500 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tool.features.map((feat) => (
                      <span
                        key={feat}
                        className="text-xs font-semibold bg-surface-100 text-surface-600 px-3 py-1.5 rounded-lg group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Try Now Free
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Planning Tools ───────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="page-container">
          <RevealSection>
            <SectionHeader
              title="Plan Your"
              highlight="Germany Journey"
              description="Essential tools to help you prepare for studying in Germany."
            />
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {planningTools.map((tool, index) => (
              <RevealSection key={tool.title} delay={index * 0.08}>
                <Link
                  to={tool.link}
                  onClick={() => window.scrollTo(0, 0)}
                  className={`block h-full bg-white rounded-2xl p-7 border border-surface-100 ${tool.borderHover} hover:shadow-xl hover:shadow-surface-900/5 transition-all duration-500 group`}
                >
                  <div className={`w-12 h-12 rounded-xl ${tool.bgColor} ${tool.iconColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-surface-500 leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials (E-E-A-T) ───────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-white">
          <div className="page-container">
            <RevealSection>
              <SectionHeader
                badge="Loved by students"
                badgeIcon={Users}
                title="What Students"
                highlight="Say"
                description="Real experiences from international students using UniAdvisorAI."
              />
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((t, i) => (
                <RevealSection key={i} delay={i * 0.08}>
                  <figure className="h-full bg-surface-50 rounded-2xl p-7 border border-surface-100">
                    <blockquote className="text-surface-700 leading-relaxed mb-5">“{t.quote}”</blockquote>
                    <figcaption className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-surface-900 text-sm">{t.name}</div>
                        <div className="text-xs text-surface-500">{t.detail}</div>
                      </div>
                    </figcaption>
                  </figure>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ Section (AEO) ────────────────────────────────────── */}
      <section className="py-24 bg-surface-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.04),transparent)]" />

        <div className="page-container relative">
          <RevealSection>
            <SectionHeader
              badge="Frequently Asked Questions"
              badgeIcon={HelpCircle}
              badgeColor="bg-blue-100 text-blue-700"
              title="Everything You Need to Know"
              description="Common questions about studying in Germany answered."
            />
          </RevealSection>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqItems.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}