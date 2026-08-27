/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Nova Notification Store — Event-based notification system
   The NovaBot widget subscribes to these events and shows speech
   bubbles + changes emotions accordingly.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type NovaNotificationType = "success" | "error" | "info" | "loading";

export interface NovaNotification {
    id: string;
    message: string;
    type: NovaNotificationType;
    duration: number; // ms, Infinity for persistent
    timestamp: number;
}

type Listener = (notification: NovaNotification | null) => void;

const listeners = new Set<Listener>();
let currentNotification: NovaNotification | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

function notify(listeners: Set<Listener>, notification: NovaNotification | null) {
    currentNotification = notification;
    listeners.forEach((fn) => fn(notification));
}

function show(message: string, type: NovaNotificationType, duration: number): string {
    // Clear any existing timer
    if (dismissTimer) {
        clearTimeout(dismissTimer);
        dismissTimer = null;
    }

    const id = `nova-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const notification: NovaNotification = { id, message, type, duration, timestamp: Date.now() };

    notify(listeners, notification);

    // Auto-dismiss (unless Infinity for loading)
    if (duration !== Infinity) {
        dismissTimer = setTimeout(() => {
            // Only dismiss if this notification is still the active one
            if (currentNotification?.id === id) {
                notify(listeners, null);
            }
            dismissTimer = null;
        }, duration);
    }

    return id;
}

function dismiss(id?: string) {
    if (!id || currentNotification?.id === id) {
        if (dismissTimer) {
            clearTimeout(dismissTimer);
            dismissTimer = null;
        }
        notify(listeners, null);
    }
}

// ─── Public API ─────────────────────────────────────────────────────

export const novaToast = {
    success: (message: string) => show(message, "success", 5000),
    error: (message: string) => show(message, "error", 6000),
    info: (message: string) => show(message, "info", 5000),
    loading: (message: string) => show(message, "loading", Infinity),
    dismiss: (id?: string) => dismiss(id),
};

/** Subscribe to notification changes. Returns unsubscribe function. */
export function subscribeNovaNotifications(listener: Listener): () => void {
    listeners.add(listener);
    // Immediately call with current state
    listener(currentNotification);
    return () => { listeners.delete(listener); };
}

export default novaToast;
