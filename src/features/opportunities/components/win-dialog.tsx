"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useReverseGeocode } from "@/features/geo/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { DealType } from "@/types/entities";

const formSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  poDate: z.string().min(1, "PO date is required"),
  poAmount: z
    .number({ error: "PO amount is required" })
    .positive("PO amount must be a positive number"),
  poRemarks: z.string().optional(),
  site: z.string(),
  timeline: z.string(),
  customerId: z.string(),
  bom: z.array(z.object({ catalogItemId: z.string(), qty: z.number() })),
  amcType: z.enum(["COMPREHENSIVE", "NON_COMPREHENSIVE"]),
  amcFrequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
  amcStartDate: z.string(),
  amcEndDate: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const reverseGeocode = useReverseGeocode();

  // Captured silently in the background while the dialog is open — no
  // visible lat/lng inputs, same pattern as the Meeting dialog and Step 1's
  // GPS auto-capture in the new-lead wizard.
  const [poGps, setPoGps] = useState<{ lat?: number; lng?: number; location?: string }>({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poNumber: "",
      poDate: "",
      poAmount: 0,
      poRemarks: "",
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

  useEffect(() => {
    if (!open) return;
    setPoGps({});
    if (!navigator.geolocation) return;
    if (typeof window !== "undefined" && !window.isSecureContext) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPoGps({ lat: latitude, lng: longitude });
        reverseGeocode.mutate(
          { lat: latitude, lng: longitude },
          {
            onSuccess: (result) => {
              const address = result.address;
              if (address) {
                setPoGps((prev) => ({ ...prev, location: address }));
              }
            },
          },
        );
      },
      () => {
        // Silent — GPS is best-effort; a PO can still be captured without it.
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
        poNumber: values.poNumber,
        poDate: new Date(values.poDate).toISOString(),
        poAmount: values.poAmount,
        poRemarks: values.poRemarks || undefined,
        poGpsLatitude: poGps.lat,
        poGpsLongitude: poGps.lng,
        poLocation: poGps.location,
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
      toast.success("Purchase Order captured — opportunity won!");
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
          <DialogTitle>Close Won — Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4 rounded-md border p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number *</Label>
                <Input id="poNumber" placeholder="PO-2026-0042" {...register("poNumber")} />
                {errors.poNumber ? (
                  <p className="text-sm text-destructive">{errors.poNumber.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="poDate">PO Date *</Label>
                <Input id="poDate" type="date" {...register("poDate")} />
                {errors.poDate ? (
                  <p className="text-sm text-destructive">{errors.poDate.message}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="poAmount">PO Amount (₹) *</Label>
              <Input
                id="poAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 150000"
                {...register("poAmount", { valueAsNumber: true })}
              />
              {errors.poAmount ? (
                <p className="text-sm text-destructive">{errors.poAmount.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="poRemarks">PO Remarks</Label>
              <Textarea id="poRemarks" rows={2} {...register("poRemarks")} />
            </div>
          </div>
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
