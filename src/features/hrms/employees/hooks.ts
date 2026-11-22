import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/hrms/employees/api";
import type { HrDocumentCategory } from "@/types/entities";

export const employeesKeys = {
  all: ["hrms", "employees"] as const,
  list: (filters: api.ListEmployeesFilters) => ["hrms", "employees", "list", filters] as const,
  me: ["hrms", "employees", "me"] as const,
  detail: (id: string) => ["hrms", "employees", id] as const,
  statutory: (id: string) => ["hrms", "employees", id, "statutory"] as const,
  history: (id: string) => ["hrms", "employees", id, "history"] as const,
  documents: (id: string) => ["hrms", "employees", id, "documents"] as const,
  designations: ["hrms", "designations"] as const,
};

export function useEmployees(filters: api.ListEmployeesFilters = {}) {
  return useQuery({ queryKey: employeesKeys.list(filters), queryFn: () => api.listEmployees(filters) });
}

export function useMyEmployee() {
  return useQuery({ queryKey: employeesKeys.me, queryFn: api.getMyEmployee });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: employeesKeys.detail(id), queryFn: () => api.getEmployee(id), enabled: !!id });
}

export function useEmployeeStatutory(id: string, enabled = true) {
  return useQuery({
    queryKey: employeesKeys.statutory(id),
    queryFn: () => api.getEmployeeStatutory(id),
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useEmployeeHistory(id: string) {
  return useQuery({ queryKey: employeesKeys.history(id), queryFn: () => api.getEmployeeHistory(id), enabled: !!id });
}

export function useEmployeeDocuments(id: string, enabled = true) {
  return useQuery({
    queryKey: employeesKeys.documents(id),
    queryFn: () => api.listEmployeeDocuments(id),
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useDesignations() {
  return useQuery({ queryKey: employeesKeys.designations, queryFn: api.listDesignations, staleTime: 5 * 60_000 });
}

// Profile edits can change what other screens show (directory rows, history),
// so invalidate the whole employees subtree rather than guessing.
function useInvalidateEmployees() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: employeesKeys.all });
}

export function useUpdateEmployee(id: string) {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload: api.UpdateEmployeePayload) => api.updateEmployee(id, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateMyEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload: api.UpdateMyProfilePayload) => api.updateMyEmployee(payload),
    onSuccess: invalidate,
  });
}

export function useUpsertEmployeeStatutory(id: string) {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload: api.UpsertStatutoryPayload) => api.upsertEmployeeStatutory(id, payload),
    onSuccess: invalidate,
  });
}

export function useUploadEmployeeDocument(id: string) {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload: { file: File; category: HrDocumentCategory; title: string }) =>
      api.uploadEmployeeDocument(id, payload),
    onSuccess: invalidate,
  });
}

export function useVerifyEmployeeDocument(id: string) {
  const invalidate = useInvalidateEmployees();
  return useMutation({ mutationFn: (documentId: string) => api.verifyEmployeeDocument(id, documentId), onSuccess: invalidate });
}

export function useDeleteEmployeeDocument(id: string) {
  const invalidate = useInvalidateEmployees();
  return useMutation({ mutationFn: (documentId: string) => api.deleteEmployeeDocument(id, documentId), onSuccess: invalidate });
}
