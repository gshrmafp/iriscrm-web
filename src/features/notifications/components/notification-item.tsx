"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowUpDown,
  AtSign,
  Bell,
  CalendarClock,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkNotificationRead } from "@/features/notifications/hooks";
import type { Notification } from "@/types/entities";

// Every backend NotificationType (see Irisbackend/prisma/schema.prisma) must
// have an entry here — an unmapped type would render `undefined` as a
// component and crash the notification list.
const TYPE_ICON: Record<Notification["type"], typeof UserPlus> = {
  QUERY_CREATED: Bell,
  QUERY_ASSIGNED: UserPlus,
  QUERY_STATUS_CHANGED: RefreshCw,
  QUERY_COMMENT_ADDED: MessageSquare,
  QUERY_MENTIONED: AtSign,
  QUERY_CLOSED: CheckCircle2,
  QUERY_PRIORITY_CHANGED: ArrowUpDown,
  QUERY_ATTACHMENT_UPLOADED: Paperclip,
  QUERY_DUE_DATE_UPDATED: CalendarClock,
  FOLLOW_UP_DUE: CalendarClock,
  FOLLOW_UP_OVERDUE: AlertTriangle,
  ENTITY_MENTIONED: AtSign,
};

// entityType/entityId always point at the navigable parent record now (see
// Irisbackend/src/core/events/notificationSubscriber.ts) — never a child
// comment/attachment/follow-up id — so this is a flat 1:1 route map.
const ENTITY_ROUTE: Record<string, string> = {
  SalesQuery: "/sales-queries",
  Lead: "/leads",
  Opportunity: "/opportunities",
};

function targetHref(notification: Notification): string | undefined {
  const base = ENTITY_ROUTE[notification.entityType];
  return base ? `${base}/${notification.entityId}` : undefined;
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const Icon = TYPE_ICON[notification.type];
  const unread = !notification.readAt;
  const href = targetHref(notification);

  function onClick() {
    if (unread) markRead.mutate(notification.id);
    if (href) router.push(href);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!href}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent/60 disabled:cursor-default disabled:hover:bg-transparent",
        unread && "bg-accent/40",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="flex-1 space-y-0.5">
        <span className="block font-medium">{notification.title}</span>
        {notification.body ? (
          <span className="block text-xs text-muted-foreground">{notification.body}</span>
        ) : null}
        <span className="block text-xs text-muted-foreground/80">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </span>
      {unread ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
    </button>
  );
}
