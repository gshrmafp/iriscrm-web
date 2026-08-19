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

// Merges comments, status/assignment activity, and top-level attachments into
// one chronological feed — mirrors follow-up-timeline.tsx/stage-history.tsx's
// single-type timelines, generalized to a tagged union of event types.
//
// Only top-level comments become their own feed entries; each comment's
// `replies` are rendered nested inside it (see CommentEvent in
// activity-timeline.tsx) rather than flattened as sibling feed items, so a
// reply visually stays attached to its thread instead of floating loose in
// chronological order.
export function buildActivityFeed(query: SalesQuery): ActivityEvent[] {
  const commentEvents: ActivityEvent[] = (query.comments ?? []).map((comment) => ({
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
