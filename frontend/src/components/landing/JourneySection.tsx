import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Target, ClipboardList, FileEdit, Award, Plane } from 'lucide-react';

/**
 * The journey section.
 *
 * A sticky left column holds the 9:16 clip and the stage list; the content
 * scrolls normally on the right, so the page never feels pinned.
 *
 * The video is NOT driven by raw scroll distance. Each stage owns a slice of
 * the timeline, and scroll progress *through that stage's own block* maps onto
 * that slice — so the word standing on screen is always the stage being read,
 * however tall or short its content happens to be.
 */

type Block = {
  heading: string;
  body: string;
  points?: string[];
  image?: string;
  to: string;
  cta: string;
};

type Stage = {
  word: string;
  kicker: string;
  /** [start, end] seconds in the clip — contiguous, covering the transition into the word */
  range: [number, number];
  icon: typeof Target;
  blocks: Block[];
};

// Frame timings read off the source (240 frames @ 24fps):
// MATCH holds 10–50, TRACK 65–100, APPLY 110–150, SUCCESS 175–240.
const STAGES: Stage[] = [
  {
    word: 'MATCH',
    kicker: 'Find the right programs',
    range: [0, 2.3],
    icon: Target,
    blocks: [
      {
        heading: 'Programs you can actually get into',
        body:
          'Describe your background once. The advisor reads your grades, degree and language level, then ranks German programs by fit — with degree, field, language and GPA checked off individually, so you can see why each one matched.',
        points: ['Match score per program', 'Eligibility gaps flagged upfront', 'Follow-up questions in chat'],
        image: '/features/ai-matching.webp',
        to: '/programs',
        cta: 'Browse programs',
      },
    ],
  },
  {
    word: 'TRACK',
    kicker: 'Keep every deadline',
    range: [2.3, 4.3],
    icon: ClipboardList,
    blocks: [
      {
        heading: 'Every deadline on one board',
        body:
          'Shortlist, documents, uni-assist status, portal logins and visa appointment in a single view. Nothing lives in a spreadsheet you forget to open.',
        points: ['Stage-by-stage progress', 'Document checklist per university', 'Deadline reminders'],
        image: '/features/application-tracker.webp',
        to: '/applications',
        cta: 'See the tracker',
      },
    ],
  },
  {
    word: 'APPLY',
    kicker: 'Documents and funding',
    range: [4.3, 6.4],
    icon: FileEdit,
    blocks: [
      {
        heading: 'SOP and CV, drafted for the program',
        body:
          'Generates a statement of purpose and a German-format CV from your profile, tailored to the specific program — then lets you edit every paragraph before you export.',
        points: ['Program-specific drafts', 'German CV conventions', 'Export to PDF or Word'],
        image: '/features/sop-generator.webp',
        to: '/tools/sop-generator',
        cta: 'Try the SOP generator',
      },
      {
        heading: 'Scholarships filtered to you',
        body:
          'DAAD, Erasmus+, foundation and state scholarships matched against your nationality, field and level — with deadlines and eligibility, not a list you have to read yourself.',
        points: ['Nationality-aware filtering', 'Deadline tracking', 'Direct application links'],
        image: '/features/scholarship-finder.webp',
        to: '/scholarships',
        cta: 'Find scholarships',
      },
    ],
  },
  {
    word: 'SUCCESS',
    kicker: 'Offer, visa, arrival',
    range: [6.4, 9.95],
    icon: Plane,
    blocks: [
      {
        heading: 'From Zulassung to your first week',
        body:
          'The offer is not the finish line. Country-specific visa checklists, blocked-account maths, health insurance and the Anmeldung paperwork are all mapped out, so the months after admission are as planned as the months before it.',
        points: [
          'Visa document checklist by country',
          'Blocked account and cost planning',
          'Anmeldung, insurance and first-month admin',
        ],
        to: '/visa-guide',
        cta: 'Open the visa guide',
      },
    ],
  },
];

