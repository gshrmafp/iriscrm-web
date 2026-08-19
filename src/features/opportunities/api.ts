import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type { DealType, Opportunity, OpportunityStage } from "@/types/entities";

type ChangeStagePayload =
  paths["/opportunities/{id}/stage"]["patch"]["requestBody"]["content"]["application/json"];
type ReassignPayload =
  paths["/opportunities/{id}/reassign"]["post"]["requestBody"]["content"]["application/json"];
type MarkLostPayload =
  paths["/opportunities/{id}/lost"]["post"]["requestBody"]["content"]["application/json"];
type WinPayload = NonNullable<
  paths["/opportunities/{id}/win"]["post"]["requestBody"]
>["content"]["application/json"];

export type { ChangeStagePayload, ReassignPayload, MarkLostPayload, WinPayload };

export interface ListOpportunitiesFilters {
  stage?: OpportunityStage;
  dealType?: DealType;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "value" | "expectedClose";
  sortOrder?: "asc" | "desc";
}
export interface PaginatedOpportunities {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface OpportunityPipelineSummary {
  byStage: { stage: OpportunityStage; count: number; value: number }[];
  openCount: number;
  pipelineValue: number;
  weightedForecast: number;
}

export async function listOpportunities(
  filters: ListOpportunitiesFilters = {},
): Promise<PaginatedOpportunities> {
  const { data } = await apiClient.get<PaginatedOpportunities>("/opportunities", { params: filters });
  return data;
}

export async function getOpportunityPipelineSummary(
  ownerId?: string,
): Promise<OpportunityPipelineSummary> {
  const { data } = await apiClient.get<OpportunityPipelineSummary>("/opportunities/summary/stats", {
    params: ownerId ? { ownerId } : undefined,
  });
  return data;
}

export async function getOpportunity(id: string): Promise<Opportunity> {
  const { data } = await apiClient.get<Opportunity>(`/opportunities/${id}`);
  return data;
}

export async function changeStage(
  id: string,
  payload: ChangeStagePayload,
): Promise<Opportunity> {
  const { data } = await apiClient.patch<Opportunity>(
    `/opportunities/${id}/stage`,
    payload,
  );
  return data;
}

export async function reassignOpportunity(
  id: string,
  payload: ReassignPayload,
): Promise<Opportunity> {
  const { data } = await apiClient.post<Opportunity>(
    `/opportunities/${id}/reassign`,
    payload,
  );
  return data;
}

export async function markOpportunityLost(
  id: string,
  payload: MarkLostPayload,
): Promise<Opportunity> {
  const { data } = await apiClient.post<Opportunity>(
    `/opportunities/${id}/lost`,
    payload,
  );
  return data;
}

export async function winOpportunity(
  id: string,
  payload: WinPayload,
): Promise<Opportunity> {
  const { data } = await apiClient.post<Opportunity>(
    `/opportunities/${id}/win`,
    payload,
  );
  return data;
}
