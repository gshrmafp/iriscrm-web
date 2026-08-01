import { apiClient } from "@/lib/api-client";
import type { components, paths } from "@/types/api.generated";
import type { Quotation } from "@/types/entities";

export type QuotationLineInput = components["schemas"]["QuotationLineInput"];
type CreateQuotationPayload =
  paths["/quotations"]["post"]["requestBody"]["content"]["application/json"];
type ReviseQuotationPayload =
  paths["/quotations/{id}/revise"]["post"]["requestBody"]["content"]["application/json"];

export type { CreateQuotationPayload, ReviseQuotationPayload };

export async function listQuotationsForOpportunity(
  opportunityId: string,
): Promise<Quotation[]> {
  const { data } = await apiClient.get<Quotation[]>(
    `/opportunities/${opportunityId}/quotations`,
  );
  return data;
}

export async function createQuotation(
  payload: CreateQuotationPayload,
): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>("/quotations", payload);
  return data;
}

export async function reviseQuotation(
  id: string,
  payload: ReviseQuotationPayload,
): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(
    `/quotations/${id}/revise`,
    payload,
  );
  return data;
}

export async function submitQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`/quotations/${id}/submit`);
  return data;
}

export async function approveQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(
    `/quotations/${id}/approve`,
  );
  return data;
}

export async function rejectQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`/quotations/${id}/reject`);
  return data;
}

export async function sendQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`/quotations/${id}/send`);
  return data;
}
