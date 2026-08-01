"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCreateQuotation,
  useReviseQuotation,
} from "@/features/quotations/hooks";
import { useAllCatalogItems } from "@/features/catalog/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { QuotationLineInput } from "@/features/quotations/api";

interface FormValues {
  validTill: string;
  lines: QuotationLineInput[];
}

function computeTotals(lines: QuotationLineInput[]) {
  return lines.reduce(
    (acc, line) => {
      const gross = (line.qty || 0) * (line.unitPrice || 0);
      const afterDiscount = gross - (line.discount || 0);
      const tax = afterDiscount * ((line.taxRatePct || 0) / 100);
      acc.subtotal += gross;
      acc.discount += line.discount || 0;
      acc.tax += tax;
      acc.total += afterDiscount + tax;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );
}

const EMPTY_LINE: QuotationLineInput = {
  description: "",
  qty: 1,
  unitPrice: 0,
  discount: 0,
  taxRatePct: 18,
};

export function QuotationBuilderDialog({
  opportunityId,
  revising,
}: {
  opportunityId: string;
  revising?: { id: string };
}) {
  const [open, setOpen] = useState(false);
  const createQuotation = useCreateQuotation(opportunityId);
  const reviseQuotation = useReviseQuotation(opportunityId);
  const { data: catalogItems } = useAllCatalogItems();

  const { register, control, handleSubmit, watch, setValue } =
    useForm<FormValues>({
      defaultValues: { validTill: "", lines: [EMPTY_LINE] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const totals = computeTotals(lines ?? []);
  const isPending = createQuotation.isPending || reviseQuotation.isPending;

  const catalogItemOptions: ComboboxOption[] = useMemo(
    () =>
      (catalogItems ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        description: `${item.code} · ₹${Number(item.basePrice).toLocaleString("en-IN")}`,
      })),
    [catalogItems],
  );

  async function onSubmit(values: FormValues) {
    const payload = {
      validTill: values.validTill
        ? new Date(values.validTill).toISOString()
        : undefined,
      lines: values.lines,
    };
    try {
      if (revising) {
        await reviseQuotation.mutateAsync({ id: revising.id, payload });
        toast.success("New quotation version created");
      } else {
        await createQuotation.mutateAsync({ opportunityId, ...payload });
        toast.success("Draft quotation created");
      }
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function onCatalogItemSelect(index: number, catalogItemId: string | null) {
    setValue(`lines.${index}.catalogItemId`, catalogItemId ?? undefined);
    const item = catalogItemId ? catalogItems?.find((i) => i.id === catalogItemId) : undefined;
    if (item) {
      setValue(`lines.${index}.description`, item.name);
      setValue(`lines.${index}.unitPrice`, Number(item.basePrice));
    }
  }

  function onQtyChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const rounded = Math.max(1, Math.round(Number(event.target.value) || 0));
    setValue(`lines.${index}.qty`, rounded, { shouldValidate: true });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={revising ? "outline" : "default"} />}>
        {revising ? "Revise" : "New quotation"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {revising ? "Revise quotation" : "Create draft quotation"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="validTill">Valid till</Label>
            <Input id="validTill" type="date" {...register("validTill")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append(EMPTY_LINE)}
              >
                <Plus className="size-3.5" /> Add line
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex-1">
                      <Combobox
                        items={catalogItemOptions}
                        value={watch(`lines.${index}.catalogItemId`) ?? null}
                        onValueChange={(value) => onCatalogItemSelect(index, value)}
                        placeholder="Catalog item (optional)"
                        emptyMessage="No catalog items found."
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
                  <div className="space-y-2">
                    <Input
                      placeholder="Description"
                      {...register(`lines.${index}.description`)}
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          inputMode="numeric"
                          {...register(`lines.${index}.qty`, {
                            valueAsNumber: true,
                          })}
                          onChange={(event) => onQtyChange(index, event)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Discount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.discount`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tax %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.taxRatePct`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-₹{totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
