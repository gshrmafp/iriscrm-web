"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { useLogFollowUp } from "@/features/leads/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

const CHANNELS = ["call", "meeting", "email"] as const;

const schema = z.object({
  note: z.string().min(1, "Note is required"),
  channel: z.enum(CHANNELS),
  nextActionAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LogFollowUpDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const logFollowUp = useLogFollowUp(leadId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "call" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await logFollowUp.mutateAsync({
        note: values.note,
        channel: values.channel,
        nextActionAt: values.nextActionAt
          ? new Date(values.nextActionAt).toISOString()
          : undefined,
      });
      toast.success("Follow-up logged");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Log follow-up
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select
              value={watch("channel")}
              onValueChange={(value) =>
                setValue("channel", (value ?? "call") as FormValues["channel"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel} className="capitalize">
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={3} {...register("note")} />
            {errors.note ? (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextActionAt">Next action reminder</Label>
            <Input id="nextActionAt" type="datetime-local" {...register("nextActionAt")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={logFollowUp.isPending}>
              {logFollowUp.isPending ? "Saving…" : "Log follow-up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
