import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type { FollowUp, Lead, LeadStatus, Opportunity } from "@/types/entities";

type CreateLeadPayload =
  paths["/leads"]["post"]["requestBody"]["content"]["application/json"];
type LogFollowUpPayload =
  paths["/leads/{id}/follow-ups"]["post"]["requestBody"]["content"]["application/json"];
type MarkLeadLostPayload =
  paths["/leads/{id}/lost"]["post"]["requestBody"]["content"]["application/json"];
type QualifyLeadPayload =
  paths["/leads/{id}/qualify"]["post"]["requestBody"]["content"]["application/json"];

export type { CreateLeadPayload, LogFollowUpPayload, MarkLeadLostPayload, QualifyLeadPayload };

export interface ListLeadsFilters {
  status?: LeadStatus;
  source?: string;
  productInterest?: string;
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

export async function getLead(id: string): Promise<Lead> {
  const { data } = await apiClient.get<Lead>(`/leads/${id}`);
  return data;
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const { data } = await apiClient.post<{ lead: Lead }>("/leads", payload);
  return data.lead;
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

export async function markLeadLost(
  id: string,
  payload: MarkLeadLostPayload,
): Promise<Lead> {
  const { data } = await apiClient.post<Lead>(`/leads/${id}/lost`, payload);
  return data;
}

export async function qualifyLead(
  id: string,
  payload: QualifyLeadPayload,
): Promise<Opportunity> {
  const { data } = await apiClient.post<Opportunity>(
    `/leads/${id}/qualify`,
    payload,
  );
  return data;
}

// ---------- Stepped lead creation ----------

export interface Step1Payload {
  companyName: string;
  remarks?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  visitLocation?: string;
}

export interface Step2Payload {
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  discussionNote?: string;
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
