"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadAttachment } from "@/features/sales-queries/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

export function AttachmentUpload({ queryId }: { queryId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAttachment(queryId);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload.mutateAsync({ file });
      toast.success(`${file.name} attached`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" onChange={onFileSelected} />
      <Button
        variant="outline"
        size="sm"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-3.5" />
        {upload.isPending ? "Uploading…" : "Attach file"}
      </Button>
    </div>
  );
}
