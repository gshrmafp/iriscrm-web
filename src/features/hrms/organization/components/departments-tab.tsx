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
import { useAuth } from "@/features/auth/AuthProvider";
import { useRegions } from "@/features/identity/hooks";
import { useHrDepartments, useSaveDepartment } from "@/features/hrms/organization/hooks";
import type { HrDepartment } from "@/features/hrms/organization/api";
import { NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import { getApiErrorMessage } from "@/lib/api-client";

function DepartmentDialog({ department, open, onOpenChange }: { department?: HrDepartment; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const { data: regions = [] } = useRegions();
  const save = useSaveDepartment();
  const [code, setCode] = useState(department?.code ?? "");
  const [name, setName] = useState(department?.name ?? "");
  const [regionId, setRegionId] = useState(department?.regionId ?? "");
  const [active, setActive] = useState(department?.active ?? true);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({
        id: department?.id,
        payload: { code: code.trim().toUpperCase(), name: name.trim(), regionId: regionId || undefined, active },
      });
      toast.success(department ? "Department updated" : "Department created");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? "Edit department" : "New department"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="deptCode">Code</Label>
              <Input id="deptCode" value={code} onChange={(e) => setCode(e.target.value)} disabled={!!department} placeholder="OPS" maxLength={20} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deptName">Name</Label>
              <Input id="deptName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Operations" />
            </div>
          </div>
          {!department ? (
            <div className="space-y-2">
              <Label htmlFor="deptRegion">Branch</Label>
              {isSuperAdmin ? (
                <NativeSelect
                  id="deptRegion"
                  value={regionId}
                  onChange={setRegionId}
                  placeholder="Shared across all branches"
                  options={regions.filter((r) => r.active).map((r) => ({ value: r.id, label: r.name }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Created in your branch.</p>
              )}
            </div>
          ) : (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">Active</span>
                <span className="block text-xs text-muted-foreground">Inactive departments can&apos;t be picked for new assignments.</span>
              </span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!code.trim() || !name.trim() || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DepartmentsTab() {
  const { data: departments = [], isLoading } = useHrDepartments(true);
  const [editing, setEditing] = useState<HrDepartment | undefined>();
  const [open, setOpen] = useState(false);
  const openDialog = (department?: HrDepartment) => {
    setEditing(department);
    setOpen(true);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Departments in your branch plus shared ones. Headcount excludes exited employees.</p>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="size-3.5" /> New department
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No departments yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {departments.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{d.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.name}</span>
                  <span className="block text-xs text-muted-foreground">{d.region?.name ?? "Shared"}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{d.headcount} people</span>
                {!d.active ? <StatusBadge label="Inactive" tone="neutral" /> : null}
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${d.name}`} onClick={() => openDialog(d)}>
                  <Pencil className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {open ? <DepartmentDialog key={editing?.id ?? "new"} department={editing} open={open} onOpenChange={setOpen} /> : null}
      </CardContent>
    </Card>
  );
}
