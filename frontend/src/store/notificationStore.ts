/**
 * Notification state management with Zustand
 */
import { create } from 'zustand';
import {
    notificationsApi,
    Notification,
    NotificationPreferences,
} from '../api/notifications';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    total: number;
    preferences: NotificationPreferences | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchNotifications: (limit?: number, offset?: number) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchPreferences: () => Promise<void>;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
    clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    total: 0,
    preferences: null,
    isLoading: false,
    error: null,

    fetchNotifications: async (limit = 20, offset = 0) => {
        set({ isLoading: true, error: null });
        try {
            const response = await notificationsApi.getNotifications(limit, offset);
            set({
                notifications: response.notifications,
                unreadCount: response.unread_count,
                total: response.total,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Failed to fetch notifications',
                isLoading: false,
            });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await notificationsApi.getUnreadCount();
            set({ unreadCount: response.unread_count });
        } catch (error) {
            // Silently fail for badge updates
            console.error('Failed to fetch unread count:', error);
        }
    },

    markAsRead: async (notificationId: number) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            const notifications = get().notifications.map((n) =>
                n.id === notificationId ? { ...n, is_read: true } : n
            );
            const unreadCount = Math.max(0, get().unreadCount - 1);
            set({ notifications, unreadCount });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Failed to mark as read' });
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationsApi.markAllAsRead();
            const notifications = get().notifications.map((n) => ({ ...n, is_read: true }));
            set({ notifications, unreadCount: 0 });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Failed to mark all as read' });
        }
    },

    fetchPreferences: async () => {
        try {
            const preferences = await notificationsApi.getPreferences();
            set({ preferences });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Failed to fetch preferences' });
        }
    },

    updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
        try {
            const updated = await notificationsApi.updatePreferences(preferences);
            set({ preferences: updated });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Failed to update preferences' });
        }
    },

    clearError: () => set({ error: null }),
}));
