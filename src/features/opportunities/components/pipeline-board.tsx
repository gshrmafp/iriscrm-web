"use client";

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
import type { Opportunity, OpportunityStage } from "@/types/entities";
import type { OpportunityPipelineSummary } from "@/features/opportunities/api";

const NEXT_STAGE: Partial<Record<OpportunityStage, OpportunityStage>> = {
  NEW: "CONTACTED",
  CONTACTED: "QUALIFIED",
  QUALIFIED: "QUOTED",
  QUOTED: "NEGOTIATION",
  NEGOTIATION: "MEETING",
};

const CAN_WIN: OpportunityStage[] = ["QUOTED", "NEGOTIATION", "MEETING"];
const CAN_LOSE: OpportunityStage[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "NEGOTIATION", "MEETING"];

const STAGE_META: Record<
  OpportunityStage,
  { label: string; accent: string; chip: string }
> = {
  NEW: {
    label: "New Visit / Lead",
    accent: "bg-info",
    chip: "bg-info/10 text-info dark:bg-info/15",
  },
  CONTACTED: {
    label: "Contacted",
    accent: "bg-purple",
    chip: "bg-purple/10 text-purple dark:bg-purple/15",
  },
  QUALIFIED: {
    label: "Qualified",
    accent: "bg-teal",
    chip: "bg-teal/10 text-teal dark:bg-teal/15",
  },
  QUOTED: {
    label: "Quotation",
    accent: "bg-warning",
    chip: "bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning",
  },
  NEGOTIATION: {
    label: "Follow-ups",
    accent: "bg-orange-500",
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  MEETING: {
    label: "Meeting",
    accent: "bg-indigo-500",
    chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  WON: {
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

const STAGES: OpportunityStage[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "NEGOTIATION", "MEETING", "WON"];

const DEAL_TYPE_META: Record<Opportunity["dealType"], { label: string; icon: typeof Wrench }> = {
  INSTALLATION: { label: "Installation", icon: Wrench },
  AMC: { label: "AMC", icon: ShieldCheck },
  PRODUCT: { label: "Product", icon: Package },
  MAINTENANCE: { label: "Maintenance", icon: Wrench },
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
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
    opportunity.stage !== "WON" &&
    opportunity.stage !== "LOST";

  async function advance() {
    if (!nextStage) return;
    try {
      await changeStage.mutateAsync({ toStage: nextStage });
      toast.success(`Moved to ${STAGE_META[nextStage].label}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card
      className="group cursor-pointer gap-0 border-border/60 p-3 shadow-none transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md"
      onClick={() => router.push(`/opportunities/${opportunity.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold tracking-tight">
          {formatInr(Number(opportunity.value))}
        </p>
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
          <DealIcon className="size-3" />
          {DEAL_TYPE_META[opportunity.dealType].label}
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
            title={`Move to ${STAGE_META[nextStage].label}`}
          >
            <ArrowRight className="size-3" />
            {STAGE_META[nextStage].label}
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
    </Card>
  );
}

export function PipelineBoard({
  opportunities,
  summary,
}: {
  opportunities: Opportunity[];
  summary?: OpportunityPipelineSummary;
}) {
  const summaryByStage = new Map(summary?.byStage.map((s) => [s.stage, s]));
  const lostItems = opportunities.filter((o) => o.stage === "LOST");
  const lostSummary = summaryByStage.get("LOST");
  const lostCount = lostSummary?.count ?? lostItems.length;
  const lostValue = lostSummary?.value ?? lostItems.reduce((sum, o) => sum + Number(o.value), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {STAGES.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage);
          const meta = STAGE_META[stage];
          const stageSummary = summaryByStage.get(stage);
          const count = stageSummary?.count ?? items.length;
          const value = stageSummary?.value ?? items.reduce((sum, o) => sum + Number(o.value), 0);

          return (
            <div key={stage} className="flex h-[calc(100vh-280px)] min-w-0 flex-col rounded-xl bg-muted/30">
              <div className={cn("h-1 shrink-0 rounded-t-xl", meta.accent)} />
              <div className="shrink-0 p-2.5 pb-1.5">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight",
                      meta.chip,
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{count}</span>
                </div>
                {value > 0 ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="size-3" />
                    {formatInr(value)}
                  </p>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-2.5">
                {items.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No opportunities
                  </p>
                ) : null}
                {count > items.length ? (
                  <p className="pt-1 pb-1 text-center text-xs text-muted-foreground">
                    +{count - items.length} more not shown
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost summary bar */}
      {lostCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STAGE_META.LOST.chip)}>
            Lost
          </span>
          <span className="text-sm text-muted-foreground">
            {lostCount} opportunities · {formatInr(lostValue)}
          </span>
        </div>
      )}
    </div>
  );
}