const CLIP_END = 9.95;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export default function JourneySection() {
  const regionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);

  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);

    setSrc(window.innerWidth < 768 ? '/story/journey-480.mp4' : '/story/journey-720.mp4');

    // Render the sticky column OR the mobile strip — never both, or we end up
    // with two <video> elements sharing one ref and only one of them driven.
    const lg = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(lg.matches);
    const onLg = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    lg.addEventListener('change', onLg);

    return () => {
      mq.removeEventListener('change', onChange);
      lg.removeEventListener('change', onLg);
    };
  }, []);

  useEffect(() => {
    if (reduced || failed || !src) return;

    const region = regionRef.current;
    const video = videoRef.current;
    if (!region || !video) return;

    let raf = 0;
    let running = false;
    let eased = 0;
    let lastStage = -1;

    const prime = () => {
      const p = video.play();
      if (p && typeof p.then === 'function') p.then(() => video.pause()).catch(() => {});
    };
    video.addEventListener('loadeddata', prime, { once: true });

    const tick = () => {
      // Anchor a little above centre — the line the reader's eye sits on
      const anchor = window.innerHeight * 0.42;

      // Pick the LAST block whose top has passed the anchor. Containment alone
      // breaks in the gaps between blocks — the anchor matches nothing there and
      // the video snaps back to the start.
      let idx = 0;
      let local = 0;

      const blocks = blockRefs.current;
      for (let i = 0; i < blocks.length; i++) {
        const el = blocks[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (anchor < r.top) break;
        idx = i;
        local = r.height > 0 ? clamp((anchor - r.top) / r.height, 0, 1) : 1;
      }

      const [from, to] = STAGES[idx].range;
      const target = from + (to - from) * local;

      eased += (target - eased) * 0.15;
      if (video.duration && Math.abs(eased - video.currentTime) > 0.008) {
        try {
          video.currentTime = clamp(eased, 0, Math.min(video.duration, CLIP_END));
        } catch {
          /* seek can throw while loading */
        }
      }

      if (idx !== lastStage) {
        lastStage = idx;
        setActive(idx);
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${clamp(target / CLIP_END, 0, 1)})`;
      }

      if (running) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(region);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      video.removeEventListener('loadeddata', prime);
    };
  }, [reduced, failed, src, isDesktop]);

  const showVideo = !reduced && !failed && src;

  const media = showVideo ? (
    <video
      ref={videoRef}
      src={src as string}
      poster="/story/journey-poster.jpg"
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-contain"
      aria-hidden="true"
    />
  ) : (
    <img
      src="/story/journey-poster.jpg"
      alt=""
      className="absolute inset-0 w-full h-full object-contain"
    />
  );

  return (
    <section ref={regionRef} className="relative bg-surface-950" aria-label="How CampusConsult works">
      {/* Mobile: slim sticky strip so the stage is always visible */}
      {!isDesktop && (
      <div className="sticky top-16 z-20 bg-surface-950/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="relative w-9 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-950">{media}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-wide">{STAGES[active].word}</p>
            <p className="text-xs text-white/50 truncate">{STAGES[active].kicker}</p>
          </div>
        </div>
        <div className="h-0.5 bg-white/10">
          <div ref={barRef} className="h-full origin-left bg-primary-400 scale-x-0" />
        </div>
      </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 lg:gap-14">
          {/* ── Sticky left column ──────────────────────────── */}
          {isDesktop && (
          <div className="lg:col-span-4">
            <div className="sticky top-24 py-6">
              {/* Native 9:16. aspect-ratio drives the height from the column
                  width, so the frame is never cropped; max-h keeps it inside
                  short viewports and object-contain absorbs the difference
                  against a matching dark backdrop. */}
              <div className="relative w-full aspect-[9/16] max-h-[calc(100vh-9rem)] mx-auto rounded-2xl overflow-hidden border border-white/10 bg-surface-950 shadow-2xl shadow-black/60">
                {media}
              </div>
            </div>
          </div>
          )}

          {/* ── Scrolling content ───────────────────────────── */}
          <div className="lg:col-span-8 py-16 sm:py-24">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary-300">
                How it works
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.025em] text-white">
                Match. Track. Apply. Succeed.
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Four stages between deciding to study in Germany and unpacking your suitcase there.
                Every one of them is free.
              </p>
            </div>

            <div className="mt-16 space-y-20 sm:space-y-28">
              {STAGES.map((stage, i) => (
                <div
                  key={stage.word}
                  ref={(el) => {
                    blockRefs.current[i] = el;
                  }}
                  className="scroll-mt-28"
                >
                  {/* Stage header */}
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-500/15 border border-primary-400/25 text-primary-300">
                      <stage.icon className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-2xl font-extrabold tracking-[0.16em] text-white leading-none">
                        {stage.word}
                      </p>
                      <p className="mt-1.5 text-sm text-white/50">{stage.kicker}</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-8">
                    {stage.blocks.map((b) => (
                      <div
                        key={b.heading}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8"
                      >
                        <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-white">
                          {b.heading}
                        </h3>
                        <p className="mt-3.5 text-base leading-relaxed text-white/70">{b.body}</p>

                        {b.points && (
                          <ul className="mt-5 space-y-2.5">
                            {b.points.map((pt) => (
                              <li key={pt} className="flex items-start gap-2.5 text-sm text-white/80">
                                <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary-400" />
                                {pt}
                              </li>
                            ))}
                          </ul>
                        )}

                        {b.image && (
                          <div className="mt-7 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/[0.07] border-b border-white/10">
                              <span className="w-2 h-2 rounded-full bg-white/25" />
                              <span className="w-2 h-2 rounded-full bg-white/25" />
                              <span className="w-2 h-2 rounded-full bg-white/25" />
                            </div>
                            <img
                              src={b.image}
                              alt={b.heading}
                              loading="lazy"
                              decoding="async"
                              className="block w-full"
                            />
                          </div>
                        )}

                        <Link
                          to={b.to}
                          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-300 hover:text-primary-200 hover:gap-2.5 transition-all"
                        >
                          {b.cta}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Close the arc where the video does */}
            <div className="mt-20 rounded-3xl border border-primary-400/25 bg-gradient-to-br from-primary-500/15 to-transparent p-8 sm:p-10">
              <Award className="w-8 h-8 text-primary-300" />
              <h3 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-white">
                All four stages, none of the fees
              </h3>
              <p className="mt-3 text-base text-white/70 max-w-lg">
                An agency charges €1,500+ to walk you through this. Here it costs nothing, and you
                keep control of every document.
              </p>
              <Link
                to="/register"
                className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-surface-950 bg-primary-400 hover:bg-primary-300 rounded-xl transition-colors active:scale-[0.98]"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
