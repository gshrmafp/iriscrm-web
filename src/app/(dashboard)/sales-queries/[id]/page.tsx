"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, queryPriorityTone, salesQueryStatusTone } from "@/components/status-badge";
import { useSalesQuery, useSalesQueryPermissions } from "@/features/sales-queries/hooks";
import { STATUS_LABELS } from "@/features/sales-queries/constants";
import { ActivityTimeline } from "@/features/sales-queries/components/activity-timeline";
import { CommentComposer } from "@/features/sales-queries/components/comment-composer";
import { AttachmentUpload } from "@/features/sales-queries/components/attachment-upload";
import { StatusChangeDialog } from "@/features/sales-queries/components/status-change-dialog";
import { AssignDepartmentDialog } from "@/features/sales-queries/components/assign-department-dialog";

export default function SalesQueryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: query, isLoading } = useSalesQuery(id);
  const permissions = useSalesQueryPermissions(query);

  if (isLoading || !query) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div>
      <PageHeader
        title={query.customerName}
        description={`${query.refNo} · ${query.companyName ?? "—"}`}
        actions={
          <>
            {permissions.canAssign ? (
              <AssignDepartmentDialog queryId={query.id} regionId={query.regionId} />
            ) : null}
            {permissions.canChangeStatus ? (
              <StatusChangeDialog queryId={query.id} currentStatus={query.status} />
            ) : null}
          </>
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
              <StatusBadge label={STATUS_LABELS[query.status]} tone={salesQueryStatusTone(query.status)} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <StatusBadge label={query.priority} tone={queryPriorityTone(query.priority)} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span>{query.department?.name ?? "Unassigned"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{query.contactPhone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{query.contactEmail ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meeting type</span>
              <span>{query.meetingType.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visit location</span>
              <span>{query.visitLocation ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product interest</span>
              <span>{query.productInterest ?? "—"}</span>
            </div>
            {query.estimatedValue ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated value</span>
                <span>₹{Number(query.estimatedValue).toLocaleString("en-IN")}</span>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground">Requirement</p>
              <p>{query.requirement}</p>
            </div>
            {query.closeReason ? (
              <div>
                <p className="text-muted-foreground">Close reason</p>
                <p>{query.closeReason}</p>
              </div>
            ) : null}
            <div className="pt-2">
              <AttachmentUpload queryId={query.id} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissions.canComment ? <CommentComposer queryId={query.id} /> : null}
            <ActivityTimeline query={query} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
