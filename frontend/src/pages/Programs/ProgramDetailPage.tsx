import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import novaToast from '../../components/nova/NovaToast';
import {
  ArrowLeft, ExternalLink, MapPin, Calendar, Clock, Euro, Languages,
  GraduationCap, BookOpen, FileCheck, AlertCircle, Heart, Share2,
  CheckCircle, XCircle, Loader2, Building2, Globe, Mail, Phone
} from 'lucide-react';
import { programsApi } from '../../api/programs';
import { profileApi } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import SEO from '../../components/common/SEO';
import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [applicationNotes, setApplicationNotes] = useState('');

  const { data: program, isLoading, error } = useQuery({
    queryKey: ['program', id],
    queryFn: () => programsApi.getProgram(id!),
    enabled: !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: isAuthenticated,
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data: { program_id: number; user_notes?: string }) =>
      profileApi.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      novaToast.success('Added to your tracker! You\'re one step closer.');
      setShowApplyModal(false);
    },
    onError: (error: any) => {
      if (error.response?.data?.detail?.includes('already')) {
        novaToast.error('You already have this in your tracker!');
      } else {
        novaToast.error('Couldn\'t add the application. Please try again.');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Program Not Found</h2>
          <p className="text-slate-600 dark:text-surface-300 mb-4">The program you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/programs')}>Browse Programs</Button>
        </div>
      </div>
    );
  }

  // Check requirements against profile
  const checkRequirements = () => {
    if (!profile) return null;

    const checks = [];

    // Helper to check if user has at least a Bachelor's degree (Bachelor, Masters, or PhD all count)
    const hasBachelorOrHigher = (degree: string | undefined) => {
      if (!degree) return false;
      const lowerDegree = degree.toLowerCase();
      return lowerDegree.includes('bachelor') ||
        lowerDegree.includes('master') ||
        lowerDegree.includes('phd') ||
        lowerDegree.includes('doctorate');
    };

    // Helper to check if user has at least a Master's degree
    const hasMastersOrHigher = (degree: string | undefined) => {
      if (!degree) return false;
      const lowerDegree = degree.toLowerCase();
      return lowerDegree.includes('master') ||
        lowerDegree.includes('phd') ||
        lowerDegree.includes('doctorate');
    };

    // Degree type check
    if (program.degree_type === 'Masters' && profile.current_degree) {
      checks.push({
        label: 'Bachelor\'s Degree',
        met: hasBachelorOrHigher(profile.current_degree),
        note: profile.current_degree
      });
    }

    if (program.degree_type === 'PhD' && profile.current_degree) {
      checks.push({
        label: 'Master\'s Degree',
        met: hasMastersOrHigher(profile.current_degree),
        note: profile.current_degree
      });
    }

    // Language check
    if (program.teaching_language) {
      const langs = Array.isArray(program.teaching_language)
        ? program.teaching_language
        : [program.teaching_language];

      if (langs.some(l => l?.toLowerCase().includes('english'))) {
        const englishMet = ['B2', 'C1', 'C2'].includes(profile.english_level || '');
        checks.push({
          label: 'English Proficiency (B2+)',
          met: englishMet,
          note: profile.english_level ? `Your level: ${profile.english_level}` : 'Not specified'
        });
      }

      if (langs.some(l => l?.toLowerCase().includes('german'))) {
        const germanMet = ['B2', 'C1', 'C2'].includes(profile.german_level || '');
        checks.push({
          label: 'German Proficiency (B2+)',
          met: germanMet,
          note: profile.german_level ? `Your level: ${profile.german_level}` : 'Not specified'
        });
      }
    }

    return checks;
  };

  // Full analysis for modal
  const getFullAnalysis = () => {
    if (!profile) return [];

    // Helper to check if user has at least a Bachelor's degree
    const hasBachelorOrHigher = (degree: string | undefined) => {
      if (!degree) return false;
      const lowerDegree = degree.toLowerCase();
      return lowerDegree.includes('bachelor') ||
        lowerDegree.includes('master') ||
        lowerDegree.includes('phd') ||
        lowerDegree.includes('doctorate');
    };

    // Helper to check if user has at least a Master's degree  
    const hasMastersOrHigher = (degree: string | undefined) => {
      if (!degree) return false;
      const lowerDegree = degree.toLowerCase();
      return lowerDegree.includes('master') ||
        lowerDegree.includes('phd') ||
        lowerDegree.includes('doctorate');
    };

    const analysis = [];

    // Degree Level - with proper hierarchy
    let degreeStatus: 'match' | 'gap' | 'missing' = 'missing';
    if (program.degree_type === 'Masters') {
      degreeStatus = hasBachelorOrHigher(profile.current_degree) ? 'match' :
        profile.current_degree ? 'gap' : 'missing';
    } else if (program.degree_type === 'PhD') {
      degreeStatus = hasMastersOrHigher(profile.current_degree) ? 'match' :
        profile.current_degree ? 'gap' : 'missing';
    } else if (program.degree_type === 'Bachelor') {
      degreeStatus = 'match'; // Everyone can apply for Bachelor
    }

    analysis.push({
      criteria: 'Degree Level',
      yours: profile.current_degree || 'Not specified',
      required: program.degree_type === 'Masters' ? 'Bachelor\'s or higher required' :
        program.degree_type === 'PhD' ? 'Master\'s or higher required' : 'High School',
      status: degreeStatus
    });

    // Field of Study
    analysis.push({
      criteria: 'Field of Study',
      yours: profile.field_of_study || 'Not specified',
      required: program.program_name || 'Related field',
      status: profile.field_of_study ? 'match' : 'missing'
    });

    // GPA
    const gpaRequired = program.academic_admission_requirements?.match(/(\d\.?\d?)\s*(GPA|grade)/i);
    analysis.push({
      criteria: 'GPA / CGPA',
      yours: profile.cgpa ? `${profile.cgpa}/${profile.gpa_scale || '4.0'}` : 'Not specified',
      required: gpaRequired ? `${gpaRequired[1]} minimum` : 'Varies',
      status: !profile.cgpa ? 'missing' :
        gpaRequired && parseFloat(String(profile.cgpa)) < parseFloat(gpaRequired[1]) ? 'gap' : 'match'
    });

    // English Level
    const englishRequired = program.language_requirements?.match(/IELTS\s*(\d\.?\d?)/i) ||
      program.language_requirements?.match(/TOEFL\s*(\d+)/i);
    const englishLevelMap: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    analysis.push({
      criteria: 'English Level',
      yours: profile.english_level || 'Not specified',
      required: englishRequired ? `IELTS ${englishRequired[1]}+` : 'B2+ typically',
      status: !profile.english_level ? 'missing' :
        (englishLevelMap[profile.english_level] || 0) >= 4 ? 'match' : 'gap'
    });

    // German Level  
    const germanRequired = program.language_requirements?.toLowerCase().includes('german');
    const germanLevel = profile.german_level;
    analysis.push({
      criteria: 'German Level',
      yours: germanLevel || 'Not specified',
      required: germanRequired ? 'B2+ typically' : 'Not required',
      status: !germanRequired ? 'match' :
        !germanLevel ? 'missing' :
          (englishLevelMap[germanLevel] || 0) >= 4 ? 'match' : 'gap'
    });

    return analysis;
  };

  const requirements = checkRequirements();


  const degreeColors: Record<string, string> = {
    'Bachelor': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Masters': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'PhD': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  // SEO Schema
  const educationalProgramSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "name": program.program_name,
    "description": program.description_content?.substring(0, 300) || `${program.program_name} at ${program.university_name}`,
    "provider": {
      "@type": "CollegeOrUniversity",
      "name": program.university_name,
      "address": program.city
    },
    "educationalCredentialAwarded": program.degree_type,
    "timeToComplete": program.programme_duration ? `P${program.programme_duration.match(/\\d/)?.[0] || '1'}Y` : "P1Y",
    "applicationDeadline": program.application_deadline,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Full-time",
      "courseWorkload": program.programme_duration,
      "startDate": program.beginning,
      "location": program.city
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.uniadvisorai.com/"
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": "Programs",
      "item": "https://www.uniadvisorai.com/programs"
    }, {
      "@type": "ListItem",
      "position": 3,
      "name": program.program_name
    }]
  };

  const degreePrefix = program.program_name.toLowerCase().includes('bsc') || program.program_name.toLowerCase().includes('msc') || program.program_name.toLowerCase().includes('bachelor') || program.program_name.toLowerCase().includes('master')
    ? '' 
    : `${program.degree_type === 'Bachelor' ? 'BSc ' : program.degree_type === 'Masters' ? 'MSc ' : (program.degree_type ? program.degree_type + ' ' : '')}`;

  const pageTitle = `${degreePrefix}${program.program_name} at ${program.university_name} (English) | CampusConsult`;
  const pageDescription = `Study ${program.program_name} (${program.degree_type}) at ${program.university_name}, ${program.city}. Duration: ${program.programme_duration}. Tuition: ${program.tuition_fees_per_semester_eur || 'None'}. Check admission requirements.`;

  // Tabs configuration
  const tabs = [
    { name: 'Overview', icon: BookOpen },
    { name: 'Admissions', icon: GraduationCap },
    { name: 'Costs & Funding', icon: Euro },
    { name: 'Contact', icon: Mail },
  ];

  // Generate FAQs for AEO
  const faqs = [
    {
      question: `What is the tuition fee for ${program.program_name}?`,
      answer: program.tuition_fees_per_semester_eur || 'There are no tuition fees for this program, only a semester contribution.'
    },
    {
      question: `Is ${program.program_name} taught in English?`,
      answer: Array.isArray(program.teaching_language)
        ? program.teaching_language.join(', ')
        : program.teaching_language || 'Please check the program details.'
    },
    {
      question: `When is the application deadline for ${program.program_name}?`,
      answer: program.application_deadline || 'Please check the university website for current deadlines.'
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const combinedSchema = [educationalProgramSchema, breadcrumbSchema, faqSchema];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-surface-900 dark:to-surface-900">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={[program.program_name, program.university_name, 'study in germany', program.city || 'Germany', program.degree_type || 'master', 'english taught programs germany']}
        schema={combinedSchema}
      />
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-surface-800 dark:to-surface-800 dark:border-b dark:border-surface-700 text-white pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 text-primary-100 hover:text-white dark:text-surface-400 dark:hover:text-surface-200 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Programs
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${degreeColors[program.degree_type || ''] || 'bg-white/20 text-white'
                    }`}>
                    {program.degree_type || program.degree}
                  </span>
                  {program.teaching_language && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 dark:bg-surface-800 dark:border dark:border-surface-700 text-white">
                      {Array.isArray(program.teaching_language)
                        ? program.teaching_language.join(', ')
                        : program.teaching_language}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                  {program.program_name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-primary-100 dark:text-surface-300">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {program.university_name}
                  </span>
                  {program.city && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {program.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 dark:border-surface-700 dark:hover:bg-surface-800"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    novaToast.success('Link copied to clipboard!');
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                {(program.contact_website || program.url) && (
                  <Button
                    variant="secondary"
                    className="dark:bg-surface-800 dark:text-white dark:border dark:border-surface-700 dark:hover:bg-surface-700"
                    onClick={() => window.open(program.contact_website || program.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Official Page
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    className="dark:bg-primary-600 dark:hover:bg-primary-500"
                    onClick={() => setShowApplyModal(true)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Track Application
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-1 overflow-hidden">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-slate-100 dark:bg-surface-900/50 p-1">
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        clsx(
                          'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                          'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2',
                          selected
                            ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-white shadow dark:shadow-black/20'
                            : 'text-slate-600 dark:text-surface-400 hover:bg-white/[0.12] dark:hover:bg-surface-800 hover:text-primary-600 dark:hover:text-white'
                        )
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.name}</span>
                      </div>
                    </Tab>
                  ))}
                </Tab.List>

                <Tab.Panels className="mt-2 text-slate-600 dark:text-surface-300">
                  {/* Overview Panel */}
                  <Tab.Panel className="p-4 space-y-6">
                    {/* Quick Info Grid */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <QuickInfoCard
                        icon={<Clock className="w-5 h-5" />}
                        label="Duration"
                        value={program.programme_duration || 'Not specified'}
                      />
                      <QuickInfoCard
                        icon={<Calendar className="w-5 h-5" />}
                        label="Start"
                        value={program.beginning || 'Not specified'}
                      />
                      <QuickInfoCard
                        icon={<Euro className="w-5 h-5" />}
                        label="Tuition"
                        value={program.tuition_fees_per_semester_eur || 'No fees'}
                      />
                      <QuickInfoCard
                        icon={<Languages className="w-5 h-5" />}
                        label="Language"
                        value={Array.isArray(program.teaching_language)
                          ? program.teaching_language[0]
                          : program.teaching_language || 'Not specified'}
                      />
                    </div>

                    {program.description_content && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Program Description</h3>
                        <div className="prose prose-slate max-w-none text-sm break-words">
                          <p className="whitespace-pre-line break-words">{program.description_content}</p>
                        </div>
                      </div>
                    )}
                  </Tab.Panel>

                  {/* Admissions Panel */}
                  <Tab.Panel className="p-4 space-y-6">
                    {program.academic_admission_requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-primary-600" />
                          Academic Requirements
                        </h3>
                        <p className="whitespace-pre-line text-sm break-words">{program.academic_admission_requirements}</p>
                      </div>
                    )}

                    {program.language_requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <Languages className="w-5 h-5 text-primary-600" />
                          Language Requirements
                        </h3>
                        <p className="whitespace-pre-line text-sm break-words">{program.language_requirements}</p>
                      </div>
                    )}

                    {program.application_deadline && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
                        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                          Application Deadline
                        </h3>
                        <p className="text-amber-800 dark:text-amber-400 font-medium break-words">{program.application_deadline}</p>
                      </div>
                    )}
                  </Tab.Panel>

                  {/* Costs & Funding Panel */}
                  <Tab.Panel className="p-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-surface-800/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Tuition Fees</h4>
                        <p className="text-sm">{program.tuition_fees_per_semester_eur || 'None'}</p>
                        {program.additional_info_tuition_fees && (
                          <p className="text-xs text-slate-500 dark:text-surface-400 mt-2">{program.additional_info_tuition_fees}</p>
                        )}
                      </div>
                      <div className="bg-slate-50 dark:bg-surface-800/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Semester Contribution</h4>
                        <p className="text-sm">{program.semester_contribution || 'Not specified'}</p>
                      </div>
                    </div>

                    {program.funding_opportunities && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <Euro className="w-5 h-5 text-green-600" />
                          Funding Opportunities
                        </h3>
                        <p className="whitespace-pre-line text-sm break-words">{program.funding_opportunities}</p>
                      </div>
                    )}

                    {program.costs_of_living && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Cost of Living</h3>
                        <p className="whitespace-pre-line text-sm break-words">{program.costs_of_living}</p>
                      </div>
                    )}
                  </Tab.Panel>

                  {/* Contact Panel */}
                  <Tab.Panel className="p-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contact Person</h3>
                        {program.contact_email ? (
                          <a href={`mailto:${program.contact_email}`} className="flex items-center gap-3 text-primary-600 hover:underline">
                            <Mail className="w-5 h-5" />
                            {program.contact_email}
                          </a>
                        ) : (
                          <p className="text-slate-500 dark:text-surface-400 italic">No email provided</p>
                        )}
                        {program.contact_phone && (
                          <div className="flex items-center gap-3 text-slate-700 dark:text-surface-300">
                            <Phone className="w-5 h-5" />
                            {program.contact_phone}
                          </div>
                        )}
                        {program.contact_website && (
                          <a href={program.contact_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary-600 hover:underline">
                            <Globe className="w-5 h-5" />
                            Program Website
                          </a>
                        )}
                      </div>

                      {program.submit_application_to && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Submit Application To</h3>
                          <div className="prose prose-sm text-slate-600 dark:text-surface-300">
                            <p className="whitespace-pre-line">{program.submit_application_to}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </Card>

            {/* AEO: Frequently Asked Questions */}
            <section className="mt-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h2>
              <div className="grid gap-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{faq.question}</h3>
                    <p className="text-slate-600 dark:text-surface-300 text-sm leading-relaxed">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 mt-1">
            {/* Requirements Check */}
            {isAuthenticated && requirements && requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary-600" />
                    requirements Check
                  </h3>
                  <ul className="space-y-3">
                    {requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {req.met ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium ${req.met ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {req.label}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-surface-400">{req.note}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-surface-400 mt-4 pt-4 border-t">
                    Based on your profile. Update your profile for accurate checks.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => setShowAnalysisModal(true)}
                  >
                    Full Analysis
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* CTA for non-authenticated */}
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border-primary-200 dark:border-primary-800/30">
                  <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
                    Want to track this program?
                  </h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
                    Sign in to track applications and get personalized recommendations.
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Button size="sm" onClick={() => navigate('/login')} className="w-full">
                        Sign In
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Button size="sm" variant="outline" onClick={() => navigate('/register')} className="w-full">
                        Register
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Track Application"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-surface-300">
            Add <strong>{program.program_name}</strong> to your application tracker.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-surface-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Add any notes about your application..."
              value={applicationNotes}
              onChange={(e) => setApplicationNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createApplicationMutation.mutate({
                program_id: program.id,
                user_notes: applicationNotes || undefined,
              })}
              disabled={createApplicationMutation.isPending}
            >
              {createApplicationMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Add to Tracker
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Analysis Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        title="Full Profile Analysis"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-surface-300 text-sm">
            Detailed comparison of your profile against <strong>{program.program_name}</strong> requirements.
          </p>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-surface-400 pb-2 border-b">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Match</span>
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> Gap</span>
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Missing</span>
          </div>

          {/* Comparison Table */}
          <div className="space-y-3">
            {getFullAnalysis().map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-surface-800/50">
                <div className="flex-shrink-0">
                  {item.status === 'match' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : item.status === 'gap' ? (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{item.criteria}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
                    <span className="text-slate-500 dark:text-surface-400">
                      Yours: <span className="text-slate-700 dark:text-surface-300">{item.yours}</span>
                    </span>
                    <span className="text-slate-500 dark:text-surface-400">
                      Required: <span className="text-slate-700 dark:text-surface-300">{item.required}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {(() => {
            const analysis = getFullAnalysis();
            const matches = analysis.filter(a => a.status === 'match').length;
            const total = analysis.length;
            const percentage = Math.round((matches / total) * 100);
            return (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800/30">
                <p className="text-center">
                  <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">{percentage}%</span>
                  <span className="text-sm text-primary-600 dark:text-primary-400 ml-2">Eligibility Check</span>
                </p>
                <p className="text-xs text-center text-primary-600 dark:text-primary-400 mt-1">
                  {matches} of {total} requirements met
                </p>
              </div>
            );
          })()}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowAnalysisModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Quick Info Card Component
function QuickInfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="text-center p-4 bg-slate-50 dark:bg-surface-800/50 border-slate-100 dark:border-surface-700">
      <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 flex items-center justify-center text-primary-600 mx-auto mb-2 shadow-sm dark:shadow-surface-900/50">
        {icon}
      </div>
      <p className="text-xs text-slate-500 dark:text-surface-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white text-sm">{value}</p>
    </Card>
  );
}
