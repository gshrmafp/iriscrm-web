import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type { Employee, OnboardingChecklist, OnboardingTask, OnboardingTemplate } from "@/types/entities";

export type OnboardEmployeePayload = NonNullable<
  paths["/hrms/onboarding"]["post"]["requestBody"]
>["content"]["application/json"];
export type AddOnboardingTaskPayload = NonNullable<
  paths["/hrms/employees/{id}/onboarding"]["post"]["requestBody"]
>["content"]["application/json"];
export type OnboardingTemplatePayload = NonNullable<
  paths["/hrms/onboarding/templates"]["post"]["requestBody"]
>["content"]["application/json"];

export async function onboardEmployee(payload: OnboardEmployeePayload): Promise<Employee> {
  const { data } = await apiClient.post<Employee>("/hrms/onboarding", payload);
  return data;
}

export async function getOnboardingChecklist(employeeId: string): Promise<OnboardingChecklist> {
  const { data } = await apiClient.get<OnboardingChecklist>(`/hrms/employees/${employeeId}/onboarding`);
  return data;
}

export async function addOnboardingTask(employeeId: string, payload: AddOnboardingTaskPayload): Promise<OnboardingTask> {
  const { data } = await apiClient.post<OnboardingTask>(`/hrms/employees/${employeeId}/onboarding`, payload);
  return data;
}

export async function setOnboardingTaskDone(employeeId: string, taskId: string, done: boolean): Promise<OnboardingTask> {
  const { data } = await apiClient.patch<OnboardingTask>(`/hrms/employees/${employeeId}/onboarding/${taskId}`, { done });
  return data;
}

export async function listOnboardingTemplates(): Promise<OnboardingTemplate[]> {
  const { data } = await apiClient.get<OnboardingTemplate[]>("/hrms/onboarding/templates");
  return data;
}

export async function createOnboardingTemplate(payload: OnboardingTemplatePayload): Promise<OnboardingTemplate> {
  const { data } = await apiClient.post<OnboardingTemplate>("/hrms/onboarding/templates", payload);
  return data;
}

export async function updateOnboardingTemplate(id: string, payload: OnboardingTemplatePayload): Promise<OnboardingTemplate> {
  const { data } = await apiClient.put<OnboardingTemplate>(`/hrms/onboarding/templates/${id}`, payload);
  return data;
}
