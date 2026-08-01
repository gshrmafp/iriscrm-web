"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useMarkLeadLost } from "@/features/leads/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { MarkLeadLostPayload } from "@/features/leads/api";

const REASONS: { value: MarkLeadLostPayload["reason"]; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "competitor", label: "Lost to competitor" },
  { value: "no_budget", label: "No budget" },
  { value: "no_response", label: "No response" },
  { value: "other", label: "Other" },
];

export function MarkLeadLostDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<MarkLeadLostPayload["reason"]>("price");
  const markLost = useMarkLeadLost(leadId);

  async function onConfirm() {
    try {
      await markLost.mutateAsync({ reason });
      toast.success("Lead marked lost");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        Mark lost
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark lead as lost</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Select
            value={reason}
            onValueChange={(value) =>
              setReason((value ?? "price") as MarkLeadLostPayload["reason"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={markLost.isPending}
          >
            {markLost.isPending ? "Saving…" : "Confirm lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
