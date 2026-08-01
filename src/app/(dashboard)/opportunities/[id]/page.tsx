"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StatusBadge,
  opportunityStageTone,
} from "@/components/status-badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { canReassignOpportunity } from "@/lib/permissions";
import { useOpportunity } from "@/features/opportunities/hooks";
import { StageHistory } from "@/features/opportunities/components/stage-history";
import { ReassignDialog } from "@/features/opportunities/components/reassign-dialog";
import { WinDialog } from "@/features/opportunities/components/win-dialog";
import { MarkOpportunityLostDialog } from "@/features/opportunities/components/mark-lost-dialog";
import { useOpportunityQuotations } from "@/features/quotations/hooks";
import { VersionHistory } from "@/features/quotations/components/version-history";
import { QuotationBuilderDialog } from "@/features/quotations/components/quotation-builder-dialog";
import { CommentSection } from "@/features/comments/components/comment-section";

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: opportunity, isLoading } = useOpportunity(id);
  const { data: quotations } = useOpportunityQuotations(id);

  if (isLoading || !opportunity) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const isActive = opportunity.stage !== "WON" && opportunity.stage !== "LOST";

  return (
    <div>
      <PageHeader
        title={`Opportunity · ${opportunity.dealType}`}
        description={`₹${Number(opportunity.value).toLocaleString("en-IN")}${
          opportunity.expectedClose
            ? ` · Expected close ${new Date(opportunity.expectedClose).toLocaleDateString()}`
            : ""
        }`}
        actions={
          isActive ? (
            <>
              {canReassignOpportunity(user?.role) ? (
                <ReassignDialog opportunityId={opportunity.id} />
              ) : null}
              <WinDialog
                opportunityId={opportunity.id}
                dealType={opportunity.dealType}
              />
              <MarkOpportunityLostDialog opportunityId={opportunity.id} />
            </>
          ) : null
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage</span>
              <StatusBadge
                label={opportunity.stage}
                tone={opportunityStageTone(opportunity.stage)}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deal type</span>
              <span>{opportunity.dealType}</span>
            </div>
            {opportunity.probability != null ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Probability</span>
                <span>{opportunity.probability}%</span>
              </div>
            ) : null}
            {opportunity.lostReason ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lost reason</span>
                <span>{opportunity.lostReason}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Stage history</CardTitle>
          </CardHeader>
          <CardContent>
            <StageHistory entries={opportunity.stageHistory ?? []} />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Quotations</CardTitle>
            {isActive ? (
              <QuotationBuilderDialog opportunityId={opportunity.id} />
            ) : null}
          </CardHeader>
          <CardContent>
            <VersionHistory
              quotations={quotations ?? []}
              opportunityId={opportunity.id}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <CommentSection entityType="OPPORTUNITY" entityId={opportunity.id} />
        </div>
      </div>
    </div>
  );
}
