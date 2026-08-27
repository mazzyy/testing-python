import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons (inline SVG for standalone demo) ---
const icons = {
    sparkles: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
            <path d="M18 2l.5 1.5L20 4l-1.5.5L18 6l-.5-1.5L16 4l1.5-.5L18 2z" opacity=".6" />
        </svg>
    ),
    graduation: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M22 10l-10-6L2 10l10 6 10-6z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" /><path d="M22 10v6" />
        </svg>
    ),
    fileText: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
    ),
    languages: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
        </svg>
    ),
    plane: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
        </svg>
    ),
    building: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18zM6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
        </svg>
    ),
    send: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
    ),
    creditCard: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    award: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="7" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </svg>
    ),
    arrow: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    ),
    arrowLeft: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    ),
    x: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    ),
    fileCheck: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M9 15l2 2 4-4" />
        </svg>
    ),
};

// --- Journey Steps Data ---
const journeySteps = [
    {
        id: 0,
        icon: icons.sparkles,
        gradient: "linear-gradient(135deg, #f59e0b, #ea580c)",
        accentColor: "#f59e0b",
        bgPattern: "radial-gradient(circle at 20% 80%, rgba(245,158,11,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(234,88,12,0.06) 0%, transparent 50%)",
        title: "Welcome to CampusConsult!",
        subtitle: "Your German Study Journey Starts Here",
        description: "We'll guide you through every step — from finding the perfect program to landing in Germany.",
        features: [
            { icon: icons.check, text: "AI-Powered Program Matching", color: "#f59e0b" },
            { icon: icons.check, text: "Document Preparation Tools", color: "#ea580c" },
            { icon: icons.check, text: "Application Tracking Dashboard", color: "#dc2626" },
        ],
    },
    {
        id: 1,
        icon: icons.fileText,
        gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        accentColor: "#3b82f6",
        bgPattern: "radial-gradient(circle at 70% 70%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 30% 30%, rgba(29,78,216,0.06) 0%, transparent 50%)",
        title: "Complete Your Profile",
        subtitle: "Build Your Academic Foundation",
        description: "Fill in your academic background for personalized program recommendations.",
        features: [
            { icon: icons.graduation, text: "Academic Background & GPA", color: "#3b82f6" },
            { icon: icons.languages, text: "Language Proficiency Levels", color: "#2563eb" },
            { icon: icons.award, text: "Skills & Achievements", color: "#1d4ed8" },
        ],
    },
    {
        id: 2,
        icon: icons.building,
        gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
        accentColor: "#8b5cf6",
        bgPattern: "radial-gradient(circle at 60% 80%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(109,40,217,0.06) 0%, transparent 50%)",
        title: "Find Your Program",
        subtitle: "Discover Perfect Matches",
        description: "Our AI analyzes 1,000+ German programs to surface the best fits for your profile.",
        features: [
            { icon: icons.check, text: "Match scores based on your profile", color: "#8b5cf6" },
            { icon: icons.check, text: "Filter by city, degree & language", color: "#7c3aed" },
            { icon: icons.check, text: "Compare deadlines & requirements", color: "#6d28d9" },
        ],
    },
    {
        id: 3,
        icon: icons.send,
        gradient: "linear-gradient(135deg, #10b981, #059669)",
        accentColor: "#10b981",
        bgPattern: "radial-gradient(circle at 80% 60%, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 40%, rgba(5,150,105,0.06) 0%, transparent 50%)",
        title: "Apply to Universities",
        subtitle: "Submit Winning Applications",
        description: "Create polished applications with AI-assisted tools built for German universities.",
        features: [
            { icon: icons.fileCheck, text: "SOP Generator with AI assistance", color: "#10b981" },
            { icon: icons.fileText, text: "CV Builder for German standards", color: "#059669" },
            { icon: icons.check, text: "Application checklist & tracking", color: "#047857" },
        ],
    },
    {
        id: 4,
        icon: icons.creditCard,
        gradient: "linear-gradient(135deg, #ec4899, #db2777)",
        accentColor: "#ec4899",
        bgPattern: "radial-gradient(circle at 30% 70%, rgba(236,72,153,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(219,39,119,0.06) 0%, transparent 50%)",
        title: "Secure Your Funding",
        subtitle: "Scholarships & Blocked Account",
        description: "Find scholarships and prepare the financial documents you'll need.",
        features: [
            { icon: icons.award, text: "Deutschlandstipendium & more", color: "#ec4899" },
            { icon: icons.check, text: "Scholarship eligibility checker", color: "#db2777" },
            { icon: icons.creditCard, text: "Blocked account guidance (€11,208)", color: "#be185d" },
        ],
    },
    {
        id: 5,
        icon: icons.plane,
        gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
        accentColor: "#06b6d4",
        bgPattern: "radial-gradient(circle at 50% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(8,145,178,0.06) 0%, transparent 50%)",
        title: "Get Your Visa & Fly!",
        subtitle: "Final Steps to Germany",
        description: "Complete your visa application, pack your bags, and begin your adventure.",
        features: [
            { icon: icons.fileCheck, text: "Visa document checklist", color: "#06b6d4" },
            { icon: icons.check, text: "Embassy appointment guide", color: "#0891b2" },
            { icon: icons.plane, text: "Pre-departure preparation", color: "#0e7490" },
        ],
    },
];

