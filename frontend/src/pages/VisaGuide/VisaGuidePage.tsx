import { useState } from 'react';
import {
    FileText, CheckCircle2, Clock, Globe, FileCheck, AlertTriangle,
    ChevronDown, ChevronRight, Download, MapPin, Calendar, DollarSign,
    Shield, Building, Plane, Users, BookOpen, HelpCircle, ExternalLink,
    MessageCircle, Lightbulb, ThumbsUp, ThumbsDown, Briefcase, Landmark, CreditCard, GraduationCap
} from 'lucide-react';
import SEO from '../../components/common/SEO';

// ==================== EMBEDDED DATA ====================

const VISA_TYPES = [
    {
        id: 'student',
        name: 'Student Visa (National Visa D)',
        description: 'For full-time degree programs at German universities',
        duration: 'Valid for 3-6 months, then convert to residence permit',
        requirements: [
            'University admission or conditional admission letter',
            'Proof of financial resources (€11,904/year)',
            'Health insurance coverage',
            'Academic qualifications'
        ],
        icon: '🎓',
        color: '#2563eb'
    },
    {
        id: 'language',
        name: 'Language Course Visa',
        description: 'For intensive German language courses (>3 months)',
        duration: 'Valid for the duration of the course (up to 1 year)',
        requirements: [
            'Enrollment confirmation for language course',
            'Proof of finances for course duration',
            'Health insurance',
            'Motivation for learning German'
        ],
        icon: '📚',
        color: '#7c3aed'
    },
    {
        id: 'studienbewerber',
        name: 'Student Applicant Visa',
        description: 'For those still waiting for university admission',
        duration: 'Valid for 3-6 months to attend interviews/exams',
        requirements: [
            'Proof of university application(s)',
            'Academic qualifications',
            'Proof of finances',
            'Clear study plan'
        ],
        icon: '📝',
        color: '#059669'
    },
    {
        id: 'schengen',
        name: 'Schengen Visa (Type C)',
        description: 'Short stays for university visits, interviews, or entrance exams',
        duration: 'Up to 90 days within 180-day period',
        requirements: [
            'Invitation from university',
            'Proof of accommodation',
            'Travel insurance',
            'Return ticket'
        ],
        icon: '✈️',
        color: '#dc2626'
    }
];

const REQUIRED_DOCUMENTS = [
    {
        category: 'Identity & Travel',
        icon: '🛂',
        items: [
            { name: 'Valid Passport', description: 'Must be valid for at least 3 months beyond your planned stay. Should have 2 blank pages.', required: true },
            { name: 'Biometric Photographs', description: '2 recent passport-size photos (35x45mm), white background, taken within last 6 months.', required: true },
            { name: 'Completed Visa Application Form', description: 'Signed and dated. Available from German embassy/consulate website.', required: true },
            { name: 'Photocopy of Passport', description: 'Copy of data page and any previous Schengen visas.', required: true }
        ]
    },
    {
        category: 'Academic Documents',
        icon: '📜',
        items: [
            { name: 'University Admission Letter', description: 'Original admission letter (Zulassungsbescheid) or conditional admission letter.', required: true },
            { name: 'Academic Certificates', description: 'High school diploma, bachelor\'s degree, transcripts. Must be Apostille-certified or legalized.', required: true },
            { name: 'Language Proficiency Certificate', description: 'TestDaF, DSH, Goethe-Zertifikat for German; IELTS/TOEFL for English-taught programs.', required: true },
            { name: 'CV/Resume', description: 'Tabular format preferred (German style). Include education and work history.', required: true },
            { name: 'Motivation Letter', description: 'Explain why you chose Germany and this specific program.', required: false }
        ]
    },
    {
        category: 'Financial Proof',
        icon: '💰',
        items: [
            { name: 'Blocked Account (Sperrkonto)', description: 'Minimum €11,904 for one year (€992/month). Most common: Expatrio, Fintiba, Deutsche Bank.', required: true },
            { name: 'Scholarship Letter', description: 'If you have a scholarship, official letter stating amount and duration.', required: false },
            { name: 'Bank Statements', description: 'Last 3-6 months of statements showing sufficient funds.', required: false },
            { name: 'Sponsor Declaration', description: 'If sponsored: Verpflichtungserklärung (formal obligation) from German resident.', required: false }
        ]
    },
    {
        category: 'Insurance',
        icon: '🏥',
        items: [
            { name: 'Health Insurance', description: 'Travel insurance for visa application. Public health insurance (TK, AOK, Barmer) required after arrival.', required: true },
            { name: 'Travel Insurance', description: 'Coverage of at least €30,000 for the Schengen area until German insurance begins.', required: true }
        ]
    }
];

