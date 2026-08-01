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
import { useTransitionStatus } from "@/features/sales-queries/hooks";
import { REMARK_REQUIRED_STATUSES, STATUS_LABELS, STATUS_TRANSITIONS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { SalesQueryStatus } from "@/types/entities";

export function StatusChangeDialog({
  queryId,
  currentStatus,
}: {
  queryId: string;
  currentStatus: SalesQueryStatus;
}) {
  const [open, setOpen] = useState(false);
  const nextOptions = STATUS_TRANSITIONS[currentStatus] ?? [];
  const [toStatus, setToStatus] = useState<SalesQueryStatus | undefined>(nextOptions[0]);
  const [remark, setRemark] = useState("");
  const transitionStatus = useTransitionStatus(queryId);

  const remarkRequired = toStatus ? REMARK_REQUIRED_STATUSES.includes(toStatus) : false;

  async function onConfirm() {
    if (!toStatus) return;
    if (remarkRequired && !remark.trim()) {
      toast.error("A remark is required for this status change");
      return;
    }
    try {
      await transitionStatus.mutateAsync({ toStatus, remark: remark || undefined });
      toast.success(`Status changed to ${STATUS_LABELS[toStatus]}`);
      setOpen(false);
      setRemark("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (nextOptions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Change status</DialogTrigger>
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
                  {STATUS_LABELS[status]}
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
