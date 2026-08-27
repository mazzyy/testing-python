import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, CheckCircle, ExternalLink, AlertCircle, AlertTriangle, Circle, Globe, Calendar, GraduationCap, Upload, Eye, Trash2, LayoutDashboard, Search, ChevronRight, X, ChevronLeft, Landmark, Euro, Plane, Calculator, Lock, Briefcase, Clock, Sparkles, Database, AlertOctagon } from 'lucide-react';
import confetti from 'canvas-confetti';
import novaToast from '../../components/nova/NovaToast';
import { applicationsApi } from '../../api/applications';
import { vaultApi } from '../../api/vault';
import { Button, Card, Badge, LoadingSpinner, Input, Select } from '../../components/ui';
import Modal from '../../components/ui/Modal';
import type { TrackerState } from '../../api/applications';
import type { ApplicationChecklistItem } from '../../types';

const TABS = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'eligibility', label: '1. Eligibility', icon: GraduationCap },
    { id: 'language', label: '2. Language', icon: Globe },
    { id: 'documents', label: '3. Documents', icon: FileText },
    { id: 'application', label: '4. Application', icon: Briefcase },
    { id: 'admission', label: '5. Admission', icon: Landmark },
    { id: 'finance', label: '6. Finance', icon: Euro },
    { id: 'visa', label: '7. Visa', icon: Plane },
];

const STAGE_DEFS = [
    { id: 'eligibility', label: 'Eligibility', category: 'profile_setup' },
    { id: 'language', label: 'Language', category: 'language' },
    { id: 'documents', label: 'Documents', category: 'documents' },
    { id: 'application', label: 'Application', category: 'university_application' },
    { id: 'admission', label: 'Admission', category: 'admission_confirmation' },
    { id: 'finance', label: 'Finance', category: 'financial_documents' },
    { id: 'visa', label: 'Visa', category: 'visa_process' },
];

// Helper to extract date and calculate days remaining
function getDeadlineStatus(deadlineText: string | undefined) {
    if (!deadlineText) return null;

    // specific logic for "1 June" or "15 July" style dates
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const regex = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i;

    // Prioritize "International" deadline if present
    let textToSearch = deadlineText;
    if (deadlineText.toLowerCase().includes("international")) {
        // rough heuristic: matching lines or chunks around 'international'
        // For now, let's just search the whole string, the regex finds the first date.
        // Often International is the *earlier* date, so the first match usually works.
    }

    const match = textToSearch.match(regex);

    if (match) {
        const day = parseInt(match[1]);
        const monthIndex = months.indexOf(match[2].toLowerCase());

        const now = new Date();
        let targetYear = now.getFullYear();
        let targetDate = new Date(targetYear, monthIndex, day);

        // If date has passed this year, assume next year (for application cycles)
        // OR better: leave it as this year if strict, but applications are usually future-looking.
        // Let's assume if it's more than 1 month in the past, it's probably next year.
        if (targetDate.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000) {
            targetDate = new Date(targetYear + 1, monthIndex, day);
        }

        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            dateStr: `${day} ${months[monthIndex]} `, // Clean format
            days: diffDays,
            original: deadlineText
        };
    }

    return { dateStr: null, days: null, original: deadlineText };
}

