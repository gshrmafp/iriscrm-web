import { apiClient } from "@/lib/api-client";
import type { Designation, OrgChartNode } from "@/types/entities";

export async function getOrgChart(filters: { regionId?: string; departmentId?: string } = {}): Promise<OrgChartNode[]> {
  const { data } = await apiClient.get<OrgChartNode[]>("/hrms/org-chart", { params: filters });
  return data;
}

export async function createDesignation(payload: { code: string; name: string; level?: number | null }): Promise<Designation> {
  const { data } = await apiClient.post<Designation>("/hrms/designations", payload);
  return data;
}

export async function updateDesignation(
  id: string,
  payload: { name?: string; level?: number | null; active?: boolean },
): Promise<Designation> {
  const { data } = await apiClient.patch<Designation>(`/hrms/designations/${id}`, payload);
  return data;
}

export interface HrDepartment {
  id: string;
  code: string;
  name: string;
  regionId: string | null;
  region: { id: string; code: string; name: string } | null;
  active: boolean;
  headcount: number;
}

export async function listHrDepartments(includeInactive = false): Promise<HrDepartment[]> {
  const { data } = await apiClient.get<HrDepartment[]>("/hrms/departments", {
    params: includeInactive ? { includeInactive: "true" } : undefined,
  });
  return data;
}

export async function createDepartment(payload: { code: string; name: string; regionId?: string }) {
  const { data } = await apiClient.post("/departments", payload);
  return data;
}

export async function updateDepartment(id: string, payload: { name?: string; active?: boolean }) {
  const { data } = await apiClient.patch(`/departments/${id}`, payload);
  return data;
}
