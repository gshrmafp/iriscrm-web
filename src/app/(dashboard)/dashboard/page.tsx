"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Target, Wallet, TrendingUp, Layers, Radio, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { DateRangeFilter, type DateRangeValue } from "@/components/dashboard/date-range-filter";
import {
  SectionCard,
  StatCard,
  computeTrend,
  joinFooter,
  relativeTime,
} from "@/components/dashboard/stat-primitives";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLeadJourneySummary, useLeads, useTeamPerformance } from "@/features/leads/hooks";
import { useOpportunities, useOpportunityPipelineSummary } from "@/features/opportunities/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import type { JourneyRecentLead, JourneyStageSummary, TeamPerformanceRow } from "@/features/leads/api";
import { isManagerOrAbove } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { LeadStageFilter } from "@/types/entities";

const STAGE_ORDER: LeadStageFilter[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "QUOTATION",
  "MEETING",
  "PURCHASE_ORDER",
  "LOST",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Per-stage presentation for the 7-stage Lead Journey breakdown — mirrors
// the same labels/tones used on the Leads list (leads/page.tsx's
// deriveLeadStage / STAGE_OPTIONS) so the app reads consistently everywhere.
const STAGE_META: Record<LeadStageFilter, { label: string; badge: "info" | "purple" | "warning" | "teal" | "success" | "danger"; bar: string }> = {
  NEW_LEAD: { label: "New Visit / Lead", badge: "info", bar: "bg-info" },
  CONTACTED: { label: "Contacted", badge: "info", bar: "bg-info" },
  QUALIFIED: { label: "Qualified", badge: "success", bar: "bg-success" },
  QUOTATION: { label: "Quotation", badge: "warning", bar: "bg-warning" },
  MEETING: { label: "Meeting", badge: "purple", bar: "bg-indigo-500" },
  PURCHASE_ORDER: { label: "PO (Purchase Order)", badge: "success", bar: "bg-success" },
  LOST: { label: "Lost", badge: "danger", bar: "bg-danger" },
};

function MiniStatChip({
  label,
  tone,
  count,
  value,
}: {
  label: string;
  tone: "success" | "danger";
  count: number;
  value?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
        tone === "success" ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5",
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone === "success" ? "bg-success" : "bg-danger")} />
      <span className="font-medium text-foreground">{label}</span>
      <span className="font-semibold">{count}</span>
      {value ? <span className="text-muted-foreground">₹{value.toLocaleString("en-IN")}</span> : null}
    </div>
  );
}

function StageTile({ stage }: { stage: JourneyStageSummary }) {
  const meta = STAGE_META[stage.stage];
  return (
    <div className="group/stage relative overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-sm">
      <div className={cn("absolute inset-x-0 top-0 h-1", meta.bar)} />
      <StatusBadge label={meta.label} tone={meta.badge} />
      <p className="mt-2.5 text-xl font-semibold tracking-tight">{stage.count}</p>
      <p className="text-xs text-muted-foreground">
        {stage.value ? `₹${stage.value.toLocaleString("en-IN")}` : " "}
      </p>
    </div>
  );
}

function recentLeadLabel(lead: JourneyRecentLead) {
  return lead.contactName || lead.companyName || lead.refNo;
}

