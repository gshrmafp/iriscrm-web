import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/quotations/api";

export const quotationsKeys = {
  forOpportunity: (opportunityId: string) =>
    ["quotations", "opportunity", opportunityId] as const,
};

export function useOpportunityQuotations(opportunityId: string) {
  return useQuery({
    queryKey: quotationsKeys.forOpportunity(opportunityId),
    queryFn: () => api.listQuotationsForOpportunity(opportunityId),
    enabled: !!opportunityId,
  });
}

export function useCreateQuotation(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: quotationsKeys.forOpportunity(opportunityId),
      });
    },
  });
}

export function useReviseQuotation(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: api.ReviseQuotationPayload;
    }) => api.reviseQuotation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: quotationsKeys.forOpportunity(opportunityId),
      });
    },
  });
}

function useQuotationAction(
  opportunityId: string,
  mutationFn: (id: string) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: quotationsKeys.forOpportunity(opportunityId),
      });
    },
  });
}

export function useSubmitQuotation(opportunityId: string) {
  return useQuotationAction(opportunityId, api.submitQuotation);
}

export function useApproveQuotation(opportunityId: string) {
  return useQuotationAction(opportunityId, api.approveQuotation);
}

export function useRejectQuotation(opportunityId: string) {
  return useQuotationAction(opportunityId, api.rejectQuotation);
}

export function useSendQuotation(opportunityId: string) {
  return useQuotationAction(opportunityId, api.sendQuotation);
}
