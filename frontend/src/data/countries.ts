export interface CountrySteps {
    title: string;
    description: string;
    link?: string;
    linkText?: string;
}

export interface PhaseItem {
    name: string;
    description: string;
    link?: string;
    linkText?: string;
    important?: boolean; // Highlight critical items
}

export interface ApplicationPhase {
    id: string;
    title: string;
    icon: string; // emoji icon
    description: string;
    items: PhaseItem[];
    tips?: string[];
}

export interface CountryData {
    code: string;
    name: string;
    slug: string;
    flag: string;
    visaWaitTime: string; // e.g., "4-6 weeks"
    embassyLocations: string[];
    gradeConversion: {
        systemName: string; // e.g., "10.0 Scale" or "GPA 4.0"
        germanEquivalent: string; // Note on how it translates
    };
    specificRequirements: string[]; // Specific docs like APS for India/China
    applicationSteps?: CountrySteps[];
    applicationPhases?: ApplicationPhase[]; // Phase-based process (new)
    communityLink?: string;
    currency: string;
    studentCount: string; // Approx number of students in Germany
}

export const countries: CountryData[] = [
    {
        code: 'IN',
        name: 'India',
        slug: 'india',
        flag: '🇮🇳',
        visaWaitTime: '4-8 weeks',
        embassyLocations: ['New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata'],
        gradeConversion: {
            systemName: '10-point CGPA or %',
            germanEquivalent: 'Converted via Modified Bavarian Formula. 7.5+ CGPA is typically good.'
        },
        specificRequirements: [
            'APS Certificate (Akademische Prüfstelle) is MANDATORY before visa application.',
            'VFS Global appointment required.',
            'Blocked Account (€11,904).'
        ],
        applicationSteps: [
            {
                title: 'APS Registration',
                description: 'Register online at aps-india.de and pay the processing fee.',
                link: 'https://aps-india.de',
                linkText: 'APS India Portal'
            },
            {
                title: 'Prepare Documents',
                description: 'Get transcripts sealed by university & degree notarized.'
            },
            {
                title: 'MEA Apostille',
                description: 'Get MEA Apostille for your degree and transcripts (Mandatory).',
                link: 'https://www.mea.gov.in/apostille.htm',
                linkText: 'MEA Apostille Guide'
            },
            {
                title: 'APS Submission',
                description: 'Submit printed application & documents to APS India via courier.'
            },
            {
                title: 'University Application',
                description: 'Apply to universities via Uni-Assist or direct portals once APS is done.',
                link: 'https://www.uni-assist.de/en/',
                linkText: 'Uni-Assist'
            },
            {
                title: 'VFS Appointment',
                description: 'Book visa appointment via VFS Global.',
                link: 'https://visa.vfsglobal.com/ind/en/deu/',
                linkText: 'VFS Global'
            }
        ],
        applicationPhases: [
            {
                id: 'eligibility',
                title: 'Eligibility Check',
                icon: '🎓',
                description: 'Verify your academic credentials meet German university requirements.',
                items: [
                    { name: 'Minimum CGPA', description: '7.0/10.0 or 65% (competitive for public universities). Top programs may require 8.0+ CGPA.', important: true },
                    { name: 'Modified Bavarian Formula', description: 'German universities convert your CGPA: 1 + 3 × (Nmax − Nd) / (Nmax − Nmin). For 10-point scale: 7.5 CGPA ≈ 2.25 German grade.', link: '/german-grade-calculator', linkText: 'Try Calculator' },
                    { name: 'Degree Equivalence (anabin)', description: 'Your university must be listed in anabin database as H+ (recognized). Check before applying.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Field of Study Match', description: 'For Master\'s programs, your Bachelor\'s field must be related. Some programs accept cross-disciplinary applicants.' },
                    { name: '12-Year vs 15/16-Year Education', description: 'Indian students with 10+2 (12-year) education may need Studienkolleg for Bachelor\'s. 15/16-year degree holders (B.Tech/B.E.) can apply directly for Master\'s.', important: true },
                ],
                tips: [
                    'Most TU9 and popular universities need 7.5+ CGPA (or German grade < 2.5).',
                    'If CGPA is below 7.0, apply to smaller universities or FH (Fachhochschulen).',
                    'Use anabin to verify your university is H+ before paying APS fees.',
                ]
            },
            {
                id: 'language',
                title: 'Language Requirements',
                icon: '🌐',
                description: 'Most English-taught Master\'s programs need IELTS/TOEFL. German-taught programs require TestDaF/DSH.',
                items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5 overall (no band below 5.5). Most commonly accepted. Valid for 2 years.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90 (varies by university). Home Edition accepted by some. Test centers in major Indian cities.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'PTE Academic', description: 'Minimum 58+ overall. Growing acceptance among German universities.', link: 'https://www.pearsonpte.com', linkText: 'Book PTE' },
                    { name: 'Duolingo English Test', description: 'Minimum 105+. Accepted by some universities — check individual program requirements.' },
                    { name: 'Medium of Instruction (MOI)', description: 'Some universities accept an MOI letter from your university confirming English was the medium of instruction.' },
                    { name: 'TestDaF (German)', description: 'TDN 4 in all sections for German-taught programs. Multiple test centers across India.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'DSH-2 (German)', description: 'Alternative to TestDaF. Can be taken at German universities after arrival with conditional admission.' },
                    { name: 'Goethe-Zertifikat C1', description: 'Accepted for German-taught programs. Available at Goethe-Institut in Delhi, Mumbai, Pune, Bangalore, Chennai, Kolkata.', link: 'https://www.goethe.de/ins/in/en/index.html', linkText: 'Goethe India' },
                ],
                tips: [
                    'IELTS 6.5 is the safe benchmark for most English-taught Master\'s programs.',
                    'Book your test 3–4 months before application deadlines.',
                    'Even for English programs, A1–A2 German helps with daily life and HiWi jobs.',
                    'TestDaF test dates fill up fast in India — register early.',
                ]
            },
            {
                id: 'documents',
                title: 'Document Preparation',
                icon: '📄',
                description: 'India requires APS Certificate (mandatory) and MEA Apostille before visa application.',
                items: [
                    { name: 'APS Certificate', description: 'Register at aps-india.de, pay fee (~₹18,000), submit notarized documents. APS verifies your academic credentials. Processing: 4–8 weeks.', link: 'https://aps-india.de', linkText: 'APS India Portal', important: true },
                    { name: 'MEA Apostille', description: 'Get Apostille from Ministry of External Affairs for degree and transcripts. Required for visa. Apply via mea.gov.in or authorized agencies.', link: 'https://www.mea.gov.in/apostille.htm', linkText: 'MEA Apostille', important: true },
                    { name: 'Passport', description: 'Valid for at least 6 months beyond travel date. Ensure it has at least 4 blank pages.' },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts from your university. Get 3–4 sets sealed separately.' },
                    { name: 'Degree Certificate', description: 'Original degree or provisional certificate. Get notarized copies made.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose: why this program, why Germany, career goals. 1–2 pages max.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV in Europass or tabular format. Include education, internships, projects, publications.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors. Should be on university letterhead with contact details.' },
                    { name: 'Passport-size Photos', description: 'Biometric photos (35mm × 45mm), white background. Get 8–10 copies.' },
                    { name: 'GRE / GATE (if required)', description: 'Some programs (especially at TU9) accept/prefer GRE or GATE scores.' },
                ],
                tips: [
                    'Start APS process 3–4 months before application deadlines.',
                    'Get notarized copies BEFORE sending originals to APS.',
                    'MEA Apostille can be done via authorized agents faster than directly.',
                    'Keep color scans (300 DPI) of everything before submitting.',
                ]
            },
            {
                id: 'application',
                title: 'University Application',
                icon: '📬',
                description: 'Apply via Uni-Assist or directly to universities. APS Certificate must be ready before applying.',
                items: [
                    { name: 'Uni-Assist', description: 'Most public universities require application via Uni-Assist. They verify credentials and forward to universities. Fee: €75 first uni + €30 each additional.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'Some universities (TU Munich, LMU, KIT, etc.) accept direct applications through their own portals.' },
                    { name: 'ProgramDatabase', description: 'Search all programs on the official German academic exchange database to find requirements and links.', link: 'https://www.study-in-germany.de/en/', linkText: 'Study in Germany' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15. Some programs close earlier (April/May). Apply by March to be safe.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15. Fewer programs available.' },
                    { name: 'APS Certificate Required', description: 'You MUST have your APS Certificate before applying. No university will process your application without it.', important: true },
                ],
                tips: [
                    'Apply to 6–10 universities to maximize your chances.',
                    'Start Uni-Assist 6–8 weeks before deadline.',
                    'Many Indian students apply for Winter semester — it has more options.',
                ]
            },
            {
                id: 'admission',
                title: 'Admission & Acceptance',
                icon: '🏛️',
                description: 'Once accepted, you\'ll receive a Zulassungsbescheid (admission letter).',
                items: [
                    { name: 'Conditional Admission', description: 'You may receive conditional admission pending language test, final degree, or APS. Can still start visa process.' },
                    { name: 'Unconditional Admission (Zulassungsbescheid)', description: 'Full admission letter. Your key document for the visa application.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'After accepting, enroll and pay semester contribution (€100–€400). Includes Semesterticket in most cities.' },
                    { name: 'Multiple Offers', description: 'If you have multiple admissions, accept your top choice promptly. Some universities have acceptance deadlines.' },
                ],
                tips: [
                    'Keep the original Zulassungsbescheid safe — needed at visa appointment.',
                    'Accept your offer within the deadline to avoid losing your seat.',
                ]
            },
            {
                id: 'finance',
                title: 'Financial Proof',
                icon: '💰',
                description: 'Blocked account with €11,904 is mandatory. India-specific transfer and scholarship details below.',
                items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. You receive ~€992/month. Approx. ₹10–11 lakh at current exchange rates.', important: true },
                    { name: 'Expatrio', description: 'Most popular. Setup in ~2 days. Fastest option for Indian students.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Deutsche Bank', description: 'Traditional option, takes 2–4 weeks.', link: 'https://www.deutsche-bank.de', linkText: 'Deutsche Bank' },
                    { name: 'Coracle', description: 'Another digital option with competitive exchange rates.', link: 'https://www.coracle.de', linkText: 'Coracle' },
                    { name: 'Bank Transfer from India', description: 'Send from SBI, ICICI, or HDFC via SWIFT/wire transfer. Declare under LRS (Liberalised Remittance Scheme). RBI allows $250,000/year per individual.', important: true },
                    { name: 'Scholarships', description: 'Full or partial scholarships for Indian students. WISE, bilateral programs, and research grants.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'SII (Study in India) Scholarships', description: 'Indo-German joint scholarships. Check the German academic exchange office in India for latest offerings.' },
                    { name: 'Semester Contribution', description: 'Pay €100–€400 each semester. Includes Semesterticket (public transport) in most cities.' },
                ],
                tips: [
                    'Under LRS, Indian residents can remit up to $250,000/year for education.',
                    'Expatrio offers INR-to-EUR conversion — often cheapest overall.',
                    'Apply for scholarships 12–18 months before your program starts.',
                ]
            },
            {
                id: 'visa',
                title: 'Visa Process',
                icon: '✈️',
                description: 'Apply for a German Student Visa via VFS Global at your nearest center in India.',
                items: [
                    { name: 'VFS Global Appointment', description: 'Book visa appointment at VFS Global (New Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune). Walk-in not allowed.', link: 'https://visa.vfsglobal.com/ind/en/deu/', linkText: 'VFS Global India', important: true },
                    { name: 'Visa Checklist', description: 'Download the official student visa checklist from the embassy website.', link: 'https://india.diplo.de/blob/2544606/aa700140226462873130456187760920/1-student-visa-data.pdf', linkText: 'Download Checklist PDF', important: true },
                    { name: 'Required: Admission Letter', description: 'Original Zulassungsbescheid or conditional admission letter.' },
                    { name: 'Required: APS Certificate', description: 'Original APS Certificate. This is checked at the visa counter.', important: true },
                    { name: 'Required: Blocked Account', description: 'Confirmation letter showing €11,904 deposited.' },
                    { name: 'Required: Health Insurance', description: 'Travel health insurance for initial period.' },
                    { name: 'Required: MEA Apostille Documents', description: 'Original degree and transcripts with MEA Apostille sticker.' },
                    { name: 'Required: Language Certificates', description: 'IELTS/TOEFL for English programs, TestDaF/DSH for German programs.' },
                    { name: 'Required: Passport Photos', description: 'Biometric photos (35mm × 45mm), recent, white background.' },
                    { name: 'Processing Time', description: '4–8 weeks. Faster than Pakistan due to VFS Global infrastructure.', important: true },
                ],
                tips: [
                    'Book VFS appointment at least 2 months before your intended travel date.',
                    'VFS Pune and Kolkata are often less crowded than Delhi and Mumbai.',
                    'Carry ALL original documents + 2 photocopies + digital copies on USB.',
                    'No interview is needed — just document submission at VFS.',
                ]
            },
        ],
        currency: 'INR',
        studentCount: '42,000+'
    },
    {
        code: 'PK',
        name: 'Pakistan',
        slug: 'pakistan',
        flag: '🇵🇰',
        visaWaitTime: '12-16 weeks (High demand)',
        embassyLocations: ['Islamabad', 'Karachi', 'Lahore'],
        gradeConversion: {
            systemName: 'CGPA 4.0 / Percentage',
            germanEquivalent: 'Converted via Modified Bavarian Formula. Min 2.5/4.0 or 60% usually required for public unis.'
        },
        specificRequirements: [
            'IBCC Equivalence Certificate for SSC/HSSC is MANDATORY.',
            'HEC attestation of all university degrees is MANDATORY.',
            'MOFA attestation of IBCC & HEC stamps is MANDATORY.',
            'Blocked Account (€11,904) required for visa.',
            'Embassy appointment booking opens in specific windows (Summer: Oct–Jan, Winter: Apr–Jul).',
            'Uni-Assist evaluation required for most universities.',
            'Health insurance (travel + public/private) needed before visa interview.'
        ],
        applicationSteps: [
            {
                title: 'IBCC Equivalence',
                description: 'Get SSC/HSSC equivalence certificate from Inter Board Committee of Chairmen (IBCC). Required for all Pakistani students. Processing takes 2-4 weeks.',
                link: 'https://ibcc.edu.pk',
                linkText: 'IBCC Portal'
            },
            {
                title: 'HEC Attestation',
                description: 'Attest all university degrees (Bachelor\'s, Master\'s) via the HEC E-Services Portal. Get degree and transcripts attested separately. Takes 1-2 weeks.',
                link: 'https://eservices.hec.gov.pk',
                linkText: 'HEC E-Portal'
            },
            {
                title: 'MOFA Attestation',
                description: 'Get both IBCC and HEC attested documents verified at the Ministry of Foreign Affairs (MOFA). Available in Islamabad, Karachi, and Lahore. Takes 1-3 days.',
                link: 'https://www.mofa.gov.pk',
                linkText: 'MOFA Pakistan'
            },
            {
                title: 'Uni-Assist Application',
                description: 'Most German universities require application via Uni-Assist. Submit attested documents for credential evaluation. Processing takes 4-6 weeks.',
                link: 'https://www.uni-assist.de/en/',
                linkText: 'Uni-Assist'
            },
            {
                title: 'University Application',
                description: 'Apply directly or via Uni-Assist to your chosen universities. Some universities accept direct applications through their own portals.',
            },
            {
                title: 'Open Blocked Account',
                description: 'Open a blocked account (Sperrkonto) with €11,904. Options: Expatrio (fastest, ~2 days), Deutsche Bank, or Coracle.',
                link: 'https://www.expatrio.com',
                linkText: 'Expatrio'
            },
            {
                title: 'Get Health Insurance',
                description: 'Arrange travel health insurance for visa interview and public/private insurance for Germany. Required before embassy appointment.',
            },
            {
                title: 'Book Embassy Appointment',
                description: 'Book visa appointment at German Embassy Islamabad or Consulate Karachi. Slots open seasonally — book early! Waitlists are common.',
                link: 'https://pakistan.diplo.de/pk-en/service/05-VisaEinreise',
                linkText: 'German Missions Pakistan'
            },
            {
                title: 'Visa Interview',
                description: 'Attend visa interview with all original documents: admission letter, blocked account, IBCC/HEC/MOFA attested docs, health insurance, motivation letter.',
                link: 'https://pakistan.diplo.de/blob/2525414/06e885743b2469145656113110432322/student-visa-checklist-data.pdf',
                linkText: 'Visa Checklist PDF'
            },
            {
                title: 'Pre-Departure',
                description: 'After visa approval: book flights, arrange accommodation (Studierendenwerk/WG), register at university, get city registration (Anmeldung) within 2 weeks of arrival.',
            }
        ],
        applicationPhases: [
            {
                id: 'eligibility',
                title: 'Eligibility Check',
                icon: '🎓',
                description: 'Verify that you meet the minimum academic requirements for German universities.',
                items: [
                    { name: 'Minimum GPA', description: '2.5/4.0 or 60% (most public universities). Some programs may require higher.', important: true },
                    { name: 'Modified Bavarian Formula', description: 'German universities convert your CGPA using: 1 + 3 × (Nmax − Nd) / (Nmax − Nmin). A result of 1.0–2.5 is competitive.', link: '/german-grade-calculator', linkText: 'Try Calculator' },
                    { name: 'Degree Equivalence', description: 'Your Bachelor\'s must be recognized as equivalent to a German degree. Check via anabin database.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Field of Study Match', description: 'For Master\'s programs, your Bachelor\'s field must be related. Some programs accept cross-disciplinary applicants with prerequisites.' },
                    { name: '12 Years vs 16 Years Issue', description: 'Pakistani students with 12-year education (Matric + Inter) may need a Studienkolleg or a 1-year foundation program for Bachelor\'s. 16-year degree holders can apply directly for Master\'s.', important: true },
                ],
                tips: [
                    'Use anabin to check if your university is classified as H+ (recognized).',
                    'If your GPA is below 2.5, consider programs at private universities or apply with strong research/work experience.',
                ]
            },
            {
                id: 'language',
                title: 'Language Requirements',
                icon: '🌐',
                description: 'Most programs require proof of English proficiency. German-taught programs require German certification.',
                items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5 overall (no band below 5.5). Most commonly accepted. Valid for 2 years.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90 (varies by university). Home Edition accepted by some universities.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'PTE Academic', description: 'Minimum 58+ overall. Accepted by many German universities as IELTS alternative.', link: 'https://www.pearsonpte.com', linkText: 'Book PTE' },
                    { name: 'Duolingo English Test', description: 'Minimum 105+. Accepted by some universities — check individual program requirements.' },
                    { name: 'Medium of Instruction (MOI)', description: 'Some universities accept a letter from your previous university confirming English was the medium of instruction, in lieu of a test.' },
                    { name: 'TestDaF (German)', description: 'TDN 4 in all sections for German-taught programs. Test centers in Islamabad and Lahore.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'DSH-2 (German)', description: 'Alternative to TestDaF. Can be taken at German universities after arrival (with conditional admission).' },
                    { name: 'Goethe-Zertifikat C1', description: 'Accepted for German-taught programs. Available through Goethe-Institut Pakistan.', link: 'https://www.goethe.de/ins/pk/en/index.html', linkText: 'Goethe Pakistan' },
                ],
                tips: [
                    'IELTS Academic is the most widely accepted — if unsure, go with IELTS.',
                    'For English-taught Master\'s, IELTS 6.5 is the safe benchmark.',
                    'Even for English programs, learning basic German (A1–A2) helps with daily life and jobs.',
                    'Book your test at least 3 months before application deadlines.',
                ]
            },
            {
                id: 'documents',
                title: 'Document Preparation',
                icon: '📄',
                description: 'Prepare and attest all required documents. Pakistan requires IBCC + HEC + MOFA attestation chain.',
                items: [
                    { name: 'IBCC Equivalence Certificate', description: 'Attest your SSC (Matric) and HSSC (Intermediate) certificates from IBCC. Apply online at ibcc.edu.pk. Processing: 2–4 weeks.', link: 'https://ibcc.edu.pk', linkText: 'IBCC Portal', important: true },
                    { name: 'HEC Attestation', description: 'Get your university degree(s) and transcripts attested via HEC E-Services Portal. Degree and transcript attested separately. Processing: 1–2 weeks.', link: 'https://eservices.hec.gov.pk', linkText: 'HEC E-Portal', important: true },
                    { name: 'MOFA Attestation', description: 'Get both IBCC and HEC attested documents verified at Ministry of Foreign Affairs. Available in Islamabad, Karachi, and Lahore. Same-day to 3 days.', link: 'https://www.mofa.gov.pk', linkText: 'MOFA Pakistan', important: true },
                    { name: 'Passport', description: 'Valid for at least 6 months beyond your intended travel date. Ensure it has at least 4 blank pages.' },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts from your university. Get multiple copies — attested and unattested.' },
                    { name: 'Degree Certificate', description: 'Original degree or provisional certificate if you haven\'t graduated yet.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose explaining why this program, why Germany, and your career goals. 1–2 pages max.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV in Europass or tabular format. Include education, research, work experience, and publications.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors or employers. Should be on official letterhead with contact details.' },
                    { name: 'Passport-size Photos', description: 'Biometric photos (35mm × 45mm) with white/light gray background. Get 8–10 copies.' },
                    { name: 'GRE / GMAT (if required)', description: 'Some competitive programs require GRE/GMAT. Check individual program requirements.' },
                ],
                tips: [
                    'Start IBCC → HEC → MOFA attestation early. The full chain takes 3–6 weeks.',
                    'Keep scanned copies (color, 300 DPI) of ALL documents before sending originals.',
                    'IBCC and HEC office in Karachi are at different locations than Islamabad HQ.',
                    'MOFA Lahore camp office is faster than Islamabad during peak season.',
                ]
            },
            {
                id: 'application',
                title: 'University Application',
                icon: '📬',
                description: 'Apply to German universities through Uni-Assist or directly via university portals.',
                items: [
                    { name: 'Uni-Assist', description: 'Most German public universities require application via Uni-Assist. They evaluate your credentials and forward documents to universities. Fee: €75 first uni + €30 each additional.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'Some universities (TU Munich, LMU, etc.) accept direct applications through their own portals. Check each program page.' },
                    { name: 'Study Programs Database', description: 'Search all programs on the official database to find requirements and application links.', link: 'https://uniadvisorai.com', linkText: 'Database' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15 for most programs. Some may close earlier (May/June). Apply by March–April to be safe.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15. Fewer programs available for summer intake.' },
                    { name: 'APS Score Sheet', description: 'Unlike India/China, Pakistan does NOT require APS. Your IBCC/HEC/MOFA chain is sufficient.' },
                ],
                tips: [
                    'Apply to 5–8 universities to maximize your chances.',
                    'Start Uni-Assist applications at least 6 weeks before deadline — processing takes time.',
                    'Track all applications in our Application Tracker.',
                ]
            },
            {
                id: 'admission',
                title: 'Admission & Acceptance',
                icon: '🏛️',
                description: 'Once accepted, you\'ll receive a Zulassungsbescheid (admission letter). This is needed for your visa.',
                items: [
                    { name: 'Conditional Admission (Bedingte Zulassung)', description: 'You may receive conditional admission pending language test results or final degree. You can still apply for a visa with this.' },
                    { name: 'Unconditional Admission (Zulassungsbescheid)', description: 'Full admission letter. This is your key document for the visa application.', important: true },
                    { name: 'Enrollment Confirmation', description: 'After accepting, you\'ll need to enroll and pay the semester contribution (usually €200–€400).' },
                    { name: 'Rejection Handling', description: 'If rejected, check if the university allows re-application or appeals. Consider alternative programs.' },
                ],
                tips: [
                    'Accept your offer promptly — some universities have deadlines for acceptance.',
                    'Keep the original Zulassungsbescheid safe — you\'ll need it for the visa interview.',
                ]
            },
            {
                id: 'finance',
                title: 'Financial Proof',
                icon: '💰',
                description: 'You must prove you can financially support yourself in Germany. A blocked account is mandatory.',
                items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904 (as of 2024). You receive ~€992/month. Required for visa. Approx. PKR 35–40 lakh at current rates.', important: true },
                    { name: 'Expatrio', description: 'Most popular provider. Account setup in ~2 days. Accepted by all German embassies.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Deutsche Bank', description: 'Traditional option. Takes 2–4 weeks for setup. Branch in Frankfurt.', link: 'https://www.deutsche-bank.de', linkText: 'Deutsche Bank' },
                    { name: 'Coracle', description: 'Another digital option with competitive exchange rates.', link: 'https://www.coracle.de', linkText: 'Coracle' },
                    { name: 'Bank Transfer from Pakistan', description: 'Transfer from Faisal Bank or HBL via SWIFT. Keep the SWIFT receipt — embassy may ask for it. Declare as "Education Abroad" to SBP.', important: true },
                    { name: 'Scholarships', description: 'Full or partial scholarships for Pakistani students. Highly competitive. Apply 12–18 months before program start.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'HEC Overseas Scholarships', description: 'HEC Pakistan offers scholarships for PhD and some Master\'s programs in Germany.', link: 'https://www.hec.gov.pk/english/scholarshipsgrants/Pages/default.aspx', linkText: 'HEC Scholarships' },
                    { name: 'Semester Contribution', description: 'Pay €200–€400 per semester to the university. Includes Semesterticket (public transport pass) in most cities.' },
                ],
                tips: [
                    'Open blocked account immediately after receiving admission — it takes time for funds to reflect.',
                    'Expatrio is the fastest option if you\'re short on time.',
                    'The SBP (State Bank of Pakistan) allows up to $70,000/year for education abroad.',
                ]
            },
            {
                id: 'visa',
                title: 'Visa Process',
                icon: '✈️',
                description: 'Apply for a German Student Visa at the German Embassy Islamabad or Consulate Karachi.',
                items: [
                    { name: 'Embassy Appointment', description: 'Book at German Embassy Islamabad or Consulate Karachi. Appointments open seasonally: Summer semester (Oct–Jan) and Winter semester (Apr–Jul). Book EARLY — slots fill fast!', link: 'https://pakistan.diplo.de/pk-en/service/05-VisaEinreise', linkText: 'German Missions Pakistan', important: true },
                    { name: 'Visa Checklist', description: 'Download the official student visa checklist from the embassy website.', link: 'https://pakistan.diplo.de/blob/2525414/06e885743b2469145656113110432322/student-visa-checklist-data.pdf', linkText: 'Download Checklist PDF', important: true },
                    { name: 'Required: Admission Letter', description: 'Original Zulassungsbescheid or conditional admission letter.' },
                    { name: 'Required: Blocked Account Confirmation', description: 'Confirmation letter from Expatrio/Deutsche Bank showing €11,904 deposited.' },
                    { name: 'Required: IBCC/HEC/MOFA Attested Documents', description: 'All original attested academic documents (IBCC + HEC + MOFA stamped).' },
                    { name: 'Required: Health Insurance', description: 'Travel health insurance for initial period + proof of German health insurance arrangement.' },
                    { name: 'Required: Motivation Letter', description: 'Why Germany, why this program, your study plan, and future career goals.' },
                    { name: 'Required: Language Certificates', description: 'IELTS/TOEFL for English programs, TestDaF/DSH/Goethe for German programs.' },
                    { name: 'Required: Passport Photos', description: 'Biometric photos (35mm × 45mm), recent, light background.' },
                    { name: 'Processing Time', description: '12–16 weeks (3–4 months). Can be longer during peak season. Plan accordingly!', important: true },
                ],
                tips: [
                    'Book your appointment as soon as you receive your admission letter.',
                    'Arrive 30 minutes early. Dress formally for the interview.',
                    'Be honest and confident. They want to verify genuine study intent.',
                    'Carry ALL original documents + 2 photocopies each.',
                    'Karachi consulate is often less busy than Islamabad embassy.',
                ]
            },
        ],
        currency: 'PKR',
        studentCount: '8,000+'
    },
    {
        code: 'CN',
        name: 'China',
        slug: 'china',
        flag: '🇨🇳',
        visaWaitTime: '3-4 weeks',
        embassyLocations: ['Beijing', 'Shanghai', 'Guangzhou', 'Chengdu', 'Shenyang'],
        gradeConversion: {
            systemName: '100-point scale',
            germanEquivalent: 'APS verification dictates the conversion.'
        },
        specificRequirements: [
            'APS Certificate is MANDATORY.',
            'Gaokao scores often relevant for Bachelors.'
        ],
        applicationPhases: [
            {
                id: 'eligibility',
                title: 'Eligibility Check',
                icon: '🎓',
                description: 'Verify your academic credentials meet German university requirements.',
                items: [
                    { name: 'Gaokao Score (Bachelor\'s)', description: 'For Bachelor\'s programs, a Gaokao score of 525+ (out of 750) or top 30% is typically needed. Some programs accept without Gaokao if you attend Studienkolleg.', important: true },
                    { name: 'Minimum GPA (Master\'s)', description: '75/100 or higher for most public universities. Top TU9 programs may require 80+.', important: true },
                    { name: 'Modified Bavarian Formula', description: 'Your percentage is converted using: 1 + 3 × (Nmax − Nd) / (Nmax − Nmin). APS verification may influence the conversion.', link: '/german-grade-calculator', linkText: 'Try Calculator' },
                    { name: 'Degree Equivalence (anabin)', description: 'Your university must be recognized in anabin. Most 211/985 universities are H+.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Field of Study Match', description: 'For Master\'s, your Bachelor\'s field should be related. Cross-disciplinary may require prerequisites.' },
                ],
                tips: [
                    '985/211 university graduates have better recognition at German universities.',
                    'If Gaokao score is below threshold, Studienkolleg is a pathway to Bachelor\'s.',
                ]
            },
            {
                id: 'language',
                title: 'Language Requirements',
                icon: '🌐',
                description: 'English-taught programs need IELTS/TOEFL. German-taught programs need TestDaF/DSH.',
                items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5 overall. Very widely accepted. Test centers in all major Chinese cities.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90. Available at many test centers in China.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'Duolingo English Test', description: 'Minimum 105+. Accepted by some universities.' },
                    { name: 'TestDaF (German)', description: 'TDN 4 in all sections. Test centers in Beijing, Shanghai, Nanjing, Guangzhou, Chengdu, and more.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center', important: true },
                    { name: 'DSH-2 (German)', description: 'Can be taken at German Studienkolleg or university after arrival.' },
                    { name: 'Goethe-Zertifikat C1', description: 'Available at Goethe-Institut in Beijing, Shanghai, and other cities.', link: 'https://www.goethe.de/ins/cn/en/index.html', linkText: 'Goethe China' },
                ],
                tips: [
                    'Many Chinese students learn German before arriving — it significantly helps with daily life.',
                    'Studienkolleg requires B1/B2 German proficiency.',
                    'Book TestDaF early as test dates fill up quickly in China.',
                ]
            },
            {
                id: 'documents',
                title: 'Document Preparation',
                icon: '📄',
                description: 'China requires APS Certificate (mandatory) from APS China in Beijing.',
                items: [
                    { name: 'APS Certificate', description: 'Register at aps.org.cn, submit documents, and attend interview or plausibility check. APS verifies academic credentials. Processing: 6–12 weeks.', link: 'https://www.aps.org.cn', linkText: 'APS China Portal', important: true },
                    { name: 'APS Interview', description: 'You may be required to attend an interview at APS Beijing to verify your academic knowledge. Prepare for subject-specific questions.', important: true },
                    { name: 'Notarized Translations', description: 'All Chinese documents must be translated into German or English by a certified translator and notarized.' },
                    { name: 'Passport', description: 'Valid for at least 6 months beyond travel date.' },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts from your university. Chinese + English/German translation.' },
                    { name: 'Degree Certificate / Gaokao', description: 'Original degree or Gaokao certificate with translations.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose in English or German.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV in Europass format.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors on university letterhead.' },
                ],
                tips: [
                    'APS interview questions are based on your major — review your coursework.',
                    'Start APS process at least 4 months before application deadlines.',
                    'APS China has separate tracks for Bachelor\'s and Master\'s applicants.',
                ]
            },
            {
                id: 'application',
                title: 'University Application',
                icon: '📬',
                description: 'Apply via Uni-Assist or directly. APS Certificate must be ready before applying.',
                items: [
                    { name: 'Uni-Assist', description: 'Most public universities require Uni-Assist. Fee: €75 first uni + €30 each additional.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'TU Munich, LMU, and some others accept direct applications.' },
                    { name: 'Program Database', description: 'Search all available programs.', link: 'https://uniadvisorai.com', linkText: 'Database' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15. Apply by April to be safe.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                    { name: 'Studienkolleg', description: 'If you don\'t meet direct entry requirements for Bachelor\'s, apply through Studienkolleg first.', link: 'https://www.studienkollegs.de/home.html', linkText: 'Studienkolleg Info' },
                ],
                tips: [
                    'Apply to 5–8 universities to maximize your chances.',
                    'Studienkolleg applications have separate, earlier deadlines.',
                ]
            },
            {
                id: 'admission',
                title: 'Admission & Acceptance',
                icon: '🏛️',
                description: 'Once accepted, you receive a Zulassungsbescheid (admission letter).',
                items: [
                    { name: 'Conditional Admission', description: 'May be conditional on language test or final degree. You can start visa process.' },
                    { name: 'Unconditional Admission (Zulassungsbescheid)', description: 'Full admission letter — key document for visa.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay semester contribution (€150–€400) after accepting.' },
                ],
                tips: [
                    'Accept your offer promptly within the deadline.',
                    'Keep original Zulassungsbescheid for visa appointment.',
                ]
            },
            {
                id: 'finance',
                title: 'Financial Proof',
                icon: '💰',
                description: 'Blocked account with €11,904 is mandatory. China-specific transfer details below.',
                items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. You receive ~€992/month. Approx. ¥90,000–95,000 at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice. Setup in ~2 days.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Deutsche Bank', description: 'Traditional option, takes 2–4 weeks.', link: 'https://www.deutsche-bank.de', linkText: 'Deutsche Bank' },
                    { name: 'Bank Transfer from China', description: 'Transfer via Bank of China, ICBC, or China Construction Bank. SAFE (State Administration of Foreign Exchange) limits annual foreign exchange to $50,000 per person.', important: true },
                    { name: 'CSC Scholarships', description: 'China Scholarship Council offers full scholarships for study in Germany. Apply through your Chinese university.', link: 'https://www.csc.edu.cn/', linkText: 'CSC Portal' },
                    { name: 'Scholarships', description: 'scholarships for Chinese students.', link: 'https://uniadvisorai.com/scholarships', linkText: 'Scholarships' },
                    { name: 'Semester Contribution', description: 'Pay €150–€400 per semester.' },
                ],
                tips: [
                    'SAFE $50,000 annual limit: parents can combine quotas if needed.',
                    'Some Chinese banks have partnership programs with Expatrio for faster setup.',
                ]
            },
            {
                id: 'visa',
                title: 'Visa Process',
                icon: '✈️',
                description: 'Apply for a German Student Visa at the German Embassy/Consulate in China.',
                items: [
                    { name: 'Embassy/Consulate Appointment', description: 'Book at German Embassy Beijing or Consulates in Shanghai, Guangzhou, Chengdu, Shenyang.', link: 'https://china.diplo.de/cn-zh/service/visa-einreise', linkText: 'German Missions China', important: true },
                    { name: 'Required: APS Certificate', description: 'Original APS Certificate from APS China.', important: true },
                    { name: 'Required: Admission Letter', description: 'Original Zulassungsbescheid.' },
                    { name: 'Required: Blocked Account', description: 'Confirmation of €11,904 deposit.' },
                    { name: 'Required: Health Insurance', description: 'Travel insurance for initial period.' },
                    { name: 'Required: Language Certificates', description: 'IELTS/TOEFL or TestDaF/DSH certificates.' },
                    { name: 'Processing Time', description: '3–4 weeks. Relatively fast processing in China.', important: true },
                ],
                tips: [
                    'Shanghai and Guangzhou consulates may have shorter wait times than Beijing.',
                    'Prepare all documents with Chinese translations where needed.',
                    'Carry original + 2 copies of everything.',
                ]
            },
        ],
        currency: 'CNY',
        studentCount: '40,000+'
    },
    {
        code: 'US',
        name: 'USA',
        slug: 'usa',
        flag: '🇺🇸',
        visaWaitTime: '2-3 weeks',
        embassyLocations: ['Washington DC', 'New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Boston', 'Houston', 'Atlanta', 'Miami'],
        gradeConversion: {
            systemName: 'GPA 4.0',
            germanEquivalent: 'Direct equivalence usually. 3.0+ recommended.'
        },
        specificRequirements: [
            'Can enter Germany visa-free and apply for residence permit within 90 days.',
            'Proof of health insurance and finances required for permit.'
        ],
        applicationPhases: [
            {
                id: 'eligibility',
                title: 'Eligibility Check',
                icon: '🎓',
                description: 'US degrees are generally well-recognized in Germany. Verify specific requirements.',
                items: [
                    { name: 'GPA Requirement', description: '3.0/4.0 or higher recommended for competitive programs. Direct equivalence to German grades using Bavarian Formula.', important: true },
                    { name: 'Modified Bavarian Formula', description: 'Your GPA is converted using: 1 + 3 × (Nmax − Nd) / (Nmax − Nmin). 3.0 GPA ≈ 2.5 German grade.', link: '/german-grade-calculator', linkText: 'Try Calculator' },
                    { name: 'Degree Recognition', description: 'US degrees from accredited universities are generally recognized as equivalent. Check anabin for your university.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Field of Study Match', description: 'For Master\'s, your Bachelor\'s field should align. US liberal arts degrees may need specific prerequisites.' },
                    { name: 'No APS Required', description: 'Unlike India/China, US students do NOT need APS. Document verification is simpler.' },
                ],
                tips: [
                    'US accredited degrees are almost always recognized — don\'t worry about anabin unless you attended a non-traditional institution.',
                    'Liberal arts graduates: check if the program requires specific credit hours in your field.',
                ]
            },
            {
                id: 'language',
                title: 'Language Requirements',
                icon: '🌐',
                description: 'As a native English speaker, English proficiency is usually waived. German programs need German certification.',
                items: [
                    { name: 'English Proficiency (often waived)', description: 'Many universities waive IELTS/TOEFL for US citizens or those with US degrees. Check individual program requirements.' },
                    { name: 'IELTS/TOEFL (if needed)', description: 'If required: IELTS 6.5+ or TOEFL 90+. Some programs still require it even for native speakers.', link: 'https://www.ielts.org', linkText: 'Book IELTS' },
                    { name: 'TestDaF (German)', description: 'TDN 4 in all sections for German-taught programs.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'DSH-2 (German)', description: 'Alternative to TestDaF. Can be taken at German universities after arrival.' },
                    { name: 'Goethe-Zertifikat C1', description: 'Available at Goethe-Institut locations across the US.', link: 'https://www.goethe.de/ins/us/en/index.html', linkText: 'Goethe USA' },
                ],
                tips: [
                    'Even if English is waived, check if your specific program requires an official certificate.',
                    'Learning German (A1–B1) before arriving makes a huge quality-of-life difference.',
                    'Many US universities offer German language courses you can take before departure.',
                ]
            },
            {
                id: 'documents',
                title: 'Document Preparation',
                icon: '📄',
                description: 'US document process is simpler — Apostille from your state\'s Secretary of State.',
                items: [
                    { name: 'Apostille', description: 'Get Apostille from your state\'s Secretary of State office for your degree and transcripts. Processing varies by state (1 day to 4 weeks).', important: true },
                    { name: 'Official Transcripts', description: 'Order sealed official transcripts from your university registrar. Some accept digital transcripts via Parchment/National Student Clearinghouse.' },
                    { name: 'Degree Certificate', description: 'Original diploma or degree certificate.' },
                    { name: 'Passport', description: 'Valid US passport. No visa needed to enter Germany — you can enter visa-free!' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose explaining your goals.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV in European format (Europass).', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors on university letterhead.' },
                    { name: 'Certified Translation', description: 'If applying to German-taught programs, get ATA-certified translations of documents.' },
                ],
                tips: [
                    'Some states offer same-day Apostille service in person.',
                    'You can often start the process online on your state\'s Secretary of State website.',
                    'No APS, no embassy interview — US process is much simpler than most countries.',
                ]
            },
            {
                id: 'application',
                title: 'University Application',
                icon: '📬',
                description: 'Apply via Uni-Assist or directly. No APS required — you can apply immediately.',
                items: [
                    { name: 'Uni-Assist', description: 'Some universities require Uni-Assist. Fee: €75 first uni + €30 each additional.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist' },
                    { name: 'Direct University Portals', description: 'Many top universities accept direct applications. Check each program page.' },
                    { name: 'ProgramDatabase', description: 'Search all programs and requirements.', link: 'https://www.study-in-germany.de/en/', linkText: 'Study in Germany' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ],
                tips: [
                    'US students often find the application process simpler than expected.',
                    'Apply to 4–6 programs across different cities.',
                ]
            },
            {
                id: 'admission',
                title: 'Admission & Acceptance',
                icon: '🏛️',
                description: 'Once accepted, you receive a Zulassungsbescheid.',
                items: [
                    { name: 'Conditional Admission', description: 'May be conditional on language test or final grades.' },
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay semester contribution (€150–€400) after accepting.' },
                ],
                tips: [
                    'Accept promptly — deadlines may be tight.',
                ]
            },
            {
                id: 'finance',
                title: 'Financial Proof',
                icon: '💰',
                description: 'Blocked account with €11,904 required for residence permit (applied for after arrival).',
                items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. ~$12,800 at current rates. Required for residence permit.', important: true },
                    { name: 'Expatrio', description: 'Popular choice. Quick setup.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Deutsche Bank', description: 'Traditional option.', link: 'https://www.deutsche-bank.de', linkText: 'Deutsche Bank' },
                    { name: 'Bank Transfer', description: 'Wire transfer from US bank (Chase, Bank of America, etc.). No restrictions on foreign exchange.' },
                    { name: 'Fulbright Scholarships', description: 'Fulbright Commission offers scholarships for US students studying in Germany.', link: 'https://www.fulbright.de/', linkText: 'Fulbright Germany' },
                    { name: 'Scholarships', description: 'German academic scholarships available for US students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'Semester Contribution', description: 'Pay €150–€400 per semester.' },
                ],
                tips: [
                    'No foreign exchange restrictions from the US — transfer is straightforward.',
                    'Fulbright is very prestigious and covers most expenses.',
                ]
            },
            {
                id: 'visa',
                title: 'Entry & Residence Permit',
                icon: '✈️',
                description: 'US citizens can enter Germany VISA-FREE for 90 days and apply for a residence permit after arrival!',
                items: [
                    { name: 'Visa-Free Entry', description: 'US citizens do NOT need a student visa before arrival. Enter Germany as a tourist and apply for a residence permit (Aufenthaltstitel) within 90 days.', important: true },
                    { name: 'City Registration (Anmeldung)', description: 'Register at your local Bürgeramt within 2 weeks of finding housing. This is required before applying for residence permit.', important: true },
                    { name: 'Residence Permit Application', description: 'Apply at your local Ausländerbehörde (foreigners\' office). Bring admission letter, blocked account, health insurance, passport.' },
                    { name: 'Health Insurance', description: 'Must have German public or private health insurance. TK, AOK, or Barmer are popular public options.' },
                    { name: 'Required Documents', description: 'Admission letter, blocked account confirmation, health insurance, biometric photos, passport, rental contract (Mietvertrag).' },
                    { name: 'Processing Time', description: 'Residence permit processing: 2–6 weeks after submission. You receive a Fiktionsbescheinigung (temporary permit) while waiting.' },
                ],
                tips: [
                    'The biggest advantage for US students: NO visa appointment or embassy interview needed!',
                    'Book an appointment at Ausländerbehörde early — wait times can be long in big cities.',
                    'Get Anmeldung done ASAP — you need it for everything (bank, insurance, residence permit).',
                    'Consider arriving 2–3 weeks early to handle all paperwork before semester starts.',
                ]
            },
        ],
        currency: 'USD',
        studentCount: '6,000+'
    },
    {
        code: 'NG',
        name: 'Nigeria',
        slug: 'nigeria',
        flag: '🇳🇬',
        visaWaitTime: '8-12 weeks',
        embassyLocations: ['Abuja', 'Lagos'],
        gradeConversion: {
            systemName: '5.0 Scale',
            germanEquivalent: 'Second Class Upper (3.5+) highly preferred.'
        },
        specificRequirements: [
            'Interview is very detailed regarding motivation.',
            'Proof of funds is scrutinized strictly.'
        ],
        applicationPhases: [
            {
                id: 'eligibility',
                title: 'Eligibility Check',
                icon: '🎓',
                description: 'Verify your Nigerian degree meets German university requirements.',
                items: [
                    { name: 'Minimum GPA', description: 'Second Class Upper (3.5/5.0) or higher strongly preferred. First Class gets best chances.', important: true },
                    { name: 'Modified Bavarian Formula', description: 'Your GPA on 5.0 scale is converted. 3.5/5.0 ≈ 2.8 German grade. First Class (4.5+) ≈ 1.6 German grade.', link: '/german-grade-calculator', linkText: 'Try Calculator' },
                    { name: 'Degree Recognition (anabin)', description: 'Check if your Nigerian university is recognized in anabin database.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Field of Study Match', description: 'For Master\'s, your Bachelor\'s field must be related.' },
                    { name: 'NYSC Certificate', description: 'While not always required, having your NYSC discharge/exemption certificate can be helpful.' },
                ],
                tips: [
                    'Second Class Upper Division is the practical minimum for most programs.',
                    'Federal universities are more likely to be recognized than some state/private ones.',
                ]
            },
            {
                id: 'language',
                title: 'Language Requirements',
                icon: '🌐',
                description: 'English proficiency proof is needed despite English being Nigeria\'s official language.',
                items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5 overall. Most commonly accepted. Test centers in Lagos, Abuja, Port Harcourt.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90. Available at test centers in major Nigerian cities.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'PTE Academic', description: 'Minimum 58+. Growing acceptance.', link: 'https://www.pearsonpte.com', linkText: 'Book PTE' },
                    { name: 'Duolingo English Test', description: 'Minimum 105+. Check if your specific program accepts it.' },
                    { name: 'TestDaF (German)', description: 'TDN 4 for German-taught programs. Limited test centers in Nigeria.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available through Goethe-Institut Lagos.', link: 'https://www.goethe.de/ins/ng/en/index.html', linkText: 'Goethe Nigeria' },
                ],
                tips: [
                    'Even though Nigeria is English-speaking, IELTS is still required by most German universities.',
                    'IELTS 6.5 is the safe benchmark.',
                    'Book tests early — slots in Lagos fill up fast.',
                ]
            },
            {
                id: 'documents',
                title: 'Document Preparation',
                icon: '📄',
                description: 'Nigeria requires FME (Federal Ministry of Education) verification and MFA legalization.',
                items: [
                    { name: 'FME Verification', description: 'Get your academic documents verified at Federal Ministry of Education, Abuja. Processing: 2–4 weeks.', important: true },
                    { name: 'MFA Legalization', description: 'After FME verification, legalize documents at Ministry of Foreign Affairs, Abuja.', important: true },
                    { name: 'German Embassy Authentication', description: 'Submit legalized documents to German Embassy Abuja or Lagos for final authentication.', important: true },
                    { name: 'Passport', description: 'Valid Nigerian passport with at least 6 months validity and 4 blank pages.' },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts from your university.' },
                    { name: 'Degree Certificate', description: 'Original degree certificate or statement of result.' },
                    { name: 'WAEC/NECO Certificates', description: 'Original O\'Level results (WAEC/NECO) may be needed for some applications.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose — motivation is scrutinized closely for Nigerian applicants.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool', important: true },
                    { name: 'CV / Resume', description: 'Academic CV in Europass format.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors on university letterhead.' },
                ],
                tips: [
                    'FME → MFA → Embassy chain takes 4–8 weeks total. Start very early.',
                    'The embassy scrutinizes motivation and genuineness closely — ensure SOP is detailed and authentic.',
                    'Keep original + certified copies of everything.',
                ]
            },
            {
                id: 'application',
                title: 'University Application',
                icon: '📬',
                description: 'Apply via Uni-Assist or directly to universities.',
                items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist. Fee: €75 first uni + €30 each additional.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'Some universities accept direct applications.' },
                    { name: 'ProgramDatabase', description: 'Search all programs and requirements.', link: 'https://www.study-in-germany.de/en/', linkText: 'Study in Germany' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15. Apply by April–May.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ],
                tips: [
                    'Apply to 5–8 universities to maximize chances.',
                    'Start early — document verification takes longer from Nigeria.',
                ]
            },
            {
                id: 'admission',
                title: 'Admission & Acceptance',
                icon: '🏛️',
                description: 'Once accepted, you receive a Zulassungsbescheid (admission letter).',
                items: [
                    { name: 'Conditional Admission', description: 'May be conditional on language test or final degree.' },
                    { name: 'Unconditional Admission', description: 'Full admission letter — your key document for visa.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay semester contribution (€150–€400).' },
                ],
                tips: [
                    'Accept promptly within the deadline.',
                    'Keep original Zulassungsbescheid safe — critically needed for visa interview.',
                ]
            },
            {
                id: 'finance',
                title: 'Financial Proof',
                icon: '💰',
                description: 'Blocked account is mandatory. Proof of funds is scrutinized very strictly for Nigerian applicants.',
                items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. At current rates approximately ₦18–20 million. Required for visa.', important: true },
                    { name: 'Expatrio', description: 'Most popular and fastest provider.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Deutsche Bank', description: 'Traditional option, takes 2–4 weeks.', link: 'https://www.deutsche-bank.de', linkText: 'Deutsche Bank' },
                    { name: 'Bank Transfer from Nigeria', description: 'Transfer via GTBank, Access Bank, or Zenith Bank using SWIFT. CBN allows $5,000/quarter for PTA (Personal Travel Allowance). You may need multiple transfers or a sponsor.', important: true },
                    { name: 'Sponsorship Letter', description: 'If sponsored, provide notarized sponsorship letter + sponsor\'s bank statements (6 months) + proof of income.' },
                    { name: 'Scholarships', description: 'German academic scholarships available for Nigerian students. Highly competitive.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'PTDF Scholarships', description: 'Petroleum Technology Development Fund offers scholarships for postgraduate study abroad.', link: 'https://ptdf.gov.ng/', linkText: 'PTDF Portal' },
                    { name: 'Semester Contribution', description: 'Pay €150–€400 per semester.' },
                ],
                tips: [
                    'Embassy scrutinizes financial proof heavily — ensure clean, consistent bank statements.',
                    'CBN $5,000/quarter PTA limit means you may need to save and transfer over several quarters.',
                    'If using a sponsor, the sponsorship relationship must be clearly documented.',
                ]
            },
            {
                id: 'visa',
                title: 'Visa Process',
                icon: '✈️',
                description: 'Apply at German Embassy Abuja or Consulate Lagos. The interview is detailed and thorough.',
                items: [
                    { name: 'Embassy Appointment', description: 'Book at German Embassy Abuja or Lagos. Wait times can be long — book as early as possible.', link: 'https://abuja.diplo.de/ng-en/service/05-VisaEinreise', linkText: 'German Missions Nigeria', important: true },
                    { name: 'Visa Interview', description: 'The interview is thorough and detailed. Be prepared to explain your study motivation, career plans, financial backing, and return plans.', important: true },
                    { name: 'Required: Admission Letter', description: 'Original Zulassungsbescheid.' },
                    { name: 'Required: Blocked Account', description: 'Confirmation of €11,904 deposited.' },
                    { name: 'Required: FME/MFA Verified Documents', description: 'All original verified and legalized academic documents.' },
                    { name: 'Required: Health Insurance', description: 'Travel health insurance for initial period.' },
                    { name: 'Required: Motivation Letter', description: 'Detailed letter explaining study motivation and career goals.' },
                    { name: 'Required: Language Certificates', description: 'IELTS/TOEFL or TestDaF certificates.' },
                    { name: 'Processing Time', description: '8–12 weeks. Can be longer. Apply well in advance!', important: true },
                ],
                tips: [
                    'The visa interview is more detailed for Nigerian applicants — practice your answers.',
                    'Be prepared to explain: Why Germany? Why this program? What are your career plans after?',
                    'Show genuine study intent — bring research on the specific program and professors.',
                    'Lagos consulate may have shorter wait times than Abuja embassy.',
                    'Carry ALL original documents + 2 photocopies each.',
                ]
            },
        ],
        currency: 'NGN',
        studentCount: '4,000+'
    },
    {
        code: 'IR',
        name: 'Iran',
        slug: 'iran',
        flag: '🇮🇷',
        visaWaitTime: '8-16 weeks',
        embassyLocations: ['Tehran'],
        gradeConversion: { systemName: '20-point Scale', germanEquivalent: 'Converted via Modified Bavarian Formula. 16/20+ is competitive.' },
        specificRequirements: ['All documents must be legalized by the Iranian Ministry of Foreign Affairs.', 'Apostille/legalization chain required.', 'Blocked Account (€11,904) required.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Verify your Iranian degree meets German university requirements.', items: [
                    { name: 'Minimum GPA', description: '16/20 or higher recommended for competitive programs. 14/20 minimum for most public universities.', important: true },
                    { name: 'Modified Bavarian Formula', description: 'Your 20-point grade is converted. 16/20 ≈ 2.4 German grade.', link: '/german-grade-calculator', linkText: 'Try Calculator' },
                    { name: 'Degree Recognition (anabin)', description: 'Check if your Iranian university is recognized. Most state universities are H+.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Konkur Score (Bachelor\'s)', description: 'For Bachelor\'s applicants, Konkur (university entrance exam) scores may be relevant for Studienkolleg.' },
                    { name: 'No APS Required', description: 'Iran does NOT require APS. Document legalization through MFA is the main requirement.' },
                ], tips: ['State universities (Tehran, Sharif, Amirkabir) have the best recognition.', 'If GPA is below 14, consider smaller universities or FH programs.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English-taught programs need IELTS/TOEFL. German-taught programs need TestDaF/DSH.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5. Test centers in Tehran, Isfahan, Shiraz.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90. Available in Tehran.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF (German)', description: 'TDN 4 in all sections. Limited test centers — plan ahead.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available via Goethe-Institut Tehran or partner institutions.' },
                ], tips: ['IELTS is the most accessible option in Iran.', 'Many Iranian students learn German through private institutes before applying.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Iranian documents must be legalized through the Ministry of Foreign Affairs.', items: [
                    { name: 'MFA Legalization', description: 'All academic documents must be legalized by the Iranian Ministry of Foreign Affairs. This replaces Apostille for Iran.', important: true },
                    { name: 'Certified Translations', description: 'All documents must be translated into German or English by a certified/sworn translator.', important: true },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts from your university.' },
                    { name: 'Degree Certificate', description: 'Original degree or provisional certificate.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV in Europass format.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors.' },
                ], tips: ['MFA legalization can take 2–4 weeks. Start early.', 'Use sworn translators recognized by the German Embassy.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly to universities.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist. Fee: €75 first + €30 each additional.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'Some universities accept direct applications.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply to 5–8 universities to maximize chances.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Conditional Admission', description: 'May be conditional on language test or final degree.' },
                    { name: 'Unconditional Admission', description: 'Full admission letter — key document for visa.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly within the deadline.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 mandatory. Banking transfers from Iran may face additional scrutiny.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. Due to banking restrictions, transfers from Iran may require intermediary banks.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Banking Challenges', description: 'Due to international sanctions, wire transfers from Iran may face delays. Use intermediary banks (Turkey, UAE) if needed.', important: true },
                    { name: 'Scholarships', description: 'German academic scholarships available for Iranian students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                ], tips: ['Start the blocked account process early — banking transfers can be complicated.', 'Some Iranian students use family accounts in Turkey or UAE as intermediaries.']
            },
            {
                id: 'visa', title: 'Visa Process', icon: '✈️', description: 'Apply at the German Embassy in Tehran.', items: [
                    { name: 'Embassy Appointment', description: 'Book at German Embassy Tehran. Wait times can be very long.', link: 'https://iran.diplo.de/ir-de/service/05-VisaEinreise', linkText: 'German Embassy Iran', important: true },
                    { name: 'Visa Interview', description: 'Detailed interview about study motivation and plans.', important: true },
                    { name: 'Required Documents', description: 'Admission letter, blocked account, MFA-legalized documents, health insurance, language certificates.' },
                    { name: 'Processing Time', description: '8–16 weeks. Can be longer during peak season.', important: true },
                ], tips: ['Book appointment as soon as you receive admission.', 'Prepare thoroughly for the interview — explain study motivation clearly.']
            },
        ],
        currency: 'IRR',
        studentCount: '12,000+'
    },
    {
        code: 'TR',
        name: 'Turkey',
        slug: 'turkey',
        flag: '🇹🇷',
        visaWaitTime: '4-8 weeks',
        embassyLocations: ['Ankara', 'Istanbul', 'Izmir', 'Antalya'],
        gradeConversion: { systemName: '4.0 Scale / 100-point', germanEquivalent: 'Converted via Modified Bavarian Formula. 3.0/4.0 or 75/100 is competitive.' },
        specificRequirements: ['YÖK (Council of Higher Education) recognition of degree.', 'Apostille via Turkish Governor\'s office.', 'Blocked Account (€11,904) required.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Turkish degrees are generally well-recognized in Germany.', items: [
                    { name: 'Minimum GPA', description: '3.0/4.0 or 75/100 for competitive programs. 2.5/4.0 minimum for most.', important: true },
                    { name: 'YÖK Recognition', description: 'Your degree must be from a YÖK-recognized university. Most state and established private universities qualify.' },
                    { name: 'Degree Recognition (anabin)', description: 'Turkish universities are generally well-represented in anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'No APS Required', description: 'Turkey does NOT require APS Certificate.' },
                ], tips: ['Turkish state universities have excellent recognition in Germany.', 'Many Turkish-German exchange programs exist — check bilateral agreements.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English or German proficiency required depending on program.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5. Test centers in Istanbul, Ankara, Izmir, and more.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90. Widely available.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF', description: 'TDN 4 in all sections. Test centers in Istanbul and Ankara.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut Istanbul, Ankara, and Izmir.', link: 'https://www.goethe.de/ins/tr/en/index.html', linkText: 'Goethe Turkey' },
                ], tips: ['Many Turkish students already learn German in high school — leverage this advantage.', 'Turkish-German cultural exchange is strong — many resources available.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Turkey is a Hague Convention member — Apostille is available.', items: [
                    { name: 'Apostille', description: 'Get Apostille from your local Governor\'s office (Valilik) for degree and transcripts.', important: true },
                    { name: 'Certified Translations', description: 'Translate documents into German or English by a sworn translator (yeminli tercüman).', important: true },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts from your university.' },
                    { name: 'Degree Certificate', description: 'Original diploma with Apostille.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors.' },
                ], tips: ['Apostille process in Turkey is straightforward — usually 1–3 days at Valilik.', 'Notarized translations (noter onaylı) are widely accepted.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'Some universities accept direct applications.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                    { name: 'Turkish-German University Programs', description: 'Special bilateral programs exist between Turkish and German universities.', link: 'https://www.tau.edu.tr/', linkText: 'Turkish-German University' },
                ], tips: ['Check for bilateral exchange agreements between your Turkish university and German universities.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Conditional Admission', description: 'May be conditional on language test or final degree.' },
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly within the deadline.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 mandatory.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. Approx. ₺400,000+ at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Bank Transfer', description: 'Transfer from Turkish banks (İş Bankası, Garanti, Ziraat) via SWIFT. TCMB allows education-related forex transfers.' },
                    { name: 'Scholarships', description: 'German academic scholarships available for Turkish students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'YTB Scholarships', description: 'Presidency for Turks Abroad offers some scholarship opportunities.' },
                ], tips: ['Expatrio is the fastest option for blocked account setup.']
            },
            {
                id: 'visa', title: 'Visa Process', icon: '✈️', description: 'Apply at the German Embassy/Consulate in Turkey.', items: [
                    { name: 'Embassy/Consulate Appointment', description: 'Book at German Embassy Ankara or Consulates in Istanbul, Izmir, Antalya.', link: 'https://tuerkei.diplo.de/tr-tr/service/05-VisaEinreise', linkText: 'German Missions Turkey', important: true },
                    { name: 'Required Documents', description: 'Admission letter, blocked account, Apostille documents, health insurance, language certificates.' },
                    { name: 'Processing Time', description: '4–8 weeks. Istanbul consulate may be faster.', important: true },
                ], tips: ['Istanbul consulate often has more appointment slots.', 'Strong Turkish-German bilateral relations mean visa processing is relatively smooth.']
            },
        ],
        currency: 'TRY',
        studentCount: '10,000+'
    },
    {
        code: 'RU',
        name: 'Russia',
        slug: 'russia',
        flag: '🇷🇺',
        visaWaitTime: '6-12 weeks',
        embassyLocations: ['Moscow', 'St. Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kaliningrad'],
        gradeConversion: { systemName: '5-point Scale', germanEquivalent: 'Converted via Modified Bavarian Formula. 4.5/5.0+ is competitive.' },
        specificRequirements: ['Documents must be apostilled via Russian Ministry of Justice.', 'Certified translations required.', 'Blocked Account (€11,904) required.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Russian degrees are generally well-recognized in Germany.', items: [
                    { name: 'Minimum GPA', description: '4.0/5.0 or higher for most programs. 4.5+ is competitive.', important: true },
                    { name: 'Degree Recognition', description: 'Russian state university degrees are well-recognized. Check anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Specialist vs Bologna Degrees', description: 'Russian 5-year Specialist degrees and 4-year Bachelor\'s (Bologna system) are both recognized. Specialist ≈ Master\'s equivalent.' },
                    { name: 'No APS Required', description: 'Russia does NOT require APS Certificate.' },
                ], tips: ['Top Russian universities (MSU, SPbSU, MIPT, HSE) have excellent recognition.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English or German proficiency required.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5. Test centers in Moscow, St. Petersburg, and other cities.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF', description: 'TDN 4 in all sections. Centers in Moscow and St. Petersburg.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut Moscow and St. Petersburg.', link: 'https://www.goethe.de/ins/ru/en/index.html', linkText: 'Goethe Russia' },
                ], tips: ['Many Russian students learn German — it opens more program options.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Russia is a Hague Convention member — Apostille is available.', items: [
                    { name: 'Apostille', description: 'Get Apostille from the Russian Ministry of Justice for degree and transcripts.', important: true },
                    { name: 'Certified Translations', description: 'Translate all documents into German or English by a certified translator. Notarize translations.', important: true },
                    { name: 'Academic Transcripts', description: 'Official transcripts with Apostille.' },
                    { name: 'Degree Certificate', description: 'Original diploma with Apostille.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors.' },
                ], tips: ['Apostille process takes 5–10 business days in Russia.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Direct University Portals', description: 'Some accept direct applications.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply to 5–8 universities.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Conditional Admission', description: 'May be conditional on language or final degree.' },
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 mandatory.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. Due to sanctions, bank transfers may face restrictions.', important: true },
                    { name: 'Banking Challenges', description: 'International sanctions may affect SWIFT transfers. Use non-sanctioned banks or intermediary countries if needed.', important: true },
                    { name: 'Scholarships', description: 'German academic scholarships available.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                ], tips: ['Start banking process early — sanctions may cause delays.', 'Some Russian students use banks in third countries.']
            },
            {
                id: 'visa', title: 'Visa Process', icon: '✈️', description: 'Apply at the German Embassy/Consulate in Russia.', items: [
                    { name: 'Embassy/Consulate Appointment', description: 'Book at German Embassy Moscow or Consulates.', link: 'https://russland.diplo.de/ru-de/service/05-VisaEinreise', linkText: 'German Missions Russia', important: true },
                    { name: 'Required Documents', description: 'Admission letter, blocked account, apostilled documents, health insurance, language certificates.' },
                    { name: 'Processing Time', description: '6–12 weeks. May vary due to current political situation.', important: true },
                ], tips: ['Processing times may be longer than usual — apply well in advance.']
            },
        ],
        currency: 'RUB',
        studentCount: '10,000+'
    },
    {
        code: 'EG',
        name: 'Egypt',
        slug: 'egypt',
        flag: '🇪🇬',
        visaWaitTime: '6-10 weeks',
        embassyLocations: ['Cairo'],
        gradeConversion: { systemName: 'Percentage / 4.0 GPA', germanEquivalent: 'Converted via Modified Bavarian Formula. 75%+ or 3.0/4.0 is competitive.' },
        specificRequirements: ['Documents must be legalized by Egyptian MFA and German Embassy.', 'Supreme Council of Universities recognition.', 'Blocked Account (€11,904) required.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Verify your Egyptian degree meets German requirements.', items: [
                    { name: 'Minimum GPA', description: '75% or 3.0/4.0 for most programs. Good/Very Good classification preferred.', important: true },
                    { name: 'Degree Recognition', description: 'Egyptian state university degrees are generally recognized. Check anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'Thanaweya Amma (Bachelor\'s)', description: 'For Bachelor\'s, Thanaweya Amma scores may be relevant. Studienkolleg may be required.' },
                    { name: 'No APS Required', description: 'Egypt does NOT require APS.' },
                ], tips: ['Cairo University, Ain Shams, and Alexandria University have good recognition.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English or German proficiency required.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5. Test centers in Cairo and Alexandria.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF', description: 'TDN 4 in all sections.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut Cairo and Alexandria.', link: 'https://www.goethe.de/ins/eg/en/index.html', linkText: 'Goethe Egypt' },
                ], tips: ['Egyptian students with German school background (e.g., Deutsche Schule Cairo) have advantages.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Egypt requires document legalization through MFA.', items: [
                    { name: 'MFA Legalization', description: 'All documents must be legalized by the Egyptian Ministry of Foreign Affairs.', important: true },
                    { name: 'German Embassy Authentication', description: 'After MFA, documents may need authentication by the German Embassy in Cairo.', important: true },
                    { name: 'Certified Translations', description: 'Translate all Arabic documents into German or English.' },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts.' },
                    { name: 'Degree Certificate', description: 'Original degree with legalization.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors.' },
                ], tips: ['MFA legalization in Cairo takes 1–2 weeks.', 'German Embassy authentication may add another week.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply to 5–8 universities.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 mandatory.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. Approx. EGP 575,000+ at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'CBE Regulations', description: 'Central Bank of Egypt may have forex transfer limits. Check current regulations for education abroad.', important: true },
                    { name: 'Scholarships', description: 'German academic scholarships available for Egyptian students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'GERSS Scholarships', description: 'German-Egyptian Research Short-term Scholarships available through the German academic exchange office in Cairo.' },
                ], tips: ['Check CBE forex limits before planning transfers.']
            },
            {
                id: 'visa', title: 'Visa Process', icon: '✈️', description: 'Apply at the German Embassy in Cairo.', items: [
                    { name: 'Embassy Appointment', description: 'Book at German Embassy Cairo.', link: 'https://kairo.diplo.de/eg-de/service/05-VisaEinreise', linkText: 'German Embassy Egypt', important: true },
                    { name: 'Required Documents', description: 'Admission letter, blocked account, legalized documents, health insurance, language certificates.' },
                    { name: 'Processing Time', description: '6–10 weeks.', important: true },
                ], tips: ['Book appointment early — Cairo embassy can have long wait times.']
            },
        ],
        currency: 'EGP',
        studentCount: '6,000+'
    },
    {
        code: 'UA',
        name: 'Ukraine',
        slug: 'ukraine',
        flag: '🇺🇦',
        visaWaitTime: '4-8 weeks',
        embassyLocations: ['Kyiv'],
        gradeConversion: { systemName: '100-point / 5-point Scale', germanEquivalent: 'Converted via Modified Bavarian Formula. 75/100 or 4.0/5.0+ is competitive.' },
        specificRequirements: ['Apostille via Ukrainian Ministry of Education.', 'Certified translations required.', 'Blocked Account (€11,904) required.', 'Special provisions may apply due to ongoing conflict.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Ukrainian degrees are well-recognized in Germany, especially from top national universities.', items: [
                    { name: 'Minimum GPA', description: '75/100 or 4.0/5.0 for most programs.', important: true },
                    { name: 'Degree Recognition', description: 'Ukrainian state university degrees are generally recognized. Check anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'No APS Required', description: 'Ukraine does NOT require APS.' },
                    { name: 'Special Refugee Provisions', description: 'Ukrainian students affected by the conflict may have access to special admission pathways and fee waivers at German universities.', important: true },
                ], tips: ['Many German universities offer special programs and support for Ukrainian students.', 'KPI Kyiv, Kharkiv National, and Lviv Polytechnic have strong recognition.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English or German proficiency required.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF', description: 'TDN 4 in all sections.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut Kyiv.', link: 'https://www.goethe.de/ins/ua/en/index.html', linkText: 'Goethe Ukraine' },
                ], tips: ['Some German universities waive language requirements or provide preparatory courses for Ukrainian refugees.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Ukraine is a Hague Convention member — Apostille available.', items: [
                    { name: 'Apostille', description: 'Get Apostille from the Ukrainian Ministry of Education and Science for academic documents.', important: true },
                    { name: 'Certified Translations', description: 'Translate into German or English by a certified translator.', important: true },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts.' },
                    { name: 'Degree Certificate', description: 'Original diploma with Apostille.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Lost Documents', description: 'If documents were lost due to conflict, German universities may accept alternative proof or sworn statements.', important: true },
                ], tips: ['If you cannot obtain original documents due to the conflict, contact the university directly.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Special Programs', description: 'Many German universities have created special admission tracks for Ukrainian students.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Check university websites for special Ukrainian student programs.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400. May be waived for Ukrainian refugees.' },
                ], tips: ['Many universities waive fees for Ukrainian students.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account requirements may be modified for Ukrainian students.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Standard requirement: €11,904. May be waived or reduced for refugees with temporary protection status.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Scholarships', description: 'Special German academic programs for Ukrainian students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'Temporary Protection Status', description: 'Ukrainians with temporary protection (§24 AufenthG) may have different financial requirements.', important: true },
                ], tips: ['Check if you qualify for temporary protection status — it simplifies many requirements.']
            },
            {
                id: 'visa', title: 'Visa / Entry Process', icon: '✈️', description: 'Ukrainians may enter Germany visa-free under temporary protection.', items: [
                    { name: 'Visa-Free Entry (Temporary Protection)', description: 'Ukrainians can enter Germany visa-free and apply for temporary protection under EU Directive 2001/55/EC. Valid for residence and study.', important: true },
                    { name: 'Student Visa (Regular)', description: 'If not using temporary protection, apply at German Embassy Kyiv.', link: 'https://kiew.diplo.de/ua-de/service/05-VisaEinreise', linkText: 'German Embassy Ukraine' },
                    { name: 'Residence Permit', description: 'Apply at local Ausländerbehörde after arrival.' },
                    { name: 'Processing Time', description: '4–8 weeks for regular visa. Temporary protection: immediate.', important: true },
                ], tips: ['Temporary protection is the fastest path — check eligibility.', 'Many cities have dedicated offices for Ukrainian arrivals.']
            },
        ],
        currency: 'UAH',
        studentCount: '8,000+'
    },
    {
        code: 'ID',
        name: 'Indonesia',
        slug: 'indonesia',
        flag: '🇮🇩',
        visaWaitTime: '6-10 weeks',
        embassyLocations: ['Jakarta'],
        gradeConversion: { systemName: '4.0 Scale', germanEquivalent: 'Converted via Modified Bavarian Formula. 3.0/4.0+ is competitive.' },
        specificRequirements: ['Legalization by Indonesian Ministry of Law and Human Rights.', 'DIKTI (Directorate of Higher Education) recognition.', 'Blocked Account (€11,904) required.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Verify your Indonesian degree meets German requirements.', items: [
                    { name: 'Minimum GPA', description: '3.0/4.0 or higher for most programs.', important: true },
                    { name: 'Degree Recognition', description: 'Indonesian degrees from accredited universities (DIKTI A/B accreditation) are recognized. Check anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'DIKTI Accreditation', description: 'Your program should have DIKTI accreditation (minimum B, preferably A).', important: true },
                    { name: 'No APS Required', description: 'Indonesia does NOT require APS.' },
                ], tips: ['ITB, UI, UGM, and ITS have strong international recognition.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English or German proficiency required.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5. Test centers in Jakarta, Surabaya, Bandung, and more.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF', description: 'TDN 4 in all sections.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut Jakarta, Bandung and partner institutions.', link: 'https://www.goethe.de/ins/id/en/index.html', linkText: 'Goethe Indonesia' },
                ], tips: ['TOEFL ITP is widely available in Indonesia but check if your target university accepts it.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Indonesia requires document legalization.', items: [
                    { name: 'Legalization', description: 'Get documents legalized by the Ministry of Law and Human Rights and the German Embassy in Jakarta.', important: true },
                    { name: 'Certified Translations', description: 'Translate all Indonesian documents into German or English by a sworn translator.', important: true },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts.' },
                    { name: 'Degree Certificate (Ijazah)', description: 'Original Ijazah with legalization.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors.' },
                ], tips: ['Legalization process takes 2–4 weeks.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply to 5–8 universities.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 mandatory.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. Approx. IDR 190,000,000+ at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Bank Transfer', description: 'Transfer via BCA, Mandiri, or BNI. Bank Indonesia allows education-related forex transfers.' },
                    { name: 'Scholarships', description: 'German academic scholarships available for Indonesian students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'LPDP Scholarships', description: 'Indonesia Endowment Fund for Education (LPDP) offers full scholarships for studying abroad.', link: 'https://lpdp.kemenkeu.go.id/', linkText: 'LPDP Portal', important: true },
                ], tips: ['LPDP is a major funding source — apply early, it\'s very competitive.']
            },
            {
                id: 'visa', title: 'Visa Process', icon: '✈️', description: 'Apply at the German Embassy in Jakarta.', items: [
                    { name: 'Embassy Appointment', description: 'Book at German Embassy Jakarta.', link: 'https://jakarta.diplo.de/id-de/service/05-VisaEinreise', linkText: 'German Embassy Indonesia', important: true },
                    { name: 'Required Documents', description: 'Admission letter, blocked account, legalized documents, health insurance, language certificates.' },
                    { name: 'Processing Time', description: '6–10 weeks.', important: true },
                ], tips: ['Book appointment early.']
            },
        ],
        currency: 'IDR',
        studentCount: '5,000+'
    },
    {
        code: 'BD',
        name: 'Bangladesh',
        slug: 'bangladesh',
        flag: '🇧🇩',
        visaWaitTime: '8-12 weeks',
        embassyLocations: ['Dhaka'],
        gradeConversion: { systemName: '4.0 Scale / 5.0 Scale', germanEquivalent: 'Converted via Modified Bavarian Formula. 3.0/4.0+ or 3.5/5.0+ is competitive.' },
        specificRequirements: ['Documents must be attested by the Ministry of Foreign Affairs.', 'University Grants Commission (UGC) recognized degree required.', 'Blocked Account (€11,904) required.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Verify your Bangladeshi degree meets German requirements.', items: [
                    { name: 'Minimum GPA', description: '3.0/4.0 or 3.5/5.0 for most programs. Higher for competitive programs.', important: true },
                    { name: 'UGC Recognition', description: 'Your university must be recognized by the University Grants Commission (UGC) of Bangladesh.', important: true },
                    { name: 'Degree Recognition (anabin)', description: 'Check if your university is recognized in anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'No APS Required', description: 'Bangladesh does NOT require APS.' },
                    { name: '12-Year vs 16-Year Education', description: 'Students with 12-year (SSC+HSC) education may need Studienkolleg for Bachelor\'s. 16-year degree holders can apply for Master\'s directly.', important: true },
                ], tips: ['BUET, DU, and RUET graduates have good recognition.', 'Private university degrees are accepted if UGC-recognized.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English or German proficiency required.', items: [
                    { name: 'IELTS Academic', description: 'Minimum 6.0–6.5. Test centers in Dhaka, Chittagong, Sylhet.', link: 'https://www.ielts.org', linkText: 'Book IELTS', important: true },
                    { name: 'TOEFL iBT', description: 'Minimum 80–90.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                    { name: 'TestDaF', description: 'TDN 4 for German-taught programs. Limited centers in Dhaka.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut Dhaka.', link: 'https://www.goethe.de/ins/bd/en/index.html', linkText: 'Goethe Bangladesh' },
                ], tips: ['IELTS is the most widely accepted and accessible option.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Bangladesh requires MFA attestation for documents.', items: [
                    { name: 'MFA Attestation', description: 'All academic documents must be attested by the Ministry of Foreign Affairs of Bangladesh.', important: true },
                    { name: 'Notarized Copies', description: 'Get notarized copies (notary public) of all documents before MFA attestation.' },
                    { name: 'Certified Translations', description: 'Translate all Bengali/English documents as required.', important: true },
                    { name: 'Academic Transcripts', description: 'Official sealed transcripts.' },
                    { name: 'Degree Certificate', description: 'Original degree with MFA attestation.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                    { name: 'Recommendation Letters', description: '2–3 letters from professors.' },
                ], tips: ['MFA attestation in Dhaka takes 1–2 weeks.', 'Get multiple sets of attested copies.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Most universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist', important: true },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply to 5–8 universities.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 mandatory.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. Approx. BDT 14,00,000+ at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Bank Transfer', description: 'Transfer via Dutch-Bangla Bank, BRAC Bank, or Standard Chartered Bangladesh. Bangladesh Bank allows education-related forex under student quota.' },
                    { name: 'Scholarships', description: 'German academic scholarships available.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                ], tips: ['Bangladesh Bank has specific education forex quotas — check current limits.']
            },
            {
                id: 'visa', title: 'Visa Process', icon: '✈️', description: 'Apply at the German Embassy in Dhaka.', items: [
                    { name: 'Embassy Appointment', description: 'Book at German Embassy Dhaka.', link: 'https://dhaka.diplo.de/bd-de/service/05-VisaEinreise', linkText: 'German Embassy Bangladesh', important: true },
                    { name: 'Visa Interview', description: 'Interview about study motivation and plans. Be well-prepared.', important: true },
                    { name: 'Required Documents', description: 'Admission letter, blocked account, MFA-attested documents, health insurance, language certificates.' },
                    { name: 'Processing Time', description: '8–12 weeks.', important: true },
                ], tips: ['Book appointment early — Dhaka embassy can have long wait times.', 'Be prepared for detailed interview questions.']
            },
        ],
        currency: 'BDT',
        studentCount: '5,000+'
    },
    {
        code: 'DE',
        name: 'Germany',
        slug: 'germany',
        flag: '🇩🇪',
        visaWaitTime: 'N/A (domestic)',
        embassyLocations: [],
        gradeConversion: { systemName: 'German 1.0–5.0 Scale', germanEquivalent: 'Already in German system. 1.0 = best, 4.0 = passing.' },
        specificRequirements: ['No visa required — domestic students.', 'Hochschulreife (Abitur) required for Bachelor\'s.', 'Semester contribution (€150–€400) per semester.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'As a German student, you already have the simplest path.', items: [
                    { name: 'Abitur (Bachelor\'s)', description: 'Allgemeine Hochschulreife (Abitur) is required for university entrance. Fachabitur allows entry to Fachhochschulen.', important: true },
                    { name: 'Bachelor\'s Degree (Master\'s)', description: 'A recognized Bachelor\'s degree is required for Master\'s programs. Must be in a related field.', important: true },
                    { name: 'NC (Numerus Clausus)', description: 'Some programs have NC restrictions based on Abitur grade. Check per program.' },
                    { name: 'No APS/Apostille Needed', description: 'German documents are directly accepted by German universities.' },
                ], tips: ['ZVS/hochschulstart.de handles NC-restricted programs.', 'Fachhochschulen often have lower NC requirements.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'German proficiency is assumed. English may be needed for English-taught programs.', items: [
                    { name: 'German Programs', description: 'No separate German language proof needed for native German speakers.' },
                    { name: 'English Programs (IELTS)', description: 'If applying for English-taught programs, IELTS 6.0–6.5 or TOEFL 80+ may be required.', link: 'https://www.ielts.org', linkText: 'Book IELTS' },
                    { name: 'English Programs (TOEFL)', description: 'TOEFL iBT 80–90.', link: 'https://www.ets.org/toefl', linkText: 'Book TOEFL' },
                ], tips: ['Some English-taught programs accept school English certificates.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Straightforward document process for German nationals.', items: [
                    { name: 'Abitur Certificate', description: 'Original Abiturzeugnis for Bachelor\'s applications.', important: true },
                    { name: 'Bachelor\'s Degree', description: 'For Master\'s: original Bachelor\'s certificate and transcript.' },
                    { name: 'Personalausweis / Passport', description: 'German ID card or passport.' },
                    { name: 'Motivation Letter', description: 'Required for some Master\'s programs.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV for Master\'s programs.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                ], tips: ['No attestation, apostille, or translation needed for German documents.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply directly or via hochschulstart.de for NC programs.', items: [
                    { name: 'hochschulstart.de', description: 'For NC-restricted programs (Medicine, Law, etc.). Centralized application.', link: 'https://www.hochschulstart.de', linkText: 'hochschulstart.de', important: true },
                    { name: 'Direct University Portals', description: 'Most non-NC programs accept direct applications through university websites.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15 for NC programs, varies for others.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply early for NC programs — Abitur grade is the primary selection criterion.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Enrollment process after admission.', items: [
                    { name: 'Zulassungsbescheid', description: 'Admission letter from the university.', important: true },
                    { name: 'Enrollment (Immatrikulation)', description: 'Enroll in person or online. Pay semester contribution.' },
                    { name: 'Semester Contribution', description: '€150–€400 per semester. Includes Semesterticket.' },
                ], tips: ['Enroll within the deadline or lose your spot.']
            },
            {
                id: 'finance', title: 'Financial Planning', icon: '💰', description: 'No blocked account needed. BAföG and scholarships available for German students.', items: [
                    { name: 'No Tuition Fees', description: 'Public universities in Germany are tuition-free for all students.', important: true },
                    { name: 'BAföG', description: 'Federal student financial aid. Up to ~€934/month (2024). Half grant, half interest-free loan.', link: 'https://www.bafög.de', linkText: 'BAföG Portal', important: true },
                    { name: 'Deutschlandstipendium', description: '€300/month merit-based scholarship. Apply through your university.', link: 'https://www.deutschlandstipendium.de', linkText: 'Deutschlandstipendium' },
                    { name: 'Studienstiftung', description: 'Prestigious scholarship foundation for top students.', link: 'https://www.studienstiftung.de', linkText: 'Studienstiftung' },
                    { name: 'KfW Studienkredit', description: 'Student loan from KfW bank if BAföG is insufficient.', link: 'https://www.kfw.de/inlandsfoerderung/Privatpersonen/Studieren-Qualifizieren/', linkText: 'KfW Studienkredit' },
                ], tips: ['Apply for BAföG immediately — processing takes weeks.', 'Combine BAföG with HiWi (student assistant) jobs for comfortable living.']
            },
            {
                id: 'visa', title: 'Getting Started', icon: '✈️', description: 'No visa needed — just enroll and move!', items: [
                    { name: 'No Visa Required', description: 'As a German citizen, no visa or residence permit is needed.', important: true },
                    { name: 'City Registration (Anmeldung)', description: 'Register at your local Bürgeramt within 2 weeks of moving to a new city.', important: true },
                    { name: 'Student Housing', description: 'Apply for Studierendenwerk housing early. Private WG (shared apartments) via WG-Gesucht.de.', link: 'https://www.wg-gesucht.de', linkText: 'WG-Gesucht' },
                    { name: 'Health Insurance', description: 'Mandatory. Gesetzliche Krankenversicherung (GKV) — TK, AOK, Barmer. ~€110/month for students.' },
                ], tips: ['Apply for student housing 3–6 months early — waiting lists are long.', 'Anmeldung is the first step for everything else.']
            },
        ],
        currency: 'EUR',
        studentCount: 'Domestic'
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        slug: 'united-kingdom',
        flag: '🇬🇧',
        visaWaitTime: '2-4 weeks',
        embassyLocations: ['London', 'Edinburgh', 'Belfast', 'Cardiff', 'Manchester', 'Birmingham'],
        gradeConversion: { systemName: 'UK Honours Classification', germanEquivalent: 'First Class ≈ 1.0–1.5, Upper Second (2:1) ≈ 1.5–2.5, Lower Second (2:2) ≈ 2.5–3.5.' },
        specificRequirements: ['Degrees from UK universities are highly recognized.', 'No APS required.', 'Blocked Account (€11,904) for residence permit.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'UK degrees are very well-recognized in Germany.', items: [
                    { name: 'UK Honours Classification', description: 'Upper Second (2:1) or higher preferred. First Class gives the best chances.', important: true },
                    { name: 'Direct Equivalence', description: 'UK 3-year Bachelor\'s is generally recognized as equivalent to German Bachelor\'s. No Studienkolleg needed.' },
                    { name: 'Degree Recognition (anabin)', description: 'UK universities are almost all recognized as H+ in anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'No APS Required', description: 'UK does NOT require APS.' },
                ], tips: ['Russell Group universities have the strongest recognition.', 'UK 3-year degrees are accepted — no extra year needed.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English proficiency usually waived for UK degree holders. German needed for German-taught programs.', items: [
                    { name: 'English (often waived)', description: 'Most universities waive English requirements for UK citizens or UK degree holders.' },
                    { name: 'TestDaF (German)', description: 'TDN 4 for German-taught programs.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut London and other UK cities.', link: 'https://www.goethe.de/ins/gb/en/index.html', linkText: 'Goethe UK' },
                ], tips: ['Learning German (A1–B1) before arrival significantly improves daily life.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'UK is a Hague Convention member — Apostille available.', items: [
                    { name: 'Apostille', description: 'Get Apostille from the UK Foreign, Commonwealth & Development Office (FCDO).', link: 'https://www.gov.uk/get-document-legalised', linkText: 'UK Apostille Service', important: true },
                    { name: 'Official Transcripts', description: 'From your UK university. HEDD verification may be accepted.' },
                    { name: 'Degree Certificate', description: 'Original degree certificate with Apostille.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                ], tips: ['UK Apostille can be done online and takes about 2 weeks.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Some universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist' },
                    { name: 'Direct Applications', description: 'Many accept direct applications.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Post-Brexit, UK citizens need a residence permit — plan accordingly.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 required for residence permit.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. ~£10,200 at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Bank Transfer', description: 'Transfer from UK banks via SWIFT. No restrictions.' },
                    { name: 'Scholarships', description: 'German academic scholarships available for UK students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                    { name: 'Erasmus Mundus', description: 'EU-funded joint Master\'s programs. Still accessible to UK students.', link: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en', linkText: 'Erasmus Mundus' },
                ], tips: ['No forex restrictions from the UK.']
            },
            {
                id: 'visa', title: 'Entry & Residence Permit', icon: '✈️', description: 'Post-Brexit, UK citizens can enter visa-free for 90 days and apply for residence permit.', items: [
                    { name: 'Visa-Free Entry (90 days)', description: 'UK citizens can enter Germany visa-free for 90 days. Apply for residence permit after arrival.', important: true },
                    { name: 'City Registration (Anmeldung)', description: 'Register at local Bürgeramt within 2 weeks.', important: true },
                    { name: 'Residence Permit', description: 'Apply at Ausländerbehörde. Bring admission letter, blocked account, health insurance, passport.' },
                    { name: 'Processing Time', description: '2–6 weeks for residence permit after submission.' },
                ], tips: ['Post-Brexit, UK citizens are treated as non-EU but still have visa-free entry.', 'Apply for residence permit as soon as possible after Anmeldung.']
            },
        ],
        currency: 'GBP',
        studentCount: '3,000+'
    },
    {
        code: 'CA',
        name: 'Canada',
        slug: 'canada',
        flag: '🇨🇦',
        visaWaitTime: '2-4 weeks',
        embassyLocations: ['Ottawa', 'Toronto', 'Montreal', 'Vancouver'],
        gradeConversion: { systemName: 'GPA 4.0 / 4.3', germanEquivalent: 'Direct equivalence similar to US. 3.0/4.0+ recommended.' },
        specificRequirements: ['Canadian degrees are well-recognized.', 'No APS required.', 'Blocked Account (€11,904) for residence permit.'],
        applicationPhases: [
            {
                id: 'eligibility', title: 'Eligibility Check', icon: '🎓', description: 'Canadian degrees are well-recognized in Germany.', items: [
                    { name: 'GPA Requirement', description: '3.0/4.0 or higher recommended. Direct equivalence to German grades.', important: true },
                    { name: 'Degree Recognition', description: 'Canadian degrees from DLI-listed institutions are well-recognized. Check anabin.', link: 'https://anabin.kmk.org/anabin.html', linkText: 'anabin Database' },
                    { name: 'No APS Required', description: 'Canada does NOT require APS.' },
                ], tips: ['U15 universities (UofT, McGill, UBC, etc.) have excellent recognition.']
            },
            {
                id: 'language', title: 'Language Requirements', icon: '🌐', description: 'English often waived for Canadian degree holders. German needed for German programs.', items: [
                    { name: 'English (often waived)', description: 'Many universities waive English proficiency for Canadian degree holders.' },
                    { name: 'IELTS/TOEFL (if needed)', description: 'If required: IELTS 6.5+ or TOEFL 90+.', link: 'https://www.ielts.org', linkText: 'Book IELTS' },
                    { name: 'TestDaF (German)', description: 'TDN 4 for German-taught programs.', link: 'https://www.testdaf.de', linkText: 'Find TestDaF Center' },
                    { name: 'Goethe-Zertifikat', description: 'Available at Goethe-Institut locations across Canada.', link: 'https://www.goethe.de/ins/ca/en/index.html', linkText: 'Goethe Canada' },
                ], tips: ['Bilingual (French/English) Canadians may find learning German easier.']
            },
            {
                id: 'documents', title: 'Document Preparation', icon: '📄', description: 'Canada is a Hague Convention member — Apostille available.', items: [
                    { name: 'Apostille', description: 'Get Apostille from Global Affairs Canada for degree and transcripts.', link: 'https://www.international.gc.ca/gac-amc/about-a_propos/services/authentication-authentification/index.aspx', linkText: 'Apostille Service', important: true },
                    { name: 'Official Transcripts', description: 'From your Canadian university. Sealed official copies.' },
                    { name: 'Degree Certificate', description: 'Original degree with Apostille.' },
                    { name: 'Motivation Letter / SOP', description: 'Statement of Purpose.', link: '/tools/sop-generator', linkText: 'SOP Generator Tool' },
                    { name: 'CV / Resume', description: 'Academic CV.', link: '/tools/cv-generator', linkText: 'CV Generator Tool' },
                ], tips: ['Canada\'s Apostille process is relatively new (Jan 2024). Use Global Affairs Canada.']
            },
            {
                id: 'application', title: 'University Application', icon: '📬', description: 'Apply via Uni-Assist or directly.', items: [
                    { name: 'Uni-Assist', description: 'Some universities require Uni-Assist.', link: 'https://www.uni-assist.de/en/', linkText: 'Uni-Assist' },
                    { name: 'Direct Applications', description: 'Many accept direct applications.' },
                    { name: 'Winter Semester Deadline', description: 'Usually July 15.', important: true },
                    { name: 'Summer Semester Deadline', description: 'Usually January 15.' },
                ], tips: ['Apply to 4–6 programs.']
            },
            {
                id: 'admission', title: 'Admission & Acceptance', icon: '🏛️', description: 'Once accepted, you receive a Zulassungsbescheid.', items: [
                    { name: 'Unconditional Admission', description: 'Full admission letter.', important: true },
                    { name: 'Enrollment & Semester Fee', description: 'Pay €150–€400 after accepting.' },
                ], tips: ['Accept promptly.']
            },
            {
                id: 'finance', title: 'Financial Proof', icon: '💰', description: 'Blocked account with €11,904 required for residence permit.', items: [
                    { name: 'Blocked Account (Sperrkonto)', description: 'Deposit €11,904. ~CAD 18,000 at current rates.', important: true },
                    { name: 'Expatrio', description: 'Popular choice.', link: 'https://www.expatrio.com', linkText: 'Open Expatrio Account' },
                    { name: 'Bank Transfer', description: 'Transfer from Canadian banks (RBC, TD, Scotiabank) via SWIFT. No restrictions.' },
                    { name: 'Scholarships', description: 'German academic scholarships available for Canadian students.', link: 'https://www.study-in-germany.de/en/plan-your-studies/financing-your-studies/scholarships_71477.php', linkText: 'Scholarships' },
                ], tips: ['No forex restrictions from Canada — transfer is straightforward.']
            },
            {
                id: 'visa', title: 'Entry & Residence Permit', icon: '✈️', description: 'Canadian citizens can enter Germany visa-free and apply for residence permit after arrival.', items: [
                    { name: 'Visa-Free Entry', description: 'Canadian citizens can enter Germany visa-free for 90 days. Apply for residence permit after arrival!', important: true },
                    { name: 'City Registration (Anmeldung)', description: 'Register at local Bürgeramt within 2 weeks.', important: true },
                    { name: 'Residence Permit', description: 'Apply at Ausländerbehörde with admission letter, blocked account, health insurance, passport.' },
                    { name: 'Processing Time', description: '2–6 weeks for residence permit.', important: true },
                ], tips: ['No embassy interview or visa needed — just arrive and register!', 'Get Anmeldung done immediately for everything else.']
            },
        ],
        currency: 'CAD',
        studentCount: '2,500+'
    },
];

export const getCountryBySlug = (slug: string) => countries.find(c => c.slug.toLowerCase() === slug.toLowerCase());
