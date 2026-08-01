"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DepartmentSelect } from "@/features/departments/components/department-select";
import { useAssignDepartment } from "@/features/sales-queries/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

export function AssignDepartmentDialog({
  queryId,
  regionId,
}: {
  queryId: string;
  regionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState<string>();
  const assignDepartment = useAssignDepartment(queryId);

  async function onConfirm() {
    if (!departmentId) return;
    try {
      await assignDepartment.mutateAsync({ departmentId });
      toast.success("Query assigned to department");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Assign department</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to a department</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Department</Label>
          <DepartmentSelect value={departmentId} onValueChange={setDepartmentId} regionId={regionId} />
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={assignDepartment.isPending || !departmentId}>
            {assignDepartment.isPending ? "Saving…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
