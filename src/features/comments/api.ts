import { apiClient } from "@/lib/api-client";
import type { CommentEntityType, EntityComment } from "@/types/entities";

const BASE_PATH: Record<CommentEntityType, string> = {
  LEAD: "/leads",
  OPPORTUNITY: "/opportunities",
};

export interface AddEntityCommentPayload {
  body: string;
  isInternalNote?: boolean;
  mentionedUserIds?: string[];
}

export interface UpdateEntityCommentPayload {
  body: string;
}

export async function listEntityComments(
  entityType: CommentEntityType,
  entityId: string,
): Promise<EntityComment[]> {
  const { data } = await apiClient.get<EntityComment[]>(`${BASE_PATH[entityType]}/${entityId}/comments`);
  return data;
}

export async function addEntityComment(
  entityType: CommentEntityType,
  entityId: string,
  payload: AddEntityCommentPayload,
): Promise<EntityComment> {
  const { data } = await apiClient.post<EntityComment>(
    `${BASE_PATH[entityType]}/${entityId}/comments`,
    payload,
  );
  return data;
}

export async function updateEntityComment(
  entityType: CommentEntityType,
  entityId: string,
  commentId: string,
  payload: UpdateEntityCommentPayload,
): Promise<EntityComment> {
  const { data } = await apiClient.patch<EntityComment>(
    `${BASE_PATH[entityType]}/${entityId}/comments/${commentId}`,
    payload,
  );
  return data;
}

export async function deleteEntityComment(
  entityType: CommentEntityType,
  entityId: string,
  commentId: string,
): Promise<EntityComment> {
  const { data } = await apiClient.delete<EntityComment>(
    `${BASE_PATH[entityType]}/${entityId}/comments/${commentId}`,
  );
  return data;
}