const APPLICATION_STEPS = [
    {
        step: 1,
        title: 'Get University Admission',
        timeline: '8-12 weeks before',
        description: 'Secure your admission letter (Zulassungsbescheid) from a German university or receive conditional admission.',
        tips: [
            'Apply to multiple universities to increase chances',
            'Check if your country requires Uni-assist for application processing',
            'Keep digital and physical copies of all documents'
        ],
        icon: Building
    },
    {
        step: 2,
        title: 'Gather Required Documents',
        timeline: '6-8 weeks before',
        description: 'Collect and prepare all required documents. Get academic documents apostilled/legalized as required.',
        tips: [
            'Start early - document legalization can take weeks',
            'Get official translations if documents are not in German/English',
            'Make multiple copies of everything'
        ],
        icon: FileText
    },
    {
        step: 3,
        title: 'Open Blocked Account & Get Insurance',
        timeline: '4-6 weeks before',
        description: 'Open a Sperrkonto (blocked account) with €11,904 and arrange health/travel insurance.',
        tips: [
            'Expatrio and Fintiba are popular digital options',
            'Account confirmation letter takes 2-5 business days',
            'Compare insurance options for best coverage'
        ],
        icon: DollarSign
    },
    {
        step: 4,
        title: 'Book Embassy Appointment',
        timeline: '3-4 weeks before',
        description: 'Schedule your visa interview at the German embassy or consulate in your country.',
        tips: [
            'Book as early as possible - slots fill up quickly',
            'Some countries have long waiting times (2-3 months)',
            'Check if VFS Global handles applications in your country'
        ],
        icon: Calendar
    },
    {
        step: 5,
        title: 'Attend Visa Interview',
        timeline: 'Appointment day',
        description: 'Attend your visa interview with all original documents. Be prepared to answer questions about your study plans.',
        tips: [
            'Arrive 15-30 minutes early',
            'Dress professionally',
            'Be confident and honest with your answers',
            'Bring extra copies of all documents'
        ],
        icon: Users
    },
    {
        step: 6,
        title: 'Wait for Processing',
        timeline: '4-6 weeks after interview',
        description: 'The embassy will process your application. Processing times vary by country and season.',
        tips: [
            'Do not book non-refundable flights until visa is approved',
            'You can track your application status online in some countries',
            'Contact embassy only if waiting longer than stated processing time'
        ],
        icon: Clock
    },
    {
        step: 7,
        title: 'Receive Visa & Travel',
        timeline: 'After approval',
        description: 'Collect your visa and prepare for your journey to Germany.',
        tips: [
            'Check visa validity dates carefully',
            'Book accommodation before arrival',
            'Carry all important documents in hand luggage'
        ],
        icon: Plane
    }
];

const AFTER_ARRIVAL_STEPS = [
    {
        title: 'City Registration (Anmeldung)',
        deadline: 'Within 14 days',
        description: 'Register your address at the local Bürgeramt (Citizens\' Office). This is mandatory for everyone living in Germany.',
        documents: ['Passport with visa', 'Rental contract or landlord confirmation (Wohnungsgeberbestätigung)', 'Anmeldung form'],
        tips: ['Book appointment online in advance', 'Some cities have long waiting times'],
        priority: 'high'
    },
    {
        title: 'Open German Bank Account',
        deadline: 'First 2 weeks',
        description: 'Open a German bank account (Girokonto) for receiving your blocked account funds and paying rent.',
        documents: ['Passport', 'City registration confirmation', 'Student ID or enrollment certificate'],
        tips: ['N26, DKB, and Commerzbank are student-friendly', 'Online banks have faster account opening'],
        priority: 'high'
    },
    {
        title: 'Health Insurance Activation',
        deadline: 'Before university enrollment',
        description: 'Activate your public health insurance (TK, AOK, Barmer, etc.) or confirm private insurance acceptance.',
        documents: ['Passport', 'University admission letter', 'City registration'],
        tips: ['Public insurance costs ~€115/month for students under 30', 'Get insurance confirmation letter for enrollment'],
        priority: 'high'
    },
    {
        title: 'University Enrollment (Immatrikulation)',
        deadline: 'Per university deadline',
        description: 'Complete your enrollment at the university with all required documents.',
        documents: ['Admission letter', 'Health insurance confirmation', 'Passport', 'Academic certificates', 'Semester fee payment receipt'],
        tips: ['Check exact deadline on your admission letter', 'Get your student ID card here'],
        priority: 'high'
    },
    {
        title: 'Residence Permit (Aufenthaltstitel)',
        deadline: 'Within 3 months',
        description: 'Apply for your residence permit at the Ausländerbehörde (Foreigners\' Authority) before your visa expires.',
        documents: ['Passport with visa', 'City registration', 'Biometric photos', 'Health insurance', 'Bank statements', 'University enrollment', 'Blocked account proof'],
        tips: ['Book appointment immediately after arrival - waiting times can be months', 'Costs €100 for first issuance'],
        priority: 'critical'
    }
];

const FAQ_ITEMS = [
    {
        question: 'How long does the German student visa process take?',
        answer: 'Processing typically takes 4-6 weeks after the interview, but can extend to 8-12 weeks during peak seasons (July-September). Some countries have longer processing times. Always apply at least 3 months before your intended travel date.'
    },
    {
        question: 'What is a blocked account (Sperrkonto) and how does it work?',
        answer: 'A blocked account is a special German bank account where you deposit €11,904 (as of 2025) to prove you can financially support yourself for one year. Each month, ~€992 is "unblocked" for your use. Popular providers include Expatrio, Fintiba, and Deutsche Bank. The account must be opened before applying for your visa.'
    },
    {
        question: 'Can I work while studying in Germany?',
        answer: 'Yes! Non-EU students can work 120 full days or 240 half days per year without special permission. Student jobs (HiWi, tutoring) often don\'t count toward this limit. The minimum wage is €12.82/hour (2025). Working more requires Ausländerbehörde approval.'
    },
    {
        question: 'What if my visa application is rejected?',
        answer: 'You have the right to appeal (Remonstration) within one month of rejection. Common rejection reasons: insufficient finances, unclear study motivation, or missing documents. You can also reapply with a stronger application after addressing the issues.'
    },
    {
        question: 'Do I need to know German to get a student visa?',
        answer: 'Not necessarily. For English-taught programs, you need English proficiency (IELTS 6.0-6.5 or TOEFL 80-90 typically). For German-taught programs, you need B2/C1 level (TestDaF 4x4, DSH-2, or equivalent). Some programs accept conditional admission with language course requirement.'
    },
    {
        question: 'How do I extend my residence permit?',
        answer: 'Apply for extension at the Ausländerbehörde 2-3 months before expiry. You\'ll need: proof of academic progress, continued enrollment, sufficient finances, and valid health insurance. Extensions are granted in 1-2 year increments. Costs approximately €93-100.'
    },
    {
        question: 'Can I travel within Europe with a German student visa?',
        answer: 'Once you have your residence permit (Aufenthaltstitel), you can travel freely within the Schengen area for up to 90 days in any 180-day period. Your initial national visa (Type D) also allows Schengen travel while valid.'
    },
    {
        question: 'What happens if I change universities in Germany?',
        answer: 'You must inform the Ausländerbehörde about the change. If switching to a completely different field of study, you may need approval. Changing universities within the same field is generally straightforward but must be reported.'
    }
];

