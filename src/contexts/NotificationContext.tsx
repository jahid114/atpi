import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

export type NotificationType = "wallet" | "lti" | "sti" | "general";
export type NotificationAction = "request" | "approved" | "rejected";

export interface AppNotification {
  id: string;
  type: NotificationType;
  action: NotificationAction;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const initialNotifications: AppNotification[] = [
  {
    id: "init-1",
    type: "wallet",
    action: "request",
    title: "New Wallet Top-Up Request",
    message: "Alice Martin requested a top-up of $5,000",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    link: "/wallet",
  },
  {
    id: "init-2",
    type: "lti",
    action: "request",
    title: "New LTI Registration",
    message: "A new investor registration is pending review",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    link: "/long-term-investment",
  },
  {
    id: "init-3",
    type: "sti",
    action: "request",
    title: "New STI Investment Request",
    message: "Pending investment request for a short-term project",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    link: "/short-term-investment",
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => {
      const newNotification: AppNotification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);

      // Toast alert
      const icons: Record<NotificationAction, string> = {
        request: "📥",
        approved: "✅",
        rejected: "❌",
      };
      toast(notification.title, {
        description: notification.message,
        icon: icons[notification.action],
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
