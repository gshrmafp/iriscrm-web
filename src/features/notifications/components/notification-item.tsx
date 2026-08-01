"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AtSign, MessageSquare, RefreshCw, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkNotificationRead } from "@/features/notifications/hooks";
import type { Notification } from "@/types/entities";

const TYPE_ICON: Record<Notification["type"], typeof UserPlus> = {
  QUERY_ASSIGNED: UserPlus,
  QUERY_STATUS_CHANGED: RefreshCw,
  QUERY_COMMENT_ADDED: MessageSquare,
  QUERY_MENTIONED: AtSign,
};

function targetQueryId(notification: Notification) {
  return notification.entityType === "SalesQuery" ? notification.entityId : undefined;
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const Icon = TYPE_ICON[notification.type];
  const unread = !notification.readAt;

  function onClick() {
    if (unread) markRead.mutate(notification.id);
    const queryId = targetQueryId(notification);
    if (queryId) router.push(`/sales-queries/${queryId}`);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent/60",
        unread && "bg-accent/40",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="flex-1">
        <span className="block">{notification.title}</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </span>
      {unread ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
    </button>
  );
}
