"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAllPicklistOptions,
  useCreatePicklistOption,
  useUpdatePicklistOption,
} from "@/features/picklists/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { PicklistType } from "@/types/entities";

function codeFromLabel(label: string) {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function PicklistManager({ listType, title }: { listType: PicklistType; title: string }) {
  const { data: options = [], isLoading } = useAllPicklistOptions(listType);
  const createOption = useCreatePicklistOption(listType);
  const updateOption = useUpdatePicklistOption(listType);
  const [label, setLabel] = useState("");

  async function onAdd() {
    const code = codeFromLabel(label);
    if (!code) return;
    try {
      await createOption.mutateAsync({ listType, code, label: label.trim() });
      toast.success(`${label.trim()} added`);
      setLabel("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onToggleActive(id: string, active: boolean) {
    try {
      await updateOption.mutateAsync({ id, payload: { active } });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`${listType}-new-label`}>Add option</Label>
            <Input
              id={`${listType}-new-label`}
              placeholder="e.g. Trade show"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <Button onClick={onAdd} disabled={createOption.isPending || !label.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : options.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No options yet.
                </TableCell>
              </TableRow>
            ) : (
              options.map((option) => (
                <TableRow key={option.id}>
                  <TableCell>{option.label}</TableCell>
                  <TableCell className="text-muted-foreground">{option.code}</TableCell>
                  <TableCell>
                    <Switch
                      checked={option.active}
                      onCheckedChange={(checked) => onToggleActive(option.id, checked)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