function DeadlineCountdown({ text }: { text?: string }) {
    const status = getDeadlineStatus(text);

    if (!status || !status.dateStr) {
        return (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium max-w-[200px] truncate" title={text}>
                <Clock className="w-3 h-3" />
                <span>Check Deadline Details</span>
            </div>
        )
    }

    const isUrgent = status.days !== null && status.days < 30;
    const isOverdue = status.days !== null && status.days < 0;

    return (
        <div className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${isOverdue ? 'bg-red-50 border-red-200 text-red-700' :
            isUrgent ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-green-50 border-green-200 text-green-700'
            }`} title={`Extracted from: ${status.original}`}>
            <Clock className="w-4 h-4" />
            <span className="font-bold">
                {isOverdue ? `Expired (${Math.abs(status.days!)} days ago)` : `${status.days} Days Remaining`}
            </span>
            <span className="text-xs opacity-75 border-l pl-2 ml-1 border-current">
                {status.dateStr}
            </span>
        </div>
    );
}

const COUNTRY_METADATA: Record<string, {
    name: string;
    flag: string;
    bannerColor: string; // Tailwind color class suffix (e.g. 'orange-50')
    verificationTitle: string;
    verificationSteps: { title: string; desc: string }[];
    verificationLocations?: { name: string; url: string; type: string; portalUrl?: string }[];
    visaCities: { name: string; url: string; type: 'Embassy' | 'Consulate' | 'VFS' | 'VisaMetric' | 'iDATA' }[];
    defaultGpaScale: string;
    minPassingGrade: number; // Added for accurate conversion
    embassyDocsUrl?: string;
}> = {
    india: {
        name: "India",
        flag: "🇮🇳",
        bannerColor: "orange",
        verificationTitle: "APS India & MEA Apostille",
        verificationSteps: [
            { title: "APS Registration", desc: "Register at aps-india.de" },
            { title: "Transcripts", desc: "Get transcripts from university" },
            { title: "APS Submission", desc: "Submit docs to APS New Delhi" },
            { title: "MEA Apostille", desc: "Get Apostille for Visa (After APS)" },
        ],
        verificationLocations: [
            { name: "VFS Global New Delhi", url: "https://www.google.com/maps/search/VFS+Global+German+Embassy+New+Delhi", type: "VFS", portalUrl: "https://visa.vfsglobal.com/ind/en/deu/" },
            { name: "VFS Global Mumbai", url: "https://www.google.com/maps/search/VFS+Global+German+Consulate+Mumbai", type: "VFS", portalUrl: "https://visa.vfsglobal.com/ind/en/deu/" },
            { name: "VFS Global Bangalore", url: "https://www.google.com/maps/search/VFS+Global+German+Consulate+Bangalore", type: "VFS", portalUrl: "https://visa.vfsglobal.com/ind/en/deu/" },
            { name: "MEA New Delhi", url: "https://www.google.com/maps/search/Ministry+of+External+Affairs+New+Delhi", type: "MEA", portalUrl: "https://e-sanad.nic.in/" },
        ],
        visaCities: [
            { name: "New Delhi", url: "https://india.diplo.de/in-en/service/-/2546072", type: "Embassy" },
            { name: "Mumbai", url: "https://india.diplo.de/in-en/service/-/2546072", type: "Consulate" },
            { name: "Bangalore", url: "https://india.diplo.de/in-en/service/-/2546072", type: "Consulate" },
            { name: "Chennai", url: "https://india.diplo.de/in-en/service/-/2546072", type: "Consulate" },
            { name: "Kolkata", url: "https://india.diplo.de/in-en/service/-/2546072", type: "Consulate" },
            { name: "Hyderabad", url: "https://india.diplo.de/in-en/service/-/2546072", type: "Consulate" },
        ],
        defaultGpaScale: "10.0",
        minPassingGrade: 4.0, // 40% usually passing
        embassyDocsUrl: "https://india.diplo.de/blob/2544606/aa700140226462873130456187760920/1-student-visa-data.pdf"
    },
    china: {
        name: "China",
        flag: "🇨🇳",
        bannerColor: "red",
        verificationTitle: "APS China (Beijing)",
        verificationSteps: [
            { title: "APS Registration", desc: "Register at aps.org.cn" },
            { title: "Verify Documents", desc: "Submit materials for Plausibility Check" },
            { title: "Interview", desc: "Attend APS Interview if required" },
        ],
        verificationLocations: [
            { name: "APS China (Beijing)", url: "https://www.aps.org.cn/contact-us", type: "APS", portalUrl: "https://www.aps.org.cn/" }
        ],
        visaCities: [
            { name: "Beijing", url: "https://china.diplo.de/cn-zh/service/visa-einreise", type: "Embassy" },
            { name: "Shanghai", url: "https://china.diplo.de/cn-zh/service/visa-einreise", type: "Consulate" },
            { name: "Guangzhou", url: "https://china.diplo.de/cn-zh/service/visa-einreise", type: "Consulate" },
            { name: "Chengdu", url: "https://china.diplo.de/cn-zh/service/visa-einreise", type: "Consulate" },
            { name: "Shenyang", url: "https://china.diplo.de/cn-zh/service/visa-einreise", type: "Consulate" },
        ],
        defaultGpaScale: "100",
        minPassingGrade: 60, // 60/100 is pass
        embassyDocsUrl: "https://china.diplo.de/cn-zh/service/visa-einreise/nationales-visum/1343714"
    },
    iran: {
        name: "Iran",
        flag: "🇮🇷",
        bannerColor: "emerald",
        verificationTitle: "Legalization (No Apostille)",
        verificationSteps: [
            { title: "Official Translation", desc: "Translate to German" },
            { title: "Justice Ministry", desc: "Stamp from Ministry of Justice" },
            { title: "MFA Attestation", desc: "Stamp from Ministry of Foreign Affairs" },
            { title: "Embassy Legalization", desc: "Book appt via VisaMetric" },
        ],
        verificationLocations: [
            { name: "VisaMetric Tehran", url: "https://ir.visametric.com/en/iran/location", type: "VisaMetric" },
            { name: "German Embassy Tehran", url: "https://teheran.diplo.de/ir-de/botschaft/adresse-oeffnungszeiten/2073280", type: "Embassy" }
        ],
        visaCities: [
            { name: "Tehran (VisaMetric)", url: "https://teheran.diplo.de/ir-de/service/05-VisaEinreise", type: "VisaMetric" }
        ],
        defaultGpaScale: "20.0",
        minPassingGrade: 10.0, // 10/20 is pass
        embassyDocsUrl: "https://teheran.diplo.de/blob/2453676/01e52331484252327702336336443463/merkblatt-studentenvisum-data.pdf"
    },
    turkey: {
        name: "Turkey",
        flag: "🇹🇷",
        bannerColor: "red",
        verificationTitle: "Apostille (Hague)",
        verificationSteps: [
            { title: "Notarization", desc: "Notarize copies" },
            { title: "Apostille", desc: "Get Apostille from Kaymakamlik/Valilik" },
            { title: "Translation", desc: "Translate if needed" },
        ],
        verificationLocations: [
            { name: "Kaymakamlik (Local)", url: "https://www.google.com/maps/search/Kaymakamlik", type: "Gov" },
            { name: "Notary Public", url: "https://www.google.com/maps/search/Noter", type: "Notary" }
        ],
        visaCities: [
            { name: "Ankara", url: "https://tuerkei.diplo.de/tr-de/service/05-VisaEinreise", type: "Embassy" },
            { name: "Istanbul", url: "https://tuerkei.diplo.de/tr-de/service/05-VisaEinreise", type: "Consulate" },
            { name: "Izmir", url: "https://tuerkei.diplo.de/tr-de/service/05-VisaEinreise", type: "Consulate" },
        ],
        defaultGpaScale: "4.0",
        minPassingGrade: 2.0, // 2.0/4.0
        embassyDocsUrl: "https://tuerkei.diplo.de/tr-de/service/05-VisaEinreise"
    },
    pakistan: {
        name: "Pakistan",
        flag: "🇵🇰",
        bannerColor: "green",
        verificationTitle: "IBCC, HEC & MOFA Attestation",
        verificationSteps: [
            { title: "IBCC Attestation", desc: "Attest SSC/HSSC from IBCC (ibcc.edu.pk)" },
            { title: "HEC Attestation", desc: "Attest University degrees via HEC E-Portal" },
            { title: "MOFA Attestation", desc: "Verify IBCC & HEC attestations at MOFA" },
            { title: "Embassy Appointment", desc: "Book appointment early (Waitlist active)" },
        ],
        verificationLocations: [
            { name: "IBCC Karachi", url: "https://www.google.com/maps/search/IBCC+Karachi", type: "IBCC", portalUrl: "https://ibcc.edu.pk/" },
            { name: "HEC Karachi", url: "https://www.google.com/maps/search/HEC+Regional+Centre+Karachi", type: "HEC", portalUrl: "https://eservices.hec.gov.pk/" },
            { name: "MOFA Karachi (Camp Office)", url: "https://www.google.com/maps/search/MOFA+Camp+Office+Karachi", type: "MOFA" },
            { name: "IBCC Islamabad", url: "https://www.google.com/maps/search/IBCC+Islamabad", type: "IBCC", portalUrl: "https://ibcc.edu.pk/" },
            { name: "HEC Islamabad", url: "https://www.google.com/maps/search/HEC+Islamabad", type: "HEC", portalUrl: "https://eservices.hec.gov.pk/" },
            { name: "MOFA Islamabad", url: "https://www.google.com/maps/search/Ministry+of+Foreign+Affairs+Islamabad", type: "MOFA" }
        ],
        visaCities: [
            { name: "Islamabad", url: "https://digital.diplo.de/visa", type: "Embassy" },
            { name: "Karachi", url: "https://digital.diplo.de/visa", type: "Consulate" }
        ],
        defaultGpaScale: "4.0",
        minPassingGrade: 2.0, // 2.0/4.0 or 50%
        embassyDocsUrl: "https://digital.diplo.de/visa"
    },
    bangladesh: {
        name: "Bangladesh",
        flag: "🇧🇩",
        bannerColor: "emerald",
        verificationTitle: "MoFA Apostille & Embassy Verification",
        verificationSteps: [
            { title: "Collect Documents", desc: "Get SSC, HSC, and university transcripts/degree certificates" },
            { title: "Certified Translation", desc: "Translate Bengali documents to German/English by certified translator" },
            { title: "MoFA e-Apostille", desc: "Get Apostille via apostille.mygov.bd portal" },
            { title: "Embassy Submission", desc: "German Embassy Dhaka may verify documents if needed" },
        ],
        verificationLocations: [
            { name: "MoFA Dhaka", url: "https://www.google.com/maps/search/Ministry+of+Foreign+Affairs+Dhaka", type: "MoFA" },
            { name: "German Embassy Dhaka", url: "https://dhaka.diplo.de", type: "Embassy" }
        ],
        visaCities: [
            { name: "Dhaka", url: "https://dhaka.diplo.de/bd-en/service/05-VisaEinreise", type: "Embassy" },
        ],
        defaultGpaScale: "4.0",
        minPassingGrade: 2.0, // 2.0/4.0
        embassyDocsUrl: "https://dhaka.diplo.de/bd-en/service/05-VisaEinreise"
    },
    "united states": {
        name: "United States",
        flag: "🇺🇸",
        bannerColor: "blue",
        verificationTitle: "Apostille (Secretary of State)",
        verificationSteps: [
            { title: "Official Transcripts", desc: "Order sealed transcripts from your university registrar" },
            { title: "Apostille", desc: "Get Apostille from your state's Secretary of State office" },
            { title: "Certified Translation", desc: "Translate to German by ATA-certified translator (if required)" },
            { title: "Document Assembly", desc: "Prepare originals + apostilled copies" },
        ],
        verificationLocations: [
            { name: "Secretary of State (State-specific)", url: "https://www.google.com/search?q=secretary+of+state+apostille", type: "Gov" },
        ],
        visaCities: [
            { name: "Washington D.C.", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Embassy" },
            { name: "New York", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Los Angeles", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Chicago", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Houston", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "San Francisco", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Miami", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Atlanta", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Boston", url: "https://www.germany.info/us-en/service/05-VisaEinreise", type: "Consulate" },
        ],
        defaultGpaScale: "4.0",
        minPassingGrade: 1.0, // US min pass is usually D=1.0, but for grad school B=3.0 often needed. For general formula use 2.0 or 1.0? Sticking to 2.0 as safe "pass" for German context equivalents.
        embassyDocsUrl: "https://www.germany.info/us-en/service/05-VisaEinreise/-/2557776"
    },
    "united kingdom": {
        name: "United Kingdom",
        flag: "🇬🇧",
        bannerColor: "indigo",
        verificationTitle: "FCDO Apostille (Legalisation)",
        verificationSteps: [
            { title: "Official Transcripts", desc: "Order certified transcripts from your university" },
            { title: "FCDO Apostille", desc: "Get Apostille via gov.uk/get-document-legalised" },
            { title: "Solicitor Certification", desc: "Get copies certified by a UK solicitor or notary" },
            { title: "Certified Translation", desc: "Translate to German by certified translator (if required)" },
        ],
        verificationLocations: [
            { name: "FCDO Legalisation Office", url: "https://www.gov.uk/get-document-legalised", type: "Gov" },
        ],
        visaCities: [
            { name: "London", url: "https://uk.diplo.de/uk-en/02/visa", type: "Embassy" },
            { name: "Edinburgh", url: "https://uk.diplo.de/uk-en/02/visa", type: "Consulate" },
            { name: "Manchester (TLScontact)", url: "https://uk.diplo.de/uk-en/02/visa", type: "VFS" },
        ],
        defaultGpaScale: "70", // UK percentage scale, capped at 70 (First Class Honours)
        minPassingGrade: 40, // Third Class Honours threshold (40%)
        embassyDocsUrl: "https://uk.diplo.de/uk-en/02/visa/-/2444678"
    },
    canada: {
        name: "Canada",
        flag: "🇨🇦",
        bannerColor: "red",
        verificationTitle: "Apostille (Global Affairs Canada)",
        verificationSteps: [
            { title: "Official Transcripts", desc: "Order sealed transcripts from your university registrar" },
            { title: "Apostille", desc: "Get Apostille from Global Affairs Canada (since Jan 2024)" },
            { title: "Notarize Copies", desc: "Notarize via Canadian Notary Public or Commissioner of Oaths" },
            { title: "Certified Translation", desc: "Translate to German by CTTIC-certified translator (if required)" },
        ],
        verificationLocations: [
            { name: "Global Affairs Canada", url: "https://www.international.gc.ca/gac-amc/about-a_propos/services/authentication-authentification/step-etape-1.aspx?lang=eng", type: "Gov" },
        ],
        visaCities: [
            { name: "Ottawa", url: "https://canada.diplo.de/ca-en/service/05-VisaEinreise", type: "Embassy" },
            { name: "Toronto", url: "https://canada.diplo.de/ca-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Montreal", url: "https://canada.diplo.de/ca-en/service/05-VisaEinreise", type: "Consulate" },
            { name: "Vancouver", url: "https://canada.diplo.de/ca-en/service/05-VisaEinreise", type: "Consulate" },
        ],
        defaultGpaScale: "4.0", // or 4.33
        minPassingGrade: 1.0,
        embassyDocsUrl: "https://canada.diplo.de/ca-en/service/05-VisaEinreise"
    },
    nigeria: {
        name: "Nigeria",
        flag: "🇳🇬",
        bannerColor: "emerald",
        verificationTitle: "FME & MFA Legalization",
        verificationSteps: [
            { title: "Collect Documents", desc: "Get official transcripts and degree certificates" },
            { title: "FME Verification", desc: "Verify at Federal Ministry of Education, Abuja" },
            { title: "MFA Legalization", desc: "Legalize at Ministry of Foreign Affairs, Abuja" },
            { title: "Embassy Authentication", desc: "Submit to German Embassy Abuja or Lagos" },
        ],
        verificationLocations: [
            { name: "Federal Ministry of Education, Abuja", url: "https://www.google.com/maps/search/Federal+Ministry+of+Education+Abuja", type: "Gov" },
            { name: "MFA Abuja", url: "https://www.google.com/maps/search/Ministry+of+Foreign+Affairs+Abuja", type: "MFA" },
            { name: "German Embassy Abuja", url: "https://abuja.diplo.de", type: "Embassy" },
        ],
        visaCities: [
            { name: "Abuja", url: "https://abuja.diplo.de/ng-en/service/05-VisaEinreise", type: "Embassy" },
            { name: "Lagos", url: "https://abuja.diplo.de/ng-en/service/05-VisaEinreise", type: "Consulate" },
        ],
        defaultGpaScale: "5.0",
        minPassingGrade: 1.0, // Nigeria 5.0 scale, pass is usually E=1.0 or D=2.0
        embassyDocsUrl: "https://abuja.diplo.de/ng-en/service/05-VisaEinreise"
    },
    russia: {
        name: "Russia",
        flag: "🇷🇺",
        bannerColor: "red",
        verificationTitle: "Apostille (Rosobrnadzor)",
        verificationSteps: [
            { title: "Notarize Copies", desc: "Get notarized copies of academic documents" },
            { title: "Apostille", desc: "Get Apostille from Department of Education (Rosobrnadzor)" },
            { title: "Translation", desc: "Notarized German translation" },
        ],
        verificationLocations: [
            { name: "Rosobrnadzor", url: "https://obrnadzor.gov.ru/", type: "Gov" },
        ],
        visaCities: [
            { name: "Moscow", url: "https://germania.diplo.de/ru-de/service/05-VisaEinreise", type: "Embassy" },
            { name: "St. Petersburg", url: "https://germania.diplo.de/ru-de/service/05-VisaEinreise", type: "Consulate" },
            { name: "Yekaterinburg", url: "https://germania.diplo.de/ru-de/service/05-VisaEinreise", type: "Consulate" },
            { name: "Novosibirsk", url: "https://germania.diplo.de/ru-de/service/05-VisaEinreise", type: "Consulate" },
            { name: "Kaliningrad", url: "https://germania.diplo.de/ru-de/service/05-VisaEinreise", type: "Consulate" },
        ],
        defaultGpaScale: "5.0",
        minPassingGrade: 3.0, // Russia 5.0 scale: 3 is Satisfactory (pass)
        embassyDocsUrl: "https://germania.diplo.de/ru-de/service/05-VisaEinreise"
    },
    egypt: {
        name: "Egypt",
        flag: "🇪🇬",
        bannerColor: "amber",
        verificationTitle: "MFA & Embassy Legalization",
        verificationSteps: [
            { title: "MFA Pre-authentication", desc: "Stamp from Egyptian Ministry of Foreign Affairs" },
            { title: "Translation", desc: "Certified German translation" },
            { title: "Legalization", desc: "Submit to German Embassy via TLScontact" },
        ],
        verificationLocations: [
            { name: "TLScontact Cairo", url: "https://visas-de.tlscontact.com/visa/eg", type: "VFS" },
        ],
        visaCities: [
            { name: "Cairo (TLScontact)", url: "https://visas-de.tlscontact.com/visa/eg", type: "VFS" },
        ],
        defaultGpaScale: "4.0",
        minPassingGrade: 2.0,
        embassyDocsUrl: "https://kairo.diplo.de/eg-de/service/05-VisaEinreise"
    },
    indonesia: {
        name: "Indonesia",
        flag: "🇮🇩",
        bannerColor: "red",
        verificationTitle: "Apostille (AHU Online)",
        verificationSteps: [
            { title: "Apostille Request", desc: "Apply via AHU Online (kemenkumham.go.id)" },
            { title: "Stamping", desc: "Get Apostille sticker on original documents" },
            { title: "Translation", desc: "Translate documents + Apostille to German" },
        ],
        verificationLocations: [
            { name: "AHU Online", url: "https://apostille.ahu.go.id/", type: "Gov" },
        ],
        visaCities: [
            { name: "Jakarta", url: "https://jakarta.diplo.de/id-de/service/05-VisaEinreise", type: "Embassy" },
        ],
        defaultGpaScale: "4.0",
        minPassingGrade: 2.0,
        embassyDocsUrl: "https://jakarta.diplo.de/id-de/service/05-VisaEinreise"
    }
};

export default function ApplicationTrackerPage() {
    const { id } = useParams<{ id: string }>();
    const applicationId = parseInt(id || '0');
    const [activeTab, setActiveTab] = useState('overview');
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationKey, setCelebrationKey] = useState(0);
    const [celebrationLabel, setCelebrationLabel] = useState('Section Complete');
    const queryClient = useQueryClient();
    const celebrationTimeoutRef = useRef<number | null>(null);
    const prevStageProgressRef = useRef<Record<string, number> | null>(null);

    // Fetch Tracker Data
    const { data: tracker, isLoading, isError } = useQuery({
        queryKey: ['application-tracker', applicationId],
        staleTime: 0,
        refetchOnMount: 'always',
        queryFn: async () => {
            try {
                await applicationsApi.initTracker(applicationId);
            } catch (e) {
                // Ignore if already exists
            }
            const data = await applicationsApi.getTracker(applicationId);

            // Auto-detect nationality mismatch and reinit if needed
            const nationality = (data.user_nationality || '').toLowerCase();
            const detectedCountry = Object.keys(COUNTRY_METADATA).find(k => nationality.includes(k));
            if (detectedCountry) {
                // Each country has a unique fingerprint term that MUST be present in its HEC items
                const expectedFingerprint: Record<string, string> = {
                    india: 'aps-india',
                    pakistan: 'hec',
                    china: 'aps.org.cn',
                    iran: 'visametric',
                    turkey: 'kaymakamlik',
                    bangladesh: 'apostille.mygov.bd',
                    'united states': 'secretary of state',
                    'united kingdom': 'fcdo',
                    canada: 'global affairs canada',
                    nigeria: 'federal ministry of education',
                    russia: 'rosobrnadzor',
                    egypt: 'tlscontact',
                    indonesia: 'ahu',
                };
                const expectedTerm = expectedFingerprint[detectedCountry];
                const hecItems = data.checklist.filter((item: any) => item.category === 'hec_verification');

                // If there are HEC items but none contain the expected fingerprint, data is stale
                const hasStale = hecItems.length > 0 && expectedTerm &&
                    !hecItems.some((item: any) =>
                        ((item.description || '') + ' ' + (item.item_name || '')).toLowerCase().includes(expectedTerm)
                    );

                if (hasStale) {
                    await applicationsApi.reinitTracker(applicationId);
                    return applicationsApi.getTracker(applicationId);
                }
            }

            return data;
        },
        enabled: !!applicationId,
    });

    const updateItemMutation = useMutation({
        mutationFn: ({ itemId, status }: { itemId: number; status: string }) =>
            applicationsApi.updateChecklistItem(applicationId, itemId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
        },
    });

    // Filter out hidden items (e.g. WES legacy items)
    const isItemVisible = (item: ApplicationChecklistItem) => {
        if (item.category === 'hec_verification' || item.category === 'documents') {
            if ((item.item_name || '').toLowerCase().includes('wes')) return false;
        }
        return true;
    };

    // Calculate Progress
    const calculateProgress = (items: ApplicationChecklistItem[] = []) => {
        const visibleItems = items.filter(isItemVisible);
        if (!visibleItems.length) return 0;
        const completed = visibleItems.filter(i => i.status === 'completed' || i.status === 'not_applicable').length;
        return Math.round((completed / visibleItems.length) * 100);
    };

    const overallProgress = calculateProgress(tracker?.checklist || []);

    const getStageProgress = (cat: string) => {
        if (!tracker) return 0;

        // Special case for Eligibility
        if (cat === 'profile_setup' && tracker.eligibility && tracker.eligibility.length > 0) {
            const metReqs = tracker.eligibility.filter((r: any) => r.is_met).length;
            return Math.round((metReqs / tracker.eligibility.length) * 100);
        }

        // Special case for Visa (from localStorage if no db items)
        if (cat === 'visa_process') {
            const dbItems = tracker.checklist.filter(i => i.category === 'visa_process');
            if (dbItems.length === 0) {
                try {
                    const saved = localStorage.getItem(`visa-checklist-${applicationId}`);
                    if (saved) {
                        const localItems = JSON.parse(saved) as { name: string, completed: boolean }[];
                        const completedCount = localItems.filter(i => i.completed).length;
                        return Math.round((completedCount / localItems.length) * 100);
                    }
                } catch {
                    return 0;
                }
                return 0;
            }
            const completedCount = dbItems.filter(i => i.status === 'completed' || i.status === 'not_applicable').length;
            return Math.round((completedCount / dbItems.length) * 100);
        }

        if (cat === 'documents') {
            const items = tracker.checklist.filter(i => (i.category === 'documents' || i.category === 'hec_verification') && isItemVisible(i));
            if (items.length === 0) return 0;
            const completed = items.filter(i => i.status === 'completed' || i.status === 'not_applicable').length;
            return Math.round((completed / items.length) * 100);
        }
        const items = tracker.checklist.filter(i => i.category === cat && isItemVisible(i));
        if (items.length === 0) return 0;
        const completed = items.filter(i => i.status === 'completed' || i.status === 'not_applicable').length;
        return Math.round((completed / items.length) * 100);
    };

    const playPing = () => {
        try {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc1 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

            osc1.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start();
            osc1.stop(ctx.currentTime + 0.5);
        } catch {
            // no-op
        }
    };

    const triggerCelebration = (label: string) => {
        if (celebrationTimeoutRef.current) {
            window.clearTimeout(celebrationTimeoutRef.current);
        }
        setCelebrationLabel(label);
        setCelebrationKey(k => k + 1);
        setShowCelebration(true);
        playPing();

        // Fire confetti
        const end = Date.now() + 1.2 * 1000;
        const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7'];

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: colors
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());

        celebrationTimeoutRef.current = window.setTimeout(() => setShowCelebration(false), 2000);
    };

    useEffect(() => {
        return () => {
            if (celebrationTimeoutRef.current) {
                window.clearTimeout(celebrationTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!tracker) return;
        const current: Record<string, number> = {};
        STAGE_DEFS.forEach(stage => {
            current[stage.id] = getStageProgress(stage.category);
        });

        const prev = prevStageProgressRef.current;
        if (prev) {
            const newlyCompleted = STAGE_DEFS.find(stage => (prev[stage.id] ?? 0) < 100 && current[stage.id] === 100);
            if (newlyCompleted) {
                triggerCelebration(`${newlyCompleted.label} complete`);
            }
        }
        prevStageProgressRef.current = current;
    }, [tracker]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-900">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (isError || !tracker) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-900">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Application not found</h2>
                    <Link to="/applications">
                        <Button className="mt-4" variant="outline">Back to Applications</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900 pb-12">
            <CompletionCelebration show={showCelebration} label={celebrationLabel} triggerKey={celebrationKey} />
            {/* Header */}
            <div className="bg-white dark:bg-surface-800 border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Link to="/applications" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 flex-shrink-0">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                                    {tracker.program?.program_name || 'Application Tracker'}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {tracker.program?.university_name} • {tracker.program?.city}
                                </p>
                            </div>
                        </div>
                        <div className="sm:ml-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
                            {tracker.program?.id && (
                                <Link to={`/programs/${tracker.program.slug}`} target="_blank" className="flex-shrink-0">
                                    <Button variant="outline" size="sm" className="hidden sm:flex">
                                        View Program <ExternalLink className="w-3 h-3 ml-2" />
                                    </Button>
                                </Link>
                            )}
                            <div className="flex-shrink-0">
                                <DeadlineCountdown text={tracker.program.application_deadline} />
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 cursor-pointer group" onClick={() => setIsProgressModalOpen(true)}>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1 group-hover:text-primary-600 transition-colors">
                            <span className="flex items-center gap-1">
                                Overall Progress
                                <span className="text-gray-400 group-hover:text-primary-500">(Click for details)</span>
                            </span>
                            <span className="font-bold">{overallProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 transition-all duration-500 group-hover:bg-primary-500"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="md:hidden flex gap-6 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-2 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                {/* Desktop Stepper */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="sticky top-32">
                        <nav aria-label="Progress">
                            <ol role="list" className="overflow-hidden">
                                {TABS.map((step, stepIdx) => {
                                    const Icon = step.icon;
                                    const isActive = activeTab === step.id;
                                    const isLast = stepIdx === TABS.length - 1;

                                    let isCompleted = false;
                                    if (step.id !== 'overview') {
                                        const stageDef = STAGE_DEFS.find(s => s.id === step.id);
                                        if (stageDef) {
                                            isCompleted = getStageProgress(stageDef.category) === 100;
                                        }
                                    }

                                    return (
                                        <li key={step.id} className={`relative ${!isLast ? 'pb-8' : ''}`}>
                                            {!isLast ? (
                                                <div className={`absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 ${isActive || isCompleted ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} aria-hidden="true" />
                                            ) : null}
                                            <button
                                                onClick={() => setActiveTab(step.id)}
                                                className="group relative flex items-start w-full text-left"
                                            >
                                                <span className="flex h-9 items-center">
                                                    <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${isActive
                                                        ? 'border-primary-600 bg-white dark:bg-surface-800'
                                                        : isCompleted
                                                            ? 'border-primary-600 bg-primary-600 dark:bg-primary-600'
                                                            : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-surface-800 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle className="h-4 w-4 text-white" aria-hidden="true" />
                                                        ) : (
                                                            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                                                        )}
                                                    </span>
                                                </span>
                                                <span className="ml-4 flex min-w-0 flex-col">
                                                    <span className={`text-sm mt-1.5 font-medium ${isActive ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                                                        {step.label}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            {activeTab === 'overview' && <OverviewTab tracker={tracker} applicationId={applicationId} />}
                            {activeTab === 'eligibility' && <EligibilityTab tracker={tracker} />}
                            {activeTab === 'language' && <LanguageTab tracker={tracker} updateMutation={updateItemMutation} />}
                            {activeTab === 'documents' && <DocumentsTab tracker={tracker} updateMutation={updateItemMutation} applicationId={applicationId} />}
                            {activeTab === 'application' && <ApplicationTab tracker={tracker} updateMutation={updateItemMutation} />}
                            {activeTab === 'admission' && <AdmissionTab tracker={tracker} updateMutation={updateItemMutation} />}
                            {activeTab === 'finance' && <FinanceTab tracker={tracker} updateMutation={updateItemMutation} />}
                            {activeTab === 'visa' && <VisaTab tracker={tracker} updateMutation={updateItemMutation} applicationId={applicationId} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Details Modal */}
            <ProgressDetailsModal
                isOpen={isProgressModalOpen}
                onClose={() => setIsProgressModalOpen(false)}
                checklist={tracker?.checklist || []}
            />
        </div>
    );
}

// -----------------------------------------------------------------------------
// Sub-Components (Tabs)
// -----------------------------------------------------------------------------

// --- Deadline Helper ---
export const useDeadlineStatus = (dueDate?: string) => {
    if (!dueDate) return { status: 'none', label: '' };
    const now = new Date();
    const due = new Date(dueDate);

    // Reset times to compare just dates
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', label: `${Math.abs(diffDays)} days overdue` };
    if (diffDays === 0) return { status: 'warning', label: 'Due today' };
    if (diffDays <= 5) return { status: 'warning', label: `Due in ${diffDays} days` };

    return { status: 'safe', label: `Due in ${diffDays} days` };
};

export const getDeadlineStyles = (status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable', dueDate?: string) => {
    if (status === 'completed' || status === 'not_applicable') return '';
    const deadline = useDeadlineStatus(dueDate);
    if (deadline.status === 'overdue') return 'ring-2 ring-red-500 bg-red-50/30 dark:bg-red-900/10';
    if (deadline.status === 'warning') return 'ring-2 ring-amber-400 animate-pulse bg-amber-50/30 dark:bg-amber-900/10';
    return '';
};

export const DeadlineBadge = ({ dueDate, status }: { dueDate?: string, status: string }) => {
    if (status === 'completed' || status === 'not_applicable') return null;
    const deadline = useDeadlineStatus(dueDate);
    if (deadline.status === 'none' || deadline.status === 'safe') return null;

    return (
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-auto ${deadline.status === 'overdue'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
            {deadline.status === 'overdue' ? <AlertOctagon className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {deadline.label}
        </div>
    );
};

function OverviewTab({ tracker, applicationId }: { tracker: TrackerState, applicationId: number }) {
    // Group items by category to calculate progress per stage
    const stages = [
        { id: 'eligibility', label: 'Eligibility', category: 'profile_setup', icon: GraduationCap }, // Changed from 'eligibility' to 'profile_setup'
        { id: 'language', label: 'Language', category: 'language', icon: Globe },
        { id: 'documents', label: 'Documents', category: 'documents', icon: FileText },
        { id: 'application', label: 'Application', category: 'university_application', icon: Briefcase },
        { id: 'admission', label: 'Admission', category: 'admission_confirmation', icon: Landmark },
        { id: 'finance', label: 'Finance', category: 'financial_documents', icon: Euro },
        { id: 'visa', label: 'Visa', category: 'visa_process', icon: Plane },
    ];

    // Filter helper duplicate
    const isItemVisible = (item: ApplicationChecklistItem) => {
        if (item.category === 'hec_verification' || item.category === 'documents') {
            if ((item.item_name || '').toLowerCase().includes('wes')) return false;
        }
        return true;
    };

    const getStageProgress = (cat: string) => {
        // Special case for Eligibility: Always use eligibility requirements analysis if available
        if (cat === 'profile_setup' && tracker.eligibility && tracker.eligibility.length > 0) {
            const metReqs = tracker.eligibility.filter(r => r.is_met).length;
            return Math.round((metReqs / tracker.eligibility.length) * 100);
        }

        // Special case for Visa: Use localStorage checklist if no database items
        if (cat === 'visa_process') {
            const dbItems = tracker.checklist.filter(i => i.category === 'visa_process');
            if (dbItems.length === 0) {
                // Read from localStorage
                try {
                    const saved = localStorage.getItem(`visa-checklist-${applicationId}`);
                    if (saved) {
                        const localItems = JSON.parse(saved) as { name: string, completed: boolean }[];
                        const completed = localItems.filter(i => i.completed).length;
                        return Math.round((completed / localItems.length) * 100);
                    }
                } catch {
                    return 0;
                }
                return 0;
            }
            const completed = dbItems.filter(i => i.status === 'completed').length;
            return Math.round((completed / dbItems.length) * 100);
        }

        // Special case for Documents: Include HEC/Verification items
        if (cat === 'documents') {
            const items = tracker.checklist.filter(i => (i.category === 'documents' || i.category === 'hec_verification') && isItemVisible(i));
            if (items.length === 0) return 0;
            const completed = items.filter(i => i.status === 'completed').length;
            return Math.round((completed / items.length) * 100);
        }

        const items = tracker.checklist.filter(i => i.category === cat && isItemVisible(i));
        if (items.length === 0) return 0;
        const completed = items.filter(i => i.status === 'completed').length;
        return Math.round((completed / items.length) * 100);
    };

    // Overall Progress (Visible Only)
    const visibleChecklist = tracker.checklist.filter(isItemVisible);
    const overallCompleted = visibleChecklist.filter(i => i.status === 'completed').length;
    const overallTotal = visibleChecklist.length;
    const overallPercent = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

    // Determine readiness score/level
    let readinessLevel = "Getting Started";
    if (overallPercent > 20) readinessLevel = "Building Momentum";
    if (overallPercent > 40) readinessLevel = "Halfway There";
    if (overallPercent > 70) readinessLevel = "Submission Ready";
    if (overallPercent > 90) readinessLevel = "Final Polish";

    const nationality = (tracker as any).user_nationality?.toLowerCase() || '';
    const countryKey = Object.keys(COUNTRY_METADATA).find(k => nationality.includes(k));
    const countryData = countryKey ? COUNTRY_METADATA[countryKey] : null;

    return (
        <div className="space-y-8">
            {/* Country-Specific Personalized Banner */}
            {countryData && (
                <div className={`rounded-xl p-4 border flex items-center gap-4 bg-${countryData.bannerColor}-50 dark:bg-${countryData.bannerColor}-900/20 border-${countryData.bannerColor}-200 dark:border-${countryData.bannerColor}-800/30`}>
                    <span className="text-3xl">{countryData.flag}</span>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            Tailored for {countryData.name} students
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {countryData.verificationTitle} and {countryData.name}-specific guidance included.
                        </p>
                    </div>
                    <span className="text-3xl ml-auto">🇩🇪</span>
                </div>
            )}

            {/* Hero Summary */}
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm dark:shadow-surface-900/50 border p-6 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Journey</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You are currently in the <strong>{readinessLevel}</strong> phase.</p>
                    <div className="flex gap-4 justify-center md:justify-start">
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg border border-green-100 dark:border-green-800/30">
                            <span className="block text-2xl font-bold">{overallCompleted}</span>
                            <span className="text-[10px] font-semibold tracking-wider uppercase">Tasks Done</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-surface-800/50 text-slate-700 dark:text-surface-300 px-4 py-2 rounded-lg border border-slate-100 dark:border-surface-700">
                            <span className="block text-2xl font-bold">{overallTotal - overallCompleted}</span>
                            <span className="text-xs font-semibold uppercase">Remaining</span>
                        </div>
                    </div>
                </div>

                {/* Circular Progress (Visual approximation) */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray={`${overallPercent}, 100`} className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{overallPercent}%</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Ready</span>
                    </div>
                </div>
            </div>

            {/* Journey Roadmap */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Your Roadmap</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stages.map((stage, idx) => {
                        const progress = getStageProgress(stage.category);
                        const isDone = progress === 100;
                        const isNext = progress < 100 && (idx === 0 || getStageProgress(stages[idx - 1].category) > 0);
                        const Icon = stage.icon;

                        return (
                            <Card key={stage.id} className={`p-4 transition-all ${isDone ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'hover:border-primary-200 dark:hover:border-primary-800'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-lg ${isDone ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : isNext ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <Badge variant={isDone ? 'success' : isNext ? 'neutral' : 'neutral'} className={!isDone && !isNext ? 'opacity-50' : ''}>
                                        {isDone ? 'Completed' : `${progress}% Done`}
                                    </Badge>
                                </div>
                                <h4 className={`font-semibold ${isDone ? 'text-green-900 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>{stage.label}</h4>
                                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${progress}%` }}></div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Next Steps Recommendation */}
            <Card className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-1">Next Priority</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Based on your progress, you should focus on the **{stages.find(s => getStageProgress(s.category) < 100)?.label || 'Final Review'}** phase next.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// --- Progress Details Modal ---
function ProgressDetailsModal({ isOpen, onClose, checklist }: { isOpen: boolean, onClose: () => void, checklist: ApplicationChecklistItem[] }) {
    // Filter helper
    const isItemVisible = (item: ApplicationChecklistItem) => {
        if (item.category === 'hec_verification' || item.category === 'documents') {
            if ((item.item_name || '').toLowerCase().includes('wes')) return false;
        }
        return true;
    };

    const visibleItems = checklist.filter(isItemVisible);
    const completed = visibleItems.filter(i => i.status === 'completed' || i.status === 'not_applicable');
    const remaining = visibleItems.filter(i => i.status !== 'completed' && i.status !== 'not_applicable');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Progress Details" size="lg">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Remaining Tasks ({remaining.length})
                    </h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto border dark:border-red-900/30 rounded-lg p-2 bg-red-50/50 dark:bg-red-900/10">
                        {remaining.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-600 mb-2" />
                                <p className="text-green-700 dark:text-green-400 font-medium">All tasks completed!</p>
                            </div>
                        ) : (
                            remaining.map(item => (
                                <div key={item.id} className="flex items-start gap-2 p-3 bg-white dark:bg-surface-800 rounded border border-red-100 dark:border-red-900/30 shadow-sm dark:shadow-surface-900/50">
                                    <div className="mt-0.5"><Circle className="w-4 h-4 text-red-300 dark:text-red-500" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.item_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                                        <Badge variant="neutral" className="mt-1 capitalize">{item.category?.replace(/_/g, ' ')}</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {completed.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Completed ({completed.length})
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto border dark:border-green-900/30 rounded-lg p-2 bg-green-50/50 dark:bg-green-900/10 opacity-75 hover:opacity-100 transition-opacity">
                            {completed.map(item => (
                                <div key={item.id} className="flex items-start gap-2 p-2 bg-white/60 dark:bg-surface-800 rounded border border-green-100 dark:border-green-800/30">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white decoration-slate-500">{item.item_name}</p>
                                        {/* <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function CompletionCelebration({ show, label, triggerKey }: { show: boolean; label: string; triggerKey: number }) {
    const pieces = useMemo(() => {
        const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
        return Array.from({ length: 18 }, (_, i) => {
            const angle = (i / 18) * Math.PI * 2;
            const radius = 110 + Math.random() * 40;
            return {
                id: i,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                rotate: Math.random() * 360,
                delay: Math.random() * 0.08,
                size: 6 + Math.random() * 6,
                color: colors[i % colors.length],
            };
        });
    }, [triggerKey]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key={triggerKey}
                    className="fixed inset-0 pointer-events-none z-[70] flex items-start justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <div className="relative mt-24">
                        <motion.div
                            className="flex items-center gap-2 bg-white dark:bg-surface-800 text-gray-900 dark:text-white px-4 py-2 rounded-full shadow-lg border border-green-100 dark:border-green-900/40"
                            initial={{ scale: 0.7, opacity: 0, y: 8 }}
                            animate={{ scale: [0.7, 1.08, 1], opacity: [0, 1, 0], y: [8, -6, -12] }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                        >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-semibold">{label}</span>
                        </motion.div>

                        {pieces.map(piece => (
                            <motion.span
                                key={piece.id}
                                className="absolute left-1/2 top-1/2 rounded-full"
                                style={{ width: piece.size, height: piece.size, backgroundColor: piece.color }}
                                initial={{ opacity: 0, x: 0, y: 0, scale: 0.6, rotate: 0 }}
                                animate={{ opacity: [0, 1, 0], x: piece.x, y: piece.y, scale: [0.6, 1, 0.8], rotate: piece.rotate }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: piece.delay }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function FilePreviewModal({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    fileType
}: {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string | null;
    fileName: string;
    fileType?: string;
}) {
    if (!isOpen || !fileUrl) return null;

    const isPdf = fileName.toLowerCase().endsWith('.pdf') || fileType === 'application/pdf';
    const isImage = fileName.match(/\.(jpeg|jpg|gif|png)$/i) != null || fileType?.startsWith('image/');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-surface-900">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        {fileName}
                    </h3>
                    <div className="flex items-center gap-2">
                        <a href={fileUrl} download={fileName}>
                            <Button size="sm" variant="outline" className="h-8">
                                <Upload className="w-4 h-4 mr-2 rotate-180" /> Download
                            </Button>
                        </a>
                        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-100 p-4 overflow-auto flex items-center justify-center">
                    {isPdf ? (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full rounded-lg shadow-sm dark:shadow-surface-900/50 bg-white dark:bg-surface-800"
                            title="Document Preview"
                        />
                    ) : isImage ? (
                        <img
                            src={fileUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-sm dark:shadow-surface-900/50"
                        />
                    ) : (
                        <div className="text-center p-8">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Preview not available for this file type.</p>
                            <Button className="mt-4" onClick={() => window.open(fileUrl, '_blank')}>
                                Download to View
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EligibilityTab({ tracker }: { tracker: TrackerState & { profile_gpa?: { cgpa: number, scale: number } } }) {
    // Ensure we handle numeric to string conversion safely for the select options (which expect "4.0", "5.0", etc.)
    const formatScale = (s?: number) => s ? (Number.isInteger(s) ? s.toFixed(1) : s.toString()) : undefined;

    const [gpaInput, setGpaInput] = useState(tracker.profile_gpa?.cgpa?.toString() || '');

    // Initialize scale with smart default: Override 4.0 to 10.0 for Indian users (who might have 4.0 as legacy default)
    // Initialize scale with smart default based on country metadata
    const [scaleInput, setScaleInput] = useState(() => {
        const nat = (tracker as any).user_nationality?.toLowerCase() || '';
        const profileScale = tracker.profile_gpa?.scale;

        // Find country metadata
        const countryKey = Object.keys(COUNTRY_METADATA).find(k => nat.includes(k));
        const defaultScale = countryKey ? COUNTRY_METADATA[countryKey].defaultGpaScale : '4.0';

        // Heuristic: If profile has '4.0' or '5.0' but country default is different (e.g. 10.0 or 100), override
        // This fixes legacy profile data overriding the correct scale
        if (countryKey && (profileScale === 4.0 || !profileScale) && defaultScale !== '4.0') {
            return defaultScale;
        }
        return formatScale(profileScale) || defaultScale;
    });

    const [conversionResult, setConversionResult] = useState<any>(null);

    // Sync state with props when tracker data updates (e.g. async fetch)
    useEffect(() => {
        if (tracker.profile_gpa?.cgpa) setGpaInput(tracker.profile_gpa.cgpa.toString());

        const nat = (tracker as any).user_nationality?.toLowerCase() || '';
        const profileScale = tracker.profile_gpa?.scale;

        const countryKey = Object.keys(COUNTRY_METADATA).find(k => nat.includes(k));
        const defaultScale = countryKey ? COUNTRY_METADATA[countryKey].defaultGpaScale : '4.0';

        // Apply same heuristic for updates
        if (countryKey && (profileScale === 4.0 || !profileScale) && defaultScale !== '4.0') {
            setScaleInput(defaultScale);
        } else if (profileScale) {
            setScaleInput(formatScale(profileScale) || '4.0');
        } else {
            setScaleInput(defaultScale);
        }
    }, [tracker.profile_gpa, (tracker as any).user_nationality]);
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const applicationId = parseInt(id || '0');

    const checkEligibilityMutation = useMutation({
        mutationFn: () => applicationsApi.checkEligibility(tracker.checklist[0]?.application_id || applicationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
        }
    });

    const calculateGpa = async () => {
        try {
            // Determine min passing grade based on selected scale and known country data
            let minPassing = undefined;
            const s = parseFloat(scaleInput);

            // 1. Try to find country match if scale matches default
            const nat = (tracker as any).user_nationality?.toLowerCase() || '';
            const countryKey = Object.keys(COUNTRY_METADATA).find(k => nat.includes(k));

            if (countryKey) {
                const meta = COUNTRY_METADATA[countryKey];
                // If the selected scale matches the country's default scale (loosely), use its minPassing
                // e.g. if meta.defaultGpaScale is "20.0" and user selected "20.0"
                if (parseFloat(meta.defaultGpaScale) === s) {
                    minPassing = meta.minPassingGrade;
                }
            }

            // 2. Fallbacks for specific scales if no country match or custom scale
            if (minPassing === undefined) {
                if (s === 100) minPassing = 50; // Standard percentage pass
                else if (s === 70) minPassing = 40; // UK Honours percentage (Third Class = 40%)
                else if (s === 20) minPassing = 10; // France/Iran style
                else if (s === 10) minPassing = 4.0; // India/Vietnam style
                else if (s === 5) minPassing = 2.0; // General 5.0 scale
                else if (s === 4) minPassing = 2.0; // General 4.0 scale
            }

            const res = await applicationsApi.calculateGpa(parseFloat(gpaInput), s, minPassing);
            setConversionResult(res);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Profile Analysis */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary-600" />
                        Academic Profile Analysis
                    </h3>
                    <div className="space-y-4">
                        {tracker.eligibility.map(req => (
                            <div key={req.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-surface-900 rounded-lg">
                                {req.is_met === true ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : req.is_met === false ? (
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{req.requirement_name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Required: <span className="font-medium">{req.requirement_value}</span></p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Profile: <span className="font-medium">{req.user_value || 'Not set'}</span></p>
                                </div>
                            </div>
                        ))}
                        {tracker.eligibility.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                                Run the eligibility check to see analysis.
                            </div>
                        )}

                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => checkEligibilityMutation.mutate()}
                            isLoading={checkEligibilityMutation.isPending}
                        >
                            Refresh Eligibility Check
                        </Button>
                    </div>
                </Card>

                {/* GPA Tools */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary-600" />
                        GPA Calculator
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your GPA/CGPA</label>
                                <Input
                                    value={gpaInput}
                                    onChange={(e: any) => setGpaInput(e.target.value)}
                                    placeholder="e.g. 2.75"
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Scale</label>
                                <Select
                                    value={scaleInput}
                                    onChange={(e) => setScaleInput(e.target.value)}
                                    options={[
                                        { value: "4.0", label: "4.0 (Pakistan/USA/Indonesia/Turkey/Egypt)" },
                                        { value: "5.0", label: "5.0 (Nigeria/Russia/Eastern Europe)" },
                                        { value: "10.0", label: "10.0 (India/Vietnam)" },
                                        { value: "20.0", label: "20.0 (Iran/France/Lebanon)" },
                                        { value: "70", label: "70 (United Kingdom — Honours %)" },
                                        { value: "100", label: "100 (China/Percentage)" }
                                    ]}
                                />
                            </div>
                        </div>

                        <Button onClick={calculateGpa} className="w-full">Convert to German Scale</Button>

                        {conversionResult && (
                            <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">German Grade ({conversionResult.classification}):</p>
                                <div className="text-3xl font-bold text-primary-700">
                                    {conversionResult.german_grade}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <strong>Formula Used:</strong> {conversionResult.formula} <br />
                                    1.0 is Best, 4.0 is Minimum Pass.
                                </p>
                            </div>
                        )}

                        <div className="text-xs text-gray-400 mt-2">
                            Uses the Modified Bavarian Formula: <br />
                            <code>1 + 3 * (Nmax - Nd) / (Nmax - Nmin)</code>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

const TEST_LINKS: Record<string, string> = {
    'IELTS': 'https://ielts.org/test-centres',
    'TOEFL': 'https://www.ets.org/toefl.html',
    'PTE': 'https://www.pearsonpte.com/book-now',
    'German (TestDaF)': 'https://www.testdaf.de/de/teilnehmende/mein-testdaf/testzentrum-finden/'
};

function LanguageTab({ tracker, updateMutation }: { tracker: TrackerState, updateMutation: any }) {
    const reqs = tracker.program.language_requirements || "No specific requirements parsed.";
    const languageItems = tracker.checklist.filter(i => i.category === 'language');

    const toggleStatus = (item: ApplicationChecklistItem) => {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed';
        updateMutation.mutate({ itemId: item.id, status: newStatus });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Language Requirements</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-surface-900 p-4 rounded-lg border">{reqs}</p>

                <div className="mt-6 mb-8">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Book English / German Test</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(TEST_LINKS).map(([test, url]) => (
                            <a
                                key={test}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border p-4 rounded-lg text-center hover:bg-gray-50 dark:bg-surface-900 cursor-pointer block group"
                            >
                                <div className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{test}</div>
                                <div className="text-xs text-blue-600 mt-1 flex items-center justify-center gap-1">
                                    Check Booking <ExternalLink className="w-3 h-3" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Manual Checklist */}
                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Language Checklist</h4>
                    {languageItems.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic text-sm">No checklist items found. Create a new application to see the default tasks.</p>
                    ) : (
                        <div className="space-y-2">
                            {languageItems.map(item => (
                                <div key={item.id} className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-surface-900 transition-colors cursor-pointer ${getDeadlineStyles(item.status, item.due_date)}`} onClick={() => toggleStatus(item)}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className={item.status === 'completed' ? 'line-through text-gray-400 flex-1' : 'text-gray-900 dark:text-white font-medium flex-1'}>
                                        {item.item_name}
                                    </div>
                                    <DeadlineBadge dueDate={item.due_date} status={item.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}



// --- Unified Document Picker Modal ---
// Shows vault docs at the top (searchable) + an upload-new area at the bottom,
// so users never need to choose between two separate buttons.
function UnifiedDocumentPicker({
    isOpen,
    onClose,
    onSelect,
    onUpload,
    isUploading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (docId: number) => void;
    onUpload: (file: File) => void;
    isUploading: boolean;
}) {
    const { data: vaultDocs } = useQuery({
        queryKey: ['vault-documents'],
        queryFn: vaultApi.getDocuments,
        enabled: isOpen
    });
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filteredDocs = vaultDocs?.filter(d =>
        d.file_name.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary-600" />
                        Attach Document
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Vault section */}
                <div className="p-4 flex-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Your Vault</p>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        {filteredDocs.length === 0 ? (
                            <p className="text-center text-gray-400 py-6 text-sm">No vault documents found.</p>
                        ) : (
                            filteredDocs.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => { onSelect(doc.id); onClose(); }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-surface-900 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all text-left group"
                                >
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 flex-shrink-0">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white truncate text-sm">{doc.file_name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 mt-0.5">
                                            <span>{doc.category}</span>
                                            <span>•</span>
                                            <span>{((doc.file_size || 0) / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Upload-new divider section */}
                <div className="p-4 border-t bg-gray-50 dark:bg-surface-900 flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Or upload a new file</p>
                    <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {isUploading ? 'Uploading…' : 'Choose file from your device'}
                        </span>
                        <input
                            type="file"
                            className="hidden"
                            disabled={isUploading}
                            onChange={e => {
                                if (e.target.files?.[0]) {
                                    onUpload(e.target.files[0]);
                                    onClose();
                                }
                            }}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}

function AddCredentialModal({
    isOpen,
    onClose,
    onSave,
    defaultName = '',
    defaultUrl = ''
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { portal_url: string; username: string; password?: string; portal_name?: string }) => void;
    defaultName?: string;
    defaultUrl?: string;
}) {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Update state when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(defaultName || '');
            setUrl(defaultUrl || '');
            setUsername('');
            setPassword('');
        }
    }, [isOpen, defaultName, defaultUrl]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ portal_url: url, username, password, portal_name: name });
        // Reset form is handled by useEffect on next open, but we can clear here too
        setUsername('');
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-surface-900">
                    <h3 className="font-semibold text-lg">Add Application Credential</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portal Name (Optional)</label>
                        <Input
                            placeholder="e.g. TUMonline"
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login URL *</label>
                        <Input
                            placeholder="https://campus.tum.de"
                            value={url}
                            onChange={(e: any) => setUrl(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username / Email *</label>
                        <Input
                            placeholder="john.doe@example.com"
                            value={username}
                            onChange={(e: any) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (Optional)</label>
                        <Input
                            type="password"
                            placeholder="Saved securely to Vault"
                            value={password}
                            onChange={(e: any) => setPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Will be saved to your secure Vault.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Credential</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DocumentsTab({ tracker, updateMutation, applicationId }: { tracker: TrackerState, updateMutation: any, applicationId: number }) {
    const hecItems = tracker.checklist.filter(i => i.category === 'hec_verification' && !i.item_name.toLowerCase().includes('wes'));
    const docItems = tracker.checklist.filter(i => i.category === 'documents' && !i.item_name.toLowerCase().includes('wes'));
    // Filter out WES from documents list in case of stale DB data
    const docReqs = (tracker.documents || []).filter(d =>
        !d.document_type.toLowerCase().includes('wes') &&
        !(d.document_name || '').toLowerCase().includes('wes')
    );
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    // pickerDocType: non-null means the unified picker modal is open for that doc type
    const [pickerDocType, setPickerDocType] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Detect nationality mismatch: check if HEC items match current nationality  
    const nationality = ((tracker as any).user_nationality || '').toLowerCase();
    const countryKey = Object.keys(COUNTRY_METADATA).find(k => nationality.includes(k));
    const hasStaleData = (() => {
        if (!countryKey) return false;
        // Each country has a unique fingerprint that MUST be in its HEC items
        const expectedFingerprint: Record<string, string> = {
            india: 'aps-india',
            pakistan: 'hec',
            china: 'aps.org.cn',
            iran: 'visametric',
            turkey: 'kaymakamlik',
            bangladesh: 'apostille.mygov.bd',
            'united states': 'secretary of state',
            'united kingdom': 'fcdo',
            canada: 'global affairs canada',
            nigeria: 'federal ministry of education',
            russia: 'rosobrnadzor',
            egypt: 'tlscontact',
            indonesia: 'ahu',
        };
        const expectedTerm = expectedFingerprint[countryKey];
        if (!expectedTerm || hecItems.length === 0) return false;
        return !hecItems.some(item =>
            ((item.description || '') + ' ' + (item.item_name || '')).toLowerCase().includes(expectedTerm)
        );
    })();

    const handleResync = async () => {
        setIsSyncing(true);
        try {
            await applicationsApi.reinitTracker(applicationId);
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
            novaToast.success('All synced! Your tracker is up to date.');
        } catch (err) {
            console.error('Resync failed', err);
            novaToast.error('Sync failed. Give it another try?');
        } finally {
            setIsSyncing(false);
        }
    };

    // Preview State
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState<string>('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Uses the dedicated endpoint — no more -(1000 + docId) proxy construction
    const handleViewDocument = async (reqId: number, fileName: string) => {
        const toastId = novaToast.loading('Loading your document...');
        try {
            const blob = await applicationsApi.fetchRequirementBlob(applicationId, reqId);
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPreviewName(fileName);
            setIsPreviewOpen(true);
            novaToast.dismiss(toastId);
        } catch (err) {
            console.error('Failed to load document', err);
            novaToast.dismiss(toastId);
            novaToast.error('Failed to load document preview.');
        }
    };

    // Clean up URL on unmount or close
    const closePreview = () => {
        setIsPreviewOpen(false);
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleCreateSOP = () => {
        const params = new URLSearchParams({
            university: tracker.program.university_name,
            programId: tracker.program.program_id,
            returnTo: applicationId.toString()
        });
        navigate(`/tools/sop-generator?${params.toString()}`);
    };

    const handleCreateCV = () => {
        const params = new URLSearchParams({
            university: tracker.program.university_name || '',
            program: tracker.program.program_name || '',
            returnTo: applicationId.toString()
        });
        navigate(`/tools/cv-generator?${params.toString()}`);
    };

    const toggleStatus = (item: ApplicationChecklistItem) => {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed';
        updateMutation.mutate({ itemId: item.id, status: newStatus });
    };

    // Called from the unified picker's upload area
    const handlePickerUpload = async (file: File) => {
        if (!pickerDocType) return;
        const docType = pickerDocType;
        setPickerDocType(null); // close picker optimistically
        try {
            setIsUploading(true);
            await applicationsApi.uploadDocument(applicationId, file, docType);
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
            queryClient.invalidateQueries({ queryKey: ['vault-documents'] });
        } catch (err) {
            console.error('Upload failed', err);
            novaToast.error('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Called from the "Update" label on already-uploaded docs (bypass picker)
    const handleDirectUpload = async (docType: string, file: File) => {
        try {
            setIsUploading(true);
            await applicationsApi.uploadDocument(applicationId, file, docType);
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
            queryClient.invalidateQueries({ queryKey: ['vault-documents'] });
        } catch (err) {
            console.error('Upload failed', err);
            novaToast.error('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveDocument = async (docType: string) => {
        if (!confirm("Are you sure you want to remove this document?")) return;

        try {
            await applicationsApi.deleteDocument(applicationId, docType);
            novaToast.success('Document removed successfully.');
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
        } catch (err) {
            console.error('Failed to remove document', err);
            novaToast.error('Couldn\'t remove that document. Try again?');
        }
    };

    const handleVaultSelect = async (vaultDocId: number) => {
        if (!pickerDocType) return;
        const docType = pickerDocType;
        setPickerDocType(null);
        try {
            await applicationsApi.linkVaultDocument(applicationId, docType, vaultDocId);
            novaToast.success('Document linked from your Vault!');
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
        } catch (err) {
            console.error('Link vault doc failed', err);
            novaToast.error('Couldn\'t link that document. Please retry.');
        }
    };

    return (
        <div className="space-y-6">
            <UnifiedDocumentPicker
                isOpen={pickerDocType !== null}
                onClose={() => setPickerDocType(null)}
                onSelect={handleVaultSelect}
                onUpload={handlePickerUpload}
                isUploading={isUploading}
            />

            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={closePreview}
                fileUrl={previewUrl}
                fileName={previewName}
            />

            {/* Nationality Mismatch Warning */}
            {hasStaleData && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-medium text-amber-900">Outdated checklist detected</p>
                            <p className="text-sm text-amber-700">Your tracker has steps from a different country. Re-sync to update based on your current nationality.</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleResync}
                        disabled={isSyncing}
                        className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                    >
                        {isSyncing ? 'Syncing...' : '↻ Re-sync'}
                    </Button>
                </div>
            )}

            {/* 1. Preparation Steps */}
            <Card className="p-6 border-l-4 border-l-primary-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">1</span>
                        Document Preparation
                    </h3>

                    {/* SOP and CV Buttons */}
                    <div className="flex flex-col gap-2 items-end">
                        {docReqs.some(doc => doc.document_type === 'sop') && (
                            <Button size="sm" onClick={handleCreateSOP} className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all">
                                <Sparkles className="w-4 h-4 mr-2" /> AI Create SOP
                            </Button>
                        )}
                        {(docReqs.some(doc => ['cv', 'resume', 'curriculum_vitae'].includes((doc.document_type || '').toLowerCase())) ||
                            tracker.checklist.some(item => ['cv', 'resume'].some(term => item.item_name.toLowerCase().includes(term)))) && (
                                <Button size="sm" onClick={handleCreateCV} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg transition-all">
                                    <FileText className="w-4 h-4 mr-2" /> AI Create CV
                                </Button>
                            )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm p-3 rounded-lg border dark:border-blue-800/30">
                        <strong>Action Required:</strong> Please check off these items once you have drafted/collected them.
                    </div>
                    <div className="space-y-2">
                        {docItems.map(item => (
                            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${item.status === 'completed' ? 'bg-gray-50 dark:bg-surface-900 border-gray-100 dark:border-gray-700' : 'bg-white dark:bg-surface-800 border-primary-100 shadow-sm dark:shadow-surface-900/50'}`}>
                                <button onClick={() => toggleStatus(item)} className="focus:outline-none">
                                    {item.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Circle className="w-6 h-6 text-primary-400 hover:text-primary-600" />}
                                </button>
                                <div>
                                    <span className={`block font-medium ${item.status === 'completed' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{item.item_name}</span>
                                    {item.description && <span className="text-sm text-gray-500 dark:text-gray-400">{item.description}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {hecItems.length > 0 && (() => {
                const nationality = (tracker as any).user_nationality?.toLowerCase() || '';
                const countryKey = Object.keys(COUNTRY_METADATA).find(k => nationality.includes(k));
                const countryData = countryKey ? COUNTRY_METADATA[countryKey] : null;

                if (!countryData) return null;

                return (
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl shadow-sm dark:shadow-surface-900/50 rounded-full p-1 bg-white dark:bg-surface-800 border">{countryData.flag}</span>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{countryData.verificationTitle}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Official verification process for {countryData.name}</p>
                            </div>
                        </div>

                        {/* Detailed Guide */}
                        <div className="bg-white dark:bg-surface-800 border rounded-xl overflow-hidden mb-8">
                            <div className="bg-gray-50 dark:bg-surface-900 px-4 py-3 border-b flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Step-by-Step Process</span>
                            </div>
                            <div className="p-5 relative">
                                <div className="absolute left-8 top-5 bottom-5 w-0.5 bg-gray-200"></div>
                                <div className="space-y-6 relative">
                                    {countryData.verificationSteps.map((step, idx) => (
                                        <div key={idx} className="flex gap-4 relative">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 border-2 border-primary-500 text-primary-700 flex items-center justify-center text-sm font-bold z-[1]">
                                                {idx + 1}
                                            </div>
                                            <div className="pt-1">
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">{step.title}</h5>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {hecItems.map(item => (
                                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:bg-surface-900 transition-colors">
                                    <button className="mt-0.5 flex-shrink-0" onClick={() => toggleStatus(item)}>
                                        {item.status === 'completed' ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{item.item_name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Locations & Quick Links */}
                        {/* Locations & Quick Links */}
                        {countryData.verificationLocations && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Verification Offices
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {countryData.verificationLocations.map(loc => (
                                        <div
                                            key={loc.name}
                                            className="group flex flex-col p-3 bg-white dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all shadow-sm dark:shadow-surface-900/50 hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                                    <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{loc.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{loc.type}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                                                <a
                                                    href={loc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 bg-gray-50 dark:bg-surface-900 hover:bg-primary-50 px-2 py-1.5 rounded transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Info/Map
                                                </a>
                                                {loc.portalUrl && (
                                                    <a
                                                        href={loc.portalUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-2 py-1.5 rounded transition-colors shadow-sm dark:shadow-surface-900/50"
                                                    >
                                                        <ExternalLink className="w-3 h-3" /> Portal
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })()}

            {/* 3. Required Documents Upload */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Required Documents</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {docReqs.map(doc => {
                        const isUploaded = !!doc.file_path; // OR check status
                        return (
                            <div key={doc.id} className={`border p-4 rounded-lg flex items-center justify-between ${isUploaded ? 'bg-green-50 border-green-200' : ''}`}>
                                <div className="min-w-0 flex-1 mr-4">
                                    <div className="font-medium text-gray-900 dark:text-white truncate" title={doc.document_name || doc.document_type}>
                                        {doc.document_name || doc.document_type}
                                    </div>
                                    <Badge variant={isUploaded ? 'success' : 'neutral'} className="mt-1">
                                        {isUploaded ? 'Uploaded' : doc.document_type}
                                    </Badge>
                                    {isUploaded && doc.file_name && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                            {doc.file_name}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    {isUploaded ? (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleViewDocument(doc.id, doc.file_name || doc.document_type)}
                                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveDocument(doc.document_type)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                                                Replace
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    disabled={isUploading}
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            handleDirectUpload(doc.document_type, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        // Single unified action — opens the combined vault + upload picker
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-3 text-xs"
                                            disabled={isUploading}
                                            onClick={() => setPickerDocType(doc.document_type)}
                                        >
                                            <Upload className="w-3 h-3 mr-1.5" /> Attach
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

function ApplicationTab({ tracker, updateMutation }: { tracker: TrackerState, updateMutation: any }) {
    const portalItems = tracker.checklist.filter(i => i.category === 'university_application');

    const toggleStatus = (item: ApplicationChecklistItem) => {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed';
        updateMutation.mutate({ itemId: item.id, status: newStatus });
    };

    const queryClient = useQueryClient();
    const [isAddCredOpen, setIsAddCredOpen] = useState(false);
    const { id } = useParams<{ id: string }>();
    const applicationId = parseInt(id || '0');

    const addCredentialMutation = useMutation({
        mutationFn: (data: { portal_url: string; username: string; password?: string; portal_name?: string }) =>
            applicationsApi.addCredential(tracker?.checklist[0]?.application_id || applicationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['application-tracker', applicationId] });
            queryClient.invalidateQueries({ queryKey: ['vault-credentials'] });
            setIsAddCredOpen(false);
            novaToast.success('Credential saved!');
        },
        onError: () => {
            novaToast.error('Couldn\'t save the credential.');
        }
    });

    return (
        <div className="space-y-6">
            {/* Step-by-Step Guide */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" /> Application Process Guide
                </h3>
                <div className="bg-slate-50 dark:bg-surface-800/50 border border-slate-200 dark:border-surface-700 rounded-lg p-4 mb-2">
                    <div className="text-sm text-slate-700 dark:text-surface-300 space-y-3">
                        <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">1</span>
                            <div>
                                <p className="font-medium">Check Portal Type</p>
                                <p className="text-slate-500 dark:text-surface-400">Determine if the university uses <strong>Uni-Assist</strong>, their own <strong>Direct Portal</strong> (e.g., TUMonline, C@MPUS), or <strong>Hochschulstart</strong>.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">2</span>
                            <div>
                                <p className="font-medium">Register & Activate</p>
                                <p className="text-slate-500 dark:text-surface-400">Create an account using your permanent email. Activate it via the link sent to your inbox. Save your credentials below.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">3</span>
                            <div>
                                <p className="font-medium">Fill Online Application</p>
                                <p className="text-slate-500 dark:text-surface-400">Enter personal details exactly as on your passport. Upload PDFs (max 5MB usually). Rename files clearly (e.g., <code>CV_Name.pdf</code>).</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">4</span>
                            <div>
                                <p className="font-medium">Pay Application Fee</p>
                                <p className="text-slate-500 dark:text-surface-400">Pay via Credit Card or Bank Transfer (IBAN). Save the payment receipt/proof.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">5</span>
                            <div>
                                <p className="font-medium">Submit & Download</p>
                                <p className="text-slate-500 dark:text-surface-400">Click submit. Download the summary PDF ("Antrag auf Zulassung"). <br /><em>Note: Some unis require sending this signed PDF via post.</em></p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Portal Manager */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/30">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Application Portal</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your credentials and submission status</p>
                    </div>

                    {(tracker.program.contact_website || tracker.program.url) && (
                        <a href={tracker.program.contact_website || tracker.program.url} target="_blank" rel="noopener noreferrer">
                            <Button>Go to University Website <ExternalLink className="w-4 h-4 ml-2" /></Button>
                        </a>
                    )}
                </div>

                {/* Credentials List (Mock) */}
                <div className="mt-6 bg-white dark:bg-surface-800 p-4 rounded-lg shadow-sm dark:shadow-surface-900/50 border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Saved Credentials
                    </h4>
                    {tracker.credentials.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">No credentials saved yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {tracker.credentials.map((cred: any) => (
                                <div key={cred.id} className="flex justify-between text-sm">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{cred.username}</span>
                                    <a href={cred.portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Launch</a>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-primary-600"
                        onClick={() => setIsAddCredOpen(true)}
                    >
                        + Add Credential
                    </Button>
                </div>
            </Card>

            <AddCredentialModal
                isOpen={isAddCredOpen}
                onClose={() => setIsAddCredOpen(false)}
                onSave={(data) => addCredentialMutation.mutate(data)}
                defaultName={tracker.program.program_name}
                defaultUrl={tracker.program.contact_website || tracker.program.url}
            />
            {/* Final Checklist */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Submission Checklist</h3>
                <div className="space-y-2">
                    {portalItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50 dark:bg-surface-900 transition-colors cursor-pointer" onClick={() => toggleStatus(item)}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div className={item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>
                                {item.item_name}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function AdmissionTab({ tracker, updateMutation }: { tracker: TrackerState, updateMutation: any }) {
    const admissionItems = tracker.checklist.filter(i => i.category === 'admission_confirmation');

    const toggleStatus = (item: ApplicationChecklistItem) => {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed';
        updateMutation.mutate({ itemId: item.id, status: newStatus });
    };

    return (
        <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg p-5">
                <h3 className="font-semibold text-green-900 dark:text-green-400 flex items-center gap-2 text-lg">
                    <CheckCircle className="w-5 h-5" /> Admission Phase
                </h3>
                <p className="text-green-700 dark:text-green-300 mt-1">
                    Congratulations! After receiving your admission letter, follow these steps to become an enrolled student (Immatrikulation).
                </p>
            </div>

            {/* Enrollment Guide */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary-600" /> Enrollment Guide
                </h3>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-surface-800/50 border border-slate-200 dark:border-surface-700 rounded-lg p-5 text-sm text-slate-700 dark:text-surface-300 space-y-3">
                        <p><strong className="text-slate-900 dark:text-white">1. Accept Study Place:</strong> Log in to the university portal and formally click "Accept" or "Enroll". Do this immediately, as deadlines are often short (1-2 weeks).</p>

                        <div className="pt-2">
                            <strong className="text-slate-900 dark:text-white block mb-1">2. Health Insurance (M10 Notification):</strong>
                            <p className="mb-2">You cannot enroll without this. Contact a German public provider (TK/AOK) or Expatrio/Coracle. Ask them to trigger the digital <strong>M10 Notification</strong> to your university.</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <a href="https://www.tk.de/en" target="_blank" rel="noopener noreferrer"><Badge variant="neutral" className="hover:bg-blue-50 cursor-pointer">TK (Techniker)</Badge></a>
                                <a href="https://www.aok.de/kp/uni/" target="_blank" rel="noopener noreferrer"><Badge variant="neutral" className="hover:bg-green-50 cursor-pointer">AOK</Badge></a>
                                <a href="https://www.expatrio.com" target="_blank" rel="noopener noreferrer"><Badge variant="neutral" className="hover:bg-purple-50 cursor-pointer">Expatrio</Badge></a>
                                <a href="https://www.coracle.de" target="_blank" rel="noopener noreferrer"><Badge variant="neutral" className="hover:bg-orange-50 cursor-pointer">Coracle</Badge></a>
                            </div>
                        </div>

                        <p><strong className="text-slate-900 dark:text-white">3. Semester Contribution:</strong> Transfer the semester fee (approx. €100-400) to the university bank account. Use your <strong>Application ID</strong> as the reference/payment reason.</p>

                        <p><strong className="text-slate-900 dark:text-white">4. Post Documents:</strong> Most universities still require you to send <strong>Certified Hard Copies</strong> of your final degree and transcripts via post to their International Office. Check the deadline!</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Admission Checklist</h3>
                <div className="space-y-2">
                    {admissionItems.length === 0 ? (
                        <p className="text-slate-500 dark:text-surface-400 italic">No admission items. Start a new application to see this section.</p>
                    ) : admissionItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:bg-surface-900 transition-colors cursor-pointer" onClick={() => toggleStatus(item)}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                                <div className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                    {item.item_name}
                                </div>
                                {item.description && <div className="text-xs text-slate-500 dark:text-surface-400">{item.description}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function FinanceTab({ tracker, updateMutation }: { tracker: TrackerState, updateMutation: any }) {
    const financeItems = tracker.checklist.filter(i => i.category === 'financial_documents');

    const BLOCKED_ACCOUNT_AMOUNT = "€11,904";

    const toggleStatus = (item: ApplicationChecklistItem) => {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed';
        updateMutation.mutate({ itemId: item.id, status: newStatus });
    };

    return (
        <div className="space-y-6">
            {/* Scholarships & Funding Section */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary-600" /> Scholarships & Funding
                </h3>

                {tracker.program.funding_opportunities ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">Program Specific Funding</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-line">
                            {tracker.program.funding_opportunities}
                        </p>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-surface-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 text-sm text-gray-500 dark:text-gray-400 italic">
                        No specific funding information listed for this program.
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Looking for external scholarships?
                    </div>
                    <Link to="/scholarships">
                        <Button variant="outline" size="sm">
                            Search Database <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                    </Link>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Proof Requirements</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-50 dark:bg-surface-800/50 p-4 rounded-lg border">
                        <div className="text-xs text-slate-500 dark:text-surface-400 uppercase font-semibold">Blocked Account Amount</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{BLOCKED_ACCOUNT_AMOUNT}</div>
                        <div className="text-xs text-slate-400 mt-1">Per year (required for Visa)</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-surface-800/50 p-4 rounded-lg border">
                        <div className="text-xs text-slate-500 dark:text-surface-400 uppercase font-semibold">Accepted Providers</div>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="neutral">Fintiba</Badge>
                            <Badge variant="neutral">Expatrio</Badge>
                            <Badge variant="neutral">Coracle</Badge>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Checklist</h4>
                    {financeItems.length === 0 ? (
                        <p className="text-slate-500 dark:text-surface-400 italic">No finance items. Start a new application.</p>
                    ) : financeItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:bg-surface-900 transition-colors cursor-pointer" onClick={() => toggleStatus(item)}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                                <div className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                    {item.item_name}
                                </div>
                                {item.description && <div className="text-xs text-slate-500 dark:text-surface-400">{item.description}</div>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Open Provider Portals</h4>
                    <div className="flex gap-4">
                        <a href="https://www.fintiba.com" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">Open Fintiba <ExternalLink className="w-3 h-3 ml-2" /></Button>
                        </a>
                        <a href="https://www.expatrio.com" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">Open Expatrio <ExternalLink className="w-3 h-3 ml-2" /></Button>
                        </a>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Interview Questions Data for Application Tracker
const INTERVIEW_QUESTIONS_DATA = [
    {
        category: 'Study Plans',
        icon: '🎓',
        questions: [
            {
                question: 'Why do you want to study in Germany?',
                sampleAnswer: 'Germany offers world-class education with tuition-free universities and strong industry connections. The program aligns with my career goals in [field], and the focus on research and practical training prepares me for the job market.',
                dos: ['Be specific about Germany', 'Mention the program by name', 'Connect to your career goals'],
                donts: ['Generic answers like "it\'s cheap"', 'Comparing negatively to your home country']
            },
            {
                question: 'Why did you choose this specific university and program?',
                sampleAnswer: 'I chose this university because of its strong reputation in [field]. The curriculum includes [specific courses] that directly relate to my interests. The partnerships with companies offer excellent internship opportunities.',
                dos: ['Research the program thoroughly', 'Mention specific professors or projects', 'Show you\'ve done homework'],
                donts: ['Saying it was easy to get into', 'Not knowing basic program facts']
            },
            {
                question: 'What are your plans after completing your studies?',
                sampleAnswer: 'After completing my studies, I plan to gain 2-3 years of work experience in Germany to apply my knowledge practically. Long-term, I aim to contribute to [specific industry] development.',
                dos: ['Show clear career goals', 'Connect studies to career path', 'It\'s okay to mention working in Germany'],
                donts: ['Saying you\'ll definitely stay forever', 'Having no clear plans']
            },
            {
                question: 'What are the core modules of your program?',
                sampleAnswer: 'The core modules include [list 3-4 key courses from the curriculum]. These cover [topics] which build on my previous education in [field].',
                dos: ['Know at least 4-5 core modules', 'Explain how they relate to your background', 'Show enthusiasm about specific topics'],
                donts: ['Not knowing any course names', 'Being vague about curriculum']
            }
        ]
    },
    {
        category: 'Financial Situation',
        icon: '💰',
        questions: [
            {
                question: 'How will you finance your studies?',
                sampleAnswer: 'I have opened a blocked account with €11,904 to cover first year expenses. Additionally, my parents will support me. I\'ve budgeted approximately €900/month for living costs.',
                dos: ['Have exact figures ready', 'Bring blocked account confirmation', 'Show you understand living costs'],
                donts: ['Being vague about finances', 'Saying someone else handles the money']
            },
            {
                question: 'Who is sponsoring your education?',
                sampleAnswer: 'My parents are sponsoring my education. My father works as [profession] at [company]. They have the financial capacity as shown in the bank statements provided.',
                dos: ['Know sponsor\'s occupation and income', 'Have supporting documents ready', 'Explain source of funds'],
                donts: ['Not knowing sponsor details', 'Inconsistencies with documents']
            },
            {
                question: 'Do you plan to work while studying?',
                sampleAnswer: 'I may take part-time work for practical experience, but studies are my priority. International students can work 120 full days or 240 half days yearly. I have sufficient funds, so work would be for professional development.',
                dos: ['Know work regulations (120/240 days)', 'Emphasize studies come first', 'Frame work as learning opportunity'],
                donts: ['Saying you need to work to survive', 'Not knowing work restrictions']
            }
        ]
    },
    {
        category: 'Language & Daily Life',
        icon: '📚',
        questions: [
            {
                question: 'Do you speak German?',
                sampleAnswer: 'I currently have [A1/A2/B1] level German. My program is in English, but I plan to take intensive German courses during my studies for daily life.',
                dos: ['Be honest about your level', 'Show willingness to learn', 'Mention any German courses'],
                donts: ['Lying about German level', 'Showing no interest in learning']
            },
            {
                question: 'Where will you live?',
                sampleAnswer: 'I have applied for student dormitory housing through Studentenwerk. For my first weeks, I have temporary accommodation arranged. Average rent in [city] is around €[amount]/month.',
                dos: ['Have a concrete plan', 'Know typical rent prices', 'Show you\'ve researched options'],
                donts: ['Having no plan at all', 'Unrealistic cost expectations']
            }
        ]
    }
];

const QUICK_INTERVIEW_TIPS = [
    { tip: 'Arrive 15-30 minutes early', icon: '⏰' },
    { tip: 'Dress professionally', icon: '👔' },
    { tip: 'Bring originals + copies', icon: '📁' },
    { tip: 'Be honest, don\'t memorize', icon: '💬' },
    { tip: 'Make eye contact', icon: '👁️' },
    { tip: 'Stay calm', icon: '😌' },
];

function InterviewPreparationCard({ universityName, programName, nationality }: { universityName: string, programName: string, nationality: string }) {
    const countryKey = Object.keys(COUNTRY_METADATA).find(k => nationality.toLowerCase().includes(k));
    const countryData = countryKey ? COUNTRY_METADATA[countryKey] : null;
    const [expandedCategory, setExpandedCategory] = useState<string | null>('Study Plans');
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" /> Visa Interview Preparation
            </h3>

            {/* Program Context Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    Prepare answers specific to: <strong>{programName}</strong> at <strong>{universityName}</strong>
                </p>
            </div>

            {/* Quick Tips */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Tips</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {QUICK_INTERVIEW_TIPS.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-surface-900 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                            <span>{item.icon}</span>
                            <span>{item.tip}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Required Documents Link */}
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-500 text-sm mb-1">Required Documents</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400">Arrange 2 sets of copies + originals in the order specified.</p>
                    </div>
                    <a
                        href={countryData?.embassyDocsUrl || 'https://diplo.de'}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="outline" size="sm">
                            Download Checklist <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </a>
                </div>
            </div>

            {/* Question Categories */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Common Interview Questions</h4>
                {INTERVIEW_QUESTIONS_DATA.map((category) => {
                    const isExpanded = expandedCategory === category.category;

                    return (
                        <div
                            key={category.category}
                            className={`border rounded-lg transition-all ${isExpanded ? 'border-primary-200 shadow-sm dark:shadow-surface-900/50' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            <button
                                onClick={() => {
                                    setExpandedCategory(isExpanded ? null : category.category);
                                    setExpandedQuestion(0);
                                }}
                                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 dark:bg-surface-900 transition-colors rounded-lg"
                            >
                                <span className="text-xl">{category.icon}</span>
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-white">{category.category}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({category.questions.length} questions)</span>
                                </div>
                                <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-2">
                                    {category.questions.map((q, qIdx) => {
                                        const isQExpanded = expandedQuestion === qIdx;

                                        return (
                                            <div
                                                key={qIdx}
                                                className={`rounded-lg border transition-all ${isQExpanded ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30' : 'bg-gray-50 dark:bg-surface-900 border-gray-100 dark:border-gray-700'}`}
                                            >
                                                <button
                                                    onClick={() => setExpandedQuestion(isQExpanded ? null : qIdx)}
                                                    className="w-full p-3 flex items-start gap-2 text-left"
                                                >
                                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold ${isQExpanded ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 dark:text-gray-400'}`}>
                                                        {qIdx + 1}
                                                    </div>
                                                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                                                        {q.question.replace('[university]', universityName)}
                                                    </span>
                                                </button>

                                                {isQExpanded && (
                                                    <div className="px-3 pb-3 space-y-3">
                                                        {/* Sample Answer */}
                                                        <div className="ml-8 bg-white dark:bg-surface-800 rounded p-3 border border-blue-100 dark:border-surface-700">
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">💬 Sample Answer:</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{q.sampleAnswer}"</p>
                                                        </div>

                                                        {/* Do's and Don'ts */}
                                                        <div className="ml-8 grid grid-cols-2 gap-2">
                                                            <div className="bg-green-50 dark:bg-green-900/10 rounded p-2 border border-green-100 dark:border-green-800/30">
                                                                <p className="text-xs font-medium text-green-800 dark:text-green-500 mb-1 flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" /> Do's
                                                                </p>
                                                                <ul className="text-xs text-green-700 dark:text-green-400 space-y-0.5">
                                                                    {q.dos.map((d, i) => (
                                                                        <li key={i}>• {d}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="bg-red-50 dark:bg-red-900/10 rounded p-2 border border-red-100 dark:border-red-900/30">
                                                                <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" /> Avoid
                                                                </p>
                                                                <ul className="text-xs text-red-700 dark:text-red-400 space-y-0.5">
                                                                    {q.donts.map((d, i) => (
                                                                        <li key={i}>• {d}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}


function VisaTab({ tracker, updateMutation, applicationId }: { tracker: TrackerState, updateMutation: any, applicationId: number }) {
    const visaItems = tracker.checklist.filter(i => i.category === 'visa_process');

    // Load from localStorage on mount
    const storageKey = `visa-checklist-${applicationId}`;
    const appointmentKey = `visa-appointment-${applicationId}`;

    const defaultChecklist = [
        { name: 'Complete VIDEX form online', completed: false },
        { name: 'Open Blocked Account (Sperrkonto) - €11,904', completed: false },
        { name: 'Purchase Travel Health Insurance (90+ days)', completed: false },
        { name: 'Get passport photos (biometric, 35x45mm)', completed: false },
        { name: 'Print admission letter / Zulassungsbescheid', completed: false },
        { name: 'Prepare all documents (originals + 2 copies)', completed: false },
        { name: 'Book embassy/consulate appointment', completed: false },
        { name: 'Attend visa interview', completed: false },
        { name: 'Submit passport for visa stamping', completed: false },
        { name: 'Collect passport with visa', completed: false },
        { name: 'Book flight tickets', completed: false },
    ];

    const nationality = (tracker as any).user_nationality?.toLowerCase() || '';
    const countryKey = Object.keys(COUNTRY_METADATA).find(k => nationality.includes(k));
    const countryData = countryKey ? COUNTRY_METADATA[countryKey] : null;

    const [region, setRegion] = useState<string>(() => {
        const saved = localStorage.getItem(`visa-region-${applicationId}`);
        // Validate if saved region belongs to current country to avoid stale data from previous country
        const isValid = saved && countryData?.visaCities.some(c => c.name === saved);
        if (isValid) return saved;
        return countryData?.visaCities[0]?.name || 'Your City';
    });

    // Update region when country changes (e.g. user toggles nationality in profile)
    useEffect(() => {
        if (countryData?.visaCities.length) {
            const saved = localStorage.getItem(`visa-region-${applicationId}`);
            const isValid = saved && countryData.visaCities.some(c => c.name === saved);
            if (!isValid) {
                setRegion(countryData.visaCities[0].name);
            }
        }
    }, [countryData?.name, applicationId]);

    const [appointmentDate, setAppointmentDate] = useState(() => {
        // Prefer backend date if available, otherwise fallback to localStorage
        return tracker.visa_appointment_date
            ? new Date(tracker.visa_appointment_date).toISOString().split('T')[0]
            : (localStorage.getItem(appointmentKey) || '');
    });

    const [localChecklist, setLocalChecklist] = useState<{ name: string, completed: boolean }[]>(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return defaultChecklist;
            }
        }
        return defaultChecklist;
    });

    // Save to localStorage whenever checklist changes
    const toggleLocalItem = (index: number) => {
        setLocalChecklist(prev => {
            const newList = prev.map((item, i) =>
                i === index ? { ...item, completed: !item.completed } : item
            );
            localStorage.setItem(storageKey, JSON.stringify(newList));
            return newList;
        });
    };

    // Save appointment date to localStorage
    // Save appointment date to localStorage AND Backend
    const handleAppointmentChange = async (date: string) => {
        setAppointmentDate(date);
        localStorage.setItem(appointmentKey, date);

        try {
            // Persist to backend
            await applicationsApi.updateApplication(applicationId, {
                visa_appointment_date: date ? new Date(date).toISOString() : undefined
            });
        } catch (e) {
            console.error("Failed to update visa appointment date", e);
        }
    };

    // Save region to localStorage
    const handleRegionChange = (newRegion: string) => {
        setRegion(newRegion);
        localStorage.setItem(`visa-region-${applicationId}`, newRegion);
    };

    const toggleStatus = (item: ApplicationChecklistItem) => {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed';
        updateMutation.mutate({ itemId: item.id, status: newStatus });
    };

    // Calculate days to appointment
    let daysToAppointment: number | null = null;
    if (appointmentDate) {
        const appDate = new Date(appointmentDate);
        const now = new Date();
        const diff = appDate.getTime() - now.getTime();
        daysToAppointment = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Calculate progress for overview dashboard
    // Calculate progress for overview dashboard

    return (
        <div className="space-y-6">
            {/* Section 1: Appointment Tracker */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                    <Calendar className="w-5 h-5 text-primary-600" /> Visa Appointment
                </h3>
                <div className="bg-slate-50 dark:bg-surface-800/50 border border-slate-200 dark:border-surface-700 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-surface-400 mb-1">Appointment Date</label>
                            <input
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => handleAppointmentChange(e.target.value)}
                                className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-surface-800"
                            />
                        </div>

                        {daysToAppointment !== null && (
                            <div className={`text-center px-4 py-2 rounded-lg border ${daysToAppointment < 0 ? 'bg-red-50 border-red-200 text-red-700' :
                                daysToAppointment < 14 ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                    'bg-green-50 border-green-200 text-green-700'
                                }`}>
                                <div className="text-2xl font-bold">{daysToAppointment < 0 ? Math.abs(daysToAppointment) : daysToAppointment}</div>
                                <div className="text-xs font-medium uppercase">{daysToAppointment < 0 ? 'Days Ago' : 'Days Left'}</div>
                            </div>
                        )}

                        {/* Quick Links based on Region */}
                        <div className="mt-4 w-full">
                            <label className="block text-sm font-medium text-slate-700 dark:text-surface-300 mb-3">Select Your Jurisdiction</label>
                            {countryData ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {countryData.visaCities.map(city => {
                                        const isSelected = region === city.name;
                                        return (
                                            <button
                                                key={city.name}
                                                onClick={() => handleRegionChange(city.name)}
                                                className={`text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${isSelected
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 ring-1 ring-primary-500 dark:ring-primary-400'
                                                    : 'bg-white dark:bg-surface-800 border-gray-200 dark:border-gray-700 hover:border-primary-200 hover:bg-gray-50 dark:hover:bg-surface-700'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>{city.name}</span>
                                                    {isSelected && <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{city.type}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400 italic">No specific jurisdictions found.</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex gap-3">
                        <a
                            href={countryData?.visaCities.find(c => c.name === region)?.url || countryData?.embassyDocsUrl || 'https://diplo.de'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button variant="outline" className="w-full">
                                <ExternalLink className="w-3 h-3 mr-2" /> Book Appointment ({region})
                            </Button>
                        </a>
                        <a
                            href="https://videx.diplo.de/videx/visum-erfassung/#/videx-langfristiger-aufenthalt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button variant="outline" className="w-full">
                                <FileText className="w-3 h-3 mr-2" /> Fill VIDEX Form
                            </Button>
                        </a>
                    </div>
                </div>
            </Card>

            {/* Section 2: Interview Prep & Documents */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 px-1">
                    <span className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                    Interview Preparation
                </h3>
                <InterviewPreparationCard
                    universityName={tracker.program.university_name}
                    programName={tracker.program.program_name}
                    nationality={nationality}
                />
            </div>

            {/* Section 3: Visa Checklist */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                    Visa Process Checklist
                </h3>

                {/* Show database items if available, otherwise show local checklist */}
                {visaItems.length > 0 ? (
                    <div className="space-y-2">
                        {visaItems.map(item => (
                            <div key={item.id} className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-surface-900 transition-colors cursor-pointer ${getDeadlineStyles(item.status, item.due_date)}`} onClick={() => toggleStatus(item)}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <div className={item.status === 'completed' ? 'line-through text-gray-400 flex-1' : 'text-gray-900 dark:text-white font-medium flex-1'}>
                                    {item.item_name}
                                </div>
                                <DeadlineBadge dueDate={item.due_date} status={item.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Track your visa application progress:</p>
                        {localChecklist.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:bg-surface-900 transition-colors cursor-pointer"
                                onClick={() => toggleLocalItem(idx)}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <div className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                                    {item.name}
                                </div>
                                <span className="text-xs text-gray-400">{idx + 1}/{localChecklist.length}</span>
                            </div>
                        ))}

                        {/* Progress indicator */}
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{localChecklist.filter(i => i.completed).length} of {localChecklist.length} completed</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${(localChecklist.filter(i => i.completed).length / localChecklist.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
