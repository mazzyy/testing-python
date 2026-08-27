import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Send, X, User, LogIn, ArrowDown, ExternalLink, Sparkles, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { vaultApi } from "../../api/vault";
import type { ProgramRecommendation, Scholarship, University, ChatMessage } from "../../types";
import { Document as VaultDocument } from "../../types/vault";
import { subscribeNovaNotifications, type NovaNotification } from "./NovaToast";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NOVA BOT — Premium Floating AI Chat Widget
   Aesthetic: Soft-tech / Glassmorphic / Playful-Premium
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// ─── Nova Face SVG ──────────────────────────────────────────────────
function NovaFace({ emotion = "idle", size = 60 }: { emotion?: string; size?: number }) {
    const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const faceRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (!faceRef.current) return;
            const rect = faceRef.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                setMousePos({
                    x: (dx / dist) * Math.min(dist * 0.04, 2.8),
                    y: (dy / dist) * Math.min(dist * 0.04, 2.8),
                });
            }
        };
        window.addEventListener("mousemove", handle);
        return () => window.removeEventListener("mousemove", handle);
    }, []);

    const isHappy = emotion === "happy";
    const isSad = emotion === "sad";
    const eyeY = isHappy ? 32 : 30;

    return (
        <svg ref={faceRef} width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ overflow: "visible" }}>
            {/* Outer glow */}
            <defs>
                <linearGradient id={`nova-body-${size}`} x1="22" y1="22" x2="78" y2="74" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6EE7B7" />
                    <stop offset="0.5" stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
                <filter id={`nova-shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8B5CF6" floodOpacity="0.25" />
                </filter>
                <radialGradient id={`nova-screen-${size}`} cx="50%" cy="40%" r="60%">
                    <stop stopColor="#F0F9FF" />
                    <stop offset="1" stopColor="#DBEAFE" />
                </radialGradient>
            </defs>

            {/* Antenna */}
            <rect x="47" y="10" width="6" height="12" rx="3" fill="#7C3AED" opacity="0.8" />
            <circle cx="50" cy="8" r="5" fill="#A78BFA">
                <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="8" r="3" fill="#DDD6FE">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Ears */}
            <rect x="17" y="42" width="7" height="14" rx="3.5" fill="#7C3AED" opacity="0.6" />
            <rect x="76" y="42" width="7" height="14" rx="3.5" fill="#7C3AED" opacity="0.6" />

            {/* Body */}
            <rect x="22" y="22" width="56" height="52" rx="16" fill={`url(#nova-body-${size})`} filter={`url(#nova-shadow-${size})`} />

            {/* Screen */}
            <rect x="28" y="28" width="44" height="40" rx="11" fill={`url(#nova-screen-${size})`} />

            {/* Eyes */}
            <g>
                {isHappy ? (
                    <>
                        <path d="M 35 38 Q 39 31 43 38" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <path d="M 57 38 Q 61 31 65 38" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </>
                ) : isSad ? (
                    <>
                        {/* Wide worried eyes */}
                        <rect x="33" y={eyeY - 6} width="13" height="17" rx="6.5" fill="white" />
                        <rect x="54" y={eyeY - 6} width="13" height="17" rx="6.5" fill="white" />
                        <circle cx={39.5 + mousePos.x} cy={eyeY + 3 + mousePos.y} r="3.8" fill="#1E1B4B" />
                        <circle cx={60.5 + mousePos.x} cy={eyeY + 3 + mousePos.y} r="3.8" fill="#1E1B4B" />
                        {/* Worried eyebrows */}
                        <path d="M 33 22 Q 38 20 44 25" stroke="#6D28D9" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                        <path d="M 67 22 Q 62 20 56 25" stroke="#6D28D9" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    </>
                ) : (
                    <>
                        <rect x="34" y={eyeY - 5} width="11" height="16" rx="5.5" fill="white" />
                        <rect x="55" y={eyeY - 5} width="11" height="16" rx="5.5" fill="white" />
                        <circle cx={39.5 + mousePos.x} cy={eyeY + 3 + mousePos.y} r="3.2" fill="#1E1B4B">
                            <animate attributeName="r" values="3.2;3.2;0.5;3.2;3.2" dur="4s" repeatCount="indefinite" keyTimes="0;0.92;0.95;0.98;1" />
                        </circle>
                        <circle cx={60.5 + mousePos.x} cy={eyeY + 3 + mousePos.y} r="3.2" fill="#1E1B4B">
                            <animate attributeName="r" values="3.2;3.2;0.5;3.2;3.2" dur="4s" repeatCount="indefinite" keyTimes="0;0.92;0.95;0.98;1" />
                        </circle>
                        {/* Eye shine */}
                        <circle cx={37.5 + mousePos.x * 0.5} cy={eyeY + 0.5 + mousePos.y * 0.5} r="1.2" fill="white" opacity="0.8" />
                        <circle cx={58.5 + mousePos.x * 0.5} cy={eyeY + 0.5 + mousePos.y * 0.5} r="1.2" fill="white" opacity="0.8" />
                    </>
                )}
            </g>

            {/* Blush */}
            {isHappy && (
                <>
                    <ellipse cx="32" cy="46" rx="5" ry="2.5" fill="#FCA5A5" opacity="0.5" />
                    <ellipse cx="68" cy="46" rx="5" ry="2.5" fill="#FCA5A5" opacity="0.5" />
                </>
            )}

            {/* Mouth */}
            {emotion === "thinking" ? (
                <g fill="#6D28D9">
                    <circle cx="44" cy="54" r="2"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" /></circle>
                    <circle cx="50" cy="54" r="2"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.2s" repeatCount="indefinite" /></circle>
                    <circle cx="56" cy="54" r="2"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.4s" repeatCount="indefinite" /></circle>
                </g>
            ) : isHappy ? (
                <path d="M 41 50 Q 50 58 59 50" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : isSad ? (
                <path d="M 42 57 Q 50 52 58 57" stroke="#6D28D9" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            ) : (
                <path d="M 45 54 Q 50 57 55 54" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}
        </svg>
    );
}

// ─── Particle Ring ──────────────────────────────────────────────────
function ParticleRing({ active }: { active: boolean }) {
    const particles = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            angle: (i / 6) * 360,
            delay: i * 0.15,
            size: 3 + Math.random() * 3,
        })), []
    );

    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    animate={active ? {
                        rotate: [p.angle, p.angle + 360],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1, 0.5],
                    } : { opacity: 0 }}
                    transition={{ duration: 3, repeat: Infinity, delay: p.delay, ease: "linear" }}
                    style={{
                        position: "absolute",
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: `hsl(${220 + p.id * 30}, 80%, 70%)`,
                        top: "50%",
                        left: "50%",
                        transformOrigin: `0 ${-30 + p.id * 2}px`,
                    }}
                />
            ))}
        </div>
    );
}

