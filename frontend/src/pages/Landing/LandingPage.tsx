import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Check,
  Menu,
  X,
  Sun,
  Moon,
  Calculator,
  FileEdit,
  FileSearch,
  Award,
  Coins,
  Plane,
  Building2,
  Target,
  ClipboardList,
  ShieldCheck,
  Clock,
  BadgeCheck,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '../../api';
import { useThemeStore } from '../../store/themeStore';
import SEO from '../../components/common/SEO';
import Footer from '../../components/layout/Footer';
import Logo from '../../components/common/Logo';
import costHeatmap from '../../assets/images/germany_cost_heatmap.webp';

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ value, suffix = '+' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || !value) return;
    const duration = 1400;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setN(Math.floor(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  // Stats come from the API — show a placeholder rather than a misleading "0+"
  if (!value) {
    return (
      <span ref={ref} className="text-surface-300 dark:text-surface-700">
        &mdash;
      </span>
    );
  }

  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Screenshot in a neutral browser chrome, so product shots read as product shots. */
function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-2xl shadow-surface-900/10 dark:shadow-black/40">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <span className="w-2.5 h-2.5 rounded-full bg-surface-300 dark:bg-surface-600" />
        <span className="w-2.5 h-2.5 rounded-full bg-surface-300 dark:bg-surface-600" />
        <span className="w-2.5 h-2.5 rounded-full bg-surface-300 dark:bg-surface-600" />
        <span className="ml-3 h-5 w-full max-w-[13rem] rounded-md bg-white dark:bg-surface-900" />
      </div>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="block w-full" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Content
   ───────────────────────────────────────────────────────────── */

const navLinks = [
  { name: 'Programs', path: '/programs' },
  { name: 'Universities', path: '/universities' },
  { name: 'Scholarships', path: '/scholarships' },
  { name: 'Cost of Living', path: '/cost-of-living' },
];

const toolLinks = [
  { name: 'SOP Generator', path: '/tools/sop-generator', icon: FileEdit },
  { name: 'CV Generator', path: '/tools/cv-generator', icon: FileSearch },
  { name: 'Grade Calculator', path: '/german-grade-calculator', icon: Calculator },
  { name: 'Visa Guide', path: '/visa-guide', icon: Plane },
  { name: 'Survival Guides', path: '/tools/survival-guides', icon: ClipboardList },
];

const showcase = [
  {
    eyebrow: 'AI matching',
    icon: Target,
    title: 'Programs you can actually get into',
    body: 'Describe your background once. The advisor reads your grades, degree and language level, then ranks German programs by fit — with degree, field, language and GPA checked off individually, so you can see why each one matched.',
    points: ['Match score per program', 'Eligibility gaps flagged upfront', 'Follow-up questions in chat'],
    image: '/features/ai-matching.webp',
    to: '/programs',
    cta: 'Browse programs',
  },
  {
    eyebrow: 'Application tracker',
    icon: ClipboardList,
    title: 'Every deadline on one board',
    body: 'Shortlist, documents, uni-assist status, portal logins and visa appointment in a single view. Nothing lives in a spreadsheet you forget to open.',
    points: ['Stage-by-stage progress', 'Document checklist per university', 'Deadline reminders'],
    image: '/features/application-tracker.webp',
    to: '/applications',
    cta: 'See the tracker',
  },
  {
    eyebrow: 'Documents',
    icon: FileEdit,
    title: 'SOP and CV, drafted for the program',
    body: 'Generates a statement of purpose and a German-format CV from your profile, tailored to the specific program — then lets you edit every paragraph before you export.',
    points: ['Program-specific drafts', 'German CV conventions', 'Export to PDF or Word'],
    image: '/features/sop-generator.webp',
    to: '/tools/sop-generator',
    cta: 'Try the SOP generator',
  },
  {
    eyebrow: 'Funding',
    icon: Award,
    title: 'Scholarships filtered to you',
    body: 'DAAD, Erasmus+, foundation and state scholarships matched against your nationality, field and level — with deadlines and eligibility, not a list you have to read yourself.',
    points: ['Nationality-aware filtering', 'Deadline tracking', 'Direct application links'],
    image: '/features/scholarship-finder.webp',
    to: '/scholarships',
    cta: 'Find scholarships',
  },
];

const extras = [
  {
    icon: Plane,
    title: 'Visa & arrival',
    body: 'Country-specific document checklists, appointment timelines and what happens in your first month.',
    to: '/visa-guide',
  },
  {
    icon: Calculator,
    title: 'Grade conversion',
    body: 'Convert your GPA to the German 1.0–4.0 scale with the modified Bavarian formula.',
    to: '/german-grade-calculator',
  },
  {
    icon: ClipboardList,
    title: 'Survival guides',
    body: 'Anmeldung, blocked accounts, health insurance, SIM cards — the admin no one warns you about.',
    to: '/tools/survival-guides',
  },
];

const steps = [
  { n: '01', title: 'Build your profile', body: 'Grades, degree, language level, budget and what you want to study. About five minutes.' },
  { n: '02', title: 'Get matched', body: 'The AI searches thousands of German programs and returns the ones that fit, with eligibility flagged.' },
  { n: '03', title: 'Apply and track', body: 'Generate your documents, follow the checklist, and watch every deadline from one dashboard.' },
];

const comingSoon = [
  { flag: '🇹🇷', name: 'Turkey' },
  { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇦🇹', name: 'Austria' },
  { flag: '🇵🇱', name: 'Poland' },
  { flag: '🇷🇺', name: 'Russia' },
  { flag: '🇪🇬', name: 'Egypt' },
  { flag: '🇺🇦', name: 'Ukraine' },
  { flag: '🇮🇩', name: 'Indonesia' },
];

const faqs = [
  {
    q: 'Is CampusConsult really free?',
    a: 'Yes. Every feature — AI recommendations, the application tracker, SOP and CV generation, scholarship matching, the grade calculator and the visa guides — is free. There is no card required, no trial that expires and no premium tier hidden behind the good features.',
  },
  {
    q: 'How is that possible when consultants charge thousands?',
    a: 'Agencies charge for time. CampusConsult does the same research with AI over a database of German programs, so the marginal cost of helping one more student is close to nothing.',
  },
  {
    q: 'Which countries does it cover?',
    a: 'Germany is fully covered today — programs, universities, scholarships, cost of living, visa process and application steps. Turkey, the Netherlands, Austria, Poland, Russia, Egypt, Ukraine and Indonesia are in progress.',
  },
  {
    q: 'Do I need to speak German?',
    a: 'Not for many programs. Germany has thousands of English-taught Bachelor and Master degrees, and the search lets you filter by teaching language and by the certificate you already hold.',
  },
  {
    q: 'Who is it for?',
    a: 'International students applying to German universities — school leavers heading into a Bachelor, graduates going for a Master or PhD, and career switchers using a German degree to move fields.',
  },
];

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { theme, toggleTheme } = useThemeStore();

  const { data: stats } = useQuery({
    queryKey: ['program-stats'],
    queryFn: programsApi.getStatistics,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CampusConsult',
    applicationCategory: 'EducationalApplication',
    description:
      'Free AI advisor for studying in Germany: program matching, application tracking, SOP and CV generation, scholarships, cost of living and visa guidance.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };

  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <SEO
        title="CampusConsult — Free AI Advisor for Studying in Germany"
        description="Match with German university programs, generate your SOP and CV, find scholarships and track every application deadline. Completely free for international students."
        keywords={[
          'study in germany',
          'german universities',
          'free study abroad advisor',
          'scholarships germany',
          'masters in germany',
          'sop generator',
          'student visa germany',
        ]}
        schema={schema}
      />

      {/* ─── Nav ──────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 dark:bg-surface-950/85 backdrop-blur-xl border-b border-surface-200/70 dark:border-surface-800'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <Logo to="/" idSuffix="nav" markClassName="w-10 h-10 rounded-xl" wordmarkClassName="text-xl" />

          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="px-3.5 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-50/70 dark:hover:bg-primary-900/20 transition-all"
              >
                {l.name}
              </Link>
            ))}

            <div className="relative group">
              <button className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 rounded-lg group-hover:bg-primary-50/70 dark:group-hover:bg-primary-900/20 transition-all">
                Free tools
              </button>
              <div className="absolute top-full right-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl shadow-surface-900/10 border border-surface-100 dark:border-surface-800 p-2">
                  {toolLinks.map((t) => (
                    <Link
                      key={t.path}
                      to={t.path}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group/item"
                    >
                      <span className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 flex items-center justify-center group-hover/item:bg-primary-600 group-hover/item:text-white transition-all">
                        <t.icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{t.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className="p-2.5 rounded-xl text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all active:scale-[0.98]"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label={themeLabel}
              className="p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="p-2 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 px-4 py-4 space-y-1">
            {[...navLinks, ...toolLinks.map((t) => ({ name: t.name, path: t.path }))].map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                {l.name}
              </Link>
            ))}
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="block mt-3 px-3 py-3 rounded-xl text-center text-sm font-semibold text-white bg-primary-600"
            >
              Start free
            </Link>
          </div>
        )}
      </header>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50/70 via-white to-white dark:from-primary-950/40 dark:via-surface-950 dark:to-surface-950" />
          <div className="absolute -top-24 -right-24 w-[38rem] h-[38rem] rounded-full bg-primary-200/40 dark:bg-primary-800/20 blur-3xl" />
          <div className="absolute top-40 -left-32 w-[30rem] h-[30rem] rounded-full bg-accent-200/30 dark:bg-accent-900/10 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 px-3.5 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-600" />
                  </span>
                  100% free — forever, for every student
                </span>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="mt-6 text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.04] font-extrabold tracking-[-0.025em] text-surface-900 dark:text-white">
                  Study in Germany
                  <br />
                  <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                    without paying an agent
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300 max-w-xl">
                  CampusConsult is an AI advisor that finds the German programs you qualify for,
                  writes your SOP and CV, matches you to scholarships and tracks every deadline
                  through to your visa appointment.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xl shadow-primary-600/25 hover:shadow-primary-600/35 transition-all active:scale-[0.98]"
                  >
                    Get my program matches
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/programs"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-surface-800 dark:text-surface-100 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Browse programs
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.24}>
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                  {['No credit card', 'No premium tier', 'No agent fees'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                      <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {/* Hero image */}
            <Reveal delay={0.16} className="lg:col-span-6">
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden ring-1 ring-surface-200 dark:ring-surface-800 shadow-2xl shadow-primary-900/10 dark:shadow-black/50">
                  <picture>
                    <source srcSet="/hero-image.webp" type="image/webp" />
                    <img
                      src="/hero-image.png"
                      alt="Student celebrating a German university admission"
                      width={1024}
                      height={559}
                      className="block w-full h-auto"
                    />
                  </picture>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-surface-950/35 via-transparent to-transparent"
                  />
                </div>

                {/* floating chip */}
                <div className="absolute -bottom-5 left-5 sm:left-8 flex items-center gap-3 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-xl px-4 py-3">
                  <span className="text-2xl leading-none">🇩🇪</span>
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">Germany — live now</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">More destinations coming soon</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Stat strip */}
          <Reveal delay={0.3}>
            <dl className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-200 dark:bg-surface-800">
              {[
                { v: stats?.total_programs ?? 0, label: 'Programs indexed' },
                { v: stats?.unique_universities ?? 0, label: 'Universities' },
                { v: stats?.unique_cities ?? 0, label: 'Cities covered' },
                { v: null, label: 'Cost to you' },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-surface-950 px-6 py-7 text-center">
                  <dd className="text-3xl font-extrabold text-surface-900 dark:text-white tabular-nums">
                    {s.v === null ? <span className="text-primary-600 dark:text-primary-400">€0</span> : <Counter value={s.v} />}
                  </dd>
                  <dt className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{s.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ─── Free proposition ─────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-surface-50 dark:bg-surface-900/40 border-y border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white">
              A consultant charges €1,500+. This charges nothing.
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              Not a free trial. Not a limited plan with the useful parts locked. Every feature is
              available to every student, at no cost, with no card on file.
            </p>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-3 gap-5">
            {[
              { icon: BadgeCheck, title: 'No paywall', body: 'Every tool, every guide, every recommendation — open to everyone from day one.' },
              { icon: ShieldCheck, title: 'Your data stays yours', body: 'Documents live in your private vault. Nothing is sold, nothing is shared with agencies.' },
              { icon: Clock, title: 'Answers in minutes', body: 'What takes an agency two weeks of back-and-forth takes one profile and one search here.' },
            ].map((c) => (
              <Reveal key={c.title}>
                <div className="h-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-primary-600 text-white">
                    <c.icon className="w-5 h-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-surface-900 dark:text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Showcase ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              What you get
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white">
              The whole application, in one place
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              From the first search to the day your visa is stamped.
            </p>
          </Reveal>

          <div className="mt-16 space-y-24 sm:space-y-28">
            {showcase.map((s, i) => (
              <Reveal key={s.title}>
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      <s.icon className="w-4 h-4" />
                      {s.eyebrow}
                    </span>
                    <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-surface-900 dark:text-white">
                      {s.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-surface-600 dark:text-surface-300">{s.body}</p>
                    <ul className="mt-6 space-y-2.5">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-surface-700 dark:text-surface-300">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary-600 dark:text-primary-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={s.to}
                      className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-2.5 transition-all"
                    >
                      {s.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <Screenshot src={s.image} alt={s.title} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cost of living ───────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-surface-50 dark:bg-surface-900/40 border-y border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                <Coins className="w-4 h-4" />
                Cost planning
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white">
                Know the number before you commit
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
                Tuition may be free, but Munich is not Leipzig. Compare rent, insurance, semester
                fees and the blocked-account requirement city by city — then plan a budget you can
                actually defend at the visa appointment.
              </p>
              <ul className="mt-6 space-y-2.5">
                {['Rent and living costs per city', 'Blocked account maths', 'Semester fee breakdown'].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-surface-700 dark:text-surface-300">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary-600 dark:text-primary-400" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                to="/cost-of-living"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-2.5 transition-all"
              >
                Compare cities
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  Cost of living by state
                </div>
                <img
                  src={costHeatmap}
                  alt="Heatmap of cost of living across German federal states"
                  loading="lazy"
                  decoding="async"
                  className="mt-4 block w-full max-w-md mx-auto h-auto"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Extras ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white">
              And the parts nobody prepares you for
            </h2>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {extras.map((e, i) => (
              <Reveal key={e.title} delay={i * 0.05}>
                <Link
                  to={e.to}
                  className="group block h-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-7 transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:shadow-primary-600/5 hover:-translate-y-0.5"
                >
                  <span className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <e.icon className="w-6 h-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-surface-900 dark:text-white">{e.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-surface-600 dark:text-surface-400">{e.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2.5 transition-all">
                    Open
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-surface-50 dark:bg-surface-900/40 border-y border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white">
              Three steps, start to offer
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div>
                  <span className="text-5xl font-extrabold text-primary-200 dark:text-primary-900 tabular-nums">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-surface-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-surface-600 dark:text-surface-400 max-w-xs">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Countries ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Destinations
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white">
              Germany today. More countries next.
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              We went deep on one country first — the full application process, not a summary page.
              These are the destinations we are building out now.
            </p>
          </Reveal>

          <Reveal className="mt-12">
            <div className="rounded-3xl border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/30 dark:to-surface-900 p-8">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-5xl leading-none">🇩🇪</span>
                <div className="flex-1 min-w-[16rem]">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white">Germany</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-surface-600 dark:text-surface-300">
                    Full coverage — programs, universities, scholarships, costs, visa and application process.
                  </p>
                </div>
                <Link
                  to="/programs"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
                >
                  Explore Germany
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Coming soon
              </h3>
              <div className="h-px flex-1 bg-surface-200 dark:bg-surface-800" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {comingSoon.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50/60 dark:bg-surface-900/40 px-4 py-3.5"
                >
                  <span className="text-2xl leading-none">{c.flag}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-700 dark:text-surface-200 truncate">{c.name}</p>
                    <p className="text-[0.7rem] font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">
                      In progress
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm text-surface-500 dark:text-surface-400">
              Application processes, visa rules and cost data for each country are added the same way
              Germany was — researched in full before it goes live.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-surface-50 dark:bg-surface-900/40 border-y border-surface-200 dark:border-surface-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-surface-900 dark:text-white text-center">
              Questions students ask
            </h2>
          </Reveal>

          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.04}>
                <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-base font-semibold text-surface-900 dark:text-white">{f.q}</span>
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 flex items-center justify-center transition-transform duration-200 ${
                        openFaq === i ? 'rotate-45' : ''
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 -mt-1">
                      <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">{f.a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 px-8 py-16 sm:px-16 text-center">
              <div aria-hidden className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <Building2 className="w-10 h-10 text-white/80 mx-auto" />
                <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-white">
                  Your German degree starts with one profile
                </h2>
                <p className="mt-4 text-lg text-primary-50/90 max-w-xl mx-auto">
                  Five minutes to set up. Nothing to pay, now or later.
                </p>
                <Link
                  to="/register"
                  className="mt-9 inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-primary-700 bg-white hover:bg-primary-50 rounded-xl shadow-xl transition-all active:scale-[0.98]"
                >
                  Create your free account
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
