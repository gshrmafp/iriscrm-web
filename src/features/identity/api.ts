import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type {
  EffectivePermissions,
  PermissionOverride,
  Region,
  Role,
  User,
} from "@/types/entities";

type CreateRegionPayload =
  paths["/regions"]["post"]["requestBody"]["content"]["application/json"];
type CreateUserPayload =
  paths["/users"]["post"]["requestBody"]["content"]["application/json"];
type CreatePermissionOverridePayload =
  paths["/users/{id}/permission-overrides"]["post"]["requestBody"]["content"]["application/json"];
type UpdateUserPayload =
  paths["/users/{id}"]["patch"]["requestBody"]["content"]["application/json"];

export type {
  CreateRegionPayload,
  CreateUserPayload,
  CreatePermissionOverridePayload,
  UpdateUserPayload,
};

export async function listRegions(): Promise<Region[]> {
  const { data } = await apiClient.get<Region[]>("/regions");
  return data;
}

export async function createRegion(
  payload: CreateRegionPayload,
): Promise<Region> {
  const { data } = await apiClient.post<Region>("/regions", payload);
  return data;
}

export async function updateRegion(
  id: string,
  payload: { active: boolean },
): Promise<Region> {
  const { data } = await apiClient.patch<Region>(`/regions/${id}`, payload);
  return data;
}

export interface ListUsersFilters {
  role?: Role;
  regionId?: string;
  status?: "ACTIVE" | "INACTIVE";
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
}
export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listUsers(filters: ListUsersFilters = {}): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>("/users", { params: filters });
  return data;
}

// Minimal read-only directory (id/name/email/role, region-scoped) any
// authenticated user can call — for @mentions, assignment pickers, and
// timeline name lookups. Unlike listUsers() above, this needs no
// IDENTITY_USER_MANAGE permission.
export async function listUserDirectory(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/users/directory");
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<User>("/users", payload);
  return data;
}

export async function updateUserStatus(
  id: string,
  payload: { status: "ACTIVE" | "INACTIVE" },
): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${id}/status`, payload);
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
  return data;
}

export async function getEffectivePermissions(
  userId: string,
): Promise<EffectivePermissions> {
  const { data } = await apiClient.get<EffectivePermissions>(
    `/users/${userId}/permissions`,
  );
  return data;
}

export async function createPermissionOverride(
  userId: string,
  payload: CreatePermissionOverridePayload,
): Promise<PermissionOverride> {
  const { data } = await apiClient.post<PermissionOverride>(
    `/users/${userId}/permission-overrides`,
    payload,
  );
  return data;
}

export async function deletePermissionOverride(
  userId: string,
  permissionKey: string,
): Promise<void> {
  await apiClient.delete(
    `/users/${userId}/permission-overrides/${encodeURIComponent(permissionKey)}`,
  );
}
