import { useEffect, useState } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationPreferences } from '../../api/notifications';
import Button from '../../components/ui/Button';
import { Bell, Mail, Smartphone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export default function NotificationSettingsPage() {
    const { preferences, fetchPreferences, updatePreferences, isLoading } = useNotificationStore();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const handleToggle = async (key: keyof NotificationPreferences) => {
        if (!preferences) return;

        // Optimistic update
        const newValue = !preferences[key];
        await updatePreferences({ [key]: newValue });

        setSuccessMessage('Preferences updated');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    if (!preferences && !isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-surface-500 dark:text-surface-400">Failed to load preferences. Please try again.</p>
                    <Button className="mt-4" onClick={() => fetchPreferences()}>Retry</Button>
                </div>
            </div>
        );
    }

    const sections = [
        {
            title: 'Program Deadlines',
            description: 'Get reminded when application deadlines are approaching.',
            emailKey: 'email_deadline_reminders' as const,
            inappKey: 'inapp_deadline_reminders' as const,
        },
        {
            title: 'Application Status',
            description: 'Receive notifications when your application status changes.',
            emailKey: 'email_status_changes' as const,
            inappKey: 'inapp_status_changes' as const,
        },
        {
            title: 'Visa Appointments',
            description: 'Reminders for your upcoming visa appointments.',
            emailKey: 'email_visa_reminders' as const,
            inappKey: 'inapp_visa_reminders' as const,
        },
        {
            title: 'Weekly Digest',
            description: 'A weekly summary of your progress and upcoming tasks.',
            emailKey: 'email_weekly_digest' as const,
            inappKey: 'inapp_weekly_digest' as const,
        },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:text-white mb-6 group">
                <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
            </Link>

            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-surface-100 dark:border-surface-700 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-surface-100 dark:border-surface-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Bell className="w-6 h-6 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notification Settings</h1>
                    </div>
                    <p className="text-surface-500 dark:text-surface-400 max-w-xl">
                        Manage how you want to be notified about important updates. We recommend keeping email notifications enabled so you don't miss any deadlines.
                    </p>
                </div>

                {successMessage && (
                    <div className="bg-green-50 text-green-700 px-6 py-3 text-sm font-medium border-b border-green-100 animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="divide-y divide-surface-100 dark:divide-surface-700">
                    {sections.map((section) => (
                        <div key={section.title} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">{section.title}</h3>
                                <p className="text-surface-500 dark:text-surface-400 text-sm">{section.description}</p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                {/* In-App Toggle */}
                                <button
                                    onClick={() => preferences && handleToggle(section.inappKey)}
                                    className={clsx(
                                        "group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-24",
                                        preferences?.[section.inappKey]
                                            ? "border-primary-100 bg-primary-50/30"
                                            : "border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 opacity-60 hover:opacity-100"
                                    )}
                                    type="button"
                                >
                                    <Smartphone className={clsx(
                                        "w-5 h-5 transition-colors",
                                        preferences?.[section.inappKey] ? "text-primary-600" : "text-surface-400"
                                    )} />
                                    <span className={clsx(
                                        "text-xs font-medium transition-colors",
                                        preferences?.[section.inappKey] ? "text-primary-700" : "text-surface-500 dark:text-surface-400"
                                    )}>
                                        {preferences?.[section.inappKey] ? 'In-App On' : 'In-App Off'}
                                    </span>
                                </button>

                                {/* Email Toggle */}
                                <button
                                    onClick={() => preferences && handleToggle(section.emailKey)}
                                    className={clsx(
                                        "group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-24",
                                        preferences?.[section.emailKey]
                                            ? "border-blue-100 bg-blue-50/30"
                                            : "border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 opacity-60 hover:opacity-100"
                                    )}
                                    type="button"
                                >
                                    <Mail className={clsx(
                                        "w-5 h-5 transition-colors",
                                        preferences?.[section.emailKey] ? "text-blue-600" : "text-surface-400"
                                    )} />
                                    <span className={clsx(
                                        "text-xs font-medium transition-colors",
                                        preferences?.[section.emailKey] ? "text-blue-700" : "text-surface-500 dark:text-surface-400"
                                    )}>
                                        {preferences?.[section.emailKey] ? 'Email On' : 'Email Off'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
