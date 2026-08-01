"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, leadStatusTone } from "@/components/status-badge";
import { useLead } from "@/features/leads/hooks";
import { usePicklistLabelResolver } from "@/features/picklists/hooks";
import { FollowUpTimeline } from "@/features/leads/components/follow-up-timeline";
import { LogFollowUpDialog } from "@/features/leads/components/log-follow-up-dialog";
import { QualifyLeadDialog } from "@/features/leads/components/qualify-lead-dialog";
import { MarkLeadLostDialog } from "@/features/leads/components/mark-lead-lost-dialog";
import { CommentSection } from "@/features/comments/components/comment-section";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: lead, isLoading } = useLead(id);
  const resolveLabel = usePicklistLabelResolver();

  if (isLoading || !lead) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const isOpen = lead.status === "NEW";

  return (
    <div>
      <PageHeader
        title={lead.contactName}
        description={`${lead.refNo} · ${lead.companyName ?? "—"}`}
        actions={
          isOpen ? (
            <>
              <LogFollowUpDialog leadId={lead.id} />
              <QualifyLeadDialog leadId={lead.id} />
              <MarkLeadLostDialog leadId={lead.id} />
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
              <span className="text-muted-foreground">Status</span>
              <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{lead.contactPhone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{lead.contactEmail ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span>{resolveLabel("LEAD_SOURCE", lead.source)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product interest</span>
              <span>{resolveLabel("PRODUCT_INTEREST", lead.productInterest) || "—"}</span>
            </div>
            {lead.lostReason ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lost reason</span>
                <span>{lead.lostReason}</span>
              </div>
            ) : null}
            {lead.notes ? (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p>{lead.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Follow-up history</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowUpTimeline followUps={lead.followUps ?? []} />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <CommentSection entityType="LEAD" entityId={lead.id} />
        </div>
      </div>
    </div>
  );
}
