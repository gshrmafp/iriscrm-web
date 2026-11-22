"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Download, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  useDeleteEmployeeDocument,
  useEmployeeDocuments,
  useUploadEmployeeDocument,
  useVerifyEmployeeDocument,
} from "@/features/hrms/employees/hooks";
import { downloadEmployeeDocument } from "@/features/hrms/employees/api";
import { DOCUMENT_CATEGORY_LABELS, formatHrDate } from "@/features/hrms/constants";
import { NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import { getApiErrorMessage } from "@/lib/api-client";
import type { HrDocument, HrDocumentCategory } from "@/types/entities";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";
const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDialog({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<HrDocumentCategory>("ID_PROOF");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadEmployeeDocument(employeeId);

  function reset() {
    setCategory("ID_PROOF");
    setTitle("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("File is larger than 10 MB");
      return;
    }
    try {
      await upload.mutateAsync({ file, category, title: title.trim() || file.name });
      toast.success("Document uploaded");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Upload className="size-3.5" /> Upload
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="docCategory">Type</Label>
            <NativeSelect
              id="docCategory"
              value={category}
              onChange={(v) => setCategory(v as HrDocumentCategory)}
              options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docTitle">Title</Label>
            <Input id="docTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PAN card" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docFile">File (PDF, image or Word, up to 10 MB)</Label>
            <Input id="docFile" ref={fileInput} type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!file || upload.isPending}>
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentsPanel({ employeeId, canManage }: { employeeId: string; canManage: boolean }) {
  const { data: documents = [], isLoading, isError } = useEmployeeDocuments(employeeId);
  const verify = useVerifyEmployeeDocument(employeeId);
  const remove = useDeleteEmployeeDocument(employeeId);

  async function onDownload(document: HrDocument) {
    try {
      await downloadEmployeeDocument(employeeId, document);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onVerify(document: HrDocument) {
    try {
      await verify.mutateAsync(document.id);
      toast.success(`${document.title} marked as verified`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onDelete(document: HrDocument) {
    if (!window.confirm(`Remove "${document.title}"?`)) return;
    try {
      await remove.mutateAsync(document.id);
      toast.success("Document removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
        {!isError ? (
          <CardAction>
            <UploadDialog employeeId={employeeId} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have access to these documents.</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{document.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {DOCUMENT_CATEGORY_LABELS[document.category]} · {formatSize(document.sizeBytes)} · {formatHrDate(document.createdAt)}
                  </p>
                </div>
                {document.verifiedAt ? (
                  <StatusBadge label="Verified" tone="success" />
                ) : (
                  <StatusBadge label="Not verified" tone="neutral" />
                )}
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label="Download" onClick={() => onDownload(document)}>
                    <Download className="size-4" />
                  </Button>
                  {canManage && !document.verifiedAt ? (
                    <Button size="icon-sm" variant="ghost" aria-label="Mark verified" onClick={() => onVerify(document)} disabled={verify.isPending}>
                      <BadgeCheck className="size-4" />
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => onDelete(document)} disabled={remove.isPending}>
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
