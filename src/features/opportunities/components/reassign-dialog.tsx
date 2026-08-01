"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReassignOpportunity } from "@/features/opportunities/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function ReassignDialog({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const reassign = useReassignOpportunity(opportunityId);
  const { data: users = [] } = useUserDirectory();

  const userOptions: ComboboxOption[] = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.name,
        description: `${user.id} · ${user.email}`,
        icon: (
          <Avatar size="sm">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        ),
      })),
    [users],
  );

  async function onConfirm() {
    if (!ownerId) return;
    try {
      await reassign.mutateAsync({ ownerId });
      toast.success("Opportunity reassigned");
      setOpen(false);
      setOwnerId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setOwnerId(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        Reassign
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign owner</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ownerId">New owner</Label>
          <Combobox
            items={userOptions}
            value={ownerId}
            onValueChange={setOwnerId}
            placeholder="Search by name, code or email…"
            emptyMessage="No matching employees."
          />
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={reassign.isPending || !ownerId}>
            {reassign.isPending ? "Saving…" : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
