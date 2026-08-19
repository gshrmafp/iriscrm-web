"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, followUpStatusTone } from "@/components/status-badge";
import {
  useCancelFollowUp,
  useCompleteFollowUp,
  useFollowUps,
  useRescheduleFollowUp,
} from "@/features/sales-queries/hooks";
import { FOLLOW_UP_STATUS_LABELS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { QueryFollowUp } from "@/types/entities";

function CompleteDialog({
  queryId,
  followUp,
  open,
  onOpenChange,
}: {
  queryId: string;
  followUp: QueryFollowUp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [customerResponse, setCustomerResponse] = useState("");
  const [outcome, setOutcome] = useState("");
  const completeFollowUp = useCompleteFollowUp(queryId);

  async function onConfirm() {
    try {
      await completeFollowUp.mutateAsync({
        followUpId: followUp.id,
        payload: { customerResponse: customerResponse || undefined, outcome: outcome || undefined },
      });
      toast.success("Follow-up marked complete");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete follow-up</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Customer response (optional)</Label>
          <Textarea value={customerResponse} onChange={(e) => setCustomerResponse(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Outcome (optional)</Label>
          <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={completeFollowUp.isPending}>
            {completeFollowUp.isPending ? "Saving…" : "Mark complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RescheduleDialog({
  queryId,
  followUp,
  open,
  onOpenChange,
}: {
  queryId: string;
  followUp: QueryFollowUp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("");
  const rescheduleFollowUp = useRescheduleFollowUp(queryId);

  async function onConfirm() {
    if (!scheduledAt) return;
    try {
      await rescheduleFollowUp.mutateAsync({
        followUpId: followUp.id,
        payload: { scheduledAt: new Date(scheduledAt).toISOString(), note: note || undefined },
      });
      toast.success("Follow-up rescheduled");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule follow-up</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>New date/time</Label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={rescheduleFollowUp.isPending || !scheduledAt}>
            {rescheduleFollowUp.isPending ? "Saving…" : "Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({
  queryId,
  followUp,
  open,
  onOpenChange,
}: {
  queryId: string;
  followUp: QueryFollowUp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cancelFollowUp = useCancelFollowUp(queryId);

  async function onConfirm() {
    try {
      await cancelFollowUp.mutateAsync(followUp.id);
      toast.success("Follow-up cancelled");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this follow-up?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &ldquo;{followUp.title}&rdquo; scheduled for {format(new Date(followUp.scheduledAt), "PPp")} will be marked cancelled.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={cancelFollowUp.isPending}>
            {cancelFollowUp.isPending ? "Cancelling…" : "Cancel follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpRow({
  queryId,
  followUp,
  canManage,
}: {
  queryId: string;
  followUp: QueryFollowUp;
  canManage: boolean;
}) {
  const [action, setAction] = useState<"complete" | "reschedule" | "cancel" | null>(null);
  const isActionable = followUp.status === "PENDING" || followUp.status === "OVERDUE";

  return (
    <li className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{followUp.title}</p>
        <StatusBadge label={FOLLOW_UP_STATUS_LABELS[followUp.status]} tone={followUpStatusTone(followUp.status)} />
      </div>
      <p className="text-xs text-muted-foreground">
        {format(new Date(followUp.scheduledAt), "PPp")}
        {followUp.channel ? ` · ${followUp.channel}` : ""}
      </p>
      {followUp.note ? <p className="text-sm text-muted-foreground">{followUp.note}</p> : null}
      {followUp.outcome ? (
        <p className="text-sm text-muted-foreground">Outcome: {followUp.outcome}</p>
      ) : null}
      {canManage && isActionable ? (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => setAction("complete")}>
            Complete
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAction("reschedule")}>
            Reschedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAction("cancel")}>
            Cancel
          </Button>
        </div>
      ) : null}
      <CompleteDialog
        queryId={queryId}
        followUp={followUp}
        open={action === "complete"}
        onOpenChange={(open) => setAction(open ? "complete" : null)}
      />
      <RescheduleDialog
        queryId={queryId}
        followUp={followUp}
        open={action === "reschedule"}
        onOpenChange={(open) => setAction(open ? "reschedule" : null)}
      />
      <CancelDialog
        queryId={queryId}
        followUp={followUp}
        open={action === "cancel"}
        onOpenChange={(open) => setAction(open ? "cancel" : null)}
      />
    </li>
  );
}

export function FollowUpList({ queryId, canManage }: { queryId: string; canManage: boolean }) {
  const { data: followUps = [], isLoading } = useFollowUps(queryId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (followUps.length === 0) {
    return <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>;
  }

  return (
    <ul className="space-y-3">
      {followUps.map((followUp) => (
        <FollowUpRow key={followUp.id} queryId={queryId} followUp={followUp} canManage={canManage} />
      ))}
    </ul>
  );
}