// ─── Floating Orbs Background ───────────────────────────────────────
function FloatingOrbs() {
    return (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none" }}>
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    animate={{
                        x: [0, 30 - i * 20, -20 + i * 10, 0],
                        y: [0, -20 + i * 15, 10 - i * 5, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        width: 80 + i * 40,
                        height: 80 + i * 40,
                        borderRadius: "50%",
                        background: [
                            "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
                            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
                            "radial-gradient(circle, rgba(110,231,183,0.1) 0%, transparent 70%)",
                        ][i],
                        top: ["10%", "60%", "30%"][i],
                        left: ["-10%", "60%", "20%"][i],
                    }}
                />
            ))}
        </div>
    );
}

// ─── Quick Questions ────────────────────────────────────────────────
const quickQuestions = [
    { text: "Best programs for me?", icon: "🎓" },
    { text: "Scholarship options?", icon: "💰" },
    { text: "Tuition-free universities?", icon: "🏛️" },
    { text: "How to improve my profile?", icon: "📈" },
];

// ─── Simple markdown renderer ───────────────────────────────────────
function SimpleMarkdown({ content, onNavigate }: { content: string, onNavigate?: (path: string) => void }) {
    // Very basic: bold, italic, links, line breaks
    const html = content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // If href starts with /, make it an internal link, otherwise external
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
            if (url.startsWith('/')) {
                return `<a href="${url}" class="internal-link" data-href="${url}" style="color: #6EE7B7; text-decoration: underline; cursor: pointer;">${text}</a>`;
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        })
        .replace(/\n/g, "<br/>");

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' && target.classList.contains('internal-link')) {
            e.preventDefault();
            const href = target.getAttribute('data-href');
            if (href && onNavigate) {
                onNavigate(href);
            }
        }
    };

    return <div dangerouslySetInnerHTML={{ __html: html }} onClick={handleClick} />;
}

// ─── Compact Program Card for Chat ──────────────────────────────────
function NovaProgramCard({ rec, onNavigate, onShowAnalysis }: { rec: ProgramRecommendation; onNavigate: (id: string) => void; onShowAnalysis: (rec: ProgramRecommendation) => void }) {
    const { program, match_score, highlights } = rec;
    const lang = Array.isArray(program.teaching_language) ? program.teaching_language[0] : program.teaching_language;
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                background: "rgba(139,92,246,0.06)",
                border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
            whileHover={{ scale: 1.01, borderColor: "rgba(139,92,246,0.35)" }}
            onClick={() => onNavigate(program.slug || String(program.id))}
        >
            {/* Match Score Ring (Clickable for Modal) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onShowAnalysis(rec);
                }}
                className="hover:scale-105 transition-transform"
                title="Click to see AI Match Analysis"
                style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: `conic-gradient(#6EE7B7 ${match_score}%, rgba(255,255,255,0.06) 0%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, position: "relative", border: "none", cursor: "pointer", padding: 0
                }}
            >
                <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "#1a1a2e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#6EE7B7",
                }}>
                    {match_score}%
                </div>
            </button>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    {program.degree_type && (
                        <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            background: "rgba(139,92,246,0.12)", color: "#A78BFA", fontWeight: 600,
                        }}>
                            {program.degree_type}
                        </span>
                    )}
                    {lang && (
                        <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            background: "rgba(59,130,246,0.1)", color: "#93C5FD", fontWeight: 500,
                        }}>
                            {lang}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8F0", lineHeight: 1.3 }}>
                    {program.program_name}
                </div>
                <div style={{ fontSize: 11, color: "#8B8BA0", marginTop: 2 }}>
                    {program.university_name}{program.city ? ` · ${program.city}` : ""}
                </div>
                {highlights && (
                    <div style={{ fontSize: 11, color: "#A78BFA", marginTop: 4, fontStyle: "italic", lineHeight: 1.4 }}>
                        "{highlights}"
                    </div>
                )}
            </div>

            {/* Arrow */}
            <ExternalLink size={14} style={{ color: "#8B8BA0", flexShrink: 0, marginTop: 2 }} />
        </motion.div>
    );
}

// ─── Compact Scholarship Card for Chat ──────────────────────────────
function NovaScholarshipCard({ scholarship, onNavigate }: { scholarship: Scholarship; onNavigate: (id: number) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.18)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
            whileHover={{ scale: 1.01, borderColor: "rgba(251,191,36,0.4)" }}
            onClick={() => onNavigate(scholarship.id)}
        >
            {/* Scholarship icon */}
            <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 18,
            }}>
                🎓
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    {scholarship.duration && (
                        <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            background: "rgba(251,191,36,0.12)", color: "#FBBF24", fontWeight: 600,
                        }}>
                            {scholarship.duration}
                        </span>
                    )}
                    {scholarship.deadline && (
                        <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            background: "rgba(239,68,68,0.1)", color: "#FCA5A5", fontWeight: 500,
                        }}>
                            Deadline: {scholarship.deadline.length > 30 ? scholarship.deadline.substring(0, 30) + '...' : scholarship.deadline}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8F0", lineHeight: 1.3 }}>
                    {scholarship.title}
                </div>
                {scholarship.value_benefits && (
                    <div style={{ fontSize: 11, color: "#FBBF24", marginTop: 4, fontStyle: "italic", lineHeight: 1.4 }}>
                        {scholarship.value_benefits.length > 80 ? scholarship.value_benefits.substring(0, 80) + '...' : scholarship.value_benefits}
                    </div>
                )}
            </div>

            {/* Arrow */}
            <ExternalLink size={14} style={{ color: "#8B8BA0", flexShrink: 0, marginTop: 2 }} />
        </motion.div>
    );
}

