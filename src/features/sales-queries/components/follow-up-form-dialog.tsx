"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAddFollowUp } from "@/features/sales-queries/hooks";
import { FOLLOW_UP_CHANNEL_OPTIONS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { FollowUpChannel } from "@/types/entities";

export function FollowUpFormDialog({ queryId }: { queryId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [channel, setChannel] = useState<FollowUpChannel>("call");
  const addFollowUp = useAddFollowUp(queryId);

  async function onSubmit() {
    if (!title.trim() || !scheduledAt) return;
    try {
      await addFollowUp.mutateAsync({
        title,
        note: note || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        channel,
      });
      toast.success("Follow-up scheduled");
      setTitle("");
      setNote("");
      setScheduledAt("");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-3.5" />
        Schedule follow-up
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a follow-up</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="fu-title">Title</Label>
          <Input id="fu-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fu-scheduled">When</Label>
          <Input
            id="fu-scheduled"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Channel</Label>
          <Select value={channel} onValueChange={(value) => setChannel(value as FollowUpChannel)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLLOW_UP_CHANNEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fu-note">Note (optional)</Label>
          <Textarea id="fu-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={addFollowUp.isPending || !title.trim() || !scheduledAt}>
            {addFollowUp.isPending ? "Saving…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
