"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateRegion } from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

interface FormValues {
  code: string;
  name: string;
}

export function RegionFormDialog() {
  const [open, setOpen] = useState(false);
  const createRegion = useCreateRegion();
  const { register, handleSubmit, reset } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    try {
      await createRegion.mutateAsync(values);
      toast.success("Region created");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> New region
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create region</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" placeholder="GGN" {...register("code", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Gurugram" {...register("name", { required: true })} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createRegion.isPending}>
              {createRegion.isPending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
