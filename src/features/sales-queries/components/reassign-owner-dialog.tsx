"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserDirectory } from "@/features/identity/hooks";
import { useReassignOwner } from "@/features/sales-queries/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

export function ReassignOwnerDialog({
  queryId,
  regionId,
  currentOwnerId,
  currentAssignedToId,
}: {
  queryId: string;
  regionId: string;
  currentOwnerId: string;
  currentAssignedToId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState<string | undefined>(currentOwnerId);
  const [assignedToId, setAssignedToId] = useState<string | undefined>(currentAssignedToId ?? undefined);
  const [remark, setRemark] = useState("");
  const { data: users = [] } = useUserDirectory();
  const reassignOwner = useReassignOwner(queryId);

  // Only users in the query's own region are eligible — mirrors the
  // cross-region validation in queries/service.ts#reassignOwner.
  const options: ComboboxOption[] = useMemo(
    () =>
      users
        .filter((u) => u.regionId === regionId)
        .map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [users, regionId],
  );

  async function onConfirm() {
    if (!ownerId) return;
    try {
      await reassignOwner.mutateAsync({
        ownerId,
        assignedToId: assignedToId || undefined,
        remark: remark || undefined,
      });
      toast.success("Query reassigned");
      setOpen(false);
      setRemark("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Reassign owner</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign query owner</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Owner</Label>
          <Combobox
            items={options}
            value={ownerId ?? null}
            onValueChange={(next) => setOwnerId(next ?? undefined)}
            placeholder="Search a user…"
            emptyMessage="No users found in this region."
          />
        </div>
        <div className="space-y-2">
          <Label>Assigned to (optional)</Label>
          <Combobox
            items={options}
            value={assignedToId ?? null}
            onValueChange={(next) => setAssignedToId(next ?? undefined)}
            placeholder="Search a user…"
            emptyMessage="No users found in this region."
          />
        </div>
        <div className="space-y-2">
          <Label>Remark (optional)</Label>
          <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={reassignOwner.isPending || !ownerId}>
            {reassignOwner.isPending ? "Saving…" : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
