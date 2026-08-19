"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, queryPriorityTone, salesQueryStatusTone } from "@/components/status-badge";
import { StatusChangeDialog } from "@/features/sales-queries/components/status-change-dialog";
import {
  useSalesQueryPermissions,
  useStatusTransitionsMeta,
  useTransitionStatus,
} from "@/features/sales-queries/hooks";
import {
  REMARK_REQUIRED_STATUSES,
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_TRANSITIONS,
} from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { SalesQuery, SalesQueryStatus } from "@/types/entities";

function QueryCard({
  query,
  transitions,
  labels,
  remarkRequiredStatuses,
}: {
  query: SalesQuery;
  transitions: Record<SalesQueryStatus, SalesQueryStatus[]>;
  labels: Record<SalesQueryStatus, string>;
  remarkRequiredStatuses: SalesQueryStatus[];
}) {
  const router = useRouter();
  const transitionStatus = useTransitionStatus(query.id);
  const permissions = useSalesQueryPermissions(query);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const nextOptions = transitions[query.status] ?? [];
  const soleNext = nextOptions.length === 1 ? nextOptions[0] : undefined;
  const needsRemark = soleNext ? remarkRequiredStatuses.includes(soleNext) : false;

  async function advance() {
    if (!soleNext) return;
    // Remark-required transitions (e.g. → WON/CLOSED, → CANCELLED) can't be
    // fired blind from the board — route through the dialog so the remark
    // can actually be supplied, instead of always hitting the 422.
    if (needsRemark) {
      setStatusDialogOpen(true);
      return;
    }
    try {
      await transitionStatus.mutateAsync({ toStatus: soleNext });
      toast.success(`Moved to ${labels[soleNext]}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <Card
        className="cursor-pointer gap-2 py-3"
        onClick={() => router.push(`/sales-queries/${query.id}`)}
      >
        <CardHeader className="px-3">
          <p className="text-xs text-muted-foreground">{query.refNo}</p>
          <p className="text-sm font-medium">{query.customerName}</p>
        </CardHeader>
        <CardContent className="flex items-center justify-between px-3">
          <StatusBadge label={query.priority} tone={queryPriorityTone(query.priority)} />
          {soleNext && permissions.canChangeStatus ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              disabled={transitionStatus.isPending}
              onClick={(e) => {
                e.stopPropagation();
                advance();
              }}
              title={`Move to ${labels[soleNext]}`}
            >
              <ArrowRight className="size-3.5" />
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {soleNext ? (
        <StatusChangeDialog
          queryId={query.id}
          currentStatus={query.status}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          initialToStatus={soleNext}
        />
      ) : null}
    </>
  );
}

export function QueryKanbanBoard({ queries }: { queries: SalesQuery[] }) {
  const { data: meta } = useStatusTransitionsMeta();
  const transitions = meta?.transitions ?? STATUS_TRANSITIONS;
  const labels = meta?.labels ?? STATUS_LABELS;
  const remarkRequiredStatuses = meta?.remarkRequiredStatuses ?? REMARK_REQUIRED_STATUSES;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {STATUS_ORDER.map((status) => {
        const items = queries.filter((q) => q.status === status);
        return (
          <div key={status} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <StatusBadge label={labels[status]} tone={salesQueryStatusTone(status)} />
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((query) => (
                <QueryCard
                  key={query.id}
                  query={query}
                  transitions={transitions}
                  labels={labels}
                  remarkRequiredStatuses={remarkRequiredStatuses}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
