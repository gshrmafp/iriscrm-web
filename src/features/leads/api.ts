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
