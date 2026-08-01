"use client";

import { useMemo, type ComponentType, type ReactNode } from "react";
import {
  Users,
  Target,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Building2,
  Trophy,
  MessageCircleQuestion,
  Hourglass,
  CalendarClock,
  XCircle,
  Radio,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLeads } from "@/features/leads/hooks";
import { useOpportunities, useOpportunityPipelineSummary } from "@/features/opportunities/hooks";
import { useSalesQueries } from "@/features/sales-queries/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { isManagerOrAbove } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { Department, OpportunityStage, SalesQuery, User } from "@/types/entities";

type Tone = "primary" | "success" | "warning" | "info" | "danger" | "purple" | "teal";

const TONE_ICON_CLASSES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-danger/10 text-danger",
  purple: "bg-purple/10 text-purple",
  teal: "bg-teal/10 text-teal",
};

// Per-stage accent so all six pipeline stages read as visually distinct,
// rather than reusing the same 4 generic status tones.
const STAGE_ACCENT: Record<OpportunityStage, { tone: Tone; bar: string; badge: "info" | "purple" | "warning" | "teal" | "success" | "danger" }> = {
  NEW: { tone: "info", bar: "bg-info", badge: "info" },
  CONTACTED: { tone: "purple", bar: "bg-purple", badge: "purple" },
  QUOTED: { tone: "warning", bar: "bg-warning", badge: "warning" },
  NEGOTIATION: { tone: "teal", bar: "bg-teal", badge: "teal" },
  WON: { tone: "success", bar: "bg-success", badge: "success" },
  LOST: { tone: "danger", bar: "bg-danger", badge: "danger" },
};

const STAGE_LABELS: Record<OpportunityStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUOTED: "Quoted",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

function relativeTime(timestamp: number) {
  if (!timestamp) return "";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}

function joinFooter(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ") || undefined;
}

function computeTrend(current: number, previous: number) {
  if (previous === 0 && current === 0) return { direction: "flat" as const, pct: 0 };
  if (previous === 0) return { direction: "up" as const, pct: 100 };
  const pct = Math.round(((current - previous) / previous) * 100);
  const direction: "up" | "down" | "flat" = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return { direction, pct: Math.abs(pct) };
}

function TrendChip({ direction, pct }: { direction: "up" | "down" | "flat"; pct: number }) {
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

function StatCard({
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

function SectionCard({
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

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Real week-over-week windows (no fabricated numbers) — used to compute
  // genuine trend chips for the count-based KPIs below.
  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const fourteenDaysAgo = useMemo(() => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), []);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();
  const fourteenDaysAgoIso = fourteenDaysAgo.toISOString();

  const { data: newLeadsPage, dataUpdatedAt: leadsUpdatedAt } = useLeads({ status: "NEW", pageSize: 1 });
  const { data: newLeadsThisWeek } = useLeads({ status: "NEW", dateFrom: sevenDaysAgoIso, pageSize: 1 });
  const { data: newLeadsPrevWeek } = useLeads({
    status: "NEW",
    dateFrom: fourteenDaysAgoIso,
    dateTo: sevenDaysAgoIso,
    pageSize: 1,
  });

  const { data: pipelineSummary, dataUpdatedAt: pipelineUpdatedAt } = useOpportunityPipelineSummary();
  const { data: oppsThisWeek } = useOpportunities({ dateFrom: sevenDaysAgoIso, pageSize: 1 });
  const { data: oppsPrevWeek } = useOpportunities({
    dateFrom: fourteenDaysAgoIso,
    dateTo: sevenDaysAgoIso,
    pageSize: 1,
  });

  const { data: queriesPage, dataUpdatedAt: queriesUpdatedAt } = useSalesQueries();
  const { data: queriesThisWeek } = useSalesQueries({ dateFrom: sevenDaysAgoIso, pageSize: 1 });
  const { data: queriesPrevWeek } = useSalesQueries({
    dateFrom: fourteenDaysAgoIso,
    dateTo: sevenDaysAgoIso,
    pageSize: 1,
  });

  const salesQueries = queriesPage?.items ?? [];
  const { data: departments = [] } = useDepartments();
  const { data: users = [] } = useUserDirectory();
  const isManager = isManagerOrAbove(user?.role);

  const openLeads = newLeadsPage?.total ?? 0;
  const openOpportunitiesCount = pipelineSummary?.openCount ?? 0;
  const pipelineValue = pipelineSummary?.pipelineValue ?? 0;
  const weightedForecast = pipelineSummary?.weightedForecast ?? 0;
  const byStage = pipelineSummary?.byStage ?? [];
  const maxStageCount = Math.max(1, ...byStage.map((s) => s.count));
  const totalStageCount = byStage.reduce((sum, s) => sum + s.count, 0);

  const leadsTrend = computeTrend(newLeadsThisWeek?.total ?? 0, newLeadsPrevWeek?.total ?? 0);
  const oppsTrend = computeTrend(oppsThisWeek?.total ?? 0, oppsPrevWeek?.total ?? 0);
  const queriesTrend = computeTrend(queriesThisWeek?.total ?? 0, queriesPrevWeek?.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Pipeline and forecast snapshot across leads and opportunities."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open leads"
          value={openLeads}
          icon={Users}
          tone="primary"
          trend={leadsTrend}
          footer={joinFooter(`${newLeadsThisWeek?.total ?? 0} new this week`, relativeTime(leadsUpdatedAt))}
          emphasize
        />
        <StatCard
          label="Open opportunities"
          value={openOpportunitiesCount}
          icon={Target}
          tone="info"
          trend={oppsTrend}
          footer={joinFooter(`${oppsThisWeek?.total ?? 0} created this week`, relativeTime(pipelineUpdatedAt))}
          emphasize
        />
        <StatCard
          label="Pipeline value"
          value={`₹${pipelineValue.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="success"
          footer={relativeTime(pipelineUpdatedAt)}
        />
        <StatCard
          label="Weighted forecast"
          value={`₹${weightedForecast.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          tone="warning"
          footer={relativeTime(pipelineUpdatedAt)}
        />
      </div>

      <SectionCard
        title="Pipeline by stage"
        icon={Layers}
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <Radio className="size-3 text-success" />
            {totalStageCount} total
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {byStage.map(({ stage, count, value }) => {
            const accent = STAGE_ACCENT[stage];
            return (
              <div
                key={stage}
                className="group/stage relative overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-sm"
              >
                <div className={cn("absolute inset-x-0 top-0 h-1", accent.bar)} />
                <StatusBadge label={STAGE_LABELS[stage]} tone={accent.badge} />
                <p className="mt-2.5 text-xl font-semibold tracking-tight">{count}</p>
                <p className="text-xs text-muted-foreground">
                  ₹{value.toLocaleString("en-IN")}
                </p>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", accent.bar)}
                    style={{ width: `${Math.round((count / maxStageCount) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {isManager ? (
        <ManagerQueryDashboard
          queries={salesQueries}
          departments={departments}
          users={users}
          totalTrend={queriesTrend}
          newThisWeek={queriesThisWeek?.total ?? 0}
          updatedAt={queriesUpdatedAt}
        />
      ) : (
        <ExecQueryDashboard queries={salesQueries} ownerId={user?.id} />
      )}
    </div>
  );
}

const TERMINAL_QUERY_STATUSES = new Set(["WON", "LOST", "CANCELLED", "CLOSED"]);

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function ExecQueryDashboard({
  queries,
  ownerId,
}: {
  queries: SalesQuery[];
  ownerId?: string;
}) {
  const myQueries = queries.filter((q) => q.ownerId === ownerId);
  const pendingFollowUps = myQueries.filter((q) => !TERMINAL_QUERY_STATUSES.has(q.status));
  const today = new Date();
  const todaysVisits = myQueries.filter((q) => q.visitDate && isSameDay(new Date(q.visitDate), today));
  const won = myQueries.filter((q) => q.status === "WON").length;
  const lost = myQueries.filter((q) => q.status === "LOST").length;

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <MessageCircleQuestion className="size-4 text-primary" />
        My Sales Queries
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="My queries" value={myQueries.length} icon={MessageCircleQuestion} tone="primary" />
        <StatCard label="Pending follow-ups" value={pendingFollowUps.length} icon={Hourglass} tone="warning" />
        <StatCard label="Today's visits" value={todaysVisits.length} icon={CalendarClock} tone="info" />
        <StatCard label="Won" value={won} icon={Trophy} tone="success" />
        <StatCard label="Lost" value={lost} icon={XCircle} tone="danger" />
      </div>
    </div>
  );
}

function ManagerQueryDashboard({
  queries,
  departments,
  users,
  totalTrend,
  newThisWeek,
  updatedAt,
}: {
  queries: SalesQuery[];
  departments: Department[];
  users: User[];
  totalTrend: { direction: "up" | "down" | "flat"; pct: number };
  newThisWeek: number;
  updatedAt: number;
}) {
  const pending = queries.filter((q) => !TERMINAL_QUERY_STATUSES.has(q.status));
  // "Delayed" (non-terminal + untouched for 3+ days) is deferred — it needs a
  // real SLA field from the backend, and computing it here would mean reading
  // the current time during render, which this app's React Compiler disallows.

  const byDepartment = new Map<string, { name: string; count: number }>();
  queries.forEach((q) => {
    const dept = departments.find((d) => d.id === q.departmentId);
    const key = dept?.id ?? "unassigned";
    const existing = byDepartment.get(key);
    byDepartment.set(key, {
      name: dept?.name ?? "Unassigned",
      count: (existing?.count ?? 0) + 1,
    });
  });
  const maxDeptCount = Math.max(1, ...Array.from(byDepartment.values()).map((d) => d.count));

  const byOwner = new Map<string, { name: string; won: number; lost: number; open: number }>();
  queries.forEach((q) => {
    const owner = users.find((u) => u.id === q.ownerId);
    const key = q.ownerId;
    const existing = byOwner.get(key) ?? { name: owner?.name ?? q.ownerId, won: 0, lost: 0, open: 0 };
    if (q.status === "WON") existing.won += 1;
    else if (q.status === "LOST") existing.lost += 1;
    else if (!TERMINAL_QUERY_STATUSES.has(q.status)) existing.open += 1;
    byOwner.set(key, existing);
  });

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <MessageCircleQuestion className="size-4 text-primary" />
        Sales Query Management
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total queries"
          value={queries.length}
          icon={MessageCircleQuestion}
          tone="primary"
          trend={totalTrend}
          footer={joinFooter(`${newThisWeek} new this week`, relativeTime(updatedAt))}
        />
        <StatCard label="Pending" value={pending.length} icon={Hourglass} tone="warning" />
      </div>

      <SectionCard title="Department-wise queries" icon={Building2}>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from(byDepartment.values()).map((d) => (
            <div
              key={d.name}
              className="group/dept rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-sm"
            >
              <StatusBadge label={d.name} tone="info" />
              <p className="mt-2.5 text-xl font-semibold tracking-tight">{d.count}</p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-info transition-all duration-300"
                  style={{ width: `${Math.round((d.count / maxDeptCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Team performance" icon={Trophy}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sales Executive</TableHead>
              <TableHead>Open</TableHead>
              <TableHead>Won</TableHead>
              <TableHead>Lost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(byOwner.values()).map((row) => (
              <TableRow key={row.name} className="group/row">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm" className="transition-transform duration-200 group-hover/row:scale-105">
                      <AvatarFallback>{initials(row.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell>{row.open}</TableCell>
                <TableCell>
                  <span className="font-medium text-success">{row.won}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-danger">{row.lost}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
