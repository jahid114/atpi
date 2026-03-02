import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, Wallet, TrendingUp, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type AppNotification, type NotificationType } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  wallet: { icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10" },
  lti: { icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  sti: { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  general: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" },
};

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: () => void }) {
  const navigate = useNavigate();
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const handleClick = () => {
    onRead();
    if (notification.link) navigate(notification.link);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className={cn("mt-0.5 p-1.5 rounded-md shrink-0", config.bg)}>
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium truncate", !notification.read ? "text-foreground" : "text-muted-foreground")}>
            {notification.title}
          </p>
          {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(notification.timestamp)}</p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors text-foreground">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={markAllAsRead}>
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={() => { markAsRead(n.id); setOpen(false); }} />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
