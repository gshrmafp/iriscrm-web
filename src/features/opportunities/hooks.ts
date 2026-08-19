import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/opportunities/api";

export const opportunitiesKeys = {
  all: ["opportunities"] as const,
  list: (filters: api.ListOpportunitiesFilters) => ["opportunities", "list", filters] as const,
  summary: ["opportunities", "summary"] as const,
  detail: (id: string) => ["opportunities", id] as const,
};

export function useOpportunities(filters: api.ListOpportunitiesFilters = {}) {
  return useQuery({
    queryKey: opportunitiesKeys.list(filters),
    queryFn: () => api.listOpportunities(filters),
  });
}

export function useOpportunityPipelineSummary(ownerId?: string) {
  return useQuery({
    queryKey: [...opportunitiesKeys.summary, ownerId ?? null],
    queryFn: () => api.getOpportunityPipelineSummary(ownerId),
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: opportunitiesKeys.detail(id),
    queryFn: () => api.getOpportunity(id),
    enabled: !!id,
  });
}

function useInvalidateOpportunity(id: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: opportunitiesKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: opportunitiesKeys.all });
  };
}

export function useChangeStage(id: string) {
  const invalidate = useInvalidateOpportunity(id);
  return useMutation({
    mutationFn: (payload: api.ChangeStagePayload) =>
      api.changeStage(id, payload),
    onSuccess: invalidate,
  });
}

export function useReassignOpportunity(id: string) {
  const invalidate = useInvalidateOpportunity(id);
  return useMutation({
    mutationFn: (payload: api.ReassignPayload) =>
      api.reassignOpportunity(id, payload),
    onSuccess: invalidate,
  });
}

export function useMarkOpportunityLost(id: string) {
  const invalidate = useInvalidateOpportunity(id);
  return useMutation({
    mutationFn: (payload: api.MarkLostPayload) =>
      api.markOpportunityLost(id, payload),
    onSuccess: invalidate,
  });
}

export function useWinOpportunity(id: string) {
  const invalidate = useInvalidateOpportunity(id);
  return useMutation({
    mutationFn: (payload: api.WinPayload) => api.winOpportunity(id, payload),
    onSuccess: invalidate,
  });
}
