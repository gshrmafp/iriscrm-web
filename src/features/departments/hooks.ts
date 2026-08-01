import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import * as api from "@/features/departments/api";

export const departmentsKeys = {
  all: ["departments"] as const,
  detail: (id: string) => ["departments", id] as const,
  myMemberships: (userId: string) => ["departments", "my-memberships", userId] as const,
};

export function useDepartments() {
  return useQuery({ queryKey: departmentsKeys.all, queryFn: api.listDepartments });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentsKeys.detail(id),
    queryFn: () => api.getDepartment(id),
    enabled: !!id,
  });
}

export function useMyDepartmentMemberships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: departmentsKeys.myMemberships(user?.id ?? ""),
    queryFn: () => api.getMyDepartmentMemberships(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
    },
  });
}

export function useAddDepartmentMember(departmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.AddDepartmentMemberPayload) =>
      api.addDepartmentMember(departmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(departmentId) });
      queryClient.invalidateQueries({ queryKey: ["departments", "my-memberships"] });
    },
  });
}
