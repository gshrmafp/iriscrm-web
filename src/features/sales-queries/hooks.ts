import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyDepartmentMemberships } from "@/features/departments/hooks";
import * as api from "@/features/sales-queries/api";
import {
  canAssignQueryDepartment,
  canChangeQueryStatus,
  canCommentOnQuery,
  canModerateQueryComment,
} from "@/lib/permissions";
import type { SalesQuery } from "@/types/entities";

export const salesQueriesKeys = {
  all: ["sales-queries"] as const,
  list: (filters: api.ListSalesQueriesFilters) => ["sales-queries", "list", filters] as const,
  detail: (id: string) => ["sales-queries", id] as const,
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

// The one place hooks + the pure permission functions from lib/permissions.ts
// combine — keeps permissions.ts itself hook-free and independently testable.
export function useSalesQueryPermissions(query: Pick<SalesQuery, "departmentId" | "ownerId"> | undefined) {
  const { user } = useAuth();
  const { data: memberships = [] } = useMyDepartmentMemberships();

  if (!query) {
    return { canComment: false, canChangeStatus: false, canAssign: false, canModerate: false };
  }

  return {
    canComment: canCommentOnQuery(user?.role, memberships, query, user?.id),
    canChangeStatus: canChangeQueryStatus(user?.role, memberships, query, user?.id),
    canAssign: canAssignQueryDepartment(user?.role),
    canModerate: canModerateQueryComment(user?.role, memberships, query),
  };
}
