"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MessageSquare, Send, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUserDirectory } from "@/features/identity/hooks";
import {
  useAddEntityComment,
  useEntityComments,
  useUpdateEntityComment,
  useDeleteEntityComment,
} from "@/features/comments/hooks";
import { isReadOnly } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/api-client";
import type { CommentEntityType, EntityComment } from "@/types/entities";

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

function CommentComposer({ entityType, entityId }: { entityType: CommentEntityType; entityId: string }) {
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: users = [] } = useUserDirectory();
  const addComment = useAddEntityComment(entityType, entityId);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().startsWith(query)).slice(0, 5);
  }, [mentionQuery, users]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);
    const cursor = e.target.selectionStart ?? value.length;
    const match = /(?:^|\s)@(\w*)$/.exec(value.slice(0, cursor));
    setMentionQuery(match ? match[1] : null);
  }

  function selectMention(userId: string, name: string) {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const before = body.slice(0, cursor).replace(/@(\w*)$/, `@${name} `);
    const after = body.slice(cursor);
    setBody(before + after);
    setMentionedUserIds((prev) => Array.from(new Set([...prev, userId])));
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  async function onSubmit() {
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync({ body, isInternalNote, mentionedUserIds });
      setBody("");
      setMentionedUserIds([]);
      setIsInternalNote(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-2 border-b border-border pb-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          rows={3}
          placeholder="Add a comment… use @ to mention a teammate"
          value={body}
          onChange={onChange}
        />
        {suggestions.length > 0 ? (
          <div className="absolute z-10 mt-1 w-full rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10">
            {suggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => selectMention(u.id, u.name)}
              >
                {u.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`internal-note-${entityId}`}
            checked={isInternalNote}
            onCheckedChange={(checked) => setIsInternalNote(checked === true)}
          />
          <Label htmlFor={`internal-note-${entityId}`} className="text-xs text-muted-foreground">
            Internal note (team only)
          </Label>
        </div>
        <Button size="sm" onClick={onSubmit} disabled={addComment.isPending || !body.trim()}>
          <Send className="size-3.5" />
          {addComment.isPending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  entityType,
  entityId,
  nameFor,
}: {
  comment: EntityComment;
  entityType: CommentEntityType;
  entityId: string;
  nameFor: (id: string) => string;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const updateComment = useUpdateEntityComment(entityType, entityId);
  const deleteComment = useDeleteEntityComment(entityType, entityId);

  // Comments are a permanent audit trail — only a Super Admin may edit/delete
  // one, not even the author. Mirrors the Sales Query comment policy.
  const canEdit = user?.role === "SUPER_ADMIN" && !comment.deleted;
  const authorName = comment.author?.name ?? nameFor(comment.authorId);

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

  return (
    <div className="flex gap-3">
      <Avatar size="sm">
        <AvatarFallback>{initials(authorName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{authorName}</span>
          <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "PPp")}</span>
          {comment.isInternalNote ? <StatusBadge label="Internal note" tone="warning" /> : null}
          {comment.edited ? <span className="text-xs text-muted-foreground">(edited)</span> : null}
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
        {canEdit && !editing ? (
          <div className="flex gap-1 pt-0.5">
            <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} title="Edit">
              <Pencil className="size-3" />
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={onDelete} title="Delete">
              <Trash2 className="size-3" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CommentSection({
  entityType,
  entityId,
}: {
  entityType: CommentEntityType;
  entityId: string;
}) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useEntityComments(entityType, entityId);
  const { data: users = [] } = useUserDirectory();
  const nameFor = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name] as const));
    return (id: string) => map.get(id) ?? id;
  }, [users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <MessageSquare className="size-4 text-primary" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReadOnly(user?.role) ? <CommentComposer entityType={entityType} entityId={entityId} /> : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ol className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="border-l-2 border-border pl-4">
                <CommentItem
                  comment={comment}
                  entityType={entityType}
                  entityId={entityId}
                  nameFor={nameFor}
                />
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
