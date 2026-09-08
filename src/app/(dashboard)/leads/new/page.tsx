"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Locate,
  MapPin,
  RefreshCw,
  ShieldAlert,
  User,
  ClipboardCheck,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCreateLeadStep1,
  useSaveLeadStep2,
  useSaveLeadStep3,
  useLead,
} from "@/features/leads/hooks";
import { useReverseGeocode } from "@/features/geo/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Lead, Opportunity } from "@/types/entities";

const STEPS = [
  { label: "Site Visit", description: "Company & location" },
  { label: "Contact", description: "Customer details" },
  { label: "Qualification", description: "Qualify or close" },
];

const LOCAL_MOBILE_REGEX = /^[6-9]\d{9}$/;

// --- Step 1 schema ---
const step1Schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  remarks: z.string().max(1000).optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  visitLocation: z.string().optional(),
});
type Step1Values = z.infer<typeof step1Schema>;

// --- Step 2 schema ---
const step2Schema = z
  .object({
    contactName: z.string().min(1, "Customer name is required"),
    contactPhone: z
      .string()
      .refine((v) => v.length === 0 || v.length === 10, "Must be exactly 10 digits")
      .refine((v) => v.length === 0 || LOCAL_MOBILE_REGEX.test(v), "Must start with 6-9")
      .optional()
      .or(z.literal("")),
    contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
    discussionNote: z.string().max(1000).optional(),
  })
  .refine((data) => !!data.contactPhone?.trim() || !!data.contactEmail?.trim(), {
    message: "At least one of phone or email is required",
    path: ["contactPhone"],
  });
type Step2Values = z.infer<typeof step2Schema>;

// --- Step 3 types ---
type QualificationPath = null | "NOT_QUALIFIED" | "QUALIFIED";
type QualifiedSubPath = null | "FUTURE_POTENTIAL" | "REQUIREMENT_IDENTIFIED";
type DealTypeOption = "INSTALLATION" | "AMC" | "MAINTENANCE";

const DEAL_TYPE_LABELS: Record<DealTypeOption, string> = {
  AMC: "AMC",
  MAINTENANCE: "Maintenance",
  INSTALLATION: "New System",
};

type GeoPermissionState = PermissionState | "unsupported" | null;

function positionUnavailableHint(): string {
  if (typeof navigator === "undefined") return "check that Location Services are enabled for this browser";
  const platform = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
  if (/Mac/i.test(platform)) {
    return "check System Settings → Privacy & Security → Location Services is on, and that your browser is allowed there";
  }
  if (/Win/i.test(platform)) {
    return "check Windows Settings → Privacy & security → Location is on, and that your browser is allowed there";
  }
  return "check that Location Services are turned on for this browser in your system settings";
}

