"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMarkOpportunityLost } from "@/features/opportunities/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

export function MarkOpportunityLostDialog({
  opportunityId,
  triggerRender,
  triggerContent,
}: {
  opportunityId: string;
  /** Custom trigger element (e.g. a compact icon button for use inside a card) — defaults to a plain destructive Button. */
  triggerRender?: React.ReactElement;
  triggerContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const markLost = useMarkOpportunityLost(opportunityId);

  async function onConfirm() {
    if (!reason.trim()) return;
    try {
      await markLost.mutateAsync({ reason });
      toast.success("Opportunity marked lost");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender ?? <Button variant="destructive" />}>
        {triggerContent ?? "Mark lost"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark opportunity as lost</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lost to competitor"
          />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={markLost.isPending || !reason.trim()}
          >
            {markLost.isPending ? "Saving…" : "Confirm lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
