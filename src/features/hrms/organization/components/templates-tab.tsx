"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { useOnboardingTemplates, useSaveOnboardingTemplate } from "@/features/hrms/onboarding/hooks";
import { NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import { TASK_OWNER_LABELS } from "@/features/hrms/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { OnboardingTaskOwner, OnboardingTemplate } from "@/types/entities";

type DraftTask = { key: string; title: string; owner: OnboardingTaskOwner; dueOffsetDays: string };

let draftCounter = 0;
const newKey = () => `t${++draftCounter}`;

function describeOffset(days: number) {
  if (days === 0) return "On joining day";
  return days < 0 ? `${-days} day${days === -1 ? "" : "s"} before joining` : `Day ${days} after joining`;
}

function TemplateSheet({ template, open, onOpenChange }: { template?: OnboardingTemplate; open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSaveOnboardingTemplate();
  const [name, setName] = useState(template?.name ?? "");
  const [active, setActive] = useState(template?.active ?? true);
  const [tasks, setTasks] = useState<DraftTask[]>(
    () =>
      template?.tasks.map((t) => ({ key: newKey(), title: t.title, owner: t.owner, dueOffsetDays: String(t.dueOffsetDays) })) ?? [
        { key: newKey(), title: "", owner: "HR", dueOffsetDays: "0" },
      ],
  );

  const update = (key: string, patch: Partial<DraftTask>) => setTasks((list) => list.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const move = (index: number, delta: number) =>
    setTasks((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  const offsetValid = (v: string) => /^-?\d{1,3}$/.test(v) && Number(v) >= -60 && Number(v) <= 365;
  const filled = tasks.filter((t) => t.title.trim());
  const valid = name.trim() && filled.every((t) => offsetValid(t.dueOffsetDays));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({
        id: template?.id,
        payload: {
          name: name.trim(),
          active,
          tasks: filled.map((t) => ({ title: t.title.trim(), owner: t.owner, dueOffsetDays: Number(t.dueOffsetDays) })),
        },
      });
      toast.success(template ? "Template saved" : "Template created");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{template ? "Edit onboarding template" : "New onboarding template"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="tplName">Name</Label>
            <Input id="tplName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Field sales onboarding" />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span>
              <span className="block text-sm font-medium">Active</span>
              <span className="block text-xs text-muted-foreground">Only active templates are offered when onboarding.</span>
            </span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
          <div className="space-y-2">
            <Label>Tasks</Label>
            <p className="text-xs text-muted-foreground">
              Due day is counted from the joining date (negative = before joining). Changes apply to future onboardings only.
            </p>
            <ul className="space-y-2">
              {tasks.map((task, index) => (
                <li key={task.key} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_7rem_5rem_auto]">
                  <Input value={task.title} onChange={(e) => update(task.key, { title: e.target.value })} placeholder="Task title" aria-label="Task title" />
                  <div className="col-span-1 sm:order-none">
                    <NativeSelect
                      value={task.owner}
                      onChange={(v) => update(task.key, { owner: v as OnboardingTaskOwner })}
                      options={Object.entries(TASK_OWNER_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                  </div>
                  <Input
                    value={task.dueOffsetDays}
                    onChange={(e) => update(task.key, { dueOffsetDays: e.target.value })}
                    inputMode="numeric"
                    aria-label="Due day"
                    aria-invalid={!offsetValid(task.dueOffsetDays)}
                    title={offsetValid(task.dueOffsetDays) ? describeOffset(Number(task.dueOffsetDays)) : "Whole days, −60 to 365"}
                  />
                  <div className="flex items-center">
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Move down" disabled={index === tasks.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove task" onClick={() => setTasks((list) => list.filter((t) => t.key !== task.key))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTasks((list) => [...list, { key: newKey(), title: "", owner: "HR", dueOffsetDays: "0" }])}
            >
              <Plus className="size-3.5" /> Add task
            </Button>
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={!valid || save.isPending}>
              {save.isPending ? "Saving…" : "Save template"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function TemplatesTab() {
  const { data: templates = [], isLoading } = useOnboardingTemplates();
  const [editing, setEditing] = useState<OnboardingTemplate | undefined>();
  const [open, setOpen] = useState(false);
  const openSheet = (template?: OnboardingTemplate) => {
    setEditing(template);
    setOpen(true);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Checklists copied onto a new joiner when they&apos;re onboarded.</p>
          <Button size="sm" onClick={() => openSheet()}>
            <Plus className="size-3.5" /> New template
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.tasks.length} tasks · {t.tasks.slice(0, 3).map((task) => task.title).join(", ")}
                    {t.tasks.length > 3 ? "…" : ""}
                  </span>
                </span>
                {!t.active ? <StatusBadge label="Inactive" tone="neutral" /> : null}
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${t.name}`} onClick={() => openSheet(t)}>
                  <Pencil className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {open ? <TemplateSheet key={editing?.id ?? "new"} template={editing} open={open} onOpenChange={setOpen} /> : null}
      </CardContent>
    </Card>
  );
}
