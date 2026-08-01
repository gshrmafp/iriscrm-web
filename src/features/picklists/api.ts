import { apiClient } from "@/lib/api-client";
import type { PicklistOption, PicklistType } from "@/types/entities";

export interface CreatePicklistOptionPayload {
  listType: PicklistType;
  code: string;
  label: string;
  sortOrder?: number;
}
export interface UpdatePicklistOptionPayload {
  label?: string;
  active?: boolean;
  sortOrder?: number;
}

export async function listActivePicklistOptions(listType: PicklistType): Promise<PicklistOption[]> {
  const { data } = await apiClient.get<PicklistOption[]>("/picklists", { params: { listType } });
  return data;
}

export async function listAllPicklistOptions(listType: PicklistType): Promise<PicklistOption[]> {
  const { data } = await apiClient.get<PicklistOption[]>("/picklists/all", { params: { listType } });
  return data;
}

export async function createPicklistOption(
  payload: CreatePicklistOptionPayload,
): Promise<PicklistOption> {
  const { data } = await apiClient.post<PicklistOption>("/picklists", payload);
  return data;
}

export async function updatePicklistOption(
  id: string,
  payload: UpdatePicklistOptionPayload,
): Promise<PicklistOption> {
  const { data } = await apiClient.patch<PicklistOption>(`/picklists/${id}`, payload);
  return data;
}
