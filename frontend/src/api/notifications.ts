/**
 * Notifications API client
 */
import api from './client';

export interface Notification {
    id: number;
    user_id: number;
    type: 'deadline_reminder' | 'status_change' | 'visa_reminder' | 'weekly_digest' | 'community_reply' | 'community_like';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
    read_at?: string;
}

export interface NotificationListResponse {
    notifications: Notification[];
    total: number;
    unread_count: number;
}

export interface NotificationPreferences {
    email_deadline_reminders: boolean;
    email_status_changes: boolean;
    email_visa_reminders: boolean;
    email_weekly_digest: boolean;
    inapp_deadline_reminders: boolean;
    inapp_status_changes: boolean;
    inapp_visa_reminders: boolean;
    inapp_weekly_digest: boolean;
}

export const notificationsApi = {
    /**
     * Get paginated list of notifications
     */
    getNotifications: async (
        limit = 20,
        offset = 0,
        unreadOnly = false
    ): Promise<NotificationListResponse> => {
        const response = await api.get('/notifications', {
            params: { limit, offset, unread_only: unreadOnly },
        });
        return response.data;
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    /**
     * Mark a single notification as read
     */
    markAsRead: async (notificationId: number): Promise<void> => {
        await api.put(`/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<{ message: string }> => {
        const response = await api.put('/notifications/mark-all-read');
        return response.data;
    },

    /**
     * Get notification preferences
     */
    getPreferences: async (): Promise<NotificationPreferences> => {
        const response = await api.get('/notifications/preferences');
        return response.data;
    },

    /**
     * Update notification preferences
     */
    updatePreferences: async (
        preferences: Partial<NotificationPreferences>
    ): Promise<NotificationPreferences> => {
        const response = await api.put('/notifications/preferences', preferences);
        return response.data;
    },
};