// ─── Compact University Card for Chat ──────────────────────────────
function NovaUniversityCard({ uni, onNavigate }: { uni: University; onNavigate: (name: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                background: "rgba(59,130,246,0.06)",
                border: "1px solid rgba(59,130,246,0.18)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
            whileHover={{ scale: 1.01, borderColor: "rgba(59,130,246,0.4)" }}
            onClick={() => onNavigate(uni.name)}
        >
            {/* University icon */}
            <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 18,
            }}>
                🏛️
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    {uni.cities && uni.cities.length > 0 && (
                        <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            background: "rgba(59,130,246,0.12)", color: "#93C5FD", fontWeight: 600,
                        }}>
                            📍 {uni.cities[0]}
                        </span>
                    )}
                    {uni.program_count && (
                        <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 8,
                            background: "rgba(16,185,129,0.1)", color: "#6EE7B7", fontWeight: 500,
                        }}>
                            {uni.program_count} Programs
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8F0", lineHeight: 1.3 }}>
                    {uni.name}
                </div>
                {uni.degree_types && uni.degree_types.length > 0 && (
                    <div style={{ fontSize: 11, color: "#93C5FD", marginTop: 4, fontStyle: "italic", lineHeight: 1.4 }}>
                        Offers: {uni.degree_types.filter(Boolean).join(", ")}
                    </div>
                )}
            </div>

            {/* Arrow */}
            <ExternalLink size={14} style={{ color: "#8B8BA0", flexShrink: 0, marginTop: 2 }} />
        </motion.div>
    );
}

