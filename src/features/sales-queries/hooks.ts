import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyDepartmentMemberships } from "@/features/departments/hooks";
import * as api from "@/features/sales-queries/api";
import {
  canAssignQueryDepartment,
  canChangeQueryStatus,
  canCommentOnQuery,
  canEditQuery,
  canManageFollowUps,
  canModerateQueryComment,
  canReassignQueryOwner,
} from "@/lib/permissions";
import type { SalesQuery } from "@/types/entities";

export const salesQueriesKeys = {
  all: ["sales-queries"] as const,
  list: (filters: api.ListSalesQueriesFilters) => ["sales-queries", "list", filters] as const,
  detail: (id: string) => ["sales-queries", id] as const,
  statusTransitionsMeta: ["sales-queries", "meta", "status-transitions"] as const,
  dashboard: ["sales-queries", "dashboard"] as const,
  followUps: (queryId: string) => ["sales-queries", queryId, "follow-ups"] as const,
};

export function useSalesQueries(filters: api.ListSalesQueriesFilters = {}) {
  return useQuery({
    queryKey: salesQueriesKeys.list(filters),
    queryFn: () => api.listSalesQueries(filters),
  });
}

export function useSalesQuery(id: string) {
  return useQuery({
    queryKey: salesQueriesKeys.detail(id),
    queryFn: () => api.getSalesQuery(id),
    enabled: !!id,
  });
}

function useInvalidateSalesQuery(id: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: salesQueriesKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: salesQueriesKeys.all });
  };
}

export function useCreateSalesQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSalesQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesQueriesKeys.all });
    },
  });
}

export function useUpdateSalesQuery(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: (payload: api.UpdateSalesQueryPayload) => api.updateSalesQuery(id, payload),
    onSuccess: invalidate,
  });
}

export function useAssignDepartment(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: (payload: api.AssignDepartmentPayload) => api.assignDepartment(id, payload),
    onSuccess: invalidate,
  });
}

export function useReassignOwner(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: (payload: api.ReassignOwnerPayload) => api.reassignOwner(id, payload),
    onSuccess: invalidate,
  });
}

export function useTransitionStatus(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: (payload: api.TransitionStatusPayload) => api.transitionStatus(id, payload),
    onSuccess: invalidate,
  });
}

export function useAddComment(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: (payload: api.AddCommentPayload) => api.addComment(id, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateComment(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      api.updateComment(id, commentId, { body }),
    onSuccess: invalidate,
  });
}

export function useDeleteComment(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: (commentId: string) => api.deleteComment(id, commentId),
    onSuccess: invalidate,
  });
}

export function usePinComment(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) =>
      api.pinComment(id, commentId, { isPinned }),
    onSuccess: invalidate,
  });
}

export function useUploadAttachment(id: string) {
  const invalidate = useInvalidateSalesQuery(id);
  return useMutation({
    mutationFn: ({ file, commentId }: { file: File; commentId?: string }) =>
      api.uploadAttachment(id, file, commentId),
    onSuccess: invalidate,
  });
}

export function useDownloadAttachment(id: string) {
  return useMutation({
    mutationFn: ({ attachmentId, fileName }: { attachmentId: string; fileName: string }) =>
      api.downloadAttachment(id, attachmentId, fileName),
  });
}

// ---------- Status-transitions metadata ----------
// Single source of truth fetched from the backend's pipeline.ts instead of
// hand-duplicating STATUS_TRANSITIONS in constants.ts. constants.ts remains
// the pre-fetch fallback so the board/dialog render immediately.
export function useStatusTransitionsMeta() {
  return useQuery({
    queryKey: salesQueriesKeys.statusTransitionsMeta,
    queryFn: api.getStatusTransitionsMeta,
    staleTime: 5 * 60_000,
  });
}

// ---------- Dashboard ----------
export function useDashboardStats() {
  return useQuery({
    queryKey: salesQueriesKeys.dashboard,
    queryFn: api.getDashboardStats,
  });
}

// ---------- Reports ----------
export function useRunReport() {
  return useMutation({
    mutationFn: (params: api.ReportQueryParams) => api.runReport(params),
  });
}

// ---------- Follow-ups ----------
export function useFollowUps(queryId: string, filters: api.ListFollowUpsFilters = {}) {
  return useQuery({
    queryKey: [...salesQueriesKeys.followUps(queryId), filters] as const,
    queryFn: () => api.listFollowUps(queryId, filters),
    enabled: !!queryId,
  });
}

function useInvalidateFollowUps(queryId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: salesQueriesKeys.followUps(queryId) });
    queryClient.invalidateQueries({ queryKey: salesQueriesKeys.detail(queryId) });
  };
}

export function useAddFollowUp(queryId: string) {
  const invalidate = useInvalidateFollowUps(queryId);
  return useMutation({
    mutationFn: (payload: api.CreateFollowUpPayload) => api.addFollowUp(queryId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateFollowUp(queryId: string) {
  const invalidate = useInvalidateFollowUps(queryId);
  return useMutation({
    mutationFn: ({ followUpId, payload }: { followUpId: string; payload: api.UpdateFollowUpPayload }) =>
      api.updateFollowUp(queryId, followUpId, payload),
    onSuccess: invalidate,
  });
}

export function useCompleteFollowUp(queryId: string) {
  const invalidate = useInvalidateFollowUps(queryId);
  return useMutation({
    mutationFn: ({ followUpId, payload }: { followUpId: string; payload?: api.CompleteFollowUpPayload }) =>
      api.completeFollowUp(queryId, followUpId, payload),
    onSuccess: invalidate,
  });
}

export function useRescheduleFollowUp(queryId: string) {
  const invalidate = useInvalidateFollowUps(queryId);
  return useMutation({
    mutationFn: ({ followUpId, payload }: { followUpId: string; payload: api.RescheduleFollowUpPayload }) =>
      api.rescheduleFollowUp(queryId, followUpId, payload),
    onSuccess: invalidate,
  });
}

export function useCancelFollowUp(queryId: string) {
  const invalidate = useInvalidateFollowUps(queryId);
  return useMutation({
    mutationFn: (followUpId: string) => api.cancelFollowUp(queryId, followUpId),
    onSuccess: invalidate,
  });
}

// The one place hooks + the pure permission functions from lib/permissions.ts
// combine — keeps permissions.ts itself hook-free and independently testable.
export function useSalesQueryPermissions(query: Pick<SalesQuery, "departmentId" | "ownerId"> | undefined) {
  const { user } = useAuth();
  const { data: memberships = [] } = useMyDepartmentMemberships();

  if (!query) {
    return {
      canComment: false,
      canChangeStatus: false,
      canAssign: false,
      canModerate: false,
      canReassignOwner: false,
      canEdit: false,
      canManageFollowUps: false,
    };
  }

  return {
    canComment: canCommentOnQuery(user?.role, memberships, query, user?.id),
    canChangeStatus: canChangeQueryStatus(user?.role, memberships, query, user?.id),
    canAssign: canAssignQueryDepartment(user?.role),
    canModerate: canModerateQueryComment(user?.role),
    canReassignOwner: canReassignQueryOwner(user?.role),
    canEdit: canEditQuery(user?.role, memberships, query, user?.id),
    canManageFollowUps: canManageFollowUps(user?.role, memberships, query, user?.id),
  };
}
