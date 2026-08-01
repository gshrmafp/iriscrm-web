"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQualifyLead } from "@/features/leads/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

const DEAL_TYPES = ["INSTALLATION", "AMC", "PRODUCT"] as const;

const schema = z.object({
  dealType: z.enum(DEAL_TYPES),
  value: z.number().positive("Enter an estimated value"),
  expectedClose: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function QualifyLeadDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const qualifyLead = useQualifyLead(leadId);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dealType: "INSTALLATION" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const opportunity = await qualifyLead.mutateAsync({
        dealType: values.dealType,
        value: values.value,
        expectedClose: values.expectedClose
          ? new Date(values.expectedClose).toISOString()
          : undefined,
      });
      toast.success("Lead qualified into an opportunity");
      setOpen(false);
      if (opportunity?.id) router.push(`/opportunities/${opportunity.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Qualify to opportunity</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qualify lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Deal type</Label>
            <Select
              value={watch("dealType")}
              onValueChange={(value) =>
                setValue(
                  "dealType",
                  (value ?? "INSTALLATION") as FormValues["dealType"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Estimated value (₹)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              {...register("value", { valueAsNumber: true })}
            />
            {errors.value ? (
              <p className="text-sm text-destructive">{errors.value.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedClose">Expected close date</Label>
            <Input id="expectedClose" type="date" {...register("expectedClose")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={qualifyLead.isPending}>
              {qualifyLead.isPending ? "Qualifying…" : "Qualify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
