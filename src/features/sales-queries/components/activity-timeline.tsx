"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Paperclip, Pencil, Pin, Reply, Trash2, UserPlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, salesQueryStatusTone } from "@/components/status-badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUserDirectory } from "@/features/identity/hooks";
import { CommentComposer } from "@/features/sales-queries/components/comment-composer";
import {
  useDeleteComment,
  useDownloadAttachment,
  usePinComment,
  useSalesQueryPermissions,
  useUpdateComment,
} from "@/features/sales-queries/hooks";
import { STATUS_LABELS } from "@/features/sales-queries/constants";
import { buildActivityFeed } from "@/features/sales-queries/utils";
import { getApiErrorMessage } from "@/lib/api-client";
import type { QueryComment, SalesQuery } from "@/types/entities";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function highlightMentions(body: string) {
  const parts = body.split(/(@[\w]+(?:\s[\w]+)?)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function CommentEvent({
  comment,
  queryId,
  nameFor,
  canModerate,
  canReply,
  allowReplies = true,
}: {
  comment: QueryComment;
  queryId: string;
  nameFor: (id: string) => string;
  canModerate: boolean;
  canReply: boolean;
  /** Replies render one level deep — a reply itself doesn't offer a further Reply/Pin affordance. */
  allowReplies?: boolean;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [replying, setReplying] = useState(false);
  const updateComment = useUpdateComment(queryId);
  const deleteComment = useDeleteComment(queryId);
  const pinComment = usePinComment(queryId);

  // Comments are a permanent audit trail — only a moderator (Super Admin /
  // Regional Admin / Sales Manager, per SALES_QUERY_COMMENT_MODERATE) may
  // edit/delete one, not even the author. Mirrors the backend authorization
  // in queries/service.ts (updateComment / deleteComment).
  const canEditOrDelete = canModerate && !comment.deleted;
  // Pinning your own comment is always allowed; pinning someone else's needs
  // moderation rights. Mirrors service.ts#pinComment.
  const canPin = allowReplies && (comment.authorId === user?.id || canModerate);

  async function onSave() {
    try {
      await updateComment.mutateAsync({ commentId: comment.id, body: draft });
      setEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onDelete() {
    try {
      await deleteComment.mutateAsync(comment.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onTogglePin() {
    try {
      await pinComment.mutateAsync({ commentId: comment.id, isPinned: !comment.isPinned });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar size="sm">
        <AvatarFallback>{initials(nameFor(comment.authorId))}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{nameFor(comment.authorId)}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), "PPp")}
          </span>
          {comment.isInternalNote ? (
            <StatusBadge label="Internal note" tone="warning" />
          ) : null}
          {comment.isPinned ? <StatusBadge label="Pinned" tone="info" /> : null}
          {comment.edited ? (
            <span className="text-xs text-muted-foreground">(edited)</span>
          ) : null}
        </div>
        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSave} disabled={updateComment.isPending}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {comment.deleted ? (
              <span className="italic">This comment was deleted.</span>
            ) : (
              highlightMentions(comment.body)
            )}
          </p>
        )}
        {comment.attachments && comment.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {comment.attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} queryId={queryId} attachment={attachment} />
            ))}
          </div>
        ) : null}
        {!editing ? (
          <div className="flex gap-1 pt-0.5">
            {allowReplies && canReply && !comment.deleted ? (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setReplying((prev) => !prev)}
                title="Reply"
              >
                <Reply className="size-3" />
              </Button>
            ) : null}
            {canPin && !comment.deleted ? (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={onTogglePin}
                disabled={pinComment.isPending}
                title={comment.isPinned ? "Unpin" : "Pin"}
              >
                <Pin className="size-3" />
              </Button>
            ) : null}
            {canEditOrDelete ? (
              <>
                <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} title="Edit">
                  <Pencil className="size-3" />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={onDelete} title="Delete">
                  <Trash2 className="size-3" />
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
        {replying ? (
          <div className="pt-2">
            <CommentComposer
              queryId={queryId}
              parentId={comment.id}
              compact
              onPosted={() => setReplying(false)}
            />
          </div>
        ) : null}
        {allowReplies && comment.replies && comment.replies.length > 0 ? (
          <div className="mt-3 space-y-3 border-l pl-4">
            {comment.replies.map((reply) => (
              <CommentEvent
                key={reply.id}
                comment={reply}
                queryId={queryId}
                nameFor={nameFor}
                canModerate={canModerate}
                canReply={canReply}
                allowReplies={false}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AttachmentChip({
  queryId,
  attachment,
}: {
  queryId: string;
  attachment: { id: string; fileName: string };
}) {
  const download = useDownloadAttachment(queryId);
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
      onClick={() =>
        download.mutate({ attachmentId: attachment.id, fileName: attachment.fileName })
      }
    >
      <Paperclip className="size-3" />
      {attachment.fileName}
    </button>
  );
}

export function ActivityTimeline({ query }: { query: SalesQuery }) {
  const { data: users = [] } = useUserDirectory();
  const permissions = useSalesQueryPermissions(query);
  const nameFor = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name] as const));
    return (id: string) => map.get(id) ?? id;
  }, [users]);

  const feed = useMemo(() => buildActivityFeed(query), [query]);

  if (feed.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {feed.map((event) => (
        <li key={event.id} className="border-l-2 pl-4">
          {event.type === "COMMENT" ? (
            <CommentEvent
              comment={event.comment}
              queryId={query.id}
              nameFor={nameFor}
              canModerate={permissions.canModerate}
              canReply={permissions.canComment}
            />
          ) : event.type === "STATUS_CHANGE" ? (
            <div className="text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{nameFor(event.actorId)}</span>
                {format(new Date(event.createdAt), "PPp")}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {event.fromStatus ? (
                  <>
                    <StatusBadge
                      label={STATUS_LABELS[event.fromStatus as keyof typeof STATUS_LABELS] ?? event.fromStatus}
                      tone={salesQueryStatusTone(event.fromStatus)}
                    />
                    <span className="text-muted-foreground">→</span>
                  </>
                ) : null}
                <StatusBadge
                  label={STATUS_LABELS[event.toStatus as keyof typeof STATUS_LABELS] ?? event.toStatus ?? "New"}
                  tone={salesQueryStatusTone(event.toStatus ?? "NEW")}
                />
              </div>
              {event.remark ? <p className="mt-1 text-muted-foreground">{event.remark}</p> : null}
            </div>
          ) : event.type === "ASSIGNMENT" ? (
            <div className="text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserPlus2 className="size-3.5" />
                <span className="font-medium text-foreground">{nameFor(event.actorId)}</span>
                {format(new Date(event.createdAt), "PPp")}
              </div>
              <p className="mt-1 text-muted-foreground">{event.remark ?? "Assigned to a department"}</p>
            </div>
          ) : (
            <AttachmentChip queryId={query.id} attachment={event.attachment} />
          )}
        </li>
      ))}
    </ol>
  );
}