// --- Animation Variants ---
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 40 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: "spring", damping: 28, stiffness: 320, mass: 0.8 },
    },
    exit: {
        opacity: 0, scale: 0.92, y: 40,
        transition: { duration: 0.25, ease: "easeIn" },
    },
};

const contentVariants = {
    enter: (dir: number) => ({
        x: dir > 0 ? 320 : -320,
        opacity: 0,
        filter: "blur(4px)",
    }),
    center: {
        x: 0, opacity: 1, filter: "blur(0px)",
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (dir: number) => ({
        x: dir > 0 ? -320 : 320,
        opacity: 0,
        filter: "blur(4px)",
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    }),
};

const featureItemVariants = {
    hidden: { opacity: 0, x: -16, filter: "blur(3px)" },
    visible: (i: number) => ({
        opacity: 1, x: 0, filter: "blur(0px)",
        transition: { delay: 0.28 + i * 0.09, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
};

const iconPopVariants = {
    hidden: { scale: 0, rotate: -90, opacity: 0 },
    visible: {
        scale: 1, rotate: 0, opacity: 1,
        transition: { type: "spring", damping: 14, stiffness: 200, delay: 0.08 },
    },
};

// --- Floating Particle ---
function FloatingParticle({ delay, x, y, size, color }: { delay: number, x: number | string, y: number | string, size: number, color: string }) {
    return (
        <motion.div
            style={{
                position: "absolute",
                left: x, top: y,
                width: size, height: size,
                borderRadius: "50%",
                background: color,
                pointerEvents: "none",
            }}
            animate={{
                y: [0, -12, 0, 8, 0],
                x: [0, 6, -4, 2, 0],
                opacity: [0.3, 0.6, 0.3, 0.5, 0.3],
                scale: [1, 1.2, 0.9, 1.1, 1],
            }}
            transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
            }}
        />
    );
}

// --- Progress Ring ---
function ProgressRing({ progress, accentColor }: { progress: number, accentColor: string }) {
    const r = 30;
    const circ = 2 * Math.PI * r;
    const offset = circ - progress * circ;

    return (
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2.5" />
            <motion.circle
                cx="32" cy="32" r={r}
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
        </svg>
    );
}

// --- Main Component ---
interface ProfileOnboardingProps {
    onComplete: () => void;
    onSkip: () => void;
}

export default function ProfileOnboarding({ onComplete, onSkip }: ProfileOnboardingProps) {
    const [[currentStep, direction], setStep] = useState([0, 0]);

    const step = journeySteps[currentStep];
    const isLast = currentStep === journeySteps.length - 1;
    const isFirst = currentStep === 0;
    const progress = (currentStep + 1) / journeySteps.length;

    const paginate = useCallback((dir: number) => {
        if (dir > 0 && !isLast) setStep([currentStep + 1, 1]);
        else if (dir < 0 && !isFirst) setStep([currentStep - 1, -1]);
    }, [currentStep, isLast, isFirst]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") paginate(1);
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") paginate(-1);
            if (e.key === "Escape") onSkip();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [paginate, onSkip]);

    const handleNext = () => {
        if (isLast) onComplete();
        else paginate(1);
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&display=swap');

        .onboard-root * {
          margin: 0; padding: 0; box-sizing: border-box;
        }
        .onboard-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .onboard-backdrop {
          position: absolute; inset: 0;
          background: rgba(8, 10, 20, 0.72);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
        }
        .onboard-modal {
          position: relative; width: 100%; max-width: 560px;
          background: #fff;
          border-radius: 28px;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.04),
            0 24px 80px -12px rgba(0,0,0,0.28),
            0 8px 24px -8px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .onboard-header {
          position: relative;
          padding: 22px 28px 16px;
          overflow: hidden;
        }
        .onboard-header-bg {
          position: absolute; inset: 0;
          transition: background 0.5s ease;
        }
        .onboard-header-noise {
          position: absolute; inset: 0;
          opacity: 0.06;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 128px;
        }
        .onboard-close {
          position: absolute; top: 16px; right: 16px; z-index: 10;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border: none; border-radius: 50%;
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .onboard-close:hover {
          background: rgba(255,255,255,0.22);
          color: #fff;
          transform: scale(1.08);
        }
        .onboard-dots {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-bottom: 14px; position: relative; z-index: 2;
        }
        .onboard-dot {
          border: none; padding: 0; cursor: pointer;
          height: 6px; border-radius: 3px;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          background: rgba(255,255,255,0.25);
        }
        .onboard-dot:hover { background: rgba(255,255,255,0.5); }
        .onboard-dot.active { background: #fff; width: 28px !important; }
        .onboard-dot.completed { background: rgba(255,255,255,0.7); }
        .onboard-counter {
          text-align: center; font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.55); position: relative; z-index: 2;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .onboard-content-area {
          position: relative;
          height: 420px;
          overflow: hidden;
        }
        .onboard-slide {
          position: absolute; inset: 0;
          padding: 24px 36px 36px;
          display: flex; flex-direction: column; align-items: center;
        }
        .onboard-icon-wrap {
          position: relative;
          width: 64px; height: 64px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .onboard-icon-circle {
          width: 50px; height: 50px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 6px 24px -4px rgba(0,0,0,0.15);
        }
        .onboard-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 22px; font-weight: 600;
          color: #0f172a;
          text-align: center;
          line-height: 1.25;
          margin-bottom: 3px;
        }
        .onboard-subtitle {
          font-size: 13px; font-weight: 500;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        .onboard-desc {
          font-size: 13.5px; line-height: 1.55;
          color: #64748b;
          text-align: center;
          max-width: 380px;
          margin-bottom: 18px;
        }
        .onboard-features {
          display: flex; flex-direction: column; gap: 8px;
          width: 100%; max-width: 360px;
        }
        .onboard-feature {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          transition: all 0.25s;
        }
        .onboard-feature:hover {
          background: #f1f5f9;
          transform: translateX(4px);
        }
        .onboard-feature-icon {
          width: 30px; height: 30px; flex-shrink: 0;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: 14px;
        }
        .onboard-feature-text {
          font-size: 13.5px; font-weight: 500;
          color: #334155;
          line-height: 1.3;
        }
        .onboard-footer {
          padding: 12px 28px 14px;
          background: #fafbfc;
          border-top: 1px solid #f1f5f9;
        }
        .onboard-nav {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .onboard-btn-back {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          border: none; border-radius: 10px;
          font-family: 'DM Sans', system-ui;
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #94a3b8;
        }
        .onboard-btn-back:not(:disabled):hover {
          background: #fff;
          color: #475569;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .onboard-btn-back:disabled {
          opacity: 0.3; cursor: not-allowed;
        }
        .onboard-btn-next {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 22px;
          border: none; border-radius: 12px;
          font-family: 'DM Sans', system-ui;
          font-size: 13.5px; font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 3px 12px -2px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
        }
        .onboard-btn-next::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .onboard-btn-next:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -4px rgba(0,0,0,0.2);
          filter: brightness(1.05);
        }
        .onboard-btn-next:active {
          transform: translateY(0);
        }
        .onboard-skip {
          display: block; width: 100%;
          margin-top: 8px;
          border: none; background: none;
          font-family: 'DM Sans', system-ui;
          font-size: 11.5px; font-weight: 400;
          color: #94a3b8;
          cursor: pointer;
          text-align: center;
          transition: color 0.2s;
          padding: 2px;
        }
        .onboard-skip:hover { color: #64748b; }

        .onboard-swipe-hint {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: #d4d9df;
          letter-spacing: 0.3px;
          user-select: none;
          pointer-events: none;
        }

        /* --- Step Number Badge --- */
        .step-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px 3px 4px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .step-badge-num {
          width: 20px; height: 20px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          color: #fff;
        }

        @media (max-width: 480px) {
          .onboard-modal { border-radius: 20px; }
          .onboard-header { padding: 18px 18px 14px; }
          .onboard-slide { padding: 20px 18px 28px; }
          .onboard-footer { padding: 10px 18px 12px; }
          .onboard-title { font-size: 19px; }
          .onboard-content-area { height: 400px; }
          .onboard-icon-wrap { width: 56px; height: 56px; margin-bottom: 10px; }
          .onboard-icon-circle { width: 44px; height: 44px; border-radius: 12px; }
        }
      `}</style>

            <div className="onboard-root">
                <motion.div
                    className="onboard-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onSkip}
                />

                <motion.div
                    className="onboard-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Header */}
                    <div className="onboard-header">
                        <motion.div
                            className="onboard-header-bg"
                            animate={{ background: step.gradient }}
                            transition={{ duration: 0.5 }}
                        />
                        <div className="onboard-header-noise" />

                        {/* Floating particles */}
                        {[...Array(5)].map((_, i) => (
                            <FloatingParticle
                                key={i}
                                delay={i * 0.8}
                                x={`${15 + i * 18}%`}
                                y={`${20 + (i % 3) * 25}%`}
                                size={4 + (i % 3) * 2}
                                color={`rgba(255,255,255,${0.08 + (i % 3) * 0.06})`}
                            />
                        ))}

                        <button className="onboard-close" onClick={onSkip}>
                            {icons.x}
                        </button>

                        {/* Step dots */}
                        <div className="onboard-dots">
                            {journeySteps.map((_, i) => (
                                <button
                                    key={i}
                                    className={`onboard-dot ${i === currentStep ? "active" : ""} ${i < currentStep ? "completed" : ""}`}
                                    style={{ width: i === currentStep ? 28 : 6 }}
                                    onClick={() => setStep([i, i > currentStep ? 1 : -1])}
                                    aria-label={`Go to step ${i + 1}`}
                                />
                            ))}
                        </div>

                        <div className="onboard-counter">
                            Step {currentStep + 1} of {journeySteps.length}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="onboard-content-area" style={{ background: step.bgPattern }}>
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentStep}
                                className="onboard-slide"
                                custom={direction}
                                variants={contentVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x < -60 && !isLast) paginate(1);
                                    else if (info.offset.x > 60 && !isFirst) paginate(-1);
                                }}
                                style={{ cursor: "grab" }}
                            >
                                {/* Icon with progress ring */}
                                <motion.div
                                    className="onboard-icon-wrap"
                                    variants={iconPopVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <ProgressRing progress={progress} accentColor={step.accentColor} />
                                    <div className="onboard-icon-circle" style={{ background: step.gradient }}>
                                        {step.icon}
                                    </div>
                                </motion.div>

                                {/* Step badge (shown for steps 2-6) */}
                                {currentStep > 0 && (
                                    <motion.div
                                        className="step-badge"
                                        style={{ background: `${step.accentColor}12`, color: step.accentColor }}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.12 }}
                                    >
                                        <span className="step-badge-num" style={{ background: step.accentColor }}>
                                            {currentStep}
                                        </span>
                                        Step {currentStep} of 5
                                    </motion.div>
                                )}

                                {/* Title */}
                                <motion.h2
                                    className="onboard-title"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.14, duration: 0.4 }}
                                >
                                    {step.title}
                                </motion.h2>

                                {/* Subtitle */}
                                <motion.p
                                    className="onboard-subtitle"
                                    style={{ color: step.accentColor }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.18, duration: 0.4 }}
                                >
                                    {step.subtitle}
                                </motion.p>

                                {/* Description */}
                                <motion.p
                                    className="onboard-desc"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.22, duration: 0.4 }}
                                >
                                    {step.description}
                                </motion.p>

                                {/* Features */}
                                <div className="onboard-features">
                                    {step.features.map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            className="onboard-feature"
                                            variants={featureItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            custom={i}
                                        >
                                            <div
                                                className="onboard-feature-icon"
                                                style={{ background: feature.color }}
                                            >
                                                {feature.icon}
                                            </div>
                                            <span className="onboard-feature-text">{feature.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="onboard-swipe-hint">
                            ← Swipe or use arrow keys →
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="onboard-footer">
                        <div className="onboard-nav">
                            <motion.button
                                className="onboard-btn-back"
                                disabled={isFirst}
                                onClick={() => paginate(-1)}
                                whileTap={!isFirst ? { scale: 0.96 } : {}}
                            >
                                {icons.arrowLeft}
                                Back
                            </motion.button>

                            <motion.button
                                className="onboard-btn-next"
                                style={{ background: step.gradient }}
                                onClick={handleNext}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                layout
                            >
                                {isLast ? (
                                    <>
                                        Start My Journey
                                        <motion.span
                                            animate={{ rotate: [0, 8, -8, 0] }}
                                            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                                        >
                                            {icons.sparkles}
                                        </motion.span>
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        {icons.arrow}
                                    </>
                                )}
                            </motion.button>
                        </div>

                        <button className="onboard-skip" onClick={onSkip}>
                            Skip introduction
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}