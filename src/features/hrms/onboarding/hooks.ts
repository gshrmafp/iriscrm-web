import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/hrms/onboarding/api";
import { employeesKeys } from "@/features/hrms/employees/hooks";

export const onboardingKeys = {
  checklist: (employeeId: string) => [...employeesKeys.all, employeeId, "onboarding"] as const,
  templates: ["hrms", "onboarding", "templates"] as const,
};

export function useOnboardEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.onboardEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["hrms", "org-chart"] });
    },
  });
}

export function useOnboardingChecklist(employeeId: string) {
  return useQuery({
    queryKey: onboardingKeys.checklist(employeeId),
    queryFn: () => api.getOnboardingChecklist(employeeId),
    enabled: !!employeeId,
  });
}

export function useSetOnboardingTaskDone(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) => api.setOnboardingTaskDone(employeeId, taskId, done),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.checklist(employeeId) }),
  });
}

export function useAddOnboardingTask(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.AddOnboardingTaskPayload) => api.addOnboardingTask(employeeId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.checklist(employeeId) }),
  });
}

export function useOnboardingTemplates(enabled = true) {
  return useQuery({ queryKey: onboardingKeys.templates, queryFn: api.listOnboardingTemplates, enabled });
}

export function useSaveOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: api.OnboardingTemplatePayload }) =>
      id ? api.updateOnboardingTemplate(id, payload) : api.createOnboardingTemplate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.templates }),
  });
}
