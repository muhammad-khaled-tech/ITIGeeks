// src/hooks/useGroupNotifications.js
import { useEffect, useCallback, useRef } from "react";
import {
  NotificationService,
  formatActivityMessage,
} from "../services/notificationService";
import toast from "react-hot-toast";

/**
 * Hook for real-time group activity notifications with theme support
 */
export function useGroupNotifications(groupId, currentUserId, enabled = true) {
  const lastNotificationTime = useRef(0);

  const handleActivity = useCallback((activity) => {
    // Rate limiting: 1 per 2 seconds
    const now = Date.now();
    if (now - lastNotificationTime.current < 2000) return;
    lastNotificationTime.current = now;

    const notification = formatActivityMessage(activity);

    // Theme-aware toast
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white dark:bg-leet-card border-l-4 border-brand shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5 text-2xl">
                {notification.icon}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-leet-text">
                  {notification.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-leet-sub">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l dark:border-leet-border">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-brand hover:text-brand-hover focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-right" },
    );

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        tag: "group-activity",
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled || !groupId || !currentUserId) return;

    const unsubscribe = NotificationService.listenToGroupActivity(
      groupId,
      currentUserId,
      handleActivity,
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [groupId, currentUserId, enabled, handleActivity]);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  return {
    requestPermission,
    hasPermission:
      typeof Notification !== "undefined" &&
      Notification.permission === "granted",
  };
}
