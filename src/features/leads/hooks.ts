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

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useLogFollowUp(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.LogFollowUpPayload) =>
      api.logFollowUp(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
    },
  });
}

export function useMarkLeadLost(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.MarkLeadLostPayload) =>
      api.markLeadLost(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useQualifyLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.QualifyLeadPayload) =>
      api.qualifyLead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}
