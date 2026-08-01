import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/identity/api";

export const identityKeys = {
  regions: ["regions"] as const,
  users: ["users"] as const,
  usersList: (filters: api.ListUsersFilters) => ["users", "list", filters] as const,
  userDirectory: ["users", "directory"] as const,
  permissions: (userId: string) => ["users", userId, "permissions"] as const,
};

export function useRegions() {
  return useQuery({ queryKey: identityKeys.regions, queryFn: api.listRegions });
}

export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.regions });
    },
  });
}

export function useUpdateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.updateRegion(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.regions });
    },
  });
}

export function useUsers(filters: api.ListUsersFilters = {}) {
  return useQuery({
    queryKey: identityKeys.usersList(filters),
    queryFn: () => api.listUsers(filters),
  });
}

export function useUserDirectory() {
  return useQuery({ queryKey: identityKeys.userDirectory, queryFn: api.listUserDirectory });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.users });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      api.updateUserStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.users });
    },
  });
}

export function useEffectivePermissions(userId: string) {
  return useQuery({
    queryKey: identityKeys.permissions(userId),
    queryFn: () => api.getEffectivePermissions(userId),
    enabled: !!userId,
  });
}

export function useCreatePermissionOverride(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.CreatePermissionOverridePayload) =>
      api.createPermissionOverride(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: identityKeys.permissions(userId),
      });
    },
  });
}

export function useDeletePermissionOverride(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionKey: string) =>
      api.deletePermissionOverride(userId, permissionKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: identityKeys.permissions(userId),
      });
    },
  });
}
