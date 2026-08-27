import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  BookOpen,
  FileText,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calculator,
  Plane,
  GraduationCap,
  Upload
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { profileApi, recommendationsApi, scholarshipsApi, applicationsApi } from '../../api';
import { Button, Card, Badge, PageLoader } from '../../components/ui';
import { ProgramCard } from '../../components/programs';
import { ScholarshipCard } from '../../components/scholarships';
import ApplicationProgressChart from '../../components/dashboard/ApplicationProgressChart';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    retry: false,
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications'],
    queryFn: profileApi.getApplications,
  });

  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ['recommendations', { degree_type: '', teaching_language: '', n_results: 10 }],
    queryFn: () => recommendationsApi.getRecommendations({
      use_profile: true,
      n_results: 10,
    }),
    enabled: !!profile,
    retry: false,
  });

  const { data: scholarships, isLoading: isLoadingScholarships } = useQuery({
    queryKey: ['scholarships-eligible-dashboard'],
    queryFn: () => scholarshipsApi.getEligibleScholarships(3),
    enabled: !!profile,
  });

  const isLoading = isLoadingProfile || isLoadingApplications;

  const featuredApplication = applications?.length ? applications[0] : null;

  const { data: tracker } = useQuery({
    queryKey: ['application-tracker-dashboard', featuredApplication?.id],
    queryFn: () => applicationsApi.getTracker(featuredApplication!.id),
    enabled: !!featuredApplication?.id,
    retry: false,
  });

  const getNextAction = () => {
    if (!tracker) return null;
    const visibleItems = tracker.checklist.filter(item => {
      if (item.category === 'hec_verification' || item.category === 'documents') {
        if ((item.item_name || '').toLowerCase().includes('wes')) return false;
      }
      return true;
    });

    const pendingItems = visibleItems.filter(i => i.status !== 'completed' && i.status !== 'not_applicable');
    const categoryPriority = ['profile_setup', 'eligibility', 'language', 'documents', 'hec_verification', 'university_application', 'admission_confirmation', 'financial_documents', 'visa_process'];

    pendingItems.sort((a, b) => {
      const aPriority = categoryPriority.indexOf(a.category);
      const bPriority = categoryPriority.indexOf(b.category);
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (a.display_order || 0) - (b.display_order || 0);
    });

    return pendingItems[0] || null;
  };

  const nextAction = getNextAction();

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.current_degree,
      profile.field_of_study,
      profile.university,
      profile.cgpa,
      profile.english_level,
      profile.desired_degree,
      profile.desired_fields?.length,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  if (isLoading) {
    return <PageLoader />;
  }

  const stats = [
    {
      label: 'Profile Completion',
      value: `${profileCompletion}%`,
      icon: User,
      color: 'primary',
      link: '/profile',
    },
    {
      label: 'Applications',
      value: applications?.length || 0,
      icon: FileText,
      color: 'success',
      link: '/applications',
    },
    {
      label: 'Recommendations',
      value: recommendations?.recommendations?.length || 0,
      icon: Sparkles,
      color: 'accent',
      link: '/recommendations',
    },
  ];

  const quickActions = [
    {
      title: 'Complete Profile',
      description: 'Add your academic information for better recommendations',
      icon: User,
      link: '/profile',
      color: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    },
    {
      title: 'Browse Programs',
      description: 'Explore German university programs',
      icon: BookOpen,
      link: '/programs',
      color: 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    },
    {
      title: 'Get AI Recommendations',
      description: 'Get personalized program suggestions',
      icon: Target,
      link: '/recommendations',
      color: 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
    },
    {
      title: 'Visa Guide',
      description: 'Visa & Immigration requirements',
      icon: Plane,
      link: '/visa-guide',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      title: 'Grade Calculator',
      description: 'Convert your grades to German GPA',
      icon: Calculator,
      link: '/grade-calculator',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    },
  ];

  return (
    <div className="page-container py-4 sm:py-8 px-4 sm:px-6 overflow-x-hidden max-w-full box-border">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Welcome back, {user?.full_name || user?.username}! 👋
        </h1>
        <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400">
          {profile?.nationality?.toLowerCase().includes('india')
            ? 'Your complete guide from India 🇮🇳 to Germany 🇩🇪 — made for Indian students.'
            : profile?.nationality?.toLowerCase().includes('pakistan')
              ? 'Your complete guide from Pakistan 🇵🇰 to Germany 🇩🇪 — made for Pakistani students.'
              : "Here's an overview of your journey to studying in Germany."
          }
        </p>
      </motion.div>

      {/* Immediate Next Action Banner */}
      {featuredApplication && nextAction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-900 dark:to-surface-900 text-white overflow-hidden relative border-0 shadow-lg shadow-primary-900/20">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-accent-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 sm:mb-4 text-primary-100 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse flex-shrink-0" />
                  <span className="truncate">Immediate Next Action</span>
                </div>

                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 break-words">
                  {nextAction.item_name}
                </h2>

                <p className="text-primary-100 mb-3 sm:mb-4 text-sm md:text-base">
                  {nextAction.description || 'Complete this step to move your application forward.'}
                </p>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-200 bg-black/10 w-full sm:w-fit px-3 py-1.5 rounded-lg border border-white/5 overflow-hidden">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    Application: <strong className="text-white">{featuredApplication.program?.program_name}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-stretch sm:items-start gap-2 sm:flex-row sm:items-center">
                {nextAction.item_name.toLowerCase().includes('ielts') || nextAction.item_name.toLowerCase().includes('toefl') || nextAction.item_name.toLowerCase().includes('language') ? (
                  <Link to={`/applications/${featuredApplication.id}`} className="w-full sm:w-auto">
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50 shadow-lg border-0 w-full h-12 sm:h-14 text-sm sm:text-base font-bold shadow-primary-900/50">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" /> Upload Language Score
                    </Button>
                  </Link>
                ) : nextAction.item_name.toLowerCase().includes('transcript') || nextAction.category === 'documents' || nextAction.category === 'profile_setup' ? (
                  <Link to={nextAction.category === 'profile_setup' ? '/profile' : `/applications/${featuredApplication.id}`} className="w-full sm:w-auto">
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50 shadow-lg border-0 w-full h-12 sm:h-14 text-sm sm:text-base font-bold shadow-primary-900/50">
                      {nextAction.category === 'profile_setup' ? 'Complete Profile' : 'Upload Document'}
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/applications/${featuredApplication.id}`} className="w-full sm:w-auto">
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50 shadow-lg border-0 w-full h-12 sm:h-14 text-sm sm:text-base font-bold shadow-primary-900/50">
                      Take Action <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                    </Button>
                  </Link>
                )}

                <span className="text-xs text-primary-200 text-center sm:text-left">
                  Takes about 5 mins
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 overflow-hidden">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card hover className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8 overflow-hidden">
        {/* Featured Application & Chart Section */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Featured Application */}
          {featuredApplication && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white">Latest Application</h2>
                <Link to={`/applications/${featuredApplication.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  Manage
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-800/50 border-surface-200 dark:border-surface-700 overflow-hidden">
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <Badge variant={
                        featuredApplication.status === 'accepted' ? 'success' :
                          featuredApplication.status === 'rejected' ? 'danger' :
                            'primary'
                      }>
                        {featuredApplication.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs sm:text-sm text-surface-500 dark:text-surface-400">
                        Applied {new Date(featuredApplication.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white mb-1 break-words">
                      {featuredApplication.program?.program_name || 'Unknown Program'}
                    </h3>
                    <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 mb-4 truncate">
                      {featuredApplication.program?.university_name}
                    </p>

                    {/* Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-medium text-surface-700 dark:text-surface-300">Application Progress</span>
                        <span className="text-surface-600 dark:text-surface-400">
                          {featuredApplication.checklist_progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${featuredApplication.status === 'accepted' ? 'bg-success-500' : 'bg-primary-500'
                            }`}
                          style={{
                            width: `${featuredApplication.checklist_progress}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-1">
          {applications && applications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="h-full"
            >
              {featuredApplication && (
                <ApplicationProgressChart application={featuredApplication} />
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Profile Completion Banner */}
      {
        profileCompletion < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-100 dark:border-primary-800/30">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-1 text-sm sm:text-base">
                    Complete your profile for better recommendations
                  </h3>
                  <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 mb-3">
                    The more we know about you, the better we can match you with programs.
                  </p>
                  <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{profileCompletion}% complete</p>
                </div>
                <Link to="/profile" className="self-start">
                  <Button>
                    Complete Profile
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )
      }

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 overflow-hidden">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
          {/* Quick Actions */}
          <section>
            <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full overflow-hidden">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`overflow-hidden ${index === quickActions.length - 1 && quickActions.length % 2 !== 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                >
                  <Link to={action.link}>
                    <Card interactive className="p-3 sm:p-5 h-full overflow-hidden">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${action.color} flex items-center justify-center mb-2 sm:mb-3`}>
                        <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h3 className="font-medium text-surface-900 dark:text-white mb-0.5 sm:mb-1 text-xs sm:text-base truncate">{action.title}</h3>
                      <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 hidden sm:block line-clamp-2">{action.description}</p>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Top Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white">Top Matches for You</h2>
              <Link to="/recommendations" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoadingRecommendations ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 sm:h-32 bg-surface-100 dark:bg-surface-700 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recommendations?.recommendations?.length ? (
              <div className="space-y-3 sm:space-y-4">
                {recommendations.recommendations.slice(0, 3).map((rec, index) => (
                  <motion.div
                    key={rec.program.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <ProgramCard
                      program={rec.program}
                      matchScore={rec.match_score}
                      matchReasons={rec.match_reasons}
                      compact
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-8 text-center">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-surface-300 mx-auto mb-3" />
                <h3 className="font-medium text-surface-900 dark:text-white mb-1 text-sm sm:text-base">No recommendations yet</h3>
                <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mb-4">
                  Complete your profile to get personalized program recommendations.
                </p>
                <Link to="/profile">
                  <Button size="sm">Complete Profile</Button>
                </Link>
              </Card>
            )}
          </section>

          {/* Scholarship Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white">Recommended Scholarships</h2>
              <Link to="/scholarships" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoadingScholarships ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 sm:h-32 bg-surface-100 dark:bg-surface-700 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : scholarships?.scholarships?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {scholarships.scholarships.slice(0, 2).map((item, index) => (
                  <motion.div
                    key={item.scholarship.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <ScholarshipCard scholarship={item.scholarship} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-8 text-center bg-surface-50 dark:bg-surface-800 border-dashed">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-surface-300 mx-auto mb-3" />
                <h3 className="font-medium text-surface-900 dark:text-white mb-1 text-sm sm:text-base">No scholarships found yet</h3>
                <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mb-4">
                  We'll recommend scholarships based on your profile.
                </p>
                <Link to="/scholarships">
                  <Button size="sm" variant="secondary">Browse Scholarships</Button>
                </Link>
              </Card>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Recent Applications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white">Applications</h2>
              <Link to="/applications" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all
              </Link>
            </div>

            <Card className="divide-y divide-surface-100 dark:divide-surface-700">
              {applications?.length ? (
                applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-surface-500 dark:text-surface-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-900 dark:text-white text-xs sm:text-sm truncate">
                          {app.program?.program_name || 'Unknown Program'}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                          {app.program?.university_name}
                        </p>
                      </div>
                      <Badge
                        variant={
                          app.status === 'accepted' ? 'success' :
                            app.status === 'rejected' ? 'danger' :
                              app.status === 'submitted' ? 'primary' :
                                'neutral'
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <FileText className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                  <p className="text-sm text-surface-500 dark:text-surface-400">No applications yet</p>
                </div>
              )}
            </Card>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white mb-4">Tips for Success</h2>
            <Card className="p-4 sm:p-5">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                    Upload your transcript for automatic profile completion
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                    Check language requirements early
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                    Apply to multiple programs to increase chances
                  </span>
                </li>
              </ul>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}