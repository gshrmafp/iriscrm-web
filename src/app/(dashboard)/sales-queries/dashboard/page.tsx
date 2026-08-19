"use client";

import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  Hourglass,
  MessageCircleQuestion,
  Percent,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, queryPriorityTone, salesQueryStatusTone } from "@/components/status-badge";
import { useDashboardStats } from "@/features/sales-queries/hooks";
import { STATUS_LABELS } from "@/features/sales-queries/constants";

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesQueryDashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const router = useRouter();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const { summary, byStatus, byPriority, recentlyUpdated } = data;
  const maxStatusCount = Math.max(1, ...byStatus.map((s) => s.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Query Dashboard"
        description="Live pipeline and follow-up health for sales queries, scoped to what you can see."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total queries" value={summary.totalQueries} icon={MessageCircleQuestion} />
        <StatTile label="Open" value={summary.openQueries} icon={Hourglass} />
        <StatTile label="Won" value={summary.wonQueries} icon={Trophy} />
        <StatTile label="Lost" value={summary.lostQueries} icon={XCircle} />
        <StatTile label="Conversion rate" value={`${summary.conversionRate}%`} icon={Percent} />
        <StatTile label="Pending follow-ups" value={summary.pendingFollowUps} icon={CalendarClock} />
        <StatTile label="Overdue follow-ups" value={summary.overdueFollowUps} icon={CalendarClock} />
        <StatTile label="Today's visits" value={summary.todayVisits} icon={Building2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Estimated pipeline value"
          value={`₹${summary.totalEstimatedValue.toLocaleString("en-IN")}`}
          icon={Wallet}
        />
        <StatTile
          label="Total budget captured"
          value={`₹${summary.totalBudget.toLocaleString("en-IN")}`}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" />
            By status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {byStatus.map(({ status, count }) => (
              <div key={status} className="rounded-xl border border-border/60 bg-card p-3.5">
                <StatusBadge label={STATUS_LABELS[status]} tone={salesQueryStatusTone(status)} />
                <p className="mt-2.5 text-xl font-semibold tracking-tight">{count}</p>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round((count / maxStatusCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {byPriority.map(({ priority, count }) => (
              <div
                key={priority}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2.5"
              >
                <StatusBadge label={priority} tone={queryPriorityTone(priority)} />
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently updated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentlyUpdated.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing updated recently.</p>
          ) : (
            recentlyUpdated.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => router.push(`/sales-queries/${q.id}`)}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span>
                  <span className="font-medium">{q.customerName}</span>{" "}
                  <span className="text-xs text-muted-foreground">{q.refNo}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge label={STATUS_LABELS[q.status]} tone={salesQueryStatusTone(q.status)} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(q.updatedAt).toLocaleDateString()}
                  </span>
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
