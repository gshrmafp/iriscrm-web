import type { QueryAttachment, QueryComment, SalesQuery } from "@/types/entities";

export type ActivityEvent =
  | { id: string; type: "COMMENT"; createdAt: string; comment: QueryComment }
  | {
      id: string;
      type: "STATUS_CHANGE";
      createdAt: string;
      actorId: string;
      fromStatus: string | null | undefined;
      toStatus: string | null | undefined;
      remark?: string | null;
    }
  | {
      id: string;
      type: "ASSIGNMENT";
      createdAt: string;
      actorId: string;
      remark?: string | null;
    }
  | { id: string; type: "ATTACHMENT"; createdAt: string; attachment: QueryAttachment };

function flattenComments(comments: QueryComment[]): QueryComment[] {
  return comments.flatMap((comment) => [comment, ...flattenComments(comment.replies ?? [])]);
}

// Merges comments, status/assignment activity, and top-level attachments into
// one chronological feed — mirrors follow-up-timeline.tsx/stage-history.tsx's
// single-type timelines, generalized to a tagged union of event types.
export function buildActivityFeed(query: SalesQuery): ActivityEvent[] {
  const commentEvents: ActivityEvent[] = flattenComments(query.comments ?? []).map((comment) => ({
    id: `comment-${comment.id}`,
    type: "COMMENT",
    createdAt: comment.createdAt,
    comment,
  }));

  const activityEvents: ActivityEvent[] = (query.activities ?? [])
    .filter((a) => a.action === "STATUS_CHANGED" || a.action === "CREATED" || a.action === "ASSIGNED" || a.action === "REASSIGNED")
    .map((activity) =>
      activity.action === "ASSIGNED" || activity.action === "REASSIGNED"
        ? {
            id: `activity-${activity.id}`,
            type: "ASSIGNMENT" as const,
            createdAt: activity.createdAt,
            actorId: activity.actorId,
            remark: activity.remark,
          }
        : {
            id: `activity-${activity.id}`,
            type: "STATUS_CHANGE" as const,
            createdAt: activity.createdAt,
            actorId: activity.actorId,
            fromStatus: activity.fromStatus,
            toStatus: activity.toStatus ?? "NEW",
            remark: activity.remark,
          },
    );

  const attachmentEvents: ActivityEvent[] = (query.attachments ?? [])
    .filter((attachment) => !attachment.commentId)
    .map((attachment) => ({
      id: `attachment-${attachment.id}`,
      type: "ATTACHMENT",
      createdAt: attachment.createdAt,
      attachment,
    }));

  return [...commentEvents, ...activityEvents, ...attachmentEvents].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
