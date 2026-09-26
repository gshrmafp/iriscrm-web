"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatusBadge, leadStatusTone } from "@/components/status-badge";
import { useLead } from "@/features/leads/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { FollowUpTimeline } from "@/features/leads/components/follow-up-timeline";
import { LogFollowUpDialog } from "@/features/leads/components/log-follow-up-dialog";
import { MeetingTimeline } from "@/features/leads/components/meeting-timeline";
import { LogMeetingDialog } from "@/features/leads/components/log-meeting-dialog";
import { CommentSection } from "@/features/comments/components/comment-section";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/entities";
import {
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { LoggedAtStage, OpportunityStage, StageHistoryEntry } from "@/types/entities";

// Follow-up/Meeting logging is loggable at any stage, gated off only once
// the lead/opportunity has reached a terminal state.
function isLeadTerminal(lead: Lead): boolean {
  return (
    lead.status === "LOST" ||
    lead.opportunity?.stage === "PURCHASE_ORDER" ||
    lead.opportunity?.stage === "LOST"
  );
}

const QUAL_PATH_LABELS: Record<string, { label: string; tone: string }> = {
  NOT_QUALIFIED: { label: "Not Qualified", tone: "text-red-600" },
  FUTURE_POTENTIAL: { label: "Future Potential", tone: "text-blue-600" },
  REQUIREMENT_IDENTIFIED: { label: "Requirement Identified", tone: "text-emerald-600" },
};

// Follow-up and Meeting are deliberately NOT their own accordion rows here —
// they're activities logged DURING the Quotation stage (visible nested
// inside it, grouped by loggedAtStage), not milestones the user needs to see
// as a separate checklist item. Only the two real deal-progression
// milestones get their own row.
const PIPELINE_STAGES: { stage: OpportunityStage; title: string; icon: LucideIcon }[] = [
  { stage: "QUOTATION", title: "Quotation", icon: FileText },
  { stage: "PURCHASE_ORDER", title: "PO (Purchase Order)", icon: ShoppingCart },
];

// Follow-ups/meetings logged while the opportunity had already progressed to
// FOLLOWUP or MEETING internally still fold into the Quotation row's list —
// they're all "activity during the deal," just tagged with whatever the
// live stage happened to be at that moment.
const QUOTATION_STAGE_ALIASES: LoggedAtStage[] = ["QUOTATION", "FOLLOWUP", "MEETING"];

function formatStepDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface JourneyStep {
  key: string;
  title: string;
  icon: LucideIcon;
  completed: boolean;
  completedAt?: string | null;
  failed?: boolean;
  details: { label: string; value?: string; tone?: string }[];
  // The loggedAtStage value that follow-ups/meetings logged during this
  // step are tagged with. Undefined for steps that don't correspond to one
  // of the 7 named lifecycle stages (e.g. "Qualified").
  stageKey?: LoggedAtStage;
}

function LeadJourney({ lead }: { lead: Lead }) {
  // All sections are open by default (nothing pre-collapsed) — the "Collapse
  // all" button fills this with every step's key. Tracking collapsed (rather
  // than open) keys means a step that appears later (e.g. once the lead is
  // qualified and the pipeline steps show up) is open by default too, since
  // it was never added to this set.
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  const opp = lead.opportunity;
  const history = opp?.stageHistory ?? [];
  const historyByStage = new Map<string, StageHistoryEntry>();
  for (const h of history) {
    historyByStage.set(h.toStage, h);
  }

  const isNotQualified = lead.qualificationPath === "NOT_QUALIFIED";
  const isFuturePotential = lead.qualificationPath === "FUTURE_POTENTIAL";

  const steps: JourneyStep[] = [
    {
      key: "site-visit",
      title: "New Visit / Lead",
      icon: MapPin,
      completed: !!lead.step1CompletedAt,
      completedAt: lead.step1CompletedAt,
      stageKey: "NEW_LEAD",
      details: [
        { label: "Company", value: lead.companyName },
        ...(lead.remarks ? [{ label: "Remarks", value: lead.remarks }] : []),
        ...(lead.visitLocation ? [{ label: "Location", value: lead.visitLocation }] : []),
        ...(lead.gpsLatitude != null && lead.gpsLongitude != null
          ? [{ label: "GPS", value: `${Number(lead.gpsLatitude).toFixed(5)}, ${Number(lead.gpsLongitude).toFixed(5)}` }]
          : []),
      ],
    },
    {
      key: "contact",
      title: "Contacted",
      icon: User,
      completed: !!lead.step2CompletedAt,
      completedAt: lead.step2CompletedAt,
      stageKey: "CONTACTED",
      details: [
        ...(lead.contactName ? [{ label: "Name", value: lead.contactName }] : []),
        ...(lead.contactPhone ? [{ label: "Phone", value: lead.contactPhone }] : []),
        ...(lead.contactEmail ? [{ label: "Email", value: lead.contactEmail }] : []),
        ...(lead.discussionNote ? [{ label: "Discussion", value: lead.discussionNote }] : []),
      ],
    },
    {
      key: "qualified",
      title: "Qualified",
      icon: isNotQualified ? XCircle : CheckCircle2,
      completed: !!lead.step3CompletedAt,
      completedAt: lead.step3CompletedAt,
      failed: isNotQualified,
      details: lead.qualificationPath
        ? [
            {
              label: "Outcome",
              value: QUAL_PATH_LABELS[lead.qualificationPath]?.label ?? lead.qualificationPath,
              tone: QUAL_PATH_LABELS[lead.qualificationPath]?.tone,
            },
            ...(lead.lostReason ? [{ label: "Reason", value: lead.lostReason }] : []),
          ]
        : [],
    },
  ];

  if (!isNotQualified && !isFuturePotential) {
    for (const ps of PIPELINE_STAGES) {
      const histEntry = historyByStage.get(ps.stage);
      const isCurrentOrPast = opp && stageIndex(opp.stage) >= stageIndex(ps.stage);
      const isLost = opp?.stage === "LOST";
      const completed = !!histEntry || (isCurrentOrPast && !isLost);

      const details: { label: string; value?: string; tone?: string }[] = [];
      if (ps.stage === "QUOTATION" && opp?.initialQuotationRef) {
        details.push({ label: "Quotation", value: opp.initialQuotationRef });
        if (opp.initialQuotationAmount) {
          details.push({ label: "Amount", value: `₹${Number(opp.initialQuotationAmount).toLocaleString("en-IN")}` });
        }
      }
      if (ps.stage === "PURCHASE_ORDER" && opp?.poNumber) {
        details.push({ label: "PO Number", value: opp.poNumber });
        if (opp.poAmount) {
          details.push({ label: "Amount", value: `₹${Number(opp.poAmount).toLocaleString("en-IN")}` });
        }
        if (opp.poDate) {
          details.push({ label: "PO Date", value: formatStepDate(opp.poDate) ?? "" });
        }
      }

      steps.push({
        key: ps.stage,
        title: ps.title,
        icon: ps.icon,
        completed: !!completed,
        completedAt: histEntry?.createdAt,
        details,
        stageKey: ps.stage,
      });
    }
  }

  // The "current" step is the last completed one — right before the next
  // pending step — or the last step if the whole journey is done. This is
  // both what auto-expands by default AND the only step that carries the
  // Log Follow-up/Meeting actions (every step behind it is locked history,
  // every step ahead of it hasn't been reached yet).
  const currentIndex = (() => {
    const idx = steps.findIndex((s) => !s.completed);
    if (idx === -1) return steps.length - 1;
    return Math.max(0, idx - 1);
  })();
  const currentStepKey = steps[currentIndex]?.key;

  const isTerminal = isLeadTerminal(lead);
  const followUps = lead.followUps ?? [];
  const meetings = lead.meetings ?? [];

  const allKeys = steps.map((s) => s.key);
  const openValues = allKeys.filter((k) => !collapsedKeys.has(k));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Journey</CardTitle>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsedKeys(new Set())}
          >
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsedKeys(new Set(allKeys))}
          >
            Collapse all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Accordion
          multiple
          value={openValues}
          onValueChange={(next) => setCollapsedKeys(new Set(allKeys.filter((k) => !next.includes(k))))}
        >
          {steps.map((step) => {
            const StepIcon = step.icon;

            // Legacy rows with loggedAtStage: null (pre-dating this field)
            // are lumped into whichever step is currently active rather
            // than hidden outright. Quotation also absorbs anything tagged
            // FOLLOWUP/MEETING, since those aren't rendered as their own rows.
            const stepMatchesLoggedStage = (loggedAtStage: LoggedAtStage | null | undefined) =>
              step.stageKey === "QUOTATION"
                ? !!loggedAtStage && QUOTATION_STAGE_ALIASES.includes(loggedAtStage)
                : loggedAtStage === step.stageKey;

            const followUpsForStep = step.stageKey
              ? followUps.filter(
                  (f) =>
                    stepMatchesLoggedStage(f.loggedAtStage) ||
                    (f.loggedAtStage == null && step.key === currentStepKey),
                )
              : [];
            const meetingsForStep = step.stageKey
              ? meetings.filter(
                  (m) =>
                    stepMatchesLoggedStage(m.loggedAtStage) ||
                    (m.loggedAtStage == null && step.key === currentStepKey),
                )
              : [];

            return (
              <AccordionItem key={step.key} value={step.key}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 pr-2">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        step.completed
                          ? step.failed
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <StepIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{step.title}</span>
                        {step.completed && step.completedAt ? (
                          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                            <Clock className="size-3" />
                            {formatStepDate(step.completedAt)}
                          </span>
                        ) : !step.completed ? (
                          <span className="text-xs font-normal italic text-muted-foreground">
                            Pending
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-5 pl-11">
                    {step.details.length > 0 && (
                      <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-muted/30 text-sm">
                        {step.details.map((d) => (
                          <div
                            key={d.label}
                            className="flex items-baseline gap-3 px-3 py-2"
                          >
                            <span className="w-28 shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              {d.label}
                            </span>
                            <span className={cn("flex-1 font-medium text-foreground", d.tone)}>
                              {d.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {followUpsForStep.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Follow-ups at this stage
                        </p>
                        <FollowUpTimeline followUps={followUpsForStep} />
                      </div>
                    )}

                    {meetingsForStep.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Meetings at this stage
                        </p>
                        <MeetingTimeline meetings={meetingsForStep} />
                      </div>
                    )}

                    {/* Only the current step — the last completed one, right
                        before the next pending step — carries the logging
                        actions. Every step behind it is locked history;
                        every step ahead of it hasn't been reached yet. */}
                    {!isTerminal && step.key === currentStepKey && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <LogFollowUpDialog leadId={lead.id} />
                        <LogMeetingDialog leadId={lead.id} />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

const STAGE_ORDER: OpportunityStage[] = ["QUOTATION", "FOLLOWUP", "MEETING", "PURCHASE_ORDER", "LOST"];
function stageIndex(stage: OpportunityStage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? -1 : idx;
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: lead, isLoading } = useLead(id);
  const { data: users = [] } = useUserDirectory();
  const router = useRouter();

  if (isLoading || !lead) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  // Incomplete leads: show a resume prompt instead of the full detail view
  if ((lead.currentStep ?? 3) < 3) {
    const stepLabel = lead.currentStep === 1 ? "Contact Details (Step 2)" : "Qualification (Step 3)";
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12 text-center">
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          Draft — Step {lead.currentStep} of 3 completed
        </Badge>
        <h1 className="text-2xl font-bold">{lead.companyName ?? "Lead"}</h1>
        <p className="text-muted-foreground">
          This lead is not yet complete. Continue to fill in <strong>{stepLabel}</strong>.
        </p>
        <Button size="lg" onClick={() => router.push(`/leads/new?resume=${lead.id}`)}>
          Continue Lead Creation
        </Button>
      </div>
    );
  }

  const creatorName = users.find((u) => u.id === lead.createdBy)?.name ?? lead.createdBy;
  const hasGps = lead.gpsLatitude != null && lead.gpsLongitude != null;

  return (
    <div>
      <PageHeader
        title={lead.contactName ?? lead.companyName ?? "Lead"}
        description={`${lead.refNo} · ${lead.companyName ?? "—"}`}
      />

      {/* Lead Journey Itinerary */}
      <div className="mb-6">
        <LeadJourney lead={lead} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{lead.contactPhone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{lead.contactEmail ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created by</span>
              <span>{creatorName}</span>
            </div>
            {hasGps ? (
              <div>
                <p className="text-muted-foreground">Visit location</p>
                <p>{lead.visitLocation || "Address unavailable for these coordinates"}</p>
                <p className="text-xs text-muted-foreground">
                  {Number(lead.gpsLatitude).toFixed(5)}, {Number(lead.gpsLongitude).toFixed(5)}
                </p>
              </div>
            ) : null}
            {lead.lostReason ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lost reason</span>
                <span>{lead.lostReason}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Follow-up history</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowUpTimeline followUps={lead.followUps ?? []} />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingTimeline meetings={lead.meetings ?? []} />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <CommentSection entityType="LEAD" entityId={lead.id} />
        </div>
      </div>
    </div>
  );
}
