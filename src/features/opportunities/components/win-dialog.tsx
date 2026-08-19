"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWinOpportunity } from "@/features/opportunities/hooks";
import { useAllCatalogItems } from "@/features/catalog/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { DealType } from "@/types/entities";

interface FormValues {
  site: string;
  timeline: string;
  customerId: string;
  bom: { catalogItemId: string; qty: number }[];
  amcType: "COMPREHENSIVE" | "NON_COMPREHENSIVE";
  amcFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  amcStartDate: string;
  amcEndDate: string;
}

export function WinDialog({
  opportunityId,
  dealType,
  triggerRender,
  triggerContent,
}: {
  opportunityId: string;
  dealType: DealType;
  /** Custom trigger element (e.g. a compact icon button for use inside a card) — defaults to a plain Button. */
  triggerRender?: React.ReactElement;
  triggerContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const winOpportunity = useWinOpportunity(opportunityId);
  const { data: catalogItems } = useAllCatalogItems();

  const { register, control, handleSubmit, watch, setValue } =
    useForm<FormValues>({
      defaultValues: {
        site: "",
        timeline: "",
        customerId: "",
        bom: [],
        amcType: "COMPREHENSIVE",
        amcFrequency: "MONTHLY",
        amcStartDate: "",
        amcEndDate: "",
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "bom" });
  const isAmc = dealType === "AMC";

  const catalogItemOptions: ComboboxOption[] = useMemo(
    () =>
      (catalogItems ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        description: `${item.code} · ₹${Number(item.basePrice).toLocaleString("en-IN")}`,
      })),
    [catalogItems],
  );

  function onBomQtyChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const rounded = Math.max(1, Math.round(Number(event.target.value) || 0));
    setValue(`bom.${index}.qty`, rounded, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    try {
      await winOpportunity.mutateAsync({
        site: values.site || undefined,
        timeline: values.timeline || undefined,
        customerId: values.customerId || undefined,
        bom: values.bom.length ? values.bom : undefined,
        amcType: isAmc ? values.amcType : undefined,
        amcFrequency: isAmc ? values.amcFrequency : undefined,
        amcStartDate: isAmc && values.amcStartDate
          ? new Date(values.amcStartDate).toISOString()
          : undefined,
        amcEndDate: isAmc && values.amcEndDate
          ? new Date(values.amcEndDate).toISOString()
          : undefined,
      });
      toast.success("Opportunity won!");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender ?? <Button />}>
        {triggerContent ?? "Mark Won"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Close Won</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input id="customerId" {...register("customerId")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Input id="site" placeholder="Acme HQ, Sector 21" {...register("site")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input id="timeline" placeholder="2 weeks" {...register("timeline")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bill of materials</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ catalogItemId: "", qty: 1 })}
              >
                <Plus className="size-3.5" /> Add item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Catalog item</Label>
                  <Combobox
                    items={catalogItemOptions}
                    value={watch(`bom.${index}.catalogItemId`) || null}
                    onValueChange={(value) =>
                      setValue(`bom.${index}.catalogItemId`, value ?? "")
                    }
                    placeholder="Search catalog item…"
                    emptyMessage="No catalog items found."
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    {...register(`bom.${index}.qty`, { valueAsNumber: true })}
                    onChange={(event) => onBomQtyChange(index, event)}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {isAmc ? (
            <div className="space-y-4 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>AMC type</Label>
                  <Select
                    value={watch("amcType")}
                    onValueChange={(value) =>
                      setValue(
                        "amcType",
                        (value ?? "COMPREHENSIVE") as FormValues["amcType"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPREHENSIVE">Comprehensive</SelectItem>
                      <SelectItem value="NON_COMPREHENSIVE">
                        Non-comprehensive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={watch("amcFrequency")}
                    onValueChange={(value) =>
                      setValue(
                        "amcFrequency",
                        (value ?? "MONTHLY") as FormValues["amcFrequency"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amcStartDate">Start date</Label>
                  <Input id="amcStartDate" type="date" {...register("amcStartDate")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amcEndDate">End date</Label>
                  <Input id="amcEndDate" type="date" {...register("amcEndDate")} />
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={winOpportunity.isPending}>
              {winOpportunity.isPending ? "Saving…" : "Close Won"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
