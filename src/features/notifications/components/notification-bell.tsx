"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks";
import { NotificationItem } from "@/features/notifications/components/notification-item";

export function NotificationBell() {
  const { data } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.items ?? [];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-muted hover:text-foreground transition-colors rounded-full"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-medium">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            items.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
