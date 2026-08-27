/**
 * NotificationBell component - Shows notification icon with unread count badge
 * Displays dropdown with recent notifications
 */
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Clock, AlertTriangle, Calendar, FileText, MessageSquare, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationStore } from '../../store/notificationStore';
import { Link } from 'react-router-dom';
import type { Notification } from '../../api/notifications';

// Format relative time
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

// Get icon for notification type
const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'deadline_reminder':
            return <AlertTriangle className="w-4 h-4 text-orange-500" />;
        case 'status_change':
            return <FileText className="w-4 h-4 text-blue-500" />;
        case 'visa_reminder':
            return <Calendar className="w-4 h-4 text-green-500" />;
        case 'weekly_digest':
            return <Clock className="w-4 h-4 text-purple-500" />;
        case 'community_reply':
            return <MessageSquare className="w-4 h-4 text-indigo-500" />;
        case 'community_like':
            return <Heart className="w-4 h-4 text-red-500" />;
        default:
            return <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
};

// Get priority color
const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
        case 'critical':
            return 'border-l-red-500';
        case 'high':
            return 'border-l-orange-500';
        case 'medium':
            return 'border-l-yellow-500';
        case 'low':
            return 'border-l-gray-300';
        default:
            return 'border-l-gray-200';
    }
};

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
    } = useNotificationStore();

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();

        // Poll for new notifications every 60 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications(10, 0);
        }
    }, [isOpen, fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-surface-100 dark:bg-surface-700 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-100 dark:border-surface-700 z-50 animate-slide-down overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                        <h3 className="font-semibold text-surface-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <Check className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                                <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                                <p className="text-surface-500 dark:text-surface-400 text-sm">No notifications yet</p>
                                <p className="text-surface-400 text-xs mt-1">We'll notify you about deadlines and updates</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100 dark:divide-surface-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={clsx(
                                            'block px-4 py-3 hover:bg-surface-50 dark:bg-surface-800 transition-colors cursor-pointer border-l-4',
                                            getPriorityColor(notification.priority),
                                            !notification.is_read && 'bg-primary-50/30'
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {notification.link ? (
                                            <Link to={notification.link} className="block" onClick={() => handleNotificationClick(notification)}>
                                                <NotificationContent notification={notification} />
                                            </Link>
                                        ) : (
                                            <NotificationContent notification={notification} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                            <Link
                                to="/settings/notifications"
                                className="flex items-center justify-center gap-1 text-xs text-surface-500 dark:text-surface-400 hover:text-primary-600 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Notification Settings
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Notification content component
function NotificationContent({ notification }: { notification: Notification }) {
    return (
        <div className="flex gap-3">
            <div className="mt-0.5">
                {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={clsx(
                        'text-sm line-clamp-1',
                        notification.is_read ? 'text-surface-700 dark:text-surface-300' : 'text-surface-900 dark:text-white font-medium'
                    )}>
                        {notification.title}
                    </p>
                    {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">
                    {notification.message}
                </p>
                <p className="text-[10px] text-surface-400 mt-1">
                    {formatRelativeTime(notification.created_at)}
                </p>
            </div>
        </div>
    );
}