// ─── Nova Document Card ─────────────────────────────────────────────
function NovaDocumentCard({ doc }: { doc: VaultDocument }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDownloading(true);
        try {
            await vaultApi.downloadDocument(doc.id, doc.file_name);
        } catch (error) {
            console.error("Failed to download", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                background: "rgba(107,114,128,0.04)",
                border: "1px solid rgba(107,114,128,0.15)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                gap: 12,
                alignItems: "center",
                transition: "all 0.2s",
            }}
            whileHover={{ scale: 1.01, borderColor: "rgba(107,114,128,0.3)" }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: "10px",
                background: "rgba(107,114,128,0.1)", color: "#9CA3AF",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                <FileText size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.file_name}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, textTransform: "capitalize" }}>
                    {doc.category.replace(/_/g, ' ')}
                </div>
            </div>

            <button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{
                    padding: "8px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#D1D5DB", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: isDownloading ? 0.5 : 1
                }}
                title="Download Document"
            >
                <Download size={14} className={isDownloading ? "animate-bounce" : ""} />
            </button>
        </motion.div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function NovaBot() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [isOpen, setIsOpen] = useState(false);
    const [emotion, setEmotion] = useState("idle");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [limitReached, setLimitReached] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedRec, setSelectedRec] = useState<ProgramRecommendation | null>(null);
    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    const [activeNotification, setActiveNotification] = useState<NovaNotification | null>(null);
    const [activeLoadingSteps, setActiveLoadingSteps] = useState<string[]>([
        "Analyzing request...", "Gathering information...", "Formulating response..."
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const triggerScale = useMotionValue(1);
    const triggerSpring = useSpring(triggerScale, { stiffness: 400, damping: 15 });

    // ─── Hide on specific pages ──────────
    const isHidden = false;

    // ─── Load persisted messages ─────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setMessages([]);
            return;
        }

        try {
            const stored = localStorage.getItem(`nova-chat-${user.id}`);
            if (stored) {
                const parsed = JSON.parse(stored);

                // Handle new object format with timestamp
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.messages) {
                    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
                    const isExpired = Date.now() - (parsed.timestamp || 0) > ONE_DAY_MS;

                    if (!isExpired && Array.isArray(parsed.messages)) {
                        setMessages(parsed.messages);
                    } else {
                        // Clear expired cache
                        localStorage.removeItem(`nova-chat-${user.id}`);
                        setMessages([]);
                    }
                }
                // Handle backwards compatibility for old array-based format
                else if (Array.isArray(parsed)) {
                    setMessages(parsed);
                    // Resave in new format immediately to start the 24h timer
                    localStorage.setItem(`nova-chat-${user.id}`, JSON.stringify({
                        timestamp: Date.now(),
                        messages: parsed
                    }));
                }
            } else {
                setMessages([]);
            }
        } catch {
            setMessages([]);
        }
    }, [isAuthenticated, user]);

    // ─── Persist messages ────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user || messages.length === 0) return;
        try {
            localStorage.setItem(`nova-chat-${user.id}`, JSON.stringify({
                timestamp: Date.now(),
                messages: messages
            }));
        } catch { }
    }, [messages, isAuthenticated, user]);

    // ─── Wave on mount ────────────────────────────────────────────
    useEffect(() => {
        setEmotion("waving");
        const t = setTimeout(() => setEmotion("idle"), 2500);
        return () => clearTimeout(t);
    }, []);

    // ─── Subscribe to notification store ──────────────────────────
    useEffect(() => {
        const unsubscribe = subscribeNovaNotifications((notification) => {
            setActiveNotification(notification);
            if (notification) {
                // Override Nova's emotion based on notification type
                const emotionMap: Record<string, string> = {
                    success: "happy",
                    error: "sad",
                    info: "happy",
                    loading: "thinking",
                };
                setEmotion(emotionMap[notification.type] || "idle");
            } else {
                // Return to idle when notification dismisses
                if (!isTyping) setEmotion("idle");
            }
        });
        return unsubscribe;
    }, [isTyping]);

    // ─── Scroll logic ─────────────────────────────────────────────
    const scrollToBottom = useCallback((instant: boolean | React.UIEvent = false) => {
        if (messagesEndRef.current) {
            // Use setTimeout to ensure DOM has painted before scrolling
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: instant === true ? "auto" : "smooth" });
            }, 50);
        }
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
    useEffect(() => { if (isOpen) scrollToBottom(true); }, [isOpen, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        setShowScrollDown(!atBottom && messages.length > 3);
    }, [messages.length]);

    // ─── Loading Steps Logic ──────────────────────────────────────
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isTyping) {
            timer = setInterval(() => {
                setLoadingStepIndex((prev) =>
                    prev < activeLoadingSteps.length - 1 ? prev + 1 : prev
                );
            }, 2500);
        }
        return () => clearInterval(timer);
    }, [isTyping, activeLoadingSteps.length]);

    const handleSend = async (msg = inputMessage) => {
        const text = typeof msg === "string" ? msg : inputMessage;
        if (!text.trim() || isTyping) return;

        const userMessageId = Date.now().toString();
        const assistantMessageId = (Date.now() + 1).toString();

        setMessages(prev => [...prev, {
            id: userMessageId,
            role: "user",
            content: text,
            timestamp: new Date()
        }]);
        setInputMessage("");
        setEmotion("thinking");
        setIsTyping(true);
        setLoadingStepIndex(0);

        // Intelligent Loading Steps based on input
        const lowerText = text.toLowerCase();
        if (lowerText.includes("program") || lowerText.includes("course") || lowerText.includes("university") || lowerText.includes("study")) {
            setActiveLoadingSteps(["Analyzing program requirements...", "Searching academic databases...", "Matching with your profile...", "Formulating response..."]);
        } else if (lowerText.includes("scholarship") || lowerText.includes("fund") || lowerText.includes("cost") || lowerText.includes("money")) {
            setActiveLoadingSteps(["Analyzing financial needs...", "Searching scholarship databases...", "Checking eligibility criteria...", "Formulating response..."]);
        } else if (lowerText.includes("cv") || lowerText.includes("resume") || lowerText.includes("document") || lowerText.includes("file") || lowerText.includes("vault")) {
            setActiveLoadingSteps(["Accessing secure document vault...", "Reading document contents...", "Analyzing extracted text...", "Formulating response..."]);
        } else {
            setActiveLoadingSteps(["Analyzing request...", "Gathering information...", "Formulating response..."]);
        }

        // Auto-resize textarea back
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        try {
            const token = localStorage.getItem("token");
            const baseUrl = (import.meta as any).env.VITE_API_URL || '/api';
            const response = await fetch(`${baseUrl}/recommendations/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: text,
                    include_recommendations: true,
                    n_results: 5,
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    setLimitReached(true);
                    setMessages(prev => [...prev, {
                        id: assistantMessageId,
                        role: "assistant",
                        content: "Daily chat limit reached. Try again tomorrow!",
                        timestamp: new Date()
                    }]);
                } else {
                    throw new Error("API request failed");
                }
                setIsTyping(false);
                setEmotion("idle");
                return;
            }

            // Handle standard JSON response
            const data = await response.json();

            setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: "assistant",
                content: data.response || "No response generated.",
                recommendations: data.recommendations,
                scholarships: data.scholarships,
                universities: data.universities,
                vault_documents: data.vault_documents,
                timestamp: new Date(),
            }]);

            setIsTyping(false);
            setEmotion("happy");
            if (!isOpen) setUnreadCount(c => c + 1);
            setTimeout(() => setEmotion("idle"), 2000);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: "assistant",
                content: "Oops, something went wrong. Please try again!",
                timestamp: new Date()
            }]);
            setIsTyping(false);
            setEmotion("idle");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value);
        // Auto-grow
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
    };

    const toggleChat = () => {
        if (!isOpen) {
            setEmotion("happy");
            setUnreadCount(0);
            setTimeout(() => { if (!isTyping) setEmotion("idle"); }, 1200);
        }
        setIsOpen(prev => !prev);
    };

    // ─── Animation variants ───────────────────────────────────────
    const panelVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.92, filter: "blur(8px)" },
        visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, y: 16, scale: 0.95, filter: "blur(4px)" },
    };

    const messageVariants = {
        hidden: (isUser: boolean) => ({
            opacity: 0,
            x: isUser ? 20 : -20,
            y: 8,
            scale: 0.95,
        }),
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 350, damping: 25 },
        },
    };

    // ─── Hide on /recommendations ─────────────────────────────────
    if (isHidden) return null;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');
  .nova-root {
          --nova-bg: #0F0F1A;
          --nova-surface: rgba(255,255,255,0.03);
          --nova-glass: rgba(255,255,255,0.06);
          --nova-glass-border: rgba(255,255,255,0.1);
          --nova-text: #E8E8F0;
          --nova-text-dim: #8B8BA0;
          --nova-accent-1: #8B5CF6;
          --nova-accent-2: #3B82F6;
          --nova-accent-3: #6EE7B7;
          --nova-gradient: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #6EE7B7 100%);
          --nova-panel-bg: #16162A;
          --nova-msg-bot: rgba(139,92,246,0.08);
          --nova-msg-user-gradient: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
          --nova-radius: 20px;
          --nova-font: 'DM Sans', -apple-system, sans-serif;
          --nova-font-mono: 'Space Mono', monospace;
        }

        .nova-root * {
          box-sizing: border-box;
        }

        .nova-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          font-family: var(--nova-font);
        }

        /* ─── Trigger Button ──────────────────────────── */
        .nova-trigger {
          position: relative;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .nova-trigger-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
          animation: nova-pulse-glow 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes nova-pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.12); opacity: 0.8; }
        }

        .nova-avatar-wrap {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
          filter: drop-shadow(0 4px 12px rgba(139,92,246,0.25));
        }

        .nova-avatar-float {
          animation: nova-float 3.5s ease-in-out infinite;
        }

        @keyframes nova-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .nova-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          background: #EF4444;
          color: white;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid var(--nova-panel-bg);
          font-family: var(--nova-font-mono);
        }

        /* ─── Notification Speech Bubble ──────────────── */
        .nova-speech-bubble {
          position: relative;
          max-width: 300px;
          padding: 12px 16px;
          border-radius: 16px 16px 4px 16px;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--nova-text);
          font-family: var(--nova-font);
        }

        .nova-speech-tail {
          position: absolute;
          bottom: -6px;
          right: 20px;
          width: 14px;
          height: 14px;
          clip-path: polygon(0 0, 100% 0, 100% 100%);
          pointer-events: none;
        }

        /* ─── Chat Panel ──────────────────────────────── */
        .nova-panel {
          width: 400px;
          max-width: calc(100vw - 32px);
          max-height: 560px;
          background: var(--nova-panel-bg);
          border-radius: var(--nova-radius);
          border: 1px solid var(--nova-glass-border);
          box-shadow:
            0 32px 64px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.03),
            0 0 120px rgba(139,92,246,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        @media (max-width: 768px) {
          .nova-panel { 
            width: calc(100vw - 32px); 
            max-height: calc(100dvh - 120px); 
          }
          .nova-container { right: 16px; bottom: 16px; }
          .nova-speech-bubble { max-width: calc(100vw - 64px); }
        }

        /* ─── Header ──────────────────────────────────── */
        .nova-header {
          position: relative;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--nova-glass-border);
          overflow: hidden;
        }

        .nova-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 100%);
        }

        .nova-header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--nova-glass);
          border: 1px solid var(--nova-glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .nova-header-info {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .nova-header-info h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: var(--nova-text);
          letter-spacing: -0.02em;
        }

        .nova-header-status {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 2px;
        }

        .nova-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--nova-accent-3);
          box-shadow: 0 0 6px var(--nova-accent-3);
          animation: nova-status-pulse 2s ease-in-out infinite;
        }

        @keyframes nova-status-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .nova-header-status span {
          font-size: 11px;
          color: var(--nova-text-dim);
          font-weight: 500;
        }

        .nova-close {
          position: relative;
          z-index: 1;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid var(--nova-glass-border);
          background: var(--nova-glass);
          color: var(--nova-text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nova-close:hover {
          background: rgba(255,255,255,0.1);
          color: var(--nova-text);
          border-color: rgba(255,255,255,0.2);
        }

        /* ─── Messages ────────────────────────────────── */
        .nova-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 0;
          scroll-behavior: smooth;
          position: relative;
        }

        .nova-messages::-webkit-scrollbar { width: 4px; }
        .nova-messages::-webkit-scrollbar-track { background: transparent; }
        .nova-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .nova-msg {
          display: flex;
          gap: 10px;
          max-width: 85%;
        }

        .nova-msg-user {
          flex-direction: row-reverse;
          align-self: flex-end;
        }

        .nova-msg-bot {
          align-self: flex-start;
        }

        .nova-msg-avi {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .nova-msg-bot .nova-msg-avi {
          background: var(--nova-glass);
          border: 1px solid var(--nova-glass-border);
        }

        .nova-msg-user .nova-msg-avi {
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.2);
        }

        .nova-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 13.5px;
          line-height: 1.6;
          position: relative;
        }

        .nova-msg-bot .nova-bubble {
          background: var(--nova-msg-bot);
          border: 1px solid rgba(139,92,246,0.08);
          color: var(--nova-text);
          border-bottom-left-radius: 6px;
        }

        .nova-msg-user .nova-bubble {
          background: var(--nova-msg-user-gradient);
          color: white;
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }

        .nova-bubble p { margin: 0 0 8px; }
        .nova-bubble p:last-child { margin-bottom: 0; }

        .nova-bubble strong { font-weight: 600; color: var(--nova-accent-1); }
        .nova-msg-user .nova-bubble strong { color: rgba(255,255,255,0.95); }

        .nova-bubble a {
          color: var(--nova-accent-2);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .nova-msg-user .nova-bubble a { color: rgba(255,255,255,0.9); }

        /* ─── Typing Indicator ────────────────────────── */
        .nova-typing {
          display: flex;
          gap: 5px;
          padding: 4px 0;
          align-items: center;
        }

        .nova-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--nova-accent-1);
          opacity: 0.4;
        }

        .nova-typing-dot:nth-child(1) { animation: nova-dot 1.4s ease-in-out infinite 0ms; }
        .nova-typing-dot:nth-child(2) { animation: nova-dot 1.4s ease-in-out infinite 200ms; }
        .nova-typing-dot:nth-child(3) { animation: nova-dot 1.4s ease-in-out infinite 400ms; }

        @keyframes nova-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.1); opacity: 1; }
        }

        /* ─── Welcome ─────────────────────────────────── */
        .nova-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 24px 16px;
          text-align: center;
          flex: 1;
        }

        .nova-welcome h4 {
          font-size: 22px;
          font-weight: 700;
          color: var(--nova-text);
          margin: 0 0 8px;
          letter-spacing: -0.03em;
          background: var(--nova-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nova-welcome p {
          font-size: 14px;
          color: var(--nova-text-dim);
          margin: 0;
          line-height: 1.6;
          max-width: 300px;
        }

        /* ─── Quick Questions ─────────────────────────── */
        .nova-quicks {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 4px 16px 16px;
          justify-content: center;
        }

        .nova-quick-btn {
          font-size: 12.5px;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid var(--nova-glass-border);
          background: var(--nova-glass);
          color: var(--nova-text-dim);
          cursor: pointer;
          transition: all 0.25s;
          font-family: var(--nova-font);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .nova-quick-btn:hover {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.3);
          color: var(--nova-text);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139,92,246,0.15);
        }

        /* ─── Input Area ──────────────────────────────── */
        .nova-input-area {
          padding: 14px 16px;
          border-top: 1px solid var(--nova-glass-border);
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .nova-input-wrap {
          flex: 1;
          border: 1px solid var(--nova-glass-border);
          border-radius: 16px;
          padding: 10px 14px;
          background: var(--nova-surface);
          display: flex;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .nova-input-wrap:focus-within {
          border-color: rgba(139,92,246,0.4);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .nova-input-wrap textarea {
          width: 100%;
          border: none;
          background: transparent;
          padding: 0;
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          outline: none;
          color: var(--nova-text);
          font-family: var(--nova-font);
          max-height: 100px;
        }

        .nova-input-wrap textarea::placeholder { color: var(--nova-text-dim); }

        .nova-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }

        .nova-send-btn:not(:disabled) {
          background: var(--nova-msg-user-gradient);
          color: white;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
        }

        .nova-send-btn:not(:disabled):hover {
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(124,58,237,0.45);
        }

        .nova-send-btn:disabled {
          background: var(--nova-glass);
          color: var(--nova-text-dim);
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* ─── Scroll Down Button ──────────────────────── */
        .nova-scroll-down {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--nova-panel-bg);
          border: 1px solid var(--nova-glass-border);
          color: var(--nova-text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        /* ─── Login Prompt ────────────────────────────── */
        .nova-login-section {
          text-align: center;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .nova-login-section p {
          font-size: 13.5px;
          color: var(--nova-text-dim);
          margin: 0;
          line-height: 1.5;
          max-width: 280px;
        }

        .nova-login-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 24px;
          border-radius: 14px;
          background: var(--nova-msg-user-gradient);
          color: white;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.25s;
          font-family: var(--nova-font);
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
        }

        .nova-login-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.45);
        }

        /* ─── Rate Limit Banner ───────────────────────── */
        .nova-limit {
          padding: 12px 16px;
          background: rgba(245,158,11,0.1);
          border-top: 1px solid rgba(245,158,11,0.15);
          text-align: center;
        }

        .nova-limit p {
          font-size: 12px;
          color: #F59E0B;
          margin: 0;
          font-weight: 500;
        }
      

      `}</style>

            <div className="nova-root">
                <div className="nova-container">
                    {/* ─── Chat Panel ─────────────────────────────── */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                className="nova-panel"
                                variants={panelVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                            >
                                <FloatingOrbs />

                                {/* Header */}
                                <div className="nova-header">
                                    <div className="nova-header-avatar">
                                        <NovaFace emotion={isTyping ? "thinking" : "happy"} size={26} />
                                    </div>
                                    <div className="nova-header-info">
                                        <h3>Nova</h3>
                                        <div className="nova-header-status">
                                            <div className="nova-status-dot" />
                                            <span>{isTyping ? "Thinking..." : "Your AI study advisor"}</span>
                                        </div>
                                    </div>
                                    <button className="nova-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Body */}
                                {!isAuthenticated ? (
                                    <div className="nova-login-section">
                                        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                                            <NovaFace emotion="happy" size={48} />
                                        </motion.div>
                                        <p>Sign in to chat with Nova and get personalized recommendations!</p>
                                        <button className="nova-login-cta" onClick={() => { setIsOpen(false); navigate("/login"); }}>
                                            <LogIn size={16} />
                                            Sign In
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="nova-messages" ref={messagesContainerRef} onScroll={handleScroll}>
                                            {messages.length === 0 ? (
                                                <motion.div
                                                    className="nova-welcome"
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                >
                                                    <motion.div
                                                        animate={{ y: [0, -6, 0] }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                        style={{ marginBottom: 20 }}
                                                    >
                                                        <NovaFace emotion="happy" size={56} />
                                                    </motion.div>
                                                    <h4>Hi there, I'm Nova!</h4>
                                                    <p>Ask me about programs, scholarships, admissions, or anything about studying in Germany.</p>
                                                </motion.div>
                                            ) : (
                                                messages.map((msg, i) => (
                                                    <div key={msg.id || i}>
                                                        {/* Message bubble */}
                                                        <motion.div
                                                            className={`nova-msg ${msg.role === "user" ? "nova-msg-user" : "nova-msg-bot"}`}
                                                            custom={msg.role === "user"}
                                                            variants={messageVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                        >
                                                            <div className="nova-msg-avi">
                                                                {msg.role === "assistant" ? (
                                                                    <NovaFace emotion="idle" size={18} />
                                                                ) : (
                                                                    <User size={13} color="#A78BFA" />
                                                                )}
                                                            </div>
                                                            <div className="nova-bubble">
                                                                {msg.role === "user" ? (
                                                                    <p>{msg.content}</p>
                                                                ) : (
                                                                    <SimpleMarkdown content={msg.content} onNavigate={(path) => { setIsOpen(false); navigate(path); }} />
                                                                )}
                                                            </div>
                                                        </motion.div>

                                                        {/* Program cards — full width, below the message */}
                                                        {msg.role === "assistant" && msg.recommendations && msg.recommendations.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.15 }}
                                                                style={{
                                                                    display: "flex", flexDirection: "column", gap: 8,
                                                                    marginTop: 10, marginLeft: 38,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    fontSize: 11, fontWeight: 600, color: "#8B8BA0",
                                                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                                                    marginBottom: 2,
                                                                }}>
                                                                    Recommended Programs
                                                                </div>
                                                                {[...msg.recommendations]
                                                                    .sort((a, b) => b.match_score - a.match_score)
                                                                    .map((rec, j) => (
                                                                        <NovaProgramCard
                                                                            key={rec.program.id || j}
                                                                            rec={rec}
                                                                            onNavigate={(id) => {
                                                                                setIsOpen(false);
                                                                                navigate(`/programs/${id}`);
                                                                            }}
                                                                            onShowAnalysis={setSelectedRec}
                                                                        />
                                                                    ))}
                                                            </motion.div>
                                                        )}

                                                        {/* Scholarship cards — below program cards */}
                                                        {msg.role === "assistant" && msg.scholarships && msg.scholarships.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.2 }}
                                                                style={{
                                                                    display: "flex", flexDirection: "column", gap: 8,
                                                                    marginTop: 10, marginLeft: 38,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    fontSize: 11, fontWeight: 600, color: "#FBBF24",
                                                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                                                    marginBottom: 2,
                                                                }}>
                                                                    🎓 Scholarships Found
                                                                </div>
                                                                {msg.scholarships.map((sch: Scholarship, j: number) => (
                                                                    <NovaScholarshipCard
                                                                        key={sch.id || j}
                                                                        scholarship={sch}
                                                                        onNavigate={(id) => {
                                                                            setIsOpen(false);
                                                                            navigate(`/scholarships/${id}`);
                                                                        }}
                                                                    />
                                                                ))}
                                                            </motion.div>
                                                        )}

                                                        {/* University cards — below scholarship cards */}
                                                        {msg.role === "assistant" && msg.universities && msg.universities.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.25 }}
                                                                style={{
                                                                    display: "flex", flexDirection: "column", gap: 8,
                                                                    marginTop: 10, marginLeft: 38,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    fontSize: 11, fontWeight: 600, color: "#3B82F6",
                                                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                                                    marginBottom: 2,
                                                                }}>
                                                                    🏛️ Universities Found
                                                                </div>
                                                                {msg.universities.map((uni: University, j: number) => (
                                                                    <NovaUniversityCard
                                                                        key={uni.name || j}
                                                                        uni={uni}
                                                                        onNavigate={(name) => {
                                                                            setIsOpen(false);
                                                                            navigate(`/programs?university=${encodeURIComponent(name)}`);
                                                                        }}
                                                                    />
                                                                ))}
                                                            </motion.div>
                                                        )}

                                                        {/* Document records — below everything else */}
                                                        {msg.role === "assistant" && msg.vault_documents && msg.vault_documents.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.3 }}
                                                                style={{
                                                                    display: "flex", flexDirection: "column", gap: 8,
                                                                    marginTop: 10, marginLeft: 38,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    fontSize: 11, fontWeight: 600, color: "#9CA3AF",
                                                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                                                    marginBottom: 2,
                                                                }}>
                                                                    📁 Vault Documents
                                                                </div>
                                                                {msg.vault_documents.map((doc: VaultDocument, j: number) => (
                                                                    <NovaDocumentCard
                                                                        key={doc.id || j}
                                                                        doc={doc}
                                                                    />
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                ))
                                            )}

                                            {/* Typing indicator */}
                                            <AnimatePresence>
                                                {isTyping && (
                                                    <motion.div
                                                        className="nova-msg nova-msg-bot"
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                    >
                                                        <div className="nova-msg-avi">
                                                            <NovaFace emotion="thinking" size={18} />
                                                        </div>
                                                        <div className="nova-bubble" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px" }}>
                                                            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
                                                                {activeLoadingSteps[loadingStepIndex] || "Thinking..."}
                                                            </span>
                                                            <div className="nova-typing">
                                                                <span className="nova-typing-dot" />
                                                                <span className="nova-typing-dot" />
                                                                <span className="nova-typing-dot" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Scroll down */}
                                        <AnimatePresence>
                                            {showScrollDown && (
                                                <motion.button
                                                    className="nova-scroll-down"
                                                    onClick={scrollToBottom}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 8 }}
                                                >
                                                    <ArrowDown size={14} />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>

                                        {/* Quick questions */}
                                        {messages.length === 0 && (
                                            <motion.div
                                                className="nova-quicks"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                            >
                                                {quickQuestions.map((q, i) => (
                                                    <motion.button
                                                        key={q.text}
                                                        className="nova-quick-btn"
                                                        onClick={() => handleSend(q.text)}
                                                        disabled={isTyping}
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 + i * 0.06 }}
                                                    >
                                                        <span>{q.icon}</span>
                                                        {q.text}
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* Rate limit banner */}
                                        {limitReached && (
                                            <div className="nova-limit">
                                                <p>Daily chat limit reached. Come back tomorrow!</p>
                                            </div>
                                        )}

                                        {/* Input */}
                                        {!limitReached && (
                                            <motion.div
                                                className="nova-input-area"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <div className="nova-input-wrap">
                                                    <textarea
                                                        ref={textareaRef}
                                                        value={inputMessage}
                                                        onChange={handleTextareaInput}
                                                        onKeyDown={handleKeyDown}
                                                        placeholder="Ask Nova anything..."
                                                        rows={1}
                                                        disabled={isTyping}
                                                    />
                                                </div>
                                                <motion.button
                                                    className="nova-send-btn"
                                                    onClick={() => handleSend()}
                                                    disabled={!inputMessage.trim() || isTyping}
                                                    aria-label="Send message"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.92 }}
                                                >
                                                    <Send size={16} />
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Notification Speech Bubble ───────────────── */}
                    <AnimatePresence>
                        {activeNotification && !isOpen && (
                            <motion.div
                                key={activeNotification.id}
                                initial={{ opacity: 0, y: 16, scale: 0.85, filter: "blur(6px)" }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: 10, scale: 0.9, filter: "blur(4px)" }}
                                transition={{ type: "spring", stiffness: 360, damping: 24 }}
                                style={{ cursor: "pointer", alignSelf: "flex-end" }}
                                onClick={() => setActiveNotification(null)}
                            >
                                <div
                                    className="nova-speech-bubble"
                                    style={{
                                        background: activeNotification.type === "success"
                                            ? "linear-gradient(145deg, #122522 0%, #0F1A20 100%)"
                                            : activeNotification.type === "error"
                                                ? "linear-gradient(145deg, #261414 0%, #1A0F14 100%)"
                                                : activeNotification.type === "loading"
                                                    ? "linear-gradient(145deg, #1A1530 0%, #141428 100%)"
                                                    : "linear-gradient(145deg, #141E30 0%, #0F1A28 100%)",
                                        border: `1.5px solid ${activeNotification.type === "success" ? "rgba(16,185,129,0.35)"
                                            : activeNotification.type === "error" ? "rgba(239,68,68,0.35)"
                                                : activeNotification.type === "loading" ? "rgba(139,92,246,0.35)"
                                                    : "rgba(59,130,246,0.35)"
                                            }`,
                                        boxShadow: `0 12px 40px -8px rgba(0,0,0,0.5), 0 0 20px ${activeNotification.type === "success" ? "rgba(16,185,129,0.08)"
                                            : activeNotification.type === "error" ? "rgba(239,68,68,0.08)"
                                                : activeNotification.type === "loading" ? "rgba(139,92,246,0.08)"
                                                    : "rgba(59,130,246,0.08)"
                                            }`,
                                    }}
                                >
                                    {/* Accent dot + label */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: "50%",
                                            background: activeNotification.type === "success" ? "#10B981"
                                                : activeNotification.type === "error" ? "#EF4444"
                                                    : activeNotification.type === "loading" ? "#8B5CF6" : "#3B82F6",
                                            boxShadow: `0 0 8px ${activeNotification.type === "success" ? "#10B98188"
                                                : activeNotification.type === "error" ? "#EF444488"
                                                    : activeNotification.type === "loading" ? "#8B5CF688" : "#3B82F688"
                                                }`,
                                            animation: activeNotification.type === "loading" ? "nova-pulse-glow 1.5s ease-in-out infinite" : "none",
                                        }} />
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const,
                                            color: activeNotification.type === "success" ? "#6EE7B7"
                                                : activeNotification.type === "error" ? "#FCA5A5"
                                                    : activeNotification.type === "loading" ? "#A78BFA" : "#93C5FD",
                                        }}>Nova</span>
                                    </div>
                                    {/* Message */}
                                    <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#E8E8F0" }}>
                                        {activeNotification.message}
                                    </div>
                                    {/* Tail pointing down-right toward Nova */}
                                    <div
                                        className="nova-speech-tail"
                                        style={{
                                            background: activeNotification.type === "success"
                                                ? "#122522" : activeNotification.type === "error"
                                                    ? "#261414" : activeNotification.type === "loading"
                                                        ? "#1A1530" : "#141E30",
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Floating Trigger Button ─────────────────── */}
                    <div style={{ position: "relative" }}>
                        <motion.button
                            className="nova-trigger"
                            onClick={toggleChat}
                            aria-label="Open Nova chat"
                            style={{ scale: triggerSpring }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            onHoverStart={() => triggerScale.set(1.08)}
                            onHoverEnd={() => triggerScale.set(1)}
                        >
                            <div className="nova-trigger-glow" />

                            <div className="nova-avatar-wrap">
                                <div className="nova-avatar-float">
                                    <ParticleRing active={emotion === "happy" || emotion === "waving"} />
                                    <NovaFace emotion={emotion} size={52} />
                                </div>

                                {/* Unread badge */}
                                <AnimatePresence>
                                    {unreadCount > 0 && !isOpen && (
                                        <motion.div
                                            className="nova-badge"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                        >
                                            {unreadCount}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.button>
                    </div>
                </div >
            </div >

            {/* AI Reasoning Modal */}
            <AnimatePresence>
                {
                    selectedRec && (
                        <div
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4"
                            onClick={() => setSelectedRec(null)}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{ backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxWidth: '32rem', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{ padding: '1.5rem' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>AI Match Analysis</h3>
                                        <button
                                            onClick={() => setSelectedRec(null)}
                                            style={{ color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Program Name */}
                                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                                        Analysis for <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedRec.program.program_name}</span>
                                    </p>

                                    {/* Match Score Display */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                width: '5rem', height: '5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#ffffff',
                                                background: selectedRec.match_score >= 80 ? 'linear-gradient(to bottom right, #4ade80, #16a34a)' :
                                                    selectedRec.match_score >= 60 ? 'linear-gradient(to bottom right, #fbbf24, #d97706)' :
                                                        'linear-gradient(to bottom right, #f87171, #dc2626)'
                                            }}>
                                                {selectedRec.match_score}%
                                            </div>
                                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>AI Match Score</p>
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    {selectedRec.match_reasons && selectedRec.match_reasons.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#15803d', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                                <span style={{ width: '1.25rem', height: '1.25rem', borderRadius: '9999px', backgroundColor: '#dcfce3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '0.75rem' }}>✓</span>
                                                Strengths
                                            </h4>
                                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0, margin: '8px 0 0 0', listStyle: 'none' }}>
                                                {selectedRec.match_reasons.map((reason, idx) => (
                                                    <li key={idx} style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', borderLeft: '4px solid #22c55e', margin: 0 }}>
                                                        {reason}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Concerns/Gaps */}
                                    {selectedRec.gaps && selectedRec.gaps.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#b45309', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                                <span style={{ width: '1.25rem', height: '1.25rem', borderRadius: '9999px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontSize: '0.75rem' }}>!</span>
                                                Areas to Consider
                                            </h4>
                                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0, margin: '8px 0 0 0', listStyle: 'none' }}>
                                                {selectedRec.gaps.map((gap, idx) => (
                                                    <li key={idx} style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b', margin: 0 }}>
                                                        {gap}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* AI Recommendation */}
                                    {selectedRec.highlights && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4338ca', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                                <Sparkles size={16} />
                                                AI Recommendation
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#eef2ff', padding: '0.75rem', borderRadius: '0.5rem', borderLeft: '4px solid #6366f1', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                                                "{selectedRec.highlights}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                                            This analysis is powered by AI and considers your profile, program requirements, and fit.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </>
    );
}