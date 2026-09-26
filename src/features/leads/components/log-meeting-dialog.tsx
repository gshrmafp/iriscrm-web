"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useLogMeeting } from "@/features/leads/hooks";
import { useReverseGeocode } from "@/features/geo/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

const schema = z.object({
  note: z.string().min(1, "Note is required").max(400, "Max 400 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LogMeetingDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const logMeeting = useLogMeeting(leadId);
  const reverseGeocode = useReverseGeocode();

  // Captured silently in the background while the dialog is open — no
  // visible lat/lng inputs or "share your location" toggle, same as Step 1's
  // GPS auto-capture in the new-lead wizard.
  const [gps, setGps] = useState<{ lat?: number; lng?: number; location?: string }>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { note: "" },
  });

  const noteValue = watch("note") ?? "";

  useEffect(() => {
    if (!open) return;
    setGps({});
    if (!navigator.geolocation) return;
    if (typeof window !== "undefined" && !window.isSecureContext) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGps({ lat: latitude, lng: longitude });
        reverseGeocode.mutate(
          { lat: latitude, lng: longitude },
          {
            onSuccess: (result) => {
              const address = result.address;
              if (address) {
                setGps((prev) => ({ ...prev, location: address }));
              }
            },
          },
        );
      },
      () => {
        // Silent — GPS is best-effort; a meeting can still be logged without it.
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: FormValues) {
    try {
      await logMeeting.mutateAsync({
        note: values.note,
        gpsLatitude: gps.lat,
        gpsLongitude: gps.lng,
        visitLocation: gps.location,
      });
      toast.success("Meeting logged");
      reset();
      setGps({});
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Log meeting
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-note">Note</Label>
            <Textarea id="meeting-note" rows={3} maxLength={400} {...register("note")} />
            <div className="flex items-center justify-between">
              {errors.note ? (
                <p className="text-sm text-destructive">{errors.note.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">{noteValue.length}/400</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={logMeeting.isPending}>
              {logMeeting.isPending ? "Saving…" : "Log meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
