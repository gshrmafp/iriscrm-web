"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, leadStatusTone } from "@/components/status-badge";
import { useLead } from "@/features/leads/hooks";
import { usePicklistLabelResolver } from "@/features/picklists/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { FollowUpTimeline } from "@/features/leads/components/follow-up-timeline";
import { LogFollowUpDialog } from "@/features/leads/components/log-follow-up-dialog";
import { QualifyLeadDialog } from "@/features/leads/components/qualify-lead-dialog";
import { MarkLeadLostDialog } from "@/features/leads/components/mark-lead-lost-dialog";
import { CommentSection } from "@/features/comments/components/comment-section";
import type { Lead } from "@/types/entities";
import {
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Phone,
  CalendarCheck,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { OpportunityStage, StageHistoryEntry } from "@/types/entities";

const QUAL_PATH_LABELS: Record<string, { label: string; tone: string }> = {
  NOT_QUALIFIED: { label: "Not Qualified", tone: "text-red-600" },
  FUTURE_POTENTIAL: { label: "Future Potential", tone: "text-blue-600" },
  REQUIREMENT_IDENTIFIED: { label: "Requirement Identified", tone: "text-emerald-600" },
};

const PIPELINE_STAGES: { stage: OpportunityStage; title: string; icon: LucideIcon }[] = [
  { stage: "QUOTED", title: "Quotation", icon: FileText },
  { stage: "NEGOTIATION", title: "Follow-ups", icon: Phone },
  { stage: "MEETING", title: "Meeting", icon: CalendarCheck },
  { stage: "WON", title: "PO (Purchase Order)", icon: ShoppingCart },
];

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
}

function LeadJourney({ lead }: { lead: Lead }) {
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
      if (ps.stage === "QUOTED" && opp?.initialQuotationRef) {
        details.push({ label: "Quotation", value: opp.initialQuotationRef });
        if (opp.initialQuotationAmount) {
          details.push({ label: "Amount", value: `₹${Number(opp.initialQuotationAmount).toLocaleString("en-IN")}` });
        }
      }
      if (ps.stage === "WON" && opp?.wonAt) {
        details.push({ label: "Won on", value: formatStepDate(opp.wonAt) ?? "" });
      }

      steps.push({
        key: ps.stage,
        title: ps.title,
        icon: ps.icon,
        completed: !!completed,
        completedAt: histEntry?.createdAt,
        details,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-[32px] bottom-0 w-0.5 ${
                      step.completed ? "bg-emerald-300" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${
                    step.completed
                      ? step.failed
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.completed ? (
                    <StepIcon className="size-4" />
                  ) : (
                    <StepIcon className="size-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{step.title}</span>
                    {step.completed && step.completedAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatStepDate(step.completedAt)}
                      </span>
                    )}
                  </div>
                  {step.completed && step.details.length > 0 && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
                      {step.details.map((d) => (
                        <div key={d.label} className="flex gap-2">
                          <span className="shrink-0 text-muted-foreground w-20">{d.label}</span>
                          <span className={`flex-1 ${d.tone ?? ""}`}>
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!step.completed && (
                    <p className="mt-1 text-xs text-muted-foreground italic">Pending</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const STAGE_ORDER: OpportunityStage[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "NEGOTIATION", "MEETING", "WON", "LOST"];
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
  const resolveLabel = usePicklistLabelResolver();
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

  const isOpen = lead.status === "NEW";

  return (
    <div>
      <PageHeader
        title={lead.contactName ?? lead.companyName ?? "Lead"}
        description={`${lead.refNo} · ${lead.companyName ?? "—"}`}
        actions={
          isOpen ? (
            <>
              <LogFollowUpDialog leadId={lead.id} />
              <QualifyLeadDialog leadId={lead.id} />
              <MarkLeadLostDialog leadId={lead.id} />
            </>
          ) : null
        }
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
            {lead.source && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>
                  {lead.source === "OTHER" && lead.sourceOther
                    ? lead.sourceOther
                    : resolveLabel("LEAD_SOURCE", lead.source)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product interest</span>
              <span>
                {lead.productInterest === "OTHER" && lead.productInterestOther
                  ? lead.productInterestOther
                  : resolveLabel("PRODUCT_INTEREST", lead.productInterest) || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created by</span>
              <span>{creatorName}</span>
            </div>
            {lead.address ? (
              <div>
                <p className="text-muted-foreground">Address</p>
                <p>{lead.address}</p>
              </div>
            ) : null}
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
            {lead.notes ? (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p>{lead.notes}</p>
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

        <div className="md:col-span-3">
          <CommentSection entityType="LEAD" entityId={lead.id} />
        </div>
      </div>
    </div>
  );
}
