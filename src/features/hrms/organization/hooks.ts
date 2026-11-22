import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/hrms/organization/api";
import { employeesKeys } from "@/features/hrms/employees/hooks";

export function useOrgChart(filters: { regionId?: string; departmentId?: string } = {}) {
  return useQuery({ queryKey: ["hrms", "org-chart", filters], queryFn: () => api.getOrgChart(filters) });
}

export function useSaveDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: { code?: string; name: string; level?: number | null; active?: boolean } }) =>
      id
        ? api.updateDesignation(id, { name: payload.name, level: payload.level, active: payload.active })
        : api.createDesignation({ code: payload.code ?? "", name: payload.name, level: payload.level }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeesKeys.designations }),
  });
}

export const hrDepartmentsKey = ["hrms", "departments"] as const;

// HR screens use this instead of features/departments' useDepartments — that
// endpoint needs a Sales permission HR admins don't hold.
export function useHrDepartments(includeInactive = false) {
  return useQuery({
    queryKey: [...hrDepartmentsKey, { includeInactive }],
    queryFn: () => api.listHrDepartments(includeInactive),
    staleTime: 60_000,
  });
}

export function useSaveDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: { code?: string; name: string; regionId?: string; active?: boolean } }) =>
      id
        ? api.updateDepartment(id, { name: payload.name, active: payload.active })
        : api.createDepartment({ code: payload.code ?? "", name: payload.name, regionId: payload.regionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrDepartmentsKey });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
