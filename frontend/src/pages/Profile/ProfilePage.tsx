import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import novaToast from '../../components/nova/NovaToast';
import {
  User, GraduationCap, Languages, Settings, Upload,
  Check, AlertCircle, Loader2, ChevronRight, Calculator,
  ChevronDown, Search, MapPin, BookOpen
} from 'lucide-react';
import { profileApi } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import ProfileOnboarding from '../../components/profile/ProfileOnboarding';

// Debounce helper function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

type TabType = 'personal' | 'academic' | 'languages' | 'preferences';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'personal', label: 'Personal Info', icon: <User className="w-5 h-5" /> },
  { id: 'academic', label: 'Academic Background', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'languages', label: 'Languages', icon: <Languages className="w-5 h-5" /> },
  { id: 'preferences', label: 'Preferences', icon: <Settings className="w-5 h-5" /> },
];

const languageLevels = [
  { value: '', label: 'Select level' },
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Proficient' },
];

const degreeTypes = [
  { value: '', label: 'Select degree' },
  { value: 'Bachelor', label: 'Bachelor\'s Degree' },
  { value: 'Masters', label: 'Master\'s Degree' },
  { value: 'PhD', label: 'PhD / Doctorate' },
];

const germanCities = [
  // Major metros
  'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf',
  // University hubs
  'Aachen', 'Heidelberg', 'Freiburg', 'Göttingen', 'Tübingen', 'Erlangen',
  'Darmstadt', 'Karlsruhe', 'Mannheim',
  // Eastern Germany
  'Dresden', 'Leipzig', 'Jena', 'Weimar', 'Potsdam', 'Rostock',
  // North/West
  'Bonn', 'Münster', 'Bremen', 'Hannover', 'Kiel',
  // South
  'Nuremberg', 'Regensburg', 'Augsburg', 'Würzburg', 'Passau',
];

const studyFieldGroups: Record<string, string[]> = {
  'Engineering & Technology': [
    'Computer Science', 'Artificial Intelligence', 'Data Science', 'Cybersecurity',
    'Software Engineering', 'Mechanical Engineering', 'Electrical Engineering',
    'Civil Engineering', 'Automotive Engineering', 'Aerospace Engineering',
    'Renewable Energy', 'Robotics', 'Mechatronics',
  ],
  'Natural Sciences': [
    'Physics', 'Mathematics', 'Chemistry', 'Biology', 'Biotechnology',
    'Environmental Science', 'Geosciences', 'Neuroscience',
  ],
  'Business & Economics': [
    'Business Administration', 'Economics', 'Finance', 'Marketing',
    'International Management', 'Supply Chain Management', 'Entrepreneurship',
  ],
  'Humanities & Social Sciences': [
    'Psychology', 'Political Science', 'Sociology', 'Philosophy',
    'History', 'Linguistics', 'Media Studies', 'Education',
  ],
  'Life Sciences & Health': [
    'Medicine', 'Public Health', 'Pharmacy', 'Nutrition Science',
  ],
  'Arts & Design': [
    'Architecture', 'Industrial Design', 'Fine Arts', 'Music',
  ],
  'Law & Policy': [
    'Law', 'International Law', 'European Studies', 'Public Policy',
  ],
};



