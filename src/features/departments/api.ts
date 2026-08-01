import { apiClient } from "@/lib/api-client";
import type {
  Department,
  DepartmentMemberEntry,
  DepartmentMemberRole,
  DepartmentMembership,
} from "@/types/entities";

// Interim hand-written payload types — the backend's OpenAPI spec doesn't
// document this module yet. Swap for generated `paths[...]` types once
// `npm run gen:api-types` is re-run against the live spec.
export interface CreateDepartmentPayload {
  code: string;
  name: string;
  regionId?: string;
}
export interface AddDepartmentMemberPayload {
  userId: string;
  roleInDept?: DepartmentMemberRole;
}

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>("/departments");
  return data;
}

export async function getDepartment(
  id: string,
): Promise<Department & { members: DepartmentMemberEntry[] }> {
  const { data } = await apiClient.get<Department & { members: DepartmentMemberEntry[] }>(
    `/departments/${id}`,
  );
  return data;
}

export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<Department> {
  const { data } = await apiClient.post<Department>("/departments", payload);
  return data;
}

export async function addDepartmentMember(
  departmentId: string,
  payload: AddDepartmentMemberPayload,
): Promise<DepartmentMemberEntry> {
  const { data } = await apiClient.post<DepartmentMemberEntry>(
    `/departments/${departmentId}/members`,
    payload,
  );
  return data;
}

export async function removeDepartmentMember(
  departmentId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/departments/${departmentId}/members/${userId}`);
}

// The backend doesn't expose "my memberships" as a dedicated endpoint yet —
// derive it client-side from the department list's member arrays once fetched
// via getDepartment, or (cheaper) resolve via each department's members when
// listing. For Phase 1, this fetches every visible department in full so
// membership can be computed without a dedicated backend route.
export async function getMyDepartmentMemberships(
  currentUserId: string,
): Promise<DepartmentMembership[]> {
  const departments = await listDepartments();
  const details = await Promise.all(departments.map((d) => getDepartment(d.id)));
  return details.flatMap((d) =>
    d.members
      .filter((m) => m.userId === currentUserId)
      .map((m) => ({ departmentId: d.id, roleInDept: m.roleInDept })),
  );
}
