"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { StatusBadge, queryPriorityTone, salesQueryStatusTone } from "@/components/status-badge";
import { DateRangeFilter, type DateRangeValue } from "@/components/dashboard/date-range-filter";
import { SectionCard, StatCard } from "@/components/dashboard/stat-primitives";
import { useDashboardStats } from "@/features/sales-queries/hooks";
import { STATUS_LABELS } from "@/features/sales-queries/constants";

export default function SalesQueryDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({});
  const { data, isLoading } = useDashboardStats({
    fromDate: dateRange.dateFrom,
    toDate: dateRange.dateTo,
  });
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Query Dashboard"
        description="Live pipeline and follow-up health for sales queries, scoped to what you can see."
        actions={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      />

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DashboardBody data={data} onOpenQuery={(id) => router.push(`/sales-queries/${id}`)} />
      )}
    </div>
  );
}

function DashboardBody({
  data,
  onOpenQuery,
}: {
  data: NonNullable<ReturnType<typeof useDashboardStats>["data"]>;
  onOpenQuery: (id: string) => void;
}) {
  const { summary, byStatus, byPriority, recentlyUpdated } = data;
  const maxStatusCount = Math.max(1, ...byStatus.map((s) => s.count));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total queries" value={summary.totalQueries} icon={MessageCircleQuestion} tone="primary" emphasize />
        <StatCard label="Open" value={summary.openQueries} icon={Hourglass} tone="warning" emphasize />
        <StatCard label="Won" value={summary.wonQueries} icon={Trophy} tone="success" emphasize />
        <StatCard label="Lost" value={summary.lostQueries} icon={XCircle} tone="danger" emphasize />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Conversion rate" value={`${summary.conversionRate}%`} icon={Percent} tone="info" />
        <StatCard label="Pending follow-ups" value={summary.pendingFollowUps} icon={CalendarClock} tone="warning" />
        <StatCard label="Overdue follow-ups" value={summary.overdueFollowUps} icon={CalendarClock} tone="danger" />
        <StatCard label="Today's visits" value={summary.todayVisits} icon={Building2} tone="info" />
        <StatCard
          label="Pipeline value"
          value={`₹${summary.totalEstimatedValue.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Total budget"
          value={`₹${summary.totalBudget.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="teal"
        />
      </div>

      <SectionCard title="By status" icon={BarChart3}>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {byStatus.map(({ status, count }) => (
            <div
              key={status}
              className="group/status relative overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-sm"
            >
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
      </SectionCard>

      <SectionCard title="By priority" icon={BarChart3}>
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
      </SectionCard>

      <SectionCard title="Recently updated" icon={CalendarClock}>
        <div className="space-y-2">
          {recentlyUpdated.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing updated recently.</p>
          ) : (
            recentlyUpdated.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onOpenQuery(q.id)}
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
        </div>
      </SectionCard>
    </>
  );
}
