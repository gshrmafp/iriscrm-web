"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
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
import { useReverseGeocode } from "@/features/geo/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

// The country code is fixed to +91 in the UI (input box shown separately),
// so the form field only ever holds the bare 10-digit local number — mirrors
// the server-side MOBILE_REGEX in leads/dto.ts, which is the actual source
// of truth (that one also tolerates a +91/91/0 prefix on the wire).
const LOCAL_MOBILE_REGEX = /^[6-9]\d{9}$/;

// Must match createLeadSchema's notes.max(400) in Irisbackend/leads/dto.ts —
// the backend is the actual source of truth; this only gives live feedback.
const NOTES_MAX_LENGTH = 400;

const OTHER_CODE = "OTHER";

const leadSchema = z
  .object({
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
    address: z.string().max(500, "Address must be under 500 characters").optional(),
    gpsLatitude: z.number().optional(),
    gpsLongitude: z.number().optional(),
    visitLocation: z.string().optional(),
    // Source is required and validated against whatever the admin has
    // configured active in the Lead Source picklist — see also the
    // server-side check in leads/service.ts, the actual source of truth.
    source: z.string().min(1, "Select a source"),
    sourceOther: z.string().max(200).optional(),
    productInterest: z.string().optional(),
    productInterestOther: z.string().max(200).optional(),
    notes: z.string().max(NOTES_MAX_LENGTH, `Notes must be ${NOTES_MAX_LENGTH} characters or fewer`).optional(),
  })
  .refine((data) => data.source !== OTHER_CODE || !!data.sourceOther?.trim(), {
    message: "Please specify the source",
    path: ["sourceOther"],
  })
  .refine((data) => data.productInterest !== OTHER_CODE || !!data.productInterestOther?.trim(), {
    message: "Please specify the product of interest",
    path: ["productInterestOther"],
  });

type LeadFormValues = z.infer<typeof leadSchema>;

type GeoPermissionState = PermissionState | "unsupported" | null;

