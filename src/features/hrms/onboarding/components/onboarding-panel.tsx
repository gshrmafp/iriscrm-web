"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useAddOnboardingTask, useOnboardingChecklist, useSetOnboardingTaskDone } from "@/features/hrms/onboarding/hooks";
import { NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import { TASK_OWNER_LABELS, formatHrDate } from "@/features/hrms/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { OnboardingTask, OnboardingTaskOwner } from "@/types/entities";

const OWNER_TONE = { HR: "purple", MANAGER: "info", EMPLOYEE: "teal" } as const;

function AddTaskForm({ employeeId }: { employeeId: string }) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<OnboardingTaskOwner>("HR");
  const [dueDate, setDueDate] = useState("");
  const add = useAddOnboardingTask(employeeId);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await add.mutateAsync({ title: title.trim(), owner, dueDate: dueDate || null });
      setTitle("");
      setDueDate("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2 border-t pt-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        className="min-w-48 flex-1"
        aria-label="New task title"
      />
      <div className="w-32">
        <NativeSelect
          value={owner}
          onChange={(v) => setOwner(v as OnboardingTaskOwner)}
          options={Object.entries(TASK_OWNER_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" aria-label="Due date" />
      <Button type="submit" size="sm" disabled={!title.trim() || add.isPending}>
        <Plus className="size-3.5" /> Add
      </Button>
    </form>
  );
}

export function OnboardingPanel({
  employeeId,
  canManage,
  isSelf,
}: {
  employeeId: string;
  canManage: boolean;
  isSelf: boolean;
}) {
  const { data, isLoading } = useOnboardingChecklist(employeeId);
  const setDone = useSetOnboardingTaskDone(employeeId);

  // Mirrors the API rule: HR ticks anything, the manager ticks MANAGER tasks,
  // the employee ticks their own EMPLOYEE tasks. Anyone else viewing the
  // checklist here is the manager (they can only see team members).
  const canTick = (task: OnboardingTask) =>
    canManage || (isSelf ? task.owner === "EMPLOYEE" : task.owner === "MANAGER");

  async function toggle(task: OnboardingTask, done: boolean) {
    try {
      await setDone.mutateAsync({ taskId: task.id, done });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const percent = data && data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Onboarding checklist</CardTitle>
        {data && data.total > 0 ? (
          <CardAction>
            <span className="text-sm text-muted-foreground">
              {data.done} of {data.total} done
            </span>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.total === 0 ? (
          <p className="text-sm text-muted-foreground">No onboarding checklist for this employee.</p>
        ) : (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <ul className="divide-y">
              {data.tasks.map((task) => {
                const overdue = !task.doneAt && task.dueDate && task.dueDate.slice(0, 10) < today;
                return (
                  <li key={task.id} className="flex items-start gap-3 py-3">
                    <Checkbox
                      className="mt-0.5"
                      checked={!!task.doneAt}
                      disabled={!canTick(task) || setDone.isPending}
                      onCheckedChange={(checked) => toggle(task, checked === true)}
                      aria-label={`Mark "${task.title}" ${task.doneAt ? "not done" : "done"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium", task.doneAt && "text-muted-foreground line-through")}>{task.title}</p>
                      {task.description ? <p className="text-xs text-muted-foreground">{task.description}</p> : null}
                      <p className={cn("mt-0.5 text-xs", overdue ? "text-danger" : "text-muted-foreground")}>
                        {task.doneAt
                          ? `Done ${new Date(task.doneAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                          : task.dueDate
                            ? `${overdue ? "Overdue · was due" : "Due"} ${formatHrDate(task.dueDate)}`
                            : "No due date"}
                      </p>
                    </div>
                    <StatusBadge label={TASK_OWNER_LABELS[task.owner]} tone={OWNER_TONE[task.owner]} />
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {canManage ? <AddTaskForm employeeId={employeeId} /> : null}
      </CardContent>
    </Card>
  );
}
