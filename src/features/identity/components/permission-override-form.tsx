"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePermissionOverride } from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { PermissionEffect } from "@/types/entities";

interface FormValues {
  permissionKey: string;
  effect: PermissionEffect;
  reason: string;
  expiresAt: string;
}

export function PermissionOverrideForm({ userId }: { userId: string }) {
  const createOverride = useCreatePermissionOverride(userId);
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<FormValues>({ defaultValues: { effect: "GRANT" } });

  async function onSubmit(values: FormValues) {
    try {
      await createOverride.mutateAsync({
        permissionKey: values.permissionKey,
        effect: values.effect,
        reason: values.reason || undefined,
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : undefined,
      });
      toast.success("Permission override saved");
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="permissionKey">Permission key</Label>
        <Input
          id="permissionKey"
          placeholder="sales.opportunity.reassign"
          {...register("permissionKey", { required: true })}
        />
      </div>
      <div className="space-y-2">
        <Label>Effect</Label>
        <Select
          value={watch("effect")}
          onValueChange={(value) =>
            setValue("effect", (value ?? "GRANT") as PermissionEffect)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GRANT">Grant</SelectItem>
            <SelectItem value="DENY">Deny</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" placeholder="trusted exec, temp coverage" {...register("reason")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expires at (optional)</Label>
        <Input id="expiresAt" type="date" {...register("expiresAt")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={createOverride.isPending}>
          {createOverride.isPending ? "Saving…" : "Save override"}
        </Button>
      </div>
    </form>
  );
}
