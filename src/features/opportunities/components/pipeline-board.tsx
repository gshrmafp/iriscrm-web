"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChangeStage } from "@/features/opportunities/hooks";
import type { Opportunity, OpportunityStage } from "@/types/entities";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-client";

const STAGES: OpportunityStage[] = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const NEXT_STAGE: Partial<Record<OpportunityStage, OpportunityStage>> = {
  NEW: "CONTACTED",
  CONTACTED: "QUOTED",
  QUOTED: "NEGOTIATION",
  NEGOTIATION: "WON",
};

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const changeStage = useChangeStage(opportunity.id);
  const nextStage = NEXT_STAGE[opportunity.stage];

  async function advance() {
    if (!nextStage) return;
    try {
      await changeStage.mutateAsync({ toStage: nextStage });
      toast.success(`Moved to ${nextStage}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card className="cursor-pointer gap-2 py-3" onClick={() => router.push(`/opportunities/${opportunity.id}`)}>
      <CardHeader className="px-3">
        <p className="text-sm font-medium">
          ₹{Number(opportunity.value).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-muted-foreground">{opportunity.dealType}</p>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-3">
        <p className="text-xs text-muted-foreground">
          {opportunity.expectedClose
            ? `Close: ${new Date(opportunity.expectedClose).toLocaleDateString()}`
            : ""}
        </p>
        {nextStage ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={changeStage.isPending}
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
            title={`Move to ${nextStage}`}
          >
            <ArrowRight className="size-3.5" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PipelineBoard({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {STAGES.map((stage) => {
        const items = opportunities.filter((o) => o.stage === stage);
        return (
          <div key={stage} className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">
                {stage.toLowerCase()}
              </h3>
              <span className="text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
