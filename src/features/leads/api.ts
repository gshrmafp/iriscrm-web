import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type {
  FollowUp,
  Lead,
  LeadMeeting,
  LeadStageFilter,
  LeadStatus,
  Opportunity,
  OpportunityStage,
} from "@/types/entities";

type LogFollowUpPayload =
  paths["/leads/{id}/follow-ups"]["post"]["requestBody"]["content"]["application/json"];
type LogMeetingPayload =
  paths["/leads/{id}/meetings"]["post"]["requestBody"]["content"]["application/json"];

export type { LogFollowUpPayload, LogMeetingPayload };

export interface ListLeadsFilters {
  status?: LeadStatus;
  stage?: LeadStageFilter;
  ownerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "contactName";
  sortOrder?: "asc" | "desc";
}
export interface PaginatedLeads {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listLeads(filters: ListLeadsFilters = {}): Promise<PaginatedLeads> {
  const { data } = await apiClient.get<PaginatedLeads>("/leads", { params: filters });
  return data;
}

export interface LeadStatusCount {
  status: LeadStatus;
  count: number;
}

export async function getLeadStatusSummary(ownerId?: string): Promise<LeadStatusCount[]> {
  const { data } = await apiClient.get<LeadStatusCount[]>("/leads/status-summary", {
    params: ownerId ? { ownerId } : undefined,
  });
  return data;
}

// Combined Lead+Opportunity 7-stage breakdown (with recent leads per stage)
// powering the Dashboard's sidebar.
export interface JourneyRecentLead {
  id: string;
  refNo: string;
  contactName?: string | null;
  companyName?: string | null;
  status: LeadStatus;
  currentStep: number;
  updatedAt: string;
  opportunity?: { stage: OpportunityStage } | null;
}

export interface JourneyStageSummary {
  stage: LeadStageFilter;
  count: number;
  value?: number;
  recentLeads: JourneyRecentLead[];
}

export interface LeadJourneySummary {
  stages: JourneyStageSummary[];
  total: number;
}

export interface JourneySummaryFilters {
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getLeadJourneySummary(
  filters: JourneySummaryFilters = {},
): Promise<LeadJourneySummary> {
  const { data } = await apiClient.get<LeadJourneySummary>("/leads/journey-summary", {
    params: filters,
  });
  return data;
}

// Per-owner version of the same 7-stage breakdown, for the Dashboard's Team
// performance table.
export interface TeamPerformanceRow {
  ownerId: string;
  counts: Record<LeadStageFilter, number>;
}

export interface TeamPerformanceFilters {
  dateFrom?: string;
  dateTo?: string;
}

export async function getTeamPerformance(
  filters: TeamPerformanceFilters = {},
): Promise<TeamPerformanceRow[]> {
  const { data } = await apiClient.get<TeamPerformanceRow[]>("/leads/team-performance", {
    params: filters,
  });
  return data;
}

export async function getLead(id: string): Promise<Lead> {
  const { data } = await apiClient.get<Lead>(`/leads/${id}`);
  return data;
}

export async function logFollowUp(
  id: string,
  payload: LogFollowUpPayload,
): Promise<FollowUp> {
  const { data } = await apiClient.post<FollowUp>(
    `/leads/${id}/follow-ups`,
    payload,
  );
  return data;
}

export async function logMeeting(
  id: string,
  payload: LogMeetingPayload,
): Promise<LeadMeeting> {
  const { data } = await apiClient.post<LeadMeeting>(
    `/leads/${id}/meetings`,
    payload,
  );
  return data;
}

// ---------- Stepped lead creation ----------

export interface Step1Payload {
  companyName: string;
  remarks: string;
  gpsLatitude: number;
  gpsLongitude: number;
  visitLocation: string;
}

export interface Step2Payload {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  discussionNote: string;
}

export type Step3Payload =
  | { path: "NOT_QUALIFIED"; remark: string }
  | { path: "FUTURE_POTENTIAL"; followUpDate: string; remarks?: string }
  | {
      path: "REQUIREMENT_IDENTIFIED";
      dealType: "INSTALLATION" | "AMC" | "MAINTENANCE";
      quotationRef: string;
      quotationDate: string;
      quotationAmount: number;
    };

export async function createLeadStep1(
  payload: Step1Payload,
): Promise<{ lead: Lead }> {
  const { data } = await apiClient.post<{ lead: Lead }>(
    "/leads/stepped",
    payload,
  );
  return data;
}

export async function saveLeadStep2(
  id: string,
  payload: Step2Payload,
): Promise<{ lead: Lead; duplicateWarning?: string[] }> {
  const { data } = await apiClient.patch<{
    lead: Lead;
    duplicateWarning?: string[];
  }>(`/leads/${id}/step-2`, payload);
  return data;
}

export async function saveLeadStep3(
  id: string,
  payload: Step3Payload,
): Promise<{ lead: Lead; opportunity?: Opportunity; followUp?: FollowUp }> {
  const { data } = await apiClient.patch<{
    lead: Lead;
    opportunity?: Opportunity;
    followUp?: FollowUp;
  }>(`/leads/${id}/step-3`, payload);
  return data;
}
