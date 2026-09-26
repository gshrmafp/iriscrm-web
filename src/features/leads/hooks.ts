import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/leads/api";

export const leadsKeys = {
  all: ["leads"] as const,
  list: (filters: api.ListLeadsFilters) => ["leads", "list", filters] as const,
  detail: (id: string) => ["leads", id] as const,
};

export function useLeads(filters: api.ListLeadsFilters = {}) {
  return useQuery({
    queryKey: leadsKeys.list(filters),
    queryFn: () => api.listLeads(filters),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => api.getLead(id),
    enabled: !!id,
  });
}

export function useLeadStatusSummary(ownerId?: string) {
  return useQuery({
    queryKey: ["leads", "status-summary", ownerId ?? null],
    queryFn: () => api.getLeadStatusSummary(ownerId),
  });
}

export function useLeadJourneySummary(filters: api.JourneySummaryFilters = {}) {
  return useQuery({
    queryKey: ["leads", "journey-summary", filters],
    queryFn: () => api.getLeadJourneySummary(filters),
  });
}

export function useTeamPerformance(filters: api.TeamPerformanceFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["leads", "team-performance", filters],
    queryFn: () => api.getTeamPerformance(filters),
    enabled: options.enabled ?? true,
  });
}

export function useLogFollowUp(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.LogFollowUpPayload) =>
      api.logFollowUp(id, payload),
    onSuccess: () => {
      // A follow-up can silently auto-advance the linked opportunity's stage
      // (QUOTATION -> FOLLOWUP) on the backend, so refetch both.
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function useLogMeeting(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.LogMeetingPayload) => api.logMeeting(id, payload),
    onSuccess: () => {
      // A meeting can silently auto-advance the linked opportunity's stage
      // (QUOTATION/FOLLOWUP -> MEETING) on the backend, so refetch both.
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

// ---------- Stepped lead creation ----------

export function useCreateLeadStep1() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLeadStep1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useSaveLeadStep2(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.Step2Payload) => api.saveLeadStep2(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useSaveLeadStep3(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.Step3Payload) => api.saveLeadStep3(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}