// --- Locked step summary card ---
function LockedStepCard({
  stepNumber,
  title,
  children,
}: {
  stepNumber: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5 opacity-80">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            <CheckCircle2 className="size-3.5" />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            Saved
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

export default function NewLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");
  const [currentStep, setCurrentStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(resumeId);
  const [leadRefNo, setLeadRefNo] = useState<string | null>(null);
  const [savedStep1, setSavedStep1] = useState<Step1Values | null>(null);
  const [savedStep2, setSavedStep2] = useState<Step2Values | null>(null);

  // Resume: fetch lead data and jump to the right step
  const { data: resumeLead } = useLead(resumeId ?? "");
  useEffect(() => {
    if (!resumeLead) return;
    setLeadId(resumeLead.id);
    setLeadRefNo(resumeLead.refNo);
    const step = resumeLead.currentStep ?? 1;
    if (step >= 1) {
      setSavedStep1({
        companyName: resumeLead.companyName ?? "",
        remarks: resumeLead.remarks ?? undefined,
        visitLocation: resumeLead.visitLocation ?? undefined,
        gpsLatitude: resumeLead.gpsLatitude ? Number(resumeLead.gpsLatitude) : undefined,
        gpsLongitude: resumeLead.gpsLongitude ? Number(resumeLead.gpsLongitude) : undefined,
      });
    }
    if (step >= 2) {
      setSavedStep2({
        contactName: resumeLead.contactName ?? "",
        contactPhone: resumeLead.contactPhone ?? "",
        contactEmail: resumeLead.contactEmail ?? "",
        discussionNote: resumeLead.discussionNote ?? undefined,
      });
    }
    setCurrentStep(step + 1 > 3 ? 3 : step + 1);
  }, [resumeLead]);

  // GPS state
  const [locating, setLocating] = useState(false);
  const [geoPermission, setGeoPermission] = useState<GeoPermissionState>(null);
  const [autoCaptureFailed, setAutoCaptureFailed] = useState(false);
  const [autoCaptureUnavailable, setAutoCaptureUnavailable] = useState(false);
  const [insecureContext, setInsecureContext] = useState(false);

  const createStep1 = useCreateLeadStep1();
  const saveStep2 = useSaveLeadStep2(leadId ?? "");
  const saveStep3 = useSaveLeadStep3(leadId ?? "");
  const reverseGeocode = useReverseGeocode();

  // Step 1 form
  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
  });

  // Step 2 form
  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
  });

  // Step 3 state
  const [qualPath, setQualPath] = useState<QualificationPath>(null);
  const [qualSubPath, setQualSubPath] = useState<QualifiedSubPath>(null);
  const [dealType, setDealType] = useState<DealTypeOption | null>(null);
  const [notQualifiedRemark, setNotQualifiedRemark] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [quotationRef, setQuotationRef] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [quotationAmount, setQuotationAmount] = useState("");

  // Auto-capture GPS on mount
  function captureLocation(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;
    if (!navigator.geolocation) {
      if (!silent) toast.error("Location capture isn't supported by this browser");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setInsecureContext(true);
      if (!silent) toast.error("Location capture requires HTTPS or localhost");
      return;
    }
    setInsecureContext(false);
    setLocating(true);

    function onSuccess(position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      step1Form.setValue("gpsLatitude", latitude, { shouldValidate: true });
      step1Form.setValue("gpsLongitude", longitude, { shouldValidate: true });
      setLocating(false);
      setAutoCaptureFailed(false);
      setAutoCaptureUnavailable(false);
      if (!silent) toast.success("Current location captured");
      reverseGeocode.mutate(
        { lat: latitude, lng: longitude },
        {
          onSuccess: (result) => {
            if (result.address) step1Form.setValue("visitLocation", result.address);
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
            ? "Location permission denied"
            : error.code === error.POSITION_UNAVAILABLE
              ? `Couldn't get your location — ${positionUnavailableHint()}`
              : "Couldn't get the current location — please try again",
        );
      }
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
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

  useEffect(() => {
    setGeoPermission(null);
    setAutoCaptureFailed(false);
    setAutoCaptureUnavailable(false);
    setInsecureContext(false);

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
  }, []);

  // Step 1 submit
  async function onStep1Submit(values: Step1Values) {
    try {
      const { lead } = await createStep1.mutateAsync(values);
      setLeadId(lead.id);
      setLeadRefNo(lead.refNo);
      setSavedStep1(values);
      setCurrentStep(2);
      toast.success(`Lead ${lead.refNo} created`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  // Step 2 submit
  async function onStep2Submit(values: Step2Values) {
    if (!leadId) return;
    try {
      const { duplicateWarning } = await saveStep2.mutateAsync(values);
      setSavedStep2(values);
      setCurrentStep(3);
      if (duplicateWarning?.length) {
        toast.warning(`Possible duplicate: ${duplicateWarning.join(", ")}`);
      }
      toast.success("Contact details saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  // Step 3 submissions
  async function onNotQualified() {
    if (!leadId || !notQualifiedRemark.trim()) {
      toast.error("Remark is required");
      return;
    }
    try {
      await saveStep3.mutateAsync({ path: "NOT_QUALIFIED", remark: notQualifiedRemark });
      toast.success("Lead cancelled");
      router.push("/leads");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onFuturePotential() {
    if (!leadId || !followUpDate) {
      toast.error("Follow-up date is required");
      return;
    }
    try {
      await saveStep3.mutateAsync({
        path: "FUTURE_POTENTIAL",
        followUpDate: new Date(followUpDate).toISOString(),
        remarks: followUpRemarks || undefined,
      });
      toast.success("Follow-up scheduled");
      router.push(`/leads/${leadId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onRequirementIdentified() {
    if (!leadId || !dealType || !quotationRef.trim() || !quotationDate || !quotationAmount) {
      toast.error("All quotation fields are required");
      return;
    }
    try {
      const result = await saveStep3.mutateAsync({
        path: "REQUIREMENT_IDENTIFIED",
        dealType,
        quotationRef: quotationRef.trim(),
        quotationDate: new Date(quotationDate).toISOString(),
        quotationAmount: Number(quotationAmount),
      });
      toast.success("Lead qualified — opportunity created");
      if (result.opportunity) {
        router.push(`/opportunities/${result.opportunity.id}`);
      } else {
        router.push(`/leads/${leadId}`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const gpsLat = step1Form.watch("gpsLatitude");
  const gpsLng = step1Form.watch("gpsLongitude");
  const visitLoc = step1Form.watch("visitLocation");
  const gpsCaptured = gpsLat != null && gpsLng != null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <PageHeader
        title="New Lead"
        description={leadRefNo ? `Lead ID: ${leadRefNo}` : "Create a new lead step by step"}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>
            <ArrowLeft className="size-4" />
            Back to leads
          </Button>
        }
      />

      <Stepper steps={STEPS} currentStep={currentStep} className="px-4" />

      <div className="space-y-4 px-1">
        {/* ---- Locked Step 1 summary ---- */}
        {savedStep1 && (
          <LockedStepCard stepNumber={1} title="Site Visit">
            <p>
              <span className="font-medium text-foreground">{savedStep1.companyName}</span>
              {savedStep1.remarks && <span> — {savedStep1.remarks}</span>}
            </p>
            {savedStep1.visitLocation && (
              <p className="flex items-center gap-1">
                <MapPin className="size-3" /> {savedStep1.visitLocation}
              </p>
            )}
          </LockedStepCard>
        )}

        {/* ---- Locked Step 2 summary ---- */}
        {savedStep2 && (
          <LockedStepCard stepNumber={2} title="Contact Details">
            <p className="font-medium text-foreground">{savedStep2.contactName}</p>
            <p>
              {savedStep2.contactPhone && <span>{savedStep2.contactPhone}</span>}
              {savedStep2.contactPhone && savedStep2.contactEmail && <span> · </span>}
              {savedStep2.contactEmail && <span>{savedStep2.contactEmail}</span>}
            </p>
          </LockedStepCard>
        )}

        {/* =============== STEP 1: Site Visit =============== */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <CardTitle>Step 1 — Site Visit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Acme Corp"
                    {...step1Form.register("companyName")}
                  />
                  {step1Form.formState.errors.companyName && (
                    <p className="text-sm text-destructive">
                      {step1Form.formState.errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks / Observation</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any observations from the visit..."
                    rows={3}
                    {...step1Form.register("remarks")}
                  />
                </div>

                {/* GPS Location */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  {gpsCaptured ? (
                    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 px-3.5 py-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {reverseGeocode.isPending ? "Resolving address…" : visitLoc || "GPS captured"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {gpsLat!.toFixed(5)}, {gpsLng!.toFixed(5)}
                        </p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
                          onClick={() => captureLocation()}
                          disabled={locating}
                        >
                          <RefreshCw className={cn("size-3", locating && "animate-spin")} />
                          {locating ? "Locating…" : "Recapture location"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3",
                        geoPermission === "denied" || insecureContext || autoCaptureUnavailable
                          ? "border-warning/30 bg-warning/5"
                          : "border-border bg-muted/30",
                      )}
                    >
                      {geoPermission === "denied" || insecureContext || autoCaptureUnavailable ? (
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
                      ) : (
                        <Locate
                          className={cn(
                            "mt-0.5 size-4 shrink-0 text-muted-foreground",
                            locating && "animate-pulse",
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <p className="text-xs text-muted-foreground">
                          {insecureContext
                            ? "Location capture requires HTTPS or localhost."
                            : geoPermission === "denied"
                              ? "Location access blocked. Enable it in your browser."
                              : autoCaptureUnavailable
                                ? `Location Services appear off — ${positionUnavailableHint()}.`
                                : autoCaptureFailed
                                  ? "Couldn't detect location. Try again or type it below."
                                  : locating
                                    ? "Detecting location…"
                                    : "Click below to capture GPS, or type it in."}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => captureLocation()}
                          disabled={locating}
                        >
                          <MapPin className="size-3.5" />
                          {locating ? "Locating…" : "Capture current location"}
                        </Button>
                        <div className="space-y-1.5 pt-1">
                          <Label htmlFor="visitLocation" className="text-xs text-muted-foreground">
                            Or type it in
                          </Label>
                          <Input
                            id="visitLocation"
                            placeholder="e.g. Sector 44, Gurugram"
                            {...step1Form.register("visitLocation")}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={createStep1.isPending}>
                  {createStep1.isPending ? "Saving…" : "Save & Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* =============== STEP 2: Contact Details =============== */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <CardTitle>Step 2 — Contact Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Customer Name *</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g. Rajesh Kumar"
                    {...step2Form.register("contactName")}
                  />
                  {step2Form.formState.errors.contactName && (
                    <p className="text-sm text-destructive">
                      {step2Form.formState.errors.contactName.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      maxLength={10}
                      {...step2Form.register("contactPhone")}
                    />
                    {step2Form.formState.errors.contactPhone && (
                      <p className="text-sm text-destructive">
                        {step2Form.formState.errors.contactPhone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="john@example.com"
                      {...step2Form.register("contactEmail")}
                    />
                    {step2Form.formState.errors.contactEmail && (
                      <p className="text-sm text-destructive">
                        {step2Form.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">At least one of phone or email is required.</p>

                <div className="space-y-2">
                  <Label htmlFor="discussionNote">Discussion Note</Label>
                  <Textarea
                    id="discussionNote"
                    placeholder="Notes from the conversation..."
                    rows={3}
                    {...step2Form.register("discussionNote")}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saveStep2.isPending}>
                  {saveStep2.isPending ? "Saving…" : "Save & Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* =============== STEP 3: Qualification =============== */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-primary" />
                <CardTitle>Step 3 — Qualification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Top-level choice: Qualified or Not Qualified */}
              {qualPath === null && (
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-xl border-2 border-success/40 bg-success/5 p-6 text-center transition-colors hover:border-success hover:bg-success/10"
                    onClick={() => setQualPath("QUALIFIED")}
                  >
                    <CheckCircle2 className="mx-auto mb-2 size-8 text-success" />
                    <p className="font-semibold text-foreground">Qualified</p>
                    <p className="mt-1 text-xs text-muted-foreground">Lead shows potential</p>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-6 text-center transition-colors hover:border-destructive hover:bg-destructive/10"
                    onClick={() => setQualPath("NOT_QUALIFIED")}
                  >
                    <ClipboardCheck className="mx-auto mb-2 size-8 text-destructive" />
                    <p className="font-semibold text-foreground">Not Qualified</p>
                    <p className="mt-1 text-xs text-muted-foreground">Cancel this lead</p>
                  </button>
                </div>
              )}

              {/* Not Qualified path */}
              {qualPath === "NOT_QUALIFIED" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-destructive">Not Qualified</h3>
                    <Button variant="ghost" size="sm" onClick={() => setQualPath(null)}>
                      Change
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notQualifiedRemark">Remark *</Label>
                    <Textarea
                      id="notQualifiedRemark"
                      placeholder="Why is this lead not qualified?"
                      rows={3}
                      value={notQualifiedRemark}
                      onChange={(e) => setNotQualifiedRemark(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onNotQualified}
                    disabled={saveStep3.isPending}
                  >
                    {saveStep3.isPending ? "Cancelling…" : "Cancel Lead"}
                  </Button>
                </div>
              )}

              {/* Qualified path — sub-choice */}
              {qualPath === "QUALIFIED" && qualSubPath === null && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-success">Qualified</h3>
                    <Button variant="ghost" size="sm" onClick={() => setQualPath(null)}>
                      Change
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 text-center transition-colors hover:border-primary hover:bg-primary/10"
                      onClick={() => setQualSubPath("REQUIREMENT_IDENTIFIED")}
                    >
                      <ClipboardCheck className="mx-auto mb-2 size-6 text-primary" />
                      <p className="font-semibold text-foreground">Requirement Identified</p>
                      <p className="mt-1 text-xs text-muted-foreground">Ready for quotation</p>
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-5 text-center transition-colors hover:border-amber-500 hover:bg-amber-500/10"
                      onClick={() => setQualSubPath("FUTURE_POTENTIAL")}
                    >
                      <CalendarDays className="mx-auto mb-2 size-6 text-amber-500" />
                      <p className="font-semibold text-foreground">Future Potential</p>
                      <p className="mt-1 text-xs text-muted-foreground">Schedule a follow-up</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Future Potential sub-path */}
              {qualPath === "QUALIFIED" && qualSubPath === "FUTURE_POTENTIAL" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Future Potential — Schedule Follow-up</h3>
                    <Button variant="ghost" size="sm" onClick={() => setQualSubPath(null)}>
                      Change
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followUpDate">Follow-up Date *</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followUpRemarks">Remarks</Label>
                    <Textarea
                      id="followUpRemarks"
                      placeholder="Any notes for the follow-up..."
                      rows={3}
                      value={followUpRemarks}
                      onChange={(e) => setFollowUpRemarks(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={onFuturePotential} disabled={saveStep3.isPending}>
                    {saveStep3.isPending ? "Saving…" : "Save Follow-up"}
                  </Button>
                </div>
              )}

              {/* Requirement Identified sub-path */}
              {qualPath === "QUALIFIED" && qualSubPath === "REQUIREMENT_IDENTIFIED" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Requirement Identified</h3>
                    <Button variant="ghost" size="sm" onClick={() => setQualSubPath(null)}>
                      Change
                    </Button>
                  </div>

                  {/* Deal type chips */}
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(DEAL_TYPE_LABELS) as [DealTypeOption, string][]).map(
                        ([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={cn(
                              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                              dealType === value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:border-primary/50",
                            )}
                            onClick={() => setDealType(value)}
                          >
                            {label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {dealType && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="quotationRef">Quotation Number *</Label>
                        <Input
                          id="quotationRef"
                          placeholder="e.g. QT-2026-001"
                          value={quotationRef}
                          onChange={(e) => setQuotationRef(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="quotationDate">Date *</Label>
                          <Input
                            id="quotationDate"
                            type="date"
                            value={quotationDate}
                            onChange={(e) => setQuotationDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quotationAmount">Amount (₹) *</Label>
                          <Input
                            id="quotationAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 50000"
                            value={quotationAmount}
                            onChange={(e) => setQuotationAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={onRequirementIdentified}
                        disabled={saveStep3.isPending}
                      >
                        {saveStep3.isPending ? "Qualifying…" : "Qualify Lead & Create Opportunity"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
