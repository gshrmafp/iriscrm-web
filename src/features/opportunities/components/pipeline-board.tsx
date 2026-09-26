"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  Package,
  ShieldCheck,
  Trophy,
  Wrench,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChangeStage } from "@/features/opportunities/hooks";
import { WinDialog } from "@/features/opportunities/components/win-dialog";
import { MarkOpportunityLostDialog } from "@/features/opportunities/components/mark-lost-dialog";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Lead, LeadStageFilter, Opportunity, OpportunityStage } from "@/types/entities";
import type { OpportunityPipelineSummary } from "@/features/opportunities/api";

// Mirrors the old QUOTED -> NEGOTIATION -> MEETING chain under the renamed
// stages. Note the backend now also auto-advances QUOTATION -> FOLLOWUP and
// QUOTATION/FOLLOWUP -> MEETING as a side-effect of logging a follow-up/meeting
// (POST /leads/:id/follow-ups, /meetings). There's no QUOTATION entry here
// any more: Follow-up now renders inside the same "Quotation" column as
// QUOTATION (see opportunityBelongsToStage below), so that transition would
// move a card nowhere visible. FOLLOWUP -> MEETING is still a real, visible
// move out of that merged column.
const NEXT_STAGE: Partial<Record<OpportunityStage, OpportunityStage>> = {
  FOLLOWUP: "MEETING",
};

const CAN_WIN: OpportunityStage[] = ["QUOTATION", "FOLLOWUP", "MEETING"];
const CAN_LOSE: OpportunityStage[] = ["QUOTATION", "FOLLOWUP", "MEETING"];

// The 3 lead-only stages have no Opportunity yet — Quotation/Meeting/Purchase
// Order/Lost are keyed by OpportunityStage as before, with FOLLOWUP folded
// into the QUOTATION column (see membership check in the column loop).
const LEAD_BACKED_STAGES: LeadStageFilter[] = ["NEW_LEAD", "CONTACTED", "QUALIFIED"];

