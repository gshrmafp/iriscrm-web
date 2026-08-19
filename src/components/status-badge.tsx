import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-info/10 text-info dark:bg-info/15",
  warning: "bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning",
  success: "bg-success/10 text-success dark:bg-success/15",
  danger: "bg-danger/10 text-danger dark:bg-danger/15",
  purple: "bg-purple/10 text-purple dark:bg-purple/15",
  teal: "bg-teal/10 text-teal dark:bg-teal/15",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <Badge className={cn("font-normal", TONE_CLASSES[tone])} variant="outline">
      {label}
    </Badge>
  );
}

export function leadStatusTone(status: string) {
  if (status === "QUALIFIED") return "success" as const;
  if (status === "LOST") return "danger" as const;
  return "info" as const;
}

export function opportunityStageTone(stage: string) {
  if (stage === "WON") return "success" as const;
  if (stage === "LOST") return "danger" as const;
  if (stage === "NEGOTIATION" || stage === "QUOTED") return "warning" as const;
  return "info" as const;
}

export function quotationStatusTone(status: string) {
  if (status === "APPROVED" || status === "ACCEPTED" || status === "SENT")
    return "success" as const;
  if (status === "REJECTED" || status === "EXPIRED") return "danger" as const;
  if (status === "PENDING_APPROVAL") return "warning" as const;
  return "neutral" as const;
}

export function salesQueryStatusTone(status: string) {
  if (status === "WON") return "success" as const;
  if (status === "LOST" || status === "CANCELLED") return "danger" as const;
  if (status === "WAITING_FOR_CUSTOMER" || status === "NEGOTIATION")
    return "warning" as const;
  if (status === "CLOSED") return "neutral" as const;
  return "info" as const;
}

export function queryPriorityTone(priority: string) {
  if (priority === "URGENT") return "danger" as const;
  if (priority === "HIGH") return "warning" as const;
  if (priority === "LOW") return "neutral" as const;
  return "info" as const;
}

export function followUpStatusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "OVERDUE") return "danger" as const;
  if (status === "CANCELLED") return "neutral" as const;
  if (status === "RESCHEDULED") return "warning" as const;
  return "info" as const;
}