function StageRecentLeadsCard({ stage }: { stage: JourneyStageSummary }) {
  const router = useRouter();
  const meta = STAGE_META[stage.stage];

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <span className={cn("size-1.5 shrink-0 rounded-full", meta.bar)} />
          {meta.label}
          <span className="font-normal text-muted-foreground">({stage.count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stage.recentLeads.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">No leads yet.</p>
        ) : (
          <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
            {stage.recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted"
              >
                <span className="truncate">{recentLeadLabel(lead)}</span>
                <span className="shrink-0 text-muted-foreground">{relativeTime(new Date(lead.updatedAt).getTime())}</span>
              </Link>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => router.push(`/leads?stage=${stage.stage}`)}
        >
          View all →
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamPerformanceSection({
  rows,
  nameFor,
}: {
  rows: TeamPerformanceRow[];
  nameFor: (id: string) => string;
}) {
  const router = useRouter();

  return (
    <SectionCard
      title="Team performance"
      icon={Trophy}
      action={
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/leads")}>
          View all →
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sales Executive</TableHead>
            {STAGE_ORDER.map((stage) => (
              <TableHead key={stage}>{STAGE_META[stage].label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const name = nameFor(row.ownerId);
            return (
              <TableRow
                key={row.ownerId}
                className="group/row cursor-pointer"
                onClick={() => router.push(`/leads?ownerId=${row.ownerId}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm" className="transition-transform duration-200 group-hover/row:scale-105">
                      <AvatarFallback>{initials(name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{name}</span>
                  </div>
                </TableCell>
                {STAGE_ORDER.map((stage) => (
                  <TableCell key={stage}>{row.counts[stage] ?? 0}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isManager = isManagerOrAbove(user?.role);
  const [dateRange, setDateRange] = useState<DateRangeValue>({});

  // Real week-over-week windows (no fabricated numbers) — used to compute
  // genuine trend chips for the count-based KPIs below. Deliberately
  // independent of the selected date-range filter, which narrows the KPI
  // totals themselves rather than this trend comparison. useState's lazy
  // initializer (not useMemo, which must stay pure) is the sanctioned place
  // for this one-time impure `Date.now()` read.
  const [sevenDaysAgoIso] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const [fourteenDaysAgoIso] = useState(() => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

  const { data: newLeadsPage, dataUpdatedAt: leadsUpdatedAt } = useLeads({
    status: "NEW",
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    pageSize: 1,
  });
  const { data: newLeadsThisWeek } = useLeads({ status: "NEW", dateFrom: sevenDaysAgoIso, pageSize: 1 });
  const { data: newLeadsPrevWeek } = useLeads({
    status: "NEW",
    dateFrom: fourteenDaysAgoIso,
    dateTo: sevenDaysAgoIso,
    pageSize: 1,
  });

  const { data: pipelineSummary, dataUpdatedAt: pipelineUpdatedAt } = useOpportunityPipelineSummary({
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });
  const { data: oppsThisWeek } = useOpportunities({ dateFrom: sevenDaysAgoIso, pageSize: 1 });
  const { data: oppsPrevWeek } = useOpportunities({
    dateFrom: fourteenDaysAgoIso,
    dateTo: sevenDaysAgoIso,
    pageSize: 1,
  });

  const { data: journeySummary, dataUpdatedAt: journeyUpdatedAt } = useLeadJourneySummary({
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });

  const { data: teamPerformance = [] } = useTeamPerformance(
    { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo },
    { enabled: isManager },
  );
  const { data: users = [] } = useUserDirectory();
  const nameFor = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name] as const));
    return (id: string) => map.get(id) ?? id;
  }, [users]);

  // Full roster, not just owners who already have a lead: union every Sales
  // Executive in scope with anyone appearing in the counts data (e.g. a
  // manager who owns a lead directly), defaulting missing counts to zero.
  const teamPerformanceRows = useMemo(() => {
    const countsByOwner = new Map(teamPerformance.map((row) => [row.ownerId, row.counts] as const));
    const zeroCounts = Object.fromEntries(STAGE_ORDER.map((stage) => [stage, 0])) as Record<
      LeadStageFilter,
      number
    >;
    const rosterIds = new Set([
      ...users.filter((u) => u.role === "SALES_EXECUTIVE").map((u) => u.id),
      ...teamPerformance.map((row) => row.ownerId),
    ]);
    return Array.from(rosterIds)
      .map((ownerId) => ({ ownerId, counts: countsByOwner.get(ownerId) ?? zeroCounts }))
      .sort((a, b) => nameFor(a.ownerId).localeCompare(nameFor(b.ownerId)));
  }, [users, teamPerformance, nameFor]);

  const openLeads = newLeadsPage?.total ?? 0;
  const openOpportunitiesCount = pipelineSummary?.openCount ?? 0;
  const pipelineValue = pipelineSummary?.pipelineValue ?? 0;
  const weightedForecast = pipelineSummary?.weightedForecast ?? 0;
  const stages = journeySummary?.stages ?? [];
  const totalStageCount = journeySummary?.total ?? 0;
  const poStage = stages.find((s) => s.stage === "PURCHASE_ORDER");
  const lostStage = stages.find((s) => s.stage === "LOST");
  const pipelineTiles = stages.filter((s) => s.stage !== "PURCHASE_ORDER" && s.stage !== "LOST");

  const leadsTrend = computeTrend(newLeadsThisWeek?.total ?? 0, newLeadsPrevWeek?.total ?? 0);
  const oppsTrend = computeTrend(oppsThisWeek?.total ?? 0, oppsPrevWeek?.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Pipeline and forecast snapshot across leads and opportunities."
        actions={
          <div className="flex flex-col items-end gap-2">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <div className="flex items-center gap-2">
              {poStage ? (
                <MiniStatChip label="PO (Purchase Order)" tone="success" count={poStage.count} value={poStage.value} />
              ) : null}
              {lostStage ? (
                <MiniStatChip label="Lost" tone="danger" count={lostStage.count} value={lostStage.value} />
              ) : null}
            </div>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open leads"
          value={openLeads}
          icon={Users}
          tone="primary"
          trend={leadsTrend}
          footer={joinFooter(`${newLeadsThisWeek?.total ?? 0} new this week`, `Updated ${relativeTime(leadsUpdatedAt)}`)}
          emphasize
        />
        <StatCard
          label="Open opportunities"
          value={openOpportunitiesCount}
          icon={Target}
          tone="info"
          trend={oppsTrend}
          footer={joinFooter(`${oppsThisWeek?.total ?? 0} created this week`, `Updated ${relativeTime(pipelineUpdatedAt)}`)}
          emphasize
        />
        <StatCard
          label="Pipeline value"
          value={`₹${pipelineValue.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="success"
          footer={`Updated ${relativeTime(pipelineUpdatedAt)}`}
        />
        <StatCard
          label="Weighted forecast"
          value={`₹${weightedForecast.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          tone="warning"
          footer={`Updated ${relativeTime(pipelineUpdatedAt)}`}
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
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {pipelineTiles.map((stage) => (
            <StageTile key={stage.stage} stage={stage} />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/80">Updated {relativeTime(journeyUpdatedAt)}</p>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stages.map((stage) => (
          <StageRecentLeadsCard key={stage.stage} stage={stage} />
        ))}
      </div>

      {isManager && teamPerformanceRows.length > 0 ? (
        <TeamPerformanceSection rows={teamPerformanceRows} nameFor={nameFor} />
      ) : null}
    </div>
  );
}
