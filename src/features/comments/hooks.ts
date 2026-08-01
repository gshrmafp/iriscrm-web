import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/comments/api";
import type { CommentEntityType } from "@/types/entities";

export const entityCommentsKeys = {
  list: (entityType: CommentEntityType, entityId: string) =>
    ["entity-comments", entityType, entityId] as const,
};

export function useEntityComments(entityType: CommentEntityType, entityId: string) {
  return useQuery({
    queryKey: entityCommentsKeys.list(entityType, entityId),
    queryFn: () => api.listEntityComments(entityType, entityId),
    enabled: !!entityId,
  });
}

function useInvalidateEntityComments(entityType: CommentEntityType, entityId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: entityCommentsKeys.list(entityType, entityId) });
}

export function useAddEntityComment(entityType: CommentEntityType, entityId: string) {
  const invalidate = useInvalidateEntityComments(entityType, entityId);
  return useMutation({
    mutationFn: (payload: api.AddEntityCommentPayload) => api.addEntityComment(entityType, entityId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateEntityComment(entityType: CommentEntityType, entityId: string) {
  const invalidate = useInvalidateEntityComments(entityType, entityId);
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      api.updateEntityComment(entityType, entityId, commentId, { body }),
    onSuccess: invalidate,
  });
}

export function useDeleteEntityComment(entityType: CommentEntityType, entityId: string) {
  const invalidate = useInvalidateEntityComments(entityType, entityId);
  return useMutation({
    mutationFn: (commentId: string) => api.deleteEntityComment(entityType, entityId, commentId),
    onSuccess: invalidate,
  });
}
