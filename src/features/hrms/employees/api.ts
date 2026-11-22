import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type {
  Designation,
  Employee,
  EmployeeLifecycleEvent,
  EmployeeLifecycleStatus,
  EmployeeStatutory,
  EmploymentType,
  HrDocument,
  HrDocumentCategory,
} from "@/types/entities";

export type UpdateEmployeePayload = NonNullable<
  paths["/hrms/employees/{id}"]["patch"]["requestBody"]
>["content"]["application/json"];
export type UpdateMyProfilePayload = NonNullable<
  paths["/hrms/employees/me"]["patch"]["requestBody"]
>["content"]["application/json"];
export type UpsertStatutoryPayload = NonNullable<
  paths["/hrms/employees/{id}/statutory"]["put"]["requestBody"]
>["content"]["application/json"];

export interface ListEmployeesFilters {
  search?: string;
  departmentId?: string;
  designationId?: string;
  regionId?: string;
  lifecycleStatus?: EmployeeLifecycleStatus;
  employmentType?: EmploymentType;
  includeExited?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "joiningDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedEmployees {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listEmployees(filters: ListEmployeesFilters = {}): Promise<PaginatedEmployees> {
  const { data } = await apiClient.get<PaginatedEmployees>("/hrms/employees", { params: filters });
  return data;
}

export async function getMyEmployee(): Promise<Employee> {
  const { data } = await apiClient.get<Employee>("/hrms/employees/me");
  return data;
}

export async function updateMyEmployee(payload: UpdateMyProfilePayload): Promise<Employee> {
  const { data } = await apiClient.patch<Employee>("/hrms/employees/me", payload);
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/hrms/employees/${id}`);
  return data;
}

export async function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
  const { data } = await apiClient.patch<Employee>(`/hrms/employees/${id}`, payload);
  return data;
}

export async function getEmployeeStatutory(id: string): Promise<EmployeeStatutory> {
  const { data } = await apiClient.get<EmployeeStatutory>(`/hrms/employees/${id}/statutory`);
  return data;
}

export async function upsertEmployeeStatutory(id: string, payload: UpsertStatutoryPayload): Promise<EmployeeStatutory> {
  const { data } = await apiClient.put<EmployeeStatutory>(`/hrms/employees/${id}/statutory`, payload);
  return data;
}

export async function getEmployeeHistory(id: string): Promise<EmployeeLifecycleEvent[]> {
  const { data } = await apiClient.get<EmployeeLifecycleEvent[]>(`/hrms/employees/${id}/history`);
  return data;
}

export async function listEmployeeDocuments(id: string): Promise<HrDocument[]> {
  const { data } = await apiClient.get<HrDocument[]>(`/hrms/employees/${id}/documents`);
  return data;
}

export async function uploadEmployeeDocument(
  id: string,
  payload: { file: File; category: HrDocumentCategory; title: string },
): Promise<HrDocument> {
  const formData = new FormData();
  formData.append("category", payload.category);
  formData.append("title", payload.title);
  formData.append("file", payload.file);
  const { data } = await apiClient.post<HrDocument>(`/hrms/employees/${id}/documents`, formData);
  return data;
}

export async function downloadEmployeeDocument(id: string, document: HrDocument) {
  const response = await apiClient.get(`/hrms/employees/${id}/documents/${document.id}`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = document.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function verifyEmployeeDocument(id: string, documentId: string): Promise<HrDocument> {
  const { data } = await apiClient.post<HrDocument>(`/hrms/employees/${id}/documents/${documentId}/verify`);
  return data;
}

export async function deleteEmployeeDocument(id: string, documentId: string): Promise<void> {
  await apiClient.delete(`/hrms/employees/${id}/documents/${documentId}`);
}

export async function listDesignations(): Promise<Designation[]> {
  const { data } = await apiClient.get<Designation[]>("/hrms/designations");
  return data;
}
