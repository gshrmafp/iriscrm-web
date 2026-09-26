"use client";

import type { ComponentType, ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Shared visual language for every dashboard-style page (main Dashboard,
// Sales Query Dashboard, ...) so KPI cards/section headers look identical
// everywhere rather than each page re-implementing its own.

export type Tone = "primary" | "success" | "warning" | "info" | "danger" | "purple" | "teal";

export const TONE_ICON_CLASSES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-danger/10 text-danger",
  purple: "bg-purple/10 text-purple",
  teal: "bg-teal/10 text-teal",
};

export function relativeTime(timestamp: number) {
  if (!timestamp) return "";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function joinFooter(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ") || undefined;
}

export function computeTrend(current: number, previous: number) {
  if (previous === 0 && current === 0) return { direction: "flat" as const, pct: 0 };
  if (previous === 0) return { direction: "up" as const, pct: 100 };
  const pct = Math.round(((current - previous) / previous) * 100);
  const direction: "up" | "down" | "flat" = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return { direction, pct: Math.abs(pct) };
}

export function TrendChip({ direction, pct }: { direction: "up" | "down" | "flat"; pct: number }) {
  if (direction === "flat") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3" />
        0%
      </span>
    );
  }
  const isUp = direction === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
        isUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
      )}
    >
      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {pct}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  trend,
  footer,
  emphasize,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
  trend?: { direction: "up" | "down" | "flat"; pct: number };
  footer?: string | null;
  emphasize?: boolean;
}) {
  return (
    <Card
      className={cn(
        "group/stat h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        emphasize && "ring-1 ring-primary/15",
      )}
    >
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover/stat:scale-105",
              TONE_ICON_CLASSES[tone],
            )}
          >
            <Icon className="size-5" />
          </div>
          {trend ? <TrendChip direction={trend.direction} pct={trend.pct} /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 truncate font-semibold tracking-tight",
              emphasize ? "text-2xl" : "text-xl",
            )}
          >
            {value}
          </p>
        </div>
        {footer ? (
          <p className="mt-auto text-[11px] text-muted-foreground/80">{footer}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
