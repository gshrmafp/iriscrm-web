import type { MeetingType, QueryPriority, SalesQueryStatus } from "@/types/entities";

export const STATUS_ORDER: SalesQueryStatus[] = [
  "NEW",
  "ASSIGNED",
  "UNDER_REVIEW",
  "WAITING_FOR_CUSTOMER",
  "WAITING_FOR_INTERNAL_TEAM",
  "QUOTATION_PREPARATION",
  "QUOTATION_PREPARED",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "CANCELLED",
  "CLOSED",
];

export const STATUS_LABELS: Record<SalesQueryStatus, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  UNDER_REVIEW: "Under Review",
  WAITING_FOR_CUSTOMER: "Waiting for Customer",
  WAITING_FOR_INTERNAL_TEAM: "Waiting for Internal Team",
  QUOTATION_PREPARATION: "Quotation Preparation",
  QUOTATION_PREPARED: "Quotation Ready",
  QUOTATION_SENT: "Quotation Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
};

export const STATUS_TRANSITIONS: Record<SalesQueryStatus, SalesQueryStatus[]> = {
  NEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["UNDER_REVIEW", "CANCELLED", "WAITING_FOR_INTERNAL_TEAM"],
  UNDER_REVIEW: [
    "WAITING_FOR_CUSTOMER",
    "WAITING_FOR_INTERNAL_TEAM",
    "QUOTATION_PREPARATION",
    "QUOTATION_PREPARED",
    "LOST",
    "CANCELLED",
  ],
  WAITING_FOR_CUSTOMER: [
    "UNDER_REVIEW",
    "QUOTATION_PREPARATION",
    "QUOTATION_PREPARED",
    "LOST",
    "CANCELLED",
  ],
  WAITING_FOR_INTERNAL_TEAM: [
    "UNDER_REVIEW",
    "QUOTATION_PREPARATION",
    "QUOTATION_PREPARED",
    "CANCELLED",
  ],
  QUOTATION_PREPARATION: [
    "QUOTATION_PREPARED",
    "UNDER_REVIEW",
    "WAITING_FOR_INTERNAL_TEAM",
    "CANCELLED",
  ],
  QUOTATION_PREPARED: [
    "QUOTATION_SENT",
    "QUOTATION_PREPARATION",
    "UNDER_REVIEW",
    "CANCELLED",
  ],
  QUOTATION_SENT: [
    "NEGOTIATION",
    "WON",
    "LOST",
    "WAITING_FOR_CUSTOMER",
    "QUOTATION_PREPARATION",
  ],
  NEGOTIATION: ["WON", "LOST", "QUOTATION_PREPARATION", "QUOTATION_PREPARED"],
  WON: ["CLOSED"],
  LOST: ["CLOSED"],
  CANCELLED: ["CLOSED"],
  CLOSED: [],
};

export const REMARK_REQUIRED_STATUSES: SalesQueryStatus[] = [
  "LOST",
  "CANCELLED",
  "WAITING_FOR_CUSTOMER",
  "WAITING_FOR_INTERNAL_TEAM",
  "CLOSED",
];

export const PRIORITY_OPTIONS: QueryPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "REFERRAL", label: "Referral" },
];