export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const queryClient = useQueryClient();
  const isInitialMount = useRef(true);

  // Check if this is a new user for onboarding
  const { isNewUser, clearNewUser } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync showOnboarding with isNewUser after zustand hydrates from localStorage
  useEffect(() => {
    if (isNewUser) {
      setShowOnboarding(true);
    }
  }, [isNewUser]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    clearNewUser();
    novaToast.success('Welcome! Let me help you complete your profile.');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    clearNewUser();
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        return await profileApi.getProfile();
      } catch (error: any) {
        // If 404, return null to indicate no profile exists yet
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 404
      if (error.response?.status === 404) return false;
      return failureCount < 3;
    }
  });

  const { register, formState: { errors }, reset, watch, setValue } = useForm<Partial<UserProfile>>({
    defaultValues: profile || {},
  });

  // Watch all form values for auto-save
  const formValues = watch();
  const debouncedFormValues = useDebounce(formValues, 1000); // 1 second debounce

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaveStatus('saved');
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      novaToast.error('Oops, I couldn\'t save your changes. Try again?');
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  // Auto-save effect - triggers when debounced form values change
  useEffect(() => {
    // Skip initial mount and when loading
    if (isInitialMount.current || isLoading) {
      isInitialMount.current = false;
      return;
    }

    // Don't save if form is empty
    if (!debouncedFormValues || Object.keys(debouncedFormValues).length === 0) {
      return;
    }

    // Check if we should save
    let shouldSave = false;

    if (!profile) {
      // New profile - save if we have any data
      shouldSave = true;
    } else {
      // Existing profile - check for actual changes
      shouldSave = Object.keys(debouncedFormValues).some(key => {
        const formValue = debouncedFormValues[key as keyof typeof debouncedFormValues];
        const profileValue = profile[key as keyof UserProfile];
        // Skip comparing if both are null/undefined/empty
        if (!formValue && !profileValue) return false;
        return JSON.stringify(formValue) !== JSON.stringify(profileValue);
      });
    }

    if (shouldSave && !updateMutation.isPending) {
      setSaveStatus('saving');
      updateMutation.mutate(debouncedFormValues);
    }
  }, [debouncedFormValues, profile, isLoading]);

  // Calculate profile completion
  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      'full_name', 'nationality', 'current_degree', 'field_of_study',
      'university', 'cgpa', 'english_level', 'german_level',
      'desired_degree', 'desired_fields'
    ];
    const filled = fields.filter(f => profile[f as keyof UserProfile]);
    return Math.round((filled.length / fields.length) * 100);
  };

  const completion = calculateCompletion();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      {/* Profile Onboarding for new users */}
      <AnimatePresence>
        {showOnboarding && (
          <ProfileOnboarding
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-surface-900 dark:to-surface-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Profile</h1>
            <p className="text-slate-600 dark:text-surface-300 mt-2">
              Complete your profile to get personalized program recommendations
            </p>

            {/* Completion indicator */}
            <div className="mt-4 bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm dark:shadow-surface-900/50 border border-slate-200 dark:border-surface-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-surface-300">Profile Completion</span>
                <span className="text-sm font-bold text-primary-600">{completion}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${completion >= 80 ? 'bg-green-500' :
                    completion >= 50 ? 'bg-amber-500' : 'bg-primary-500'
                    }`}
                />
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-24">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-slate-600 dark:text-surface-300 hover:bg-slate-50 dark:hover:bg-surface-800/50'
                        }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {activeTab === tab.id && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </nav>
              </Card>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div>
                <AnimatePresence mode="wait">
                  {activeTab === 'personal' && (
                    <PersonalInfoTab
                      key="personal"
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      queryClient={queryClient}
                    />
                  )}
                  {activeTab === 'academic' && (
                    <AcademicTab
                      key="academic"
                      register={register}
                      errors={errors}
                      watch={watch}
                    />
                  )}
                  {activeTab === 'languages' && (
                    <LanguagesTab
                      key="languages"
                      register={register}
                      errors={errors}
                    />
                  )}
                  {activeTab === 'preferences' && (
                    <PreferencesTab
                      key="preferences"
                      register={register}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  )}
                </AnimatePresence>

                {/* Auto-save status indicator */}
                {(
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 flex justify-end items-center gap-2"
                  >
                    <AnimatePresence mode="wait">
                      {saveStatus === 'saving' && (
                        <motion.div
                          key="saving"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-slate-500 dark:text-surface-400 bg-slate-100 dark:bg-surface-800 px-4 py-2 rounded-lg"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Saving...</span>
                        </motion.div>
                      )}
                      {saveStatus === 'saved' && (
                        <motion.div
                          key="saved"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-emerald-900/30 px-4 py-2 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Saved</span>
                        </motion.div>
                      )}
                      {saveStatus === 'error' && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-lg"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Failed to save</span>
                        </motion.div>
                      )}
                      {saveStatus === 'idle' && (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-slate-400 text-sm"
                        >
                          <Check className="w-4 h-4" />
                          <span>Changes save automatically</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

// Personal Info Tab
function PersonalInfoTab({ register, errors, setValue, queryClient }: any) {
  const [cvUploading, setCvUploading] = useState(false);
  const [cvStatus, setCvStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const onCvDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setCvUploading(true);
    setCvStatus('idle');

    profileApi.uploadDocument(file, 'cv').then((res) => {
      console.log('=== CV UPLOAD RESPONSE ===');
      console.log('Full response:', res);
      console.log('Success:', res.success);

      if (res.success) {
        // Fetch the updated profile from backend (background update)
        queryClient.invalidateQueries({ queryKey: ['profile'] });

        if (res.extracted_data) {
          const d = res.extracted_data as Record<string, any>;
          const opts = { shouldDirty: true, shouldValidate: true, shouldTouch: true };

          setTimeout(() => {
            if (d.student_name) setValue('full_name', d.student_name, opts);

            if (d.nationality) {
              const nat = d.nationality.trim();
              const formattedNat = nat.charAt(0).toUpperCase() + nat.slice(1).toLowerCase();
              setValue('nationality', formattedNat, opts);
            }

            if (d.phone) setValue('phone', d.phone, opts);
            if (d.degree) setValue('current_degree', d.degree, opts);
            if (d.major) setValue('field_of_study', d.major, opts);
            if (d.university) setValue('university', d.university, opts);
            if (d.graduation_date) setValue('graduation_date', d.graduation_date, opts);
            if (d.cgpa) setValue('cgpa', parseFloat(d.cgpa) || d.cgpa, opts);
            if (d.gpa_scale) setValue('gpa_scale', parseFloat(d.gpa_scale) || d.gpa_scale, opts);
            if (d.work_experience) setValue('work_experience', d.work_experience, opts);
            if (d.research_experience) setValue('research_experience', d.research_experience, opts);
            if (d.english_level) setValue('english_level', d.english_level, opts);
            if (d.german_level) setValue('german_level', d.german_level, opts);
          }, 100);
        }

        setCvStatus('success');
        novaToast.success('Got it! I\'ve parsed your CV and updated your profile.');
      } else {
        console.warn('CV upload returned success=false');
        setCvStatus('error');
        novaToast.error('I had trouble reading that CV. Try a different file?');
      }
    }).catch((err) => {
      console.error('CV upload failed:', err);
      setCvStatus('error');
      novaToast.error('Upload failed. Please check your file and try again.');
    }).finally(() => {
      setCvUploading(false);
    });
  }, [setValue, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onCvDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: cvUploading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* CV Upload Section */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Upload Your CV</h2>
        <p className="text-sm text-slate-500 dark:text-surface-400 mb-4">
          Upload your CV to auto-fill your profile. We support PDF and DOCX files.
        </p>
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all text-center ${isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : cvUploading
              ? 'border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50 cursor-wait'
              : cvStatus === 'success'
                ? 'border-green-400 dark:border-green-500/50 bg-green-50 dark:bg-emerald-900/20'
                : 'border-slate-300 dark:border-surface-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-surface-800/50'
            }`}
        >
          <input {...getInputProps()} />
          {cvUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
              <span className="text-sm text-slate-600 dark:text-surface-300">Parsing your CV...</span>
            </div>
          ) : cvStatus === 'success' ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium text-green-700">CV uploaded successfully!</span>
              <span className="text-xs text-slate-400 mt-1">Drop another file to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-surface-800 flex items-center justify-center text-slate-600 dark:text-surface-300 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-medium text-slate-700 dark:text-surface-300">Drop your CV here or click to browse</span>
              <span className="text-xs text-slate-400 mt-1">PDF or DOCX — AI will extract your details</span>
            </div>
          )}
        </div>
      </Card>

      {/* Personal Info Fields */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Personal Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            placeholder="John Doe"
            {...register('full_name')}
            error={errors.full_name?.message}
          />
          <Select
            label="Nationality"
            placeholder="Select your nationality"
            options={[
              { value: 'Pakistan', label: 'Pakistan' },
              { value: 'India', label: 'India' },
              { value: 'Germany', label: 'Germany' },
              { value: 'China', label: 'China' },
              { value: 'Iran', label: 'Iran' },
              { value: 'Turkey', label: 'Turkey' },
              { value: 'Russia', label: 'Russia' },
              { value: 'Egypt', label: 'Egypt' },
              { value: 'Ukraine', label: 'Ukraine' },
              { value: 'Indonesia', label: 'Indonesia' },
              { value: 'Bangladesh', label: 'Bangladesh' },
              { value: 'United States', label: 'United States' },
              { value: 'United Kingdom', label: 'United Kingdom' },
              { value: 'Canada', label: 'Canada' },
              { value: 'Nigeria', label: 'Nigeria' },
              { value: 'Other', label: 'Other' }
            ]}
            {...register('nationality')}
            error={errors.nationality?.message}
          />
          <Input
            label="Date of Birth"
            type="date"
            {...register('date_of_birth')}
            error={errors.date_of_birth?.message}
          />
          <Input
            label="Phone Number"
            placeholder="+1 234 567 8900"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>
      </Card>
    </motion.div>
  );
}

