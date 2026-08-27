import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User as UserIcon,
    GraduationCap,
    Briefcase,
    FileText,
    Star,
    MapPin,
    Building2,
    Calendar,
    Globe,
    Languages,
    BookOpen,
    Target,
    DollarSign,
    Clock,
    Shield,
    Mail,
    Phone,
    CheckCircle,
    AlertCircle,
    XCircle,
} from 'lucide-react';
import { adminApi, UserDetails, UserProfile } from '../../api/admin';
import { Badge } from '../../components/ui';

interface UserDetailModalProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
}

type TabId = 'profile' | 'applications' | 'recommendations';

export default function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
    const [activeTab, setActiveTab] = useState<TabId>('profile');

    const { data: userDetails, isLoading } = useQuery({
        queryKey: ['admin-user-details', userId],
        queryFn: () => adminApi.getUserDetails(userId),
        enabled: isOpen,
    });

    const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
        {
            id: 'applications',
            label: 'Applications',
            icon: <FileText className="w-4 h-4" />,
            count: userDetails?.applications.length
        },
        {
            id: 'recommendations',
            label: 'Recommendations',
            icon: <Star className="w-4 h-4" />,
            count: userDetails?.recommendations.length
        },
    ];

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
            draft: 'neutral',
            submitted: 'primary',
            under_review: 'warning',
            accepted: 'success',
            rejected: 'danger',
            withdrawn: 'neutral',
        };
        const labels: Record<string, string> = {
            draft: 'Draft',
            submitted: 'Submitted',
            under_review: 'Under Review',
            accepted: 'Accepted',
            rejected: 'Rejected',
            withdrawn: 'Withdrawn',
        };
        return (
            <Badge variant={variants[status] || 'neutral'}>
                {labels[status] || status}
            </Badge>
        );
    };

    const renderProfileSection = (profile: UserProfile | null) => {
        if (!profile) {
            return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">No profile data</p>
                    <p className="text-sm">This user hasn't set up their profile yet</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 dark:bg-surface-900 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Full Name" value={profile.full_name} />
                        <InfoItem label="Nationality" value={profile.nationality} icon={<Globe className="w-4 h-4" />} />
                        <InfoItem label="Date of Birth" value={profile.date_of_birth} icon={<Calendar className="w-4 h-4" />} />
                        <InfoItem label="Phone" value={profile.phone} icon={<Phone className="w-4 h-4" />} />
                    </div>
                </div>

                {/* Academic Background */}
                <div className="bg-blue-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Academic Background
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Current Degree" value={profile.current_degree} />
                        <InfoItem label="Field of Study" value={profile.field_of_study} />
                        <InfoItem label="University" value={profile.university} icon={<Building2 className="w-4 h-4" />} />
                        <InfoItem label="Graduation Date" value={profile.graduation_date} icon={<Calendar className="w-4 h-4" />} />
                        <InfoItem
                            label="CGPA"
                            value={profile.cgpa ? `${profile.cgpa}${profile.gpa_scale ? ` / ${profile.gpa_scale}` : ''}` : null}
                        />
                    </div>
                    {profile.relevant_courses && profile.relevant_courses.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Relevant Courses</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.relevant_courses.map((course, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-surface-800 rounded text-xs text-gray-700 dark:text-gray-300">
                                        {course}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Work Experience */}
                {(profile.work_experience || profile.research_experience) && (
                    <div className="bg-purple-50 rounded-xl p-5">
                        <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Experience
                        </h4>
                        {profile.work_experience && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Experience</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.work_experience}</p>
                            </div>
                        )}
                        {profile.research_experience && (
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Research Experience</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.research_experience}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Language Proficiency */}
                <div className="bg-green-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        Language Proficiency
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">English</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {profile.english_level || 'Not specified'}
                                {profile.english_certificate && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {' '}({profile.english_certificate}{profile.english_score ? `: ${profile.english_score}` : ''})
                                    </span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">German</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {profile.german_level || 'Not specified'}
                                {profile.german_certificate && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {' '}({profile.german_certificate}{profile.german_score ? `: ${profile.german_score}` : ''})
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {profile.other_languages && profile.other_languages.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Other Languages</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.other_languages.map((lang, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-surface-800 rounded text-xs text-gray-700 dark:text-gray-300">
                                        {lang.language}: {lang.level}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Preferences */}
                <div className="bg-amber-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Preferences
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Desired Degree" value={profile.desired_degree} icon={<GraduationCap className="w-4 h-4" />} />
                        <InfoItem label="Preferred Language" value={profile.preferred_language} icon={<BookOpen className="w-4 h-4" />} />
                        <InfoItem label="Budget Range" value={profile.budget_range} icon={<DollarSign className="w-4 h-4" />} />
                        <InfoItem label="Needs Funding" value={profile.needs_funding} />
                    </div>
                    {profile.desired_fields && profile.desired_fields.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Desired Fields</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.desired_fields.map((field, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-surface-800 rounded text-xs text-gray-700 dark:text-gray-300">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {profile.preferred_cities && profile.preferred_cities.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preferred Cities</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.preferred_cities.map((city, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-surface-800 rounded text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {city}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Documents */}
                {(profile.transcript_path || profile.cv_path) && (
                    <div className="bg-gray-50 dark:bg-surface-900 rounded-xl p-5">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Uploaded Documents
                        </h4>
                        <div className="flex gap-4">
                            {profile.transcript_path && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Transcript</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                            )}
                            {profile.cv_path && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">CV</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-400 flex gap-4">
                    <span>Profile created: {formatDate(profile.created_at)}</span>
                    <span>Last updated: {formatDate(profile.updated_at)}</span>
                </div>
            </div>
        );
    };

    const renderApplicationsSection = (details: UserDetails) => {
        if (details.applications.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">No applications</p>
                    <p className="text-sm">This user hasn't applied to any programs yet</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {details.applications.map((app) => (
                    <div key={app.id} className="bg-gray-50 dark:bg-surface-900 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{app.program?.program_name || 'Unknown Program'}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {app.program?.university_name || 'Unknown University'}
                                    <span className="text-gray-300">•</span>
                                    <MapPin className="w-3.5 h-3.5" />
                                    {app.program?.city || 'Unknown City'}
                                </p>
                            </div>
                            {getStatusBadge(app.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Match Score</p>
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {app.match_score ? `${Math.round(app.match_score)}%` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                                <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(app.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
                                <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(app.submitted_at)}</p>
                            </div>
                        </div>
                        {app.user_notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User Notes</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{app.user_notes}</p>
                            </div>
                        )}
                        {app.admin_notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Admin Notes</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{app.admin_notes}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderRecommendationsSection = (details: UserDetails) => {
        if (details.recommendations.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">No cached recommendations</p>
                    <p className="text-sm">AI recommendations will appear here after the user views them</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {details.recommendations.map((rec) => (
                    <div key={rec.id} className="bg-gray-50 dark:bg-surface-900 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{rec.program_name || 'Unknown Program'}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {rec.university_name || 'Unknown University'}
                                    <span className="text-gray-300">•</span>
                                    <MapPin className="w-3.5 h-3.5" />
                                    {rec.city || 'Unknown City'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(rec.match_score)}%</span>
                            </div>
                        </div>

                        {rec.match_reasons && rec.match_reasons.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Match Reasons</p>
                                <div className="space-y-1">
                                    {rec.match_reasons.map((reason, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {rec.gaps && rec.gaps.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Gaps / Concerns</p>
                                <div className="space-y-1">
                                    {rec.gaps.map((gap, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{gap}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {rec.highlights && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Highlights</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{rec.highlights}</p>
                            </div>
                        )}

                        <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Cached: {formatDate(rec.created_at)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Loading user details...</p>
                        </div>
                    ) : userDetails ? (
                        <>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {userDetails.user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{userDetails.user.full_name || userDetails.user.username}</h2>
                                        <div className="flex items-center gap-3 mt-1 text-white/80">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                {userDetails.user.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {userDetails.user.role === 'admin' ? (
                                                    <Shield className="w-4 h-4" />
                                                ) : (
                                                    <UserIcon className="w-4 h-4" />
                                                )}
                                                {userDetails.user.role.charAt(0).toUpperCase() + userDetails.user.role.slice(1)}
                                            </span>
                                            {userDetails.user.is_active ? (
                                                <span className="flex items-center gap-1 text-green-200">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-200">
                                                    <XCircle className="w-4 h-4" />
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                                ? 'text-primary-600 border-primary-600'
                                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {activeTab === 'profile' && renderProfileSection(userDetails.profile)}
                                {activeTab === 'applications' && renderApplicationsSection(userDetails)}
                                {activeTab === 'recommendations' && renderRecommendationsSection(userDetails)}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-lg font-medium">Failed to load user details</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Helper component for info items
function InfoItem({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                {icon}
                {value || <span className="text-gray-400">Not specified</span>}
            </p>
        </div>
    );
}
