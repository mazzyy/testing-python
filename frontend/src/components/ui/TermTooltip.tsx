import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface TermTooltipProps {
    term: string;
    definition?: string; // Optional: Override the default definition
    children: React.ReactNode;
    className?: string; // Add className prop
}

const TERM_DEFINITIONS: Record<string, string> = {
    'APS': 'Akademische Prüfstelle (APS) verifies the authenticity of your academic documents. Mandatory for students from India, China, and Vietnam before applying for a visa.',
    'HEC': 'Higher Education Commission (HEC) of Pakistan. You must get your degrees and transcripts attested by HEC before MOFA attestation.',
    'IBCC': 'Inter Board Committee of Chairmen (IBCC) provides equivalence certificates for SSC/HSSC (Matric/Intermediate). Mandatory for all Pakistani students applying abroad.',
    'MOFA': 'Ministry of Foreign Affairs. Attestation from MOFA is required for your documents after HEC verification (for Pakistan) or similar bodies in other countries.',
    'MEA': 'Ministry of External Affairs (India). You must get an optional Apostille sticker from MEA on your original degree/transcripts before sending them to APS.',
    'WES': 'World Education Services (WES) is typically used for US/Canada. Germany uses Uni-Assist or APS instead. DO NOT use WES for German applications unless explicitly asked.',
    'Uni-Assist': 'A service that processes international student applications for many German universities. They verify your grades and documents.',
    'VFS': 'VFS Global is the outsourcing partner for German diplomatic missions. You book your visa appointment and submit documents through them.',
    'Blocked Account': 'A Sperrkonto (Blocked Account) proves you have enough money for your stay. You must deposit ~€11,904, and you can only withdraw a monthly limit.',
    'Sperrkonto': 'A German blocked bank account required for student visa. You deposit €11,904 upfront and receive a monthly allowance (~€992) to cover living expenses.',
};

export default function TermTooltip({ term, definition, children, className = '' }: TermTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Normalize term lookup (case-insensitive if needed, but dictionary is strict for now)
    const lookupKey = Object.keys(TERM_DEFINITIONS).find(k => term.toLowerCase().includes(k.toLowerCase()));
    const text = definition || (lookupKey ? TERM_DEFINITIONS[lookupKey] : 'No definition available.');

    return (
        <span
            className={`relative inline-block cursor-help group ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)} // Mobile support
        >
            <span className="border-b border-dotted border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors rounded px-0.5">
                {children}
            </span>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 pointer-events-none"
                    >
                        <div className="font-bold mb-1 flex items-center gap-1">
                            <Info className="w-3 h-3 text-primary-400" />
                            {term}
                        </div>
                        <p className="leading-relaxed text-slate-300">
                            {text}
                        </p>
                        {/* Triangle Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
