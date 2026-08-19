"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStatusTransitionsMeta, useTransitionStatus } from "@/features/sales-queries/hooks";
import { REMARK_REQUIRED_STATUSES, STATUS_LABELS, STATUS_TRANSITIONS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { SalesQueryStatus } from "@/types/entities";

interface StatusChangeDialogProps {
  queryId: string;
  currentStatus: SalesQueryStatus;
  /** Controlled mode (e.g. driven from the kanban board's advance button) — omit for the default self-triggered dialog. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialToStatus?: SalesQueryStatus;
}

export function StatusChangeDialog({
  queryId,
  currentStatus,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  initialToStatus,
}: StatusChangeDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  // Fetched from the backend's pipeline.ts (single source of truth) with the
  // hand-copied constants.ts values as an immediate pre-fetch fallback.
  const { data: meta } = useStatusTransitionsMeta();
  const transitions = meta?.transitions ?? STATUS_TRANSITIONS;
  const labels = meta?.labels ?? STATUS_LABELS;
  const remarkRequiredStatuses = meta?.remarkRequiredStatuses ?? REMARK_REQUIRED_STATUSES;

  const nextOptions = transitions[currentStatus] ?? [];
  const [toStatus, setToStatus] = useState<SalesQueryStatus | undefined>(
    initialToStatus ?? nextOptions[0],
  );
  const [remark, setRemark] = useState("");
  const transitionStatus = useTransitionStatus(queryId);

  const remarkRequired = toStatus ? remarkRequiredStatuses.includes(toStatus) : false;

  async function onConfirm() {
    if (!toStatus) return;
    if (remarkRequired && !remark.trim()) {
      toast.error("A remark is required for this status change");
      return;
    }
    try {
      await transitionStatus.mutateAsync({ toStatus, remark: remark || undefined });
      toast.success(`Status changed to ${labels[toStatus]}`);
      setOpen(false);
      setRemark("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (nextOptions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isControlled ? null : (
        <DialogTrigger render={<Button variant="outline" />}>Change status</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change query status</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>New status</Label>
          <Select
            value={toStatus}
            onValueChange={(value) => setToStatus(value as SalesQueryStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nextOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {labels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Remark{remarkRequired ? " (required)" : " (optional)"}
          </Label>
          <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={transitionStatus.isPending || !toStatus}>
            {transitionStatus.isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