const EMBASSY_INFO = [
    { country: 'India', cities: ['New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata'], waitTime: '4-8 weeks', note: 'VFS Global handles applications' },
    { country: 'Pakistan', cities: ['Islamabad', 'Karachi'], waitTime: '6-10 weeks', note: 'High demand periods in summer' },
    { country: 'Bangladesh', cities: ['Dhaka'], waitTime: '6-8 weeks', note: 'Book appointments early' },
    { country: 'Nigeria', cities: ['Lagos', 'Abuja'], waitTime: '4-8 weeks', note: 'VFS Global handles applications' },
    { country: 'China', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Chengdu', 'Shenyang'], waitTime: '2-4 weeks', note: 'Generally faster processing' },
    { country: 'Vietnam', cities: ['Hanoi', 'Ho Chi Minh City'], waitTime: '3-6 weeks', note: 'Moderate waiting times' },
    { country: 'Indonesia', cities: ['Jakarta'], waitTime: '3-5 weeks', note: 'Book well in advance' },
    { country: 'Turkey', cities: ['Ankara', 'Istanbul', 'Izmir'], waitTime: '2-4 weeks', note: 'Relatively quick processing' }
];

const INTERVIEW_QUESTIONS = [
    {
        category: 'Study Plans',
        icon: '🎓',
        color: 'blue',
        questions: [
            {
                question: 'Why do you want to study in Germany?',
                sampleAnswer: 'Germany offers world-class education with tuition-free universities and strong industry connections. My chosen program at [University] is ranked among the top in Europe for [field], and Germany\'s focus on research and practical training aligns perfectly with my career goals.',
                tips: ['Be specific about Germany, not just "Europe"', 'Mention the university and program by name', 'Connect to your career aspirations'],
                avoid: ['Generic answers like "it\'s cheap"', 'Comparing negatively to your home country']
            },
            {
                question: 'Why did you choose this specific university and program?',
                sampleAnswer: 'I chose [University] because of its strong reputation in [field], particularly its research focus on [specific area]. The curriculum includes [specific courses/projects] that directly relate to my interest in [topic]. The university\'s partnerships with companies like [example] also offer excellent internship opportunities.',
                tips: ['Research your program thoroughly', 'Mention specific professors, labs, or projects', 'Show you\'ve done your homework'],
                avoid: ['Saying you chose it because it was easy to get into', 'Not knowing basic facts about the program']
            },
            {
                question: 'What are your plans after completing your studies?',
                sampleAnswer: 'After completing my Master\'s, I plan to gain 2-3 years of work experience in Germany to apply my knowledge in a practical setting. Long-term, I aim to [specific goal] which could involve returning to my home country to contribute to [industry/development] or continuing my career internationally.',
                tips: ['Show clear career goals', 'It\'s okay to mention staying in Germany for work', 'Connect your studies to your career path'],
                avoid: ['Saying you\'ll definitely stay forever', 'Having no clear plans at all']
            },
            {
                question: 'How does this program relate to your previous education?',
                sampleAnswer: 'My Bachelor\'s in [field] at [University] gave me a strong foundation in [skills/knowledge]. This Master\'s program builds on that by allowing me to specialize in [area]. My thesis on [topic] and courses in [subjects] have prepared me for the advanced curriculum.',
                tips: ['Draw clear connections between past and future studies', 'Mention relevant projects or coursework', 'Explain any field changes logically'],
                avoid: ['Making it seem like a random choice', 'Not remembering what you studied before']
            }
        ]
    },
    {
        category: 'Financial Situation',
        icon: '💰',
        color: 'green',
        questions: [
            {
                question: 'How will you finance your studies in Germany?',
                sampleAnswer: 'I have opened a blocked account with [Provider] containing €11,904 to cover my first year\'s living expenses. Additionally, [my parents/scholarship/savings] will support me. I\'ve budgeted approximately €900/month for rent, food, and other expenses, which is manageable in [city].',
                tips: ['Have exact figures ready', 'Bring your blocked account confirmation', 'Show you understand German living costs'],
                avoid: ['Being vague about your finances', 'Saying someone else handles the money']
            },
            {
                question: 'Who is sponsoring your education and what do they do?',
                sampleAnswer: 'My parents are sponsoring my education. My father works as [profession] at [company] and my mother is [profession]. They have the financial capacity to support me, as evidenced by the bank statements I\'ve provided showing consistent income and savings.',
                tips: ['Know your sponsor\'s occupation and income', 'Have supporting documents ready', 'Be prepared to explain the source of funds'],
                avoid: ['Not knowing details about your sponsor', 'Inconsistencies with your documents']
            },
            {
                question: 'Do you plan to work while studying?',
                sampleAnswer: 'I may take up a part-time job or student assistant position to gain practical experience, but my priority is my studies. I know international students can work 120 full days or 240 half days per year. I have sufficient funds so working is not a necessity but an opportunity for professional development.',
                tips: ['Know the work regulations (120/240 days)', 'Emphasize studies come first', 'Frame work as learning, not necessity'],
                avoid: ['Saying you need to work to survive', 'Not knowing the work restrictions']
            }
        ]
    },
    {
        category: 'Language & Preparation',
        icon: '📚',
        color: 'purple',
        questions: [
            {
                question: 'Do you speak German? How will you manage daily life?',
                sampleAnswer: 'I currently have [A1/A2/B1] level German and am taking lessons to improve. My program is taught in English, but I understand German is important for daily life. I plan to take intensive German courses during my studies and practice with local students and conversation partners.',
                tips: ['Be honest about your level', 'Show willingness to learn', 'Mention any German courses you\'re taking'],
                avoid: ['Lying about your German level', 'Showing no interest in learning German']
            },
            {
                question: 'Where will you live in Germany?',
                sampleAnswer: 'I have applied for student dormitory housing through [Studentenwerk] and am also looking at shared apartments (WG) near the university. For my first weeks, I have arranged temporary accommodation at [hostel/Airbnb/contact]. Average rent in [city] is around €[amount]/month, which fits my budget.',
                tips: ['Have a concrete plan, even if temporary', 'Know typical rent prices in your city', 'Show you\'ve researched housing options'],
                avoid: ['Having no plan at all', 'Unrealistic expectations about housing costs']
            },
            {
                question: 'What do you know about Germany and German culture?',
                sampleAnswer: 'Germany is known for its engineering excellence, punctuality, and efficiency. I\'ve researched that German culture values directness and planning. I\'m aware of practical aspects like the importance of cash payments, recycling systems (Pfand), and registering my address (Anmeldung) upon arrival.',
                tips: ['Show genuine interest in the culture', 'Mention practical knowledge', 'Be respectful and curious'],
                avoid: ['Stereotypes or offensive generalizations', 'Knowing nothing about Germany']
            }
        ]
    },
    {
        category: 'Personal Background',
        icon: '👤',
        color: 'amber',
        questions: [
            {
                question: 'Tell me about yourself and your background.',
                sampleAnswer: 'I\'m [Name] from [City, Country]. I completed my Bachelor\'s in [field] from [University] with [GPA/distinction]. I have [X years] of work/internship experience in [field] at [companies]. My passion for [area] led me to pursue further specialization in Germany.',
                tips: ['Keep it concise (1-2 minutes)', 'Focus on education and career', 'Connect to your study plans'],
                avoid: ['Long personal stories', 'Irrelevant information']
            },
            {
                question: 'Have you traveled abroad before?',
                sampleAnswer: 'Yes, I have traveled to [countries] for [purpose]. These experiences taught me to adapt to new cultures and environments. / No, this will be my first time abroad, but I have thoroughly researched what to expect and am confident in my ability to adapt.',
                tips: ['Be honest about your travel history', 'Highlight adaptability', 'Show maturity and preparation'],
                avoid: ['Mentioning visa rejections unless asked', 'Seeming unprepared for living abroad']
            }
        ]
    }
];

const INTERVIEW_TIPS = [
    { tip: 'Arrive 15-30 minutes early', icon: '⏰' },
    { tip: 'Dress professionally (business casual)', icon: '👔' },
    { tip: 'Bring all original documents + copies', icon: '📁' },
    { tip: 'Be honest - don\'t memorize scripted answers', icon: '💬' },
    { tip: 'Make eye contact and speak clearly', icon: '👁️' },
    { tip: 'Stay calm - nervousness is normal', icon: '😌' },
    { tip: 'Know your documents inside out', icon: '📋' },
    { tip: 'Turn off your phone completely', icon: '📱' }
];

// ==================== COMPONENT ====================

export default function VisaGuidePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedStep, setExpandedStep] = useState<number | null>(1);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [expandedDocCategory, setExpandedDocCategory] = useState<string | null>('Identity & Travel');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Globe },
        { id: 'steps', label: 'Step-by-Step', icon: CheckCircle2 },
        { id: 'documents', label: 'Documents', icon: FileCheck },
        { id: 'arrival', label: 'After Arrival', icon: MapPin },
        { id: 'rights', label: 'Rights & Benefits', icon: Briefcase },
        { id: 'faq', label: 'FAQ', icon: HelpCircle }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab />;
            case 'steps':
                return <StepsTab />;
            case 'documents':
                return <DocumentsTab />;
            case 'arrival':
                return <ArrivalTab />;
            case 'rights':
                return <RightsTab />;
            case 'faq':
                return <FaqTab />;
            default:
                return <OverviewTab />;
        }
    };

    // ==================== TAB COMPONENTS ====================

    const OverviewTab = () => (
        <div className="space-y-12">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard icon="📋" label="Processing Time" value="4-8 weeks" subtext="Average duration" />
                <StatCard icon="💰" label="Blocked Account" value="€11,904" subtext="Minimum for 1 year" />
                <StatCard icon="📅" label="Apply Early" value="3 months" subtext="Before travel date" />
                <StatCard icon="✅" label="Success Rate" value="~85%" subtext="With complete docs" />
            </div>

            {/* Important Notice */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-900 dark:text-amber-400 text-lg mb-2">Important: Start Early!</h3>
                        <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                            The German student visa process can take 3-4 months from start to finish. Embassy appointment slots
                            often have waiting times of 4-8 weeks. We strongly recommend starting your visa application process
                            immediately after receiving your university admission letter.
                        </p>
                    </div>
                </div>
            </div>

            {/* Visa Types */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Types of German Student Visas</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {VISA_TYPES.map((visa) => (
                        <div
                            key={visa.id}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                    style={{ backgroundColor: visa.color + '15' }}
                                >
                                    {visa.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">
                                        {visa.name}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{visa.description}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-surface-900 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{visa.duration}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Key Requirements</p>
                                {visa.requirements.map((req, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <span>{req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* EU/EEA Notice */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-900/40">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-400 text-lg mb-2">EU/EEA & Swiss Citizens</h3>
                        <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            Citizens of EU/EEA countries and Switzerland do <strong>not</strong> need a visa to study in Germany.
                            You have the right to live and study freely. You only need to register your address (Anmeldung)
                            within 14 days of moving to Germany.
                        </p>
                    </div>
                </div>
            </div>

            {/* Embassy Information */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                        <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Embassy Wait Times by Country</h2>
                </div>

                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-surface-900 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Country</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cities with German Mission</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg. Wait Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {EMBASSY_INFO.map((embassy, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:bg-surface-900 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{embassy.country}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{embassy.cities.join(', ')}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                                {embassy.waitTime}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{embassy.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const StepsTab = () => (
        <div className="space-y-8">
            {/* Timeline Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative">
                    <h2 className="text-2xl lg:text-3xl font-bold mb-3">Your Visa Application Journey</h2>
                    <p className="text-blue-100 max-w-2xl">
                        Follow these 7 steps to successfully obtain your German student visa.
                        The entire process typically takes 3-4 months from start to finish.
                    </p>
                </div>
            </div>

            {/* Steps Accordion */}
            <div className="space-y-4">
                {APPLICATION_STEPS.map((step) => {
                    const Icon = step.icon;
                    const isExpanded = expandedStep === step.step;

                    return (
                        <div
                            key={step.step}
                            className={`bg-white dark:bg-surface-800 rounded-2xl border transition-all duration-300 ${isExpanded ? 'shadow-lg border-blue-200 dark:border-blue-800' : 'shadow-sm dark:shadow-surface-900/50 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <button
                                onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                                className="w-full p-6 flex items-center gap-4 text-left"
                            >
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-sm font-bold ${isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                            STEP {step.step}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {step.timeline}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{step.title}</h3>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="px-6 pb-6 pt-0 animate-fadeIn">
                                    <div className="ml-18 pl-4 border-l-2 border-blue-100 dark:border-blue-900/30">
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">{step.description}</p>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wide mb-3">💡 Pro Tips</p>
                                            <ul className="space-y-2">
                                                {step.tips.map((tip, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                                        <span>{tip}</span>
                                                    </li>
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

            {/* Quick Timeline Visual */}
            <div className="bg-gray-50 dark:bg-surface-900 rounded-2xl p-6 lg:p-8">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6 text-center">Timeline at a Glance</h3>
                <div className="flex flex-wrap justify-center gap-2 lg:gap-0 lg:justify-between items-center">
                    {APPLICATION_STEPS.map((step, idx) => (
                        <div key={step.step} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                    {step.step}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-20">{step.title.split(' ').slice(0, 2).join(' ')}</p>
                            </div>
                            {idx < APPLICATION_STEPS.length - 1 && (
                                <ChevronRight className="w-5 h-5 text-gray-300 mx-2 hidden lg:block" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Interview Preparation Section */}
            <InterviewPreparationSection />
        </div>
    );

    const DocumentsTab = () => (
        <div className="space-y-8">
            {/* Download Checklist CTA */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-6 lg:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                        <Download className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">Document Checklist</h3>
                        <p className="text-emerald-100">Keep track of your documents with our printable checklist</p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-white dark:bg-surface-800 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-2 shrink-0">
                    <Download className="w-5 h-5" />
                    Download PDF
                </button>
            </div>

            {/* Document Categories */}
            <div className="space-y-4">
                {REQUIRED_DOCUMENTS.map((category) => {
                    const isExpanded = expandedDocCategory === category.category;

                    return (
                        <div
                            key={category.category}
                            className={`bg-white dark:bg-surface-800 rounded-2xl border transition-all duration-300 ${isExpanded ? 'shadow-lg border-blue-200 dark:border-blue-800' : 'shadow-sm dark:shadow-surface-900/50 border-gray-100 dark:border-gray-700'
                                }`}
                        >
                            <button
                                onClick={() => setExpandedDocCategory(isExpanded ? null : category.category)}
                                className="w-full p-6 flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-2xl shrink-0">
                                    {category.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{category.category}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{category.items.length} documents</p>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="px-6 pb-6 space-y-3 animate-fadeIn">
                                    {category.items.map((doc, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-xl border ${doc.required
                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                                                : 'bg-gray-50 dark:bg-surface-900 border-gray-100 dark:border-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${doc.required ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-200 dark:bg-surface-700'
                                                    }`}>
                                                    {doc.required ? (
                                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                                    ) : (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h4>
                                                        {doc.required && (
                                                            <span className="text-xs font-medium text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{doc.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Blocked Account Providers */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 lg:p-8 border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-xl">Blocked Account Providers</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Recommended services to open your Sperrkonto</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        { name: 'Expatrio', fee: '€49', time: '1-3 days', highlight: true },
                        { name: 'Fintiba', fee: '€89', time: '1-2 days', highlight: false },
                        { name: 'Deutsche Bank', fee: '€150', time: '5-10 days', highlight: false }
                    ].map((provider) => (
                        <div
                            key={provider.name}
                            className={`bg-white dark:bg-surface-800 rounded-xl p-5 border-2 transition-all ${provider.highlight
                                ? 'border-indigo-300 shadow-lg'
                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {provider.highlight && (
                                <span className="inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-1 rounded mb-3">
                                    Most Popular
                                </span>
                            )}
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{provider.name}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Setup Fee</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{provider.fee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Confirmation</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{provider.time}</span>
                                </div>
                            </div>
                            <a
                                href="#"
                                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-surface-600 transition-colors"
                            >
                                Learn More <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ArrivalTab = () => (
        <div className="space-y-8">
            {/* Arrival Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mb-32" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <Plane className="w-8 h-8" />
                        <span className="text-teal-200 font-medium">Welcome to Germany!</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-3">What to Do After Arrival</h2>
                    <p className="text-teal-100 max-w-2xl">
                        Congratulations on arriving in Germany! Here are the essential steps you need to complete
                        in your first few weeks to ensure a smooth transition.
                    </p>
                </div>
            </div>

            {/* Priority Tasks */}
            <div className="space-y-4">
                {AFTER_ARRIVAL_STEPS.map((step, idx) => (
                    <div
                        key={idx}
                        className={`bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-lg border-l-4 ${step.priority === 'critical'
                            ? 'border-l-red-500'
                            : 'border-l-amber-500'
                            }`}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            <div className="lg:w-2/3">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{step.title}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${step.priority === 'critical'
                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                        }`}>
                                        <Clock className="w-3 h-3 mr-1" />
                                        {step.deadline}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">{step.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    {step.documents.map((doc, docIdx) => (
                                        <span
                                            key={docIdx}
                                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                                        >
                                            <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                            {doc}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wide mb-2">💡 Tips</p>
                                    <ul className="space-y-1.5">
                                        {step.tips.map((tip, tipIdx) => (
                                            <li key={tipIdx} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                                <span className="text-blue-400 dark:text-blue-500">•</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* First Week Checklist */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-surface-800 dark:to-surface-800 rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-6 flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    First Week Survival Checklist
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {[
                        'Get a German SIM card (Aldi, Lidl, O2)',
                        'Open bank account or withdraw from blocked account',
                        'Buy public transport ticket or Deutschland-Ticket',
                        'Get city registration appointment (Anmeldung)',
                        'Find local supermarkets (Aldi, Lidl, REWE)',
                        'Locate your university campus',
                        'Join student welcome events',
                        'Set up home internet (if not included)'
                    ].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:border-gray-700 transition-colors cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const RightsTab = () => (
        <div className="space-y-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="w-8 h-8" />
                        <span className="text-cyan-200 font-medium">Post-Study Opportunities</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-3">Rights, Work & Citizenship</h2>
                    <p className="text-cyan-100 max-w-2xl">
                        Germany offers some of the most generous post-study work rights and pathways to citizenship for international graduates.
                    </p>
                </div>
            </div>

            {/* Post-Study Work Visa */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                        <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">18-Month Job Seeker Visa</h3>
                        <p className="text-gray-500 dark:text-gray-400">Upon graduating from a German university</p>
                    </div>
                </div>
                <div className="prose prose-blue max-w-none text-gray-600 dark:text-gray-400">
                    <p>
                        After completing your studies, you can apply for an 18-month residence permit to look for a job related to your field of study. During these 18 months, you can work any job (even casual work) to support yourself.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-4 mt-4 list-none pl-0">
                        <li className="flex items-start gap-3 bg-gray-50 dark:bg-surface-900 p-4 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span>18 months to find a qualified job</span>
                        </li>
                        <li className="flex items-start gap-3 bg-gray-50 dark:bg-surface-900 p-4 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span>Unrestricted work permission during search</span>
                        </li>
                        <li className="flex items-start gap-3 bg-gray-50 dark:bg-surface-900 p-4 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span>Apply at local Aliens Authority (Ausländerbehörde)</span>
                        </li>
                        <li className="flex items-start gap-3 bg-gray-50 dark:bg-surface-900 p-4 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span>Convert to Blue Card or Work Permit once hired</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Path to PR and Citizenship */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Permanent Residence */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                            <Landmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Permanent Residence</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                        International graduates from German universities can get a Settlement Permit (Niederlassungserlaubnis) much faster than others.
                    </p>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-400 mb-2 text-sm">Requirements:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                                2 years of skilled employment
                            </li>
                            <li className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                                B1 German language skills
                            </li>
                            <li className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                                Pension contributions (24 months)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Naturalization */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Citizenship (Passport)</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                        Under the new naturalization law (2024), the path to a German passport has been accelerated.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-400 mb-2 text-sm">New Rules:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                After 5 years of legal residence (previously 8)
                            </li>
                            <li className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                Fast track: 3 years (C1 German + achievements)
                            </li>
                            <li className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                Dual citizenship is now allowed
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Student Benefits */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-8 h-8 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Benefits & Discounts</h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Transport Ticket</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Most universities include a Semester Ticket or the discounted €29 Deutschland-Ticket for students.</p>
                    </div>
                    <div className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Health Insurance</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Students under 30 pay a discounted rate (~€120/mo) for public health insurance (TK, AOK).</p>
                    </div>
                    <div className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Working Rights</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Work up to 20h/week during semester (Werkstudent privilege: pay mostly no social contributions).</p>
                    </div>
                    <div className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Tech Discounts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Apple Education Store, Samsung Student, Microsoft Office 365 (usually free via Uni).</p>
                    </div>
                    <div className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Shopping & Streaming</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Amazon Prime Student (50% off), Spotify Premium Student, UniDays discounts.</p>
                    </div>
                    <div className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-sm dark:shadow-surface-900/50 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Culture & Leisure</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Reduced entry fees for museums, theaters, cinemas, and swimming pools with Student ID.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const FaqTab = () => (
        <div className="space-y-8">
            {/* FAQ Header */}
            <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-4">
                    <HelpCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">Frequently Asked Questions</h2>
                <p className="text-gray-600 dark:text-gray-400">Find answers to the most common questions about German student visas</p>
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-3xl mx-auto space-y-3">
                {FAQ_ITEMS.map((faq, idx) => {
                    const isExpanded = expandedFaq === idx;

                    return (
                        <div
                            key={idx}
                            className={`bg-white dark:bg-surface-800 rounded-xl border transition-all duration-300 ${isExpanded ? 'shadow-lg border-purple-200 dark:border-purple-800' : 'shadow-sm dark:shadow-surface-900/50 border-gray-100 dark:border-gray-700'
                                }`}
                        >
                            <button
                                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                                className="w-full p-5 flex items-center gap-4 text-left"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                    }`}>
                                    <span className="font-bold text-sm">{idx + 1}</span>
                                </div>
                                <span className="flex-1 font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="px-5 pb-5 animate-fadeIn">
                                    <div className="pl-12">
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Still Have Questions */}
            <div className="max-w-3xl mx-auto mt-12">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-8 text-white text-center">
                    <h3 className="font-bold text-xl mb-3">Still Have Questions?</h3>
                    <p className="text-purple-100 mb-6">
                        Every visa situation is unique. For specific questions about your case,
                        we recommend contacting your local German embassy or consulate directly.
                    </p>
                    <a
                        href="https://www.auswaertiges-amt.de/en/visa-service"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-surface-800 text-purple-600 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-surface-700 transition-colors"
                    >
                        Visit German Foreign Office <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );

    // ==================== HELPER COMPONENTS ====================

    const StatCard = ({ icon, label, value, subtext }: { icon: string; label: string; value: string; subtext: string }) => (
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">{icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className="text-sm text-gray-400">{subtext}</p>
        </div>
    );

    const InterviewPreparationSection = () => {
        const [expandedCategory, setExpandedCategory] = useState<string | null>('Study Plans');
        const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

        const colorMap: { [key: string]: { bg: string; text: string; border: string; light: string } } = {
            blue: { bg: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/30', light: 'bg-blue-50 dark:bg-blue-900/20' },
            green: { bg: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/30', light: 'bg-emerald-50 dark:bg-emerald-900/20' },
            purple: { bg: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/30', light: 'bg-purple-50 dark:bg-purple-900/20' },
            amber: { bg: 'bg-amber-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/30', light: 'bg-amber-50 dark:bg-amber-900/20' }
        };

        return (
            <div className="mt-12 space-y-8">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageCircle className="w-8 h-8" />
                            <span className="text-orange-200 font-medium">Be Prepared</span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold mb-3">Visa Interview Preparation</h2>
                        <p className="text-orange-100 max-w-2xl">
                            The visa interview is your opportunity to demonstrate your genuine intent to study in Germany.
                            Practice these common questions and know your documents inside out.
                        </p>
                    </div>
                </div>

                {/* Quick Tips Grid */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-surface-800 dark:to-surface-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Quick Interview Tips
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {INTERVIEW_TIPS.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.tip}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question Categories */}
                <div className="space-y-4">
                    {INTERVIEW_QUESTIONS.map((category) => {
                        const colors = colorMap[category.color] || colorMap.blue;
                        const isExpanded = expandedCategory === category.category;

                        return (
                            <div
                                key={category.category}
                                className={`bg-white dark:bg-surface-800 rounded-2xl border transition-all duration-300 ${isExpanded ? `shadow-lg ${colors.border}` : 'shadow-sm dark:shadow-surface-900/50 border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                <button
                                    onClick={() => {
                                        setExpandedCategory(isExpanded ? null : category.category);
                                        setExpandedQuestion(0);
                                    }}
                                    className="w-full p-6 flex items-center gap-4 text-left"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${isExpanded ? colors.bg : 'bg-gray-100 dark:bg-surface-700'} flex items-center justify-center text-2xl shrink-0 transition-colors`}>
                                        {isExpanded ? <span className="text-white text-lg">{category.icon}</span> : category.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{category.category}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{category.questions.length} common questions</p>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 space-y-4 animate-fadeIn">
                                        {category.questions.map((q, qIdx) => {
                                            const isQExpanded = expandedQuestion === qIdx;

                                            return (
                                                <div
                                                    key={qIdx}
                                                    className={`rounded-xl border transition-all ${isQExpanded ? `${colors.light} ${colors.border}` : 'bg-gray-50 dark:bg-surface-900 border-gray-100 dark:border-gray-700'
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => setExpandedQuestion(isQExpanded ? null : qIdx)}
                                                        className="w-full p-4 flex items-start gap-3 text-left"
                                                    >
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isQExpanded ? colors.bg : 'bg-gray-200 dark:bg-surface-700'
                                                            }`}>
                                                            <span className={`text-xs font-bold ${isQExpanded ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                Q{qIdx + 1}
                                                            </span>
                                                        </div>
                                                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{q.question}</span>
                                                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isQExpanded ? 'rotate-90' : ''}`} />
                                                    </button>

                                                    {isQExpanded && (
                                                        <div className="px-4 pb-4 space-y-4 animate-fadeIn">
                                                            {/* Sample Answer */}
                                                            <div className="ml-10">
                                                                <div className="bg-white dark:bg-surface-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                                        💬 Sample Answer
                                                                    </p>
                                                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic">
                                                                        "{q.sampleAnswer}"
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Tips & Avoid */}
                                                            <div className="ml-10 grid md:grid-cols-2 gap-3">
                                                                {/* Do's */}
                                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900/30">
                                                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                                        <ThumbsUp className="w-3.5 h-3.5" /> Do's
                                                                    </p>
                                                                    <ul className="space-y-1.5">
                                                                        {q.tips.map((tip, tIdx) => (
                                                                            <li key={tIdx} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                                                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                                                {tip}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                {/* Don'ts */}
                                                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                                                                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                                        <ThumbsDown className="w-3.5 h-3.5" /> Avoid
                                                                    </p>
                                                                    <ul className="space-y-1.5">
                                                                        {q.avoid.map((item, aIdx) => (
                                                                            <li key={aIdx} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                                                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                                                {item}
                                                                            </li>
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

                {/* Practice Reminder */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-surface-800 dark:to-surface-800 dark:border dark:border-gray-700 rounded-2xl p-6 text-white">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Users className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-bold text-lg mb-1">Practice Makes Perfect</h3>
                            <p className="text-violet-200 text-sm">
                                Practice your answers with friends or family. Don't memorize scripts - understand the key points
                                and express them naturally in your own words.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== MAIN RENDER ====================

    // Schema for AEO (FAQ & Article)
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_ITEMS.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Complete Guide to German Student Visas",
        "description": "Complete guide for international students on German student visa application, required documents, step-by-step process, and post-arrival registration.",
        "author": {
            "@type": "Organization",
            "name": "CampusConsult"
        },
        "publisher": {
            "@type": "Organization",
            "name": "CampusConsult",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.uniadvisorai.com/logo.png"
            }
        }
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Apply for a German Student Visa",
        "description": "Step-by-step guide to applying for a German Student Visa (National Visa D).",
        "totalTime": "P3M", // Approx 3 months
        "step": APPLICATION_STEPS.map(step => ({
            "@type": "HowToStep",
            "name": step.title,
            "text": step.description,
            "url": `https://www.uniadvisorai.com/visa-guide#step-${step.step}`,
            "itemListElement": step.tips.map(tip => ({
                "@type": "HowToDirection",
                "text": tip
            }))
        }))
    };

    const combinedSchema = {
        "@context": "https://schema.org",
        "@graph": [
            faqSchema,
            articleSchema,
            howToSchema
        ]
    };

    return (
        <>
            <SEO
                title="German Student Visa Guide 2025 — Step-by-Step Application Process | CampusConsult"
                description="Complete 2025 guide to the German student visa: required documents, Sperrkonto (blocked account), embassy interview tips, Anmeldung & residence permit — with country-specific timelines."
                keywords={['German student visa', 'study in Germany visa 2025', 'Sperrkonto', 'blocked account', 'visa application Germany', 'Anmeldung', 'residence permit', 'international students Germany']}
                schema={combinedSchema}
            />

            <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-surface-900 dark:via-surface-900 dark:to-surface-900">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                                <Plane className="w-4 h-4" />
                                <span>Visa & Immigration Guide</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                Your Complete Guide to the German Student Visa
                            </h1>
                            <p className="text-xl text-blue-100 leading-relaxed mb-8">
                                Everything you need to know about applying for a German student visa,
                                from gathering documents to settling in after arrival.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setActiveTab('steps')}
                                    className="px-6 py-3 bg-white dark:bg-surface-800 text-blue-900 dark:text-blue-100 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-surface-700 transition-colors"
                                >
                                    Start Your Journey
                                </button>
                                <button
                                    onClick={() => setActiveTab('documents')}
                                    className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                                >
                                    View Document Checklist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-16 z-30 bg-white/95 dark:bg-surface-900/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-surface-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                                            ? 'border-blue-600 text-blue-600'
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

                {/* Tab Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {renderTabContent()}
                </div>

                {/* Footer CTA */}
                <div className="bg-gray-50 dark:bg-surface-900 border-t border-gray-100 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to Start Your Application?</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                                Explore universities and programs in Germany, and take the first step toward your study abroad journey.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a
                                    href="/universities"
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Browse Universities
                                </a>
                                <a
                                    href="/programs"
                                    className="px-6 py-3 bg-white dark:bg-surface-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-surface-900 transition-colors border border-gray-200 dark:border-gray-700"
                                >
                                    Explore Programs
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add custom animation styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
}
