"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, queryPriorityTone, salesQueryStatusTone } from "@/components/status-badge";
import { useTransitionStatus } from "@/features/sales-queries/hooks";
import { STATUS_LABELS, STATUS_ORDER, STATUS_TRANSITIONS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { SalesQuery } from "@/types/entities";

function QueryCard({ query }: { query: SalesQuery }) {
  const router = useRouter();
  const transitionStatus = useTransitionStatus(query.id);
  const nextOptions = STATUS_TRANSITIONS[query.status] ?? [];
  const soleNext = nextOptions.length === 1 ? nextOptions[0] : undefined;

  async function advance() {
    if (!soleNext) return;
    try {
      await transitionStatus.mutateAsync({ toStatus: soleNext });
      toast.success(`Moved to ${STATUS_LABELS[soleNext]}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
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
        {soleNext ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={transitionStatus.isPending}
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
            title={`Move to ${STATUS_LABELS[soleNext]}`}
          >
            <ArrowRight className="size-3.5" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function QueryKanbanBoard({ queries }: { queries: SalesQuery[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {STATUS_ORDER.map((status) => {
        const items = queries.filter((q) => q.status === status);
        return (
          <div key={status} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <StatusBadge label={STATUS_LABELS[status]} tone={salesQueryStatusTone(status)} />
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((query) => (
                <QueryCard key={query.id} query={query} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
