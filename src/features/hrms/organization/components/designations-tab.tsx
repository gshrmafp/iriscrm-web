"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { useDesignations } from "@/features/hrms/employees/hooks";
import { useSaveDesignation } from "@/features/hrms/organization/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Designation } from "@/types/entities";

function DesignationDialog({ designation, open, onOpenChange }: { designation?: Designation; open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSaveDesignation();
  const [code, setCode] = useState(designation?.code ?? "");
  const [name, setName] = useState(designation?.name ?? "");
  const [level, setLevel] = useState(designation?.level != null ? String(designation.level) : "");
  const [active, setActive] = useState(designation?.active ?? true);
  const levelValid = level === "" || (/^\d{1,2}$/.test(level) && Number(level) >= 1 && Number(level) <= 20);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({
        id: designation?.id,
        payload: { code: code.trim(), name: name.trim(), level: level ? Number(level) : null, active },
      });
      toast.success(designation ? "Designation updated" : "Designation created");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{designation ? "Edit designation" : "New designation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="desCode">Code</Label>
              <Input id="desCode" value={code} onChange={(e) => setCode(e.target.value)} disabled={!!designation} placeholder="SE" maxLength={20} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="desName">Name</Label>
              <Input id="desName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Executive" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desLevel">Level</Label>
              <Input id="desLevel" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="1–20" aria-invalid={!levelValid} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Level orders designations by seniority (1 = most senior).</p>
          {designation ? (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">Active</span>
                <span className="block text-xs text-muted-foreground">Inactive designations stay on existing employees but can&apos;t be newly assigned.</span>
              </span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={!code.trim() || !name.trim() || !levelValid || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DesignationsTab() {
  const { data: designations = [], isLoading } = useDesignations();
  const [editing, setEditing] = useState<Designation | undefined>();
  const [open, setOpen] = useState(false);
  const openDialog = (designation?: Designation) => {
    setEditing(designation);
    setOpen(true);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Job titles used across every branch, ordered by level.</p>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="size-3.5" /> New designation
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : designations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No designations yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {designations.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{d.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{d.level != null ? `Level ${d.level}` : "No level"}</span>
                {!d.active ? <StatusBadge label="Inactive" tone="neutral" /> : null}
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${d.name}`} onClick={() => openDialog(d)}>
                  <Pencil className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {open ? <DesignationDialog key={editing?.id ?? "new"} designation={editing} open={open} onOpenChange={setOpen} /> : null}
      </CardContent>
    </Card>
  );
}