const STAGE_META: Record<LeadStageFilter, { label: string; accent: string; chip: string }> = {
  NEW_LEAD: {
    label: "New Visit / Lead",
    accent: "bg-info",
    chip: "bg-info/10 text-info dark:bg-info/15",
  },
  CONTACTED: {
    label: "Contacted",
    accent: "bg-info",
    chip: "bg-info/10 text-info dark:bg-info/15",
  },
  QUALIFIED: {
    label: "Qualified",
    accent: "bg-success",
    chip: "bg-success/10 text-success dark:bg-success/15",
  },
  QUOTATION: {
    label: "Quotation",
    accent: "bg-warning",
    chip: "bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning",
  },
  MEETING: {
    label: "Meeting",
    accent: "bg-indigo-500",
    chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  PURCHASE_ORDER: {
    label: "PO (Purchase Order)",
    accent: "bg-success",
    chip: "bg-success/10 text-success dark:bg-success/15",
  },
  LOST: {
    label: "Lost",
    accent: "bg-danger",
    chip: "bg-danger/10 text-danger dark:bg-danger/15",
  },
};

const STAGES: LeadStageFilter[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "QUOTATION",
  "MEETING",
  "PURCHASE_ORDER",
  "LOST",
];

const DEAL_TYPE_META: Record<Opportunity["dealType"], { label: string; icon: typeof Wrench }> = {
  INSTALLATION: { label: "Installation", icon: Wrench },
  AMC: { label: "AMC", icon: ShieldCheck },
  PRODUCT: { label: "Product", icon: Package },
  MAINTENANCE: { label: "Maintenance", icon: Wrench },
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function opportunityBelongsToStage(opportunity: Opportunity, stage: LeadStageFilter): boolean {
  if (stage === "QUOTATION") return opportunity.stage === "QUOTATION" || opportunity.stage === "FOLLOWUP";
  return opportunity.stage === stage;
}

// FOLLOWUP isn't a LeadStageFilter key (it's folded into "Quotation" for
// columns), but NEXT_STAGE can still point at it as an OpportunityStage —
// this covers that one case so STAGE_META's lookup stays fully typed.
function opportunityStageLabel(stage: OpportunityStage): string {
  if (stage === "FOLLOWUP") return STAGE_META.QUOTATION.label;
  return STAGE_META[stage].label;
}

function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  return (
    <Card
      className="group cursor-pointer gap-0 border-border/60 p-3 shadow-none transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md"
      onClick={() => router.push(`/leads/${lead.id}`)}
    >
      <p className="truncate text-sm font-semibold tracking-tight">
        {lead.contactName || lead.companyName || lead.refNo}
      </p>
      {lead.contactName && lead.companyName ? (
        <p className="truncate text-xs text-muted-foreground">{lead.companyName}</p>
      ) : null}
      <p className="mt-1.5 truncate text-xs text-muted-foreground">
        {lead.visitLocation || lead.refNo}
      </p>
    </Card>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const changeStage = useChangeStage(opportunity.id);
  const nextStage = NEXT_STAGE[opportunity.stage];
  const canWin = CAN_WIN.includes(opportunity.stage);
  const canLose = CAN_LOSE.includes(opportunity.stage);
  const DealIcon = DEAL_TYPE_META[opportunity.dealType].icon;

  const isOverdue =
    !!opportunity.expectedClose &&
    new Date(opportunity.expectedClose) < new Date() &&
    opportunity.stage !== "PURCHASE_ORDER" &&
    opportunity.stage !== "LOST";

  async function advance() {
    if (!nextStage) return;
    try {
      await changeStage.mutateAsync({ toStage: nextStage });
      toast.success(`Moved to ${opportunityStageLabel(nextStage)}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card
      className="group cursor-pointer gap-0 border-border/60 p-3 shadow-none transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md"
      onClick={() => router.push(`/opportunities/${opportunity.id}`)}
    >
      <div className="space-y-1.5">
        <p className="truncate text-base font-semibold tracking-tight">
          {formatInr(Number(opportunity.value))}
        </p>
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
          <DealIcon className="size-3 shrink-0" />
          <span className="truncate">{DEAL_TYPE_META[opportunity.dealType].label}</span>
        </span>
      </div>

      {opportunity.expectedClose ? (
        <p
          className={cn(
            "mt-1.5 text-xs",
            isOverdue ? "font-medium text-danger" : "text-muted-foreground",
          )}
        >
          {isOverdue ? "Overdue — " : "Close: "}
          {new Date(opportunity.expectedClose).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      ) : null}

      {nextStage || canWin || canLose ? (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
          {nextStage ? (
            <Button
              size="xs"
              variant="outline"
              disabled={changeStage.isPending}
              onClick={(e) => {
                e.stopPropagation();
                advance();
              }}
              title={`Move to ${opportunityStageLabel(nextStage)}`}
            >
              <ArrowRight className="size-3" />
              {opportunityStageLabel(nextStage)}
            </Button>
          ) : null}
          {canWin ? (
            <span onClick={(e) => e.stopPropagation()}>
              <WinDialog
                opportunityId={opportunity.id}
                dealType={opportunity.dealType}
                triggerRender={<Button size="xs" variant="outline" className="text-success hover:text-success" />}
                triggerContent={
                  <>
                    <Trophy className="size-3" />
                    PO
                  </>
                }
              />
            </span>
          ) : null}
          {canLose ? (
            <span onClick={(e) => e.stopPropagation()} className="ml-auto">
              <MarkOpportunityLostDialog
                opportunityId={opportunity.id}
                triggerRender={<Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-danger" />}
                triggerContent={<XCircle className="size-3.5" />}
              />
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function BoardColumn({
  stage,
  count,
  value,
  children,
  hasMore,
  isEmpty,
}: {
  stage: LeadStageFilter;
  count: number;
  value?: number;
  children: ReactNode;
  hasMore: boolean;
  isEmpty: boolean;
}) {
  const meta = STAGE_META[stage];
  return (
    <div className="flex h-[calc(100vh-280px)] min-w-0 flex-col rounded-xl bg-muted/30">
      <div className={cn("h-1 shrink-0 rounded-t-xl", meta.accent)} />
      <div className="shrink-0 p-2.5 pb-1.5">
        <div className="mb-2 flex items-center justify-between">
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight", meta.chip)}>
            {meta.label}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{count}</span>
        </div>
        {value ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3" />
            {formatInr(value)}
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-2.5">
        {children}
        {isEmpty ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
            No {stage === "NEW_LEAD" || stage === "CONTACTED" || stage === "QUALIFIED" ? "leads" : "opportunities"}
          </p>
        ) : null}
        {hasMore ? (
          <p className="pt-1 pb-1 text-center text-xs text-muted-foreground">+ more not shown</p>
        ) : null}
      </div>
    </div>
  );
}

export function PipelineBoard({
  opportunities,
  summary,
  leadColumns,
}: {
  opportunities: Opportunity[];
  summary?: OpportunityPipelineSummary;
  leadColumns: Partial<Record<"NEW_LEAD" | "CONTACTED" | "QUALIFIED", { items: Lead[]; total: number }>>;
}) {
  const summaryByStage = new Map(summary?.byStage.map((s) => [s.stage, s]));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {STAGES.map((stage) => {
          if (LEAD_BACKED_STAGES.includes(stage)) {
            const column = leadColumns[stage as "NEW_LEAD" | "CONTACTED" | "QUALIFIED"];
            const items = column?.items ?? [];
            const total = column?.total ?? items.length;
            return (
              <BoardColumn
                key={stage}
                stage={stage}
                count={total}
                isEmpty={items.length === 0}
                hasMore={total > items.length}
              >
                {items.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </BoardColumn>
            );
          }

          const items = opportunities.filter((o) => opportunityBelongsToStage(o, stage));
          const stageSummary =
            stage === "QUOTATION"
              ? {
                  count: (summaryByStage.get("QUOTATION")?.count ?? 0) + (summaryByStage.get("FOLLOWUP")?.count ?? 0),
                  value: (summaryByStage.get("QUOTATION")?.value ?? 0) + (summaryByStage.get("FOLLOWUP")?.value ?? 0),
                }
              : summaryByStage.get(stage as OpportunityStage);
          const count = stageSummary?.count ?? items.length;
          const value = stageSummary?.value ?? items.reduce((sum, o) => sum + Number(o.value), 0);

          return (
            <BoardColumn
              key={stage}
              stage={stage}
              count={count}
              value={value}
              isEmpty={items.length === 0}
              hasMore={count > items.length}
            >
              {items.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </BoardColumn>
          );
        })}
      </div>
    </div>
  );
}
