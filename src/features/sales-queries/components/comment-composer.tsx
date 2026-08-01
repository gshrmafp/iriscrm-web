"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUserDirectory } from "@/features/identity/hooks";
import { useAddComment } from "@/features/sales-queries/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

// Lightweight @mention support: no dedicated combobox primitive exists yet in
// this app, so mentions are detected with a trailing "@partial" regex against
// the textarea value and resolved against the (typically small) visible-user
// list — a full caret-relative popup is left for a later iteration.
export function CommentComposer({ queryId }: { queryId: string }) {
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: users = [] } = useUserDirectory();
  const addComment = useAddComment(queryId);

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
    <div className="space-y-2 border-b pb-4">
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
            id="internal-note"
            checked={isInternalNote}
            onCheckedChange={(checked) => setIsInternalNote(checked === true)}
          />
          <Label htmlFor="internal-note" className="text-xs text-muted-foreground">
            Internal note (not visible to customer)
          </Label>
        </div>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={addComment.isPending || !body.trim()}
        >
          <Send className="size-3.5" />
          {addComment.isPending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
