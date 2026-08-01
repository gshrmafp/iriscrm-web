"use client";

import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { useCreateLead } from "@/features/leads/hooks";
import { useActivePicklistOptions } from "@/features/picklists/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

// The country code is fixed to +91 in the UI (input box shown separately),
// so the form field only ever holds the bare 10-digit local number — mirrors
// the server-side MOBILE_REGEX in leads/dto.ts, which is the actual source
// of truth (that one also tolerates a +91/91/0 prefix on the wire).
const LOCAL_MOBILE_REGEX = /^[6-9]\d{9}$/;

const leadSchema = z.object({
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  companyName: z.string().optional(),
  contactPhone: z
    .string()
    .refine((v) => v.length === 0 || v.length === 10, "Mobile number must be exactly 10 digits")
    .refine(
      (v) => v.length === 0 || LOCAL_MOBILE_REGEX.test(v),
      "Enter a valid mobile number starting with 6-9",
    )
    .optional()
    .or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  // Source is required and validated against whatever the admin has
  // configured active in the Lead Source picklist — see also the
  // server-side check in leads/service.ts, the actual source of truth.
  source: z.string().min(1, "Select a source"),
  productInterest: z.string().optional(),
  notes: z.string().max(1000, "Notes must be under 1000 characters").optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function LeadFormDialog() {
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const createLead = useCreateLead();
  const { data: sourceOptions = [] } = useActivePicklistOptions("LEAD_SOURCE");
  const { data: productOptions = [] } = useActivePicklistOptions("PRODUCT_INTEREST");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    mode: "onChange",
    defaultValues: { source: "", productInterest: "" },
  });

  const gpsLatitude = watch("gpsLatitude");
  const gpsLongitude = watch("gpsLongitude");
  const contactPhone = watch("contactPhone") ?? "";

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
    setValue("contactPhone", digits, { shouldValidate: true, shouldDirty: true });
  }

  // Live feedback only flags an invalid starting digit (0-5) as the user
  // types — incomplete length isn't nagged about until they try to submit.
  const phoneStartInvalid = contactPhone.length > 0 && !/^[6-9]/.test(contactPhone);
  const phoneError = phoneStartInvalid
    ? "Enter a valid mobile number starting with 6-9"
    : isSubmitted
      ? errors.contactPhone?.message
      : undefined;

  function captureLocation() {
    if (!navigator.geolocation) {
      toast.error("Location capture isn't supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("gpsLatitude", position.coords.latitude, { shouldValidate: true });
        setValue("gpsLongitude", position.coords.longitude, { shouldValidate: true });
        setLocating(false);
        toast.success("Current location captured");
      },
      (error) => {
        setLocating(false);
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied — enable it to capture the visit location"
            : "Couldn't get the current location",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(values: LeadFormValues) {
    try {
      await createLead.mutateAsync({
        ...values,
        contactPhone: values.contactPhone ? `+91${values.contactPhone}` : undefined,
        contactEmail: values.contactEmail || undefined,
        productInterest: values.productInterest || undefined,
      });
      toast.success("Lead captured");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next, eventDetails) => {
        // Accidental clicks outside the form (or a stray Escape press) are a
        // common way to lose an in-progress lead — require an explicit
        // Cancel/X/successful-submit to close instead.
        if (!next && (eventDetails.reason === "outside-press" || eventDetails.reason === "escape-key")) {
          eventDetails.cancel();
          return;
        }
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New Lead
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture a lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName ? (
              <p className="text-sm text-destructive">{errors.contactName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" {...register("companyName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <div className="flex items-center gap-2">
              <span className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                +91
              </span>
              <Input
                id="contactPhone"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="98765 43210"
                {...register("contactPhone")}
                onChange={handlePhoneChange}
              />
            </div>
            {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail ? (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Visit location</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={captureLocation}
                disabled={locating}
              >
                <MapPin className="size-3.5" />
                {locating ? "Locating…" : "Capture current location"}
              </Button>
              {gpsLatitude != null && gpsLongitude != null ? (
                <span className="text-xs text-muted-foreground">
                  {gpsLatitude.toFixed(5)}, {gpsLongitude.toFixed(5)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={watch("source")}
              onValueChange={(value) => setValue("source", value ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source ? (
              <p className="text-sm text-destructive">{errors.source.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Product interest</Label>
            <Select
              value={watch("productInterest")}
              onValueChange={(value) => setValue("productInterest", value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product (optional)" />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
            {errors.notes ? (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? "Saving…" : "Save lead"}
            </Button>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