export function LeadFormDialog() {
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoPermission, setGeoPermission] = useState<GeoPermissionState>(null);
  const [autoCaptureFailed, setAutoCaptureFailed] = useState(false);
  const [autoCaptureUnavailable, setAutoCaptureUnavailable] = useState(false);
  const createLead = useCreateLead();
  const reverseGeocode = useReverseGeocode();
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
  const visitLocation = watch("visitLocation");
  const contactPhone = watch("contactPhone") ?? "";
  const source = watch("source");
  const productInterest = watch("productInterest");
  const notes = watch("notes") ?? "";

  const sourceItems: ComboboxOption[] = useMemo(
    () => sourceOptions.map((o) => ({ value: o.code, label: o.label })),
    [sourceOptions],
  );
  const productItems: ComboboxOption[] = useMemo(
    () => productOptions.map((o) => ({ value: o.code, label: o.label })),
    [productOptions],
  );

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

  // `silent` is used for the automatic on-open attempt: no error toast if it
  // fails there (the user hasn't asked for anything yet), so it doesn't
  // greet them with an alarming error the instant the dialog opens. The
  // manual "Capture current location" button always reports success/failure.
  function captureLocation(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;
    if (!navigator.geolocation) {
      if (!silent) toast.error("Location capture isn't supported by this browser");
      return;
    }
    setLocating(true);

    function onSuccess(position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      setValue("gpsLatitude", latitude, { shouldValidate: true });
      setValue("gpsLongitude", longitude, { shouldValidate: true });
      setLocating(false);
      setAutoCaptureFailed(false);
      setAutoCaptureUnavailable(false);
      if (!silent) toast.success("Current location captured");
      reverseGeocode.mutate(
        { lat: latitude, lng: longitude },
        {
          onSuccess: (result) => {
            if (result.address) setValue("visitLocation", result.address);
          },
        },
      );
    }

    function onFinalError(error: GeolocationPositionError) {
      setLocating(false);
      if (error.code === error.PERMISSION_DENIED) setGeoPermission("denied");
      if (silent) {
        setAutoCaptureFailed(true);
        setAutoCaptureUnavailable(error.code === error.POSITION_UNAVAILABLE);
      }
      if (!silent) {
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied — enable it to capture the visit location"
            : error.code === error.POSITION_UNAVAILABLE
              ? "Couldn't get your location — check that Location Services are turned on for this browser in your system settings"
              : "Couldn't get the current location — please try again",
        );
      }
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        // A high-accuracy GPS fix can time out on machines with no real GPS
        // chip (most laptops rely on slower Wi-Fi-based positioning) — retry
        // once with network-based positioning and a longer timeout before
        // giving up.
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000,
          });
          return;
        }
        onFinalError(error);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // Automatically capture the visit location as soon as the form opens —
  // the manual "Capture current location" button below still works to
  // retry/refresh it. First check the actual permission state: once a user
  // has denied location for this site, browsers won't silently re-prompt,
  // so firing getCurrentPosition again is a guaranteed silent no-op — we'd
  // rather show an actionable "how to fix it" message than keep retrying.
  useEffect(() => {
    if (!open) return;
    setGeoPermission(null);
    setAutoCaptureFailed(false);
    setAutoCaptureUnavailable(false);

    if (!navigator.permissions?.query) {
      captureLocation({ silent: true });
      return;
    }

    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setGeoPermission(status.state);
        if (status.state !== "denied") captureLocation({ silent: true });
      })
      .catch(() => {
        if (!cancelled) captureLocation({ silent: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: LeadFormValues) {
    try {
      await createLead.mutateAsync({
        ...values,
        contactPhone: values.contactPhone ? `+91${values.contactPhone}` : undefined,
        contactEmail: values.contactEmail || undefined,
        address: values.address || undefined,
        visitLocation: values.visitLocation || undefined,
        productInterest: values.productInterest || undefined,
        sourceOther: values.source === OTHER_CODE ? values.sourceOther : undefined,
        productInterestOther: values.productInterest === OTHER_CODE ? values.productInterestOther : undefined,
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
            <Label htmlFor="contactName">
              Contact name <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} placeholder="Contact or company address" {...register("address")} />
            {errors.address ? <p className="text-sm text-destructive">{errors.address.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Visit location</Label>
            {!(gpsLatitude != null && gpsLongitude != null) ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAutoCaptureFailed(false);
                    setAutoCaptureUnavailable(false);
                    captureLocation();
                  }}
                  disabled={locating}
                >
                  <MapPin className="size-3.5" />
                  {locating ? "Locating…" : "Capture current location"}
                </Button>
              </div>
            ) : null}
            {gpsLatitude != null && gpsLongitude != null ? (
              <div className="space-y-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                <p className="text-muted-foreground">
                  {gpsLatitude.toFixed(5)}, {gpsLongitude.toFixed(5)}
                </p>
                <p className="text-foreground">
                  {reverseGeocode.isPending
                    ? "Resolving address…"
                    : visitLocation || "Address unavailable for these coordinates"}
                </p>
                <button
                  type="button"
                  className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  onClick={() => {
                    setAutoCaptureFailed(false);
                    setAutoCaptureUnavailable(false);
                    captureLocation();
                  }}
                  disabled={locating}
                >
                  {locating ? "Locating…" : "Recapture location"}
                </button>
              </div>
            ) : locating ? (
              <p className="text-xs text-muted-foreground">Detecting your current location…</p>
            ) : geoPermission === "denied" ? (
              <p className="text-xs text-warning-foreground dark:text-warning">
                Location access is blocked for this site. Click the location icon in your browser&apos;s
                address bar and choose &quot;Allow&quot;, then click &quot;Capture current location&quot; above.
              </p>
            ) : autoCaptureUnavailable ? (
              <p className="text-xs text-warning-foreground dark:text-warning">
                Location Services appear to be turned off for this browser at the system level. Enable
                them in your system settings, then click &quot;Capture current location&quot; above.
              </p>
            ) : autoCaptureFailed ? (
              <p className="text-xs text-warning-foreground dark:text-warning">
                Couldn&apos;t detect your location automatically. Click &quot;Capture current location&quot;
                above to try again, or allow location access if your browser prompts you.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No location captured yet — click above, or allow location access when prompted.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Source <span className="text-destructive">*</span>
            </Label>
            <Combobox
              items={sourceItems}
              value={source || null}
              onValueChange={(value) => setValue("source", value ?? "", { shouldValidate: true })}
              placeholder="Search a source…"
              emptyMessage="No sources found."
            />
            {errors.source ? (
              <p className="text-sm text-destructive">{errors.source.message}</p>
            ) : null}
            {source === OTHER_CODE ? (
              <div className="space-y-1">
                <Input placeholder="Please specify the source" {...register("sourceOther")} />
                {errors.sourceOther ? (
                  <p className="text-sm text-destructive">{errors.sourceOther.message}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Product interest</Label>
            <Combobox
              items={productItems}
              value={productInterest || null}
              onValueChange={(value) => setValue("productInterest", value ?? "")}
              placeholder="Search a product (optional)…"
              emptyMessage="No products found."
            />
            {productInterest === OTHER_CODE ? (
              <div className="space-y-1">
                <Input placeholder="Please specify the product of interest" {...register("productInterestOther")} />
                {errors.productInterestOther ? (
                  <p className="text-sm text-destructive">{errors.productInterestOther.message}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              <span
                className={
                  notes.length > NOTES_MAX_LENGTH
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {notes.length}/{NOTES_MAX_LENGTH}
              </span>
            </div>
            <Textarea id="notes" rows={3} maxLength={NOTES_MAX_LENGTH} {...register("notes")} />
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