// Academic Tab
function AcademicTab({ register, errors, watch }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Academic Background</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Select
            label="Current Degree"
            options={degreeTypes}
            {...register('current_degree')}
            error={errors.current_degree?.message}
          />
          <Input
            label="Field of Study"
            placeholder="e.g., Computer Science"
            {...register('field_of_study')}
            error={errors.field_of_study?.message}
          />
          <Input
            label="University/Institution"
            placeholder="e.g., SRH, TUM, FAU"
            {...register('university')}
            error={errors.university?.message}
          />
          <Input
            label="Expected/Actual Graduation"
            placeholder="e.g., May 2025"
            {...register('graduation_date')}
            error={errors.graduation_date?.message}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">GPA / Academic Performance</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="CGPA / GPA"
            type="number"
            step="0.01"
            placeholder="e.g., 3.8"
            {...register('cgpa', { valueAsNumber: true })}
            error={errors.cgpa?.message}
          />
          <Input
            label="GPA Scale"
            type="number"
            step="0.1"
            placeholder="e.g., 4.0 or 10.0"
            {...register('gpa_scale', { valueAsNumber: true })}
            error={errors.gpa_scale?.message}
          />
        </div>
        <GPAConverterDisplay watch={watch} />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Experience</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-surface-300 mb-2">
              Work Experience
            </label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-surface-800 text-slate-900 dark:text-white"
              rows={4}
              placeholder="Describe your relevant work experience..."
              {...register('work_experience')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-surface-300 mb-2">
              Research Experience
            </label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-surface-800 text-slate-900 dark:text-white"
              rows={4}
              placeholder="Describe any research projects, publications, or academic work..."
              {...register('research_experience')}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Languages Tab
function LanguagesTab({ register, errors }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">English Proficiency</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Select
            label="English Level (CEFR)"
            options={languageLevels}
            {...register('english_level')}
            error={errors.english_level?.message}
          />
          <Input
            label="Certificate Type"
            placeholder="e.g., IELTS, TOEFL, Cambridge"
            {...register('english_certificate')}
          />
          <Input
            label="Score"
            placeholder="e.g., 7.5 (IELTS) or 100 (TOEFL)"
            {...register('english_score')}
          />
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Most German universities require B2-C1 level English for English-taught programs.
            Common accepted tests are IELTS (6.5+), TOEFL iBT (80+), or Cambridge (B2 First).
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">German Proficiency</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Select
            label="German Level (CEFR)"
            options={languageLevels}
            {...register('german_level')}
            error={errors.german_level?.message}
          />
          <Input
            label="Certificate Type"
            placeholder="e.g., TestDaF, DSH, Goethe"
            {...register('german_certificate')}
          />
          <Input
            label="Score"
            placeholder="e.g., TestDaF 4x4, DSH-2"
            {...register('german_score')}
          />
        </div>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> German-taught programs typically require DSH-2/TestDaF 4x4 (B2-C1).
            Many English-taught programs don't require German, but basic German helps with daily life.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

// Collapsible Accordion Section helper
function AccordionSection({
  title, icon, badge, defaultOpen = false, children
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
            {icon}
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {badge !== undefined && badge !== 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
              {badge} selected
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-5 border-t border-slate-100 dark:border-surface-700 mt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Searchable chip selector helper
function SearchableChipSelector({
  items,
  selected,
  onToggle,
  placeholder = 'Search...',
  columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  placeholder?: string;
  columns?: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? items.filter(item => item.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-surface-600 rounded-xl text-sm bg-white dark:bg-surface-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>
      <div className={`grid ${columns} gap-2`}>
        {filtered.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all text-left truncate ${selected?.includes(item)
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-200 dark:shadow-none scale-[1.02]'
              : 'bg-slate-50 dark:bg-surface-800 text-slate-700 dark:text-surface-300 hover:bg-slate-100 dark:hover:bg-surface-700 border border-slate-200 dark:border-surface-600'
              }`}
            title={item}
          >
            {selected?.includes(item) && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {item}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No matches found for "{search}"</p>
      )}
    </div>
  );
}

// Preferences Tab
function PreferencesTab({ register, errors, watch, setValue }: any) {
  const desiredFields = watch('desired_fields') || [];
  const preferredCities = watch('preferred_cities') || [];


  const toggleArrayField = (fieldName: string, value: string) => {
    const current = watch(fieldName) || [];
    if (current.includes(value)) {
      setValue(fieldName, current.filter((v: string) => v !== value));
    } else {
      setValue(fieldName, [...current, value]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* 1. Study Preferences */}
      <AccordionSection
        title="Study Preferences"
        icon={<GraduationCap className="w-5 h-5" />}
        defaultOpen={true}
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <Select
            label="Desired Degree"
            options={degreeTypes}
            {...register('desired_degree')}
            error={errors.desired_degree?.message}
          />
          <Select
            label="Teaching Language"
            options={[
              { value: '', label: 'No preference' },
              { value: 'English', label: 'English' },
              { value: 'German', label: 'German' },
              { value: 'Bilingual', label: 'Bilingual (EN/DE)' },
            ]}
            {...register('preferred_language')}
          />

        </div>
      </AccordionSection>



      {/* 3. Fields of Interest */}
      <AccordionSection
        title="Fields of Interest"
        icon={<BookOpen className="w-5 h-5" />}
        badge={desiredFields.length}
      >
        <div className="space-y-5">
          {Object.entries(studyFieldGroups).map(([groupName, fields]) => {
            const selectedInGroup = fields.filter(f => desiredFields.includes(f)).length;
            return (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-surface-400">{groupName}</h3>
                  {selectedInGroup > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full font-medium">
                      {selectedInGroup}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {fields.map(field => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => toggleArrayField('desired_fields', field)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all text-left truncate ${desiredFields.includes(field)
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-surface-800 text-slate-700 dark:text-surface-300 hover:bg-slate-100 dark:hover:bg-surface-700 border border-slate-200 dark:border-surface-600'
                        }`}
                      title={field}
                    >
                      {desiredFields.includes(field) && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                      {field}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {desiredFields.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-surface-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-surface-400">
              {desiredFields.length} field{desiredFields.length !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={() => setValue('desired_fields', [])}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </AccordionSection>

      {/* 4. Preferred Cities */}
      <AccordionSection
        title="Preferred Cities"
        icon={<MapPin className="w-5 h-5" />}
        badge={preferredCities.length}
      >
        <SearchableChipSelector
          items={germanCities}
          selected={preferredCities}
          onToggle={(city) => toggleArrayField('preferred_cities', city)}
          placeholder="Search German cities..."
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        />
        {preferredCities.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-surface-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-surface-400">
              {preferredCities.length} cit{preferredCities.length !== 1 ? 'ies' : 'y'} selected
            </span>
            <button
              type="button"
              onClick={() => setValue('preferred_cities', [])}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </AccordionSection>




    </motion.div>
  );
}



// Helper component for live GPA conversion
function GPAConverterDisplay({ watch }: { watch: any }) {
  const cgpa = watch('cgpa');
  const scale = watch('gpa_scale');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!cgpa || !scale) return;
    setLoading(true);
    try {
      const { applicationsApi } = await import('../../api/applications');
      const res = await applicationsApi.calculateGpa(Number(cgpa), Number(scale));
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-surface-700">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-surface-400">
          German universities typically use a scale where 1.0 is best and 4.0 is passing.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCheck}
          disabled={!cgpa || !scale}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Check German Grade
        </Button>
      </div>

      {result && (
        <div className="bg-slate-50 dark:bg-surface-800/50 p-4 rounded-lg flex items-center gap-4">
          <div className="bg-primary-100 p-3 rounded-full">
            <Calculator className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-surface-400">Converted German Grade</div>
            <div className="font-bold text-lg text-slate-900 dark:text-white">
              {result.german_grade} <span className="text-sm font-normal text-slate-500 dark:text-surface-400">({result.classification})</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Formula: {result.formula}</div>
          </div>
        </div>
      )}
    </div>
  );
}
