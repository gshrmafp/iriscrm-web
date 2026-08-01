"use client";

import { useMemo } from "react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllCatalogItems, useCreatePriceRule } from "@/features/catalog/hooks";
import { useRegions } from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { PriceRuleType } from "@/types/entities";

const RULE_TYPES: PriceRuleType[] = [
  "PROMOTIONAL",
  "REGION_OVERRIDE",
  "VOLUME_SLAB",
  "CUSTOMER_TIER",
];

interface FormValues {
  catalogItemId: string;
  regionId: string;
  ruleType: PriceRuleType;
  value: number;
  effectiveFrom: string;
  effectiveTo: string;
}

export function PriceRuleForm() {
  const { data: catalogItems } = useAllCatalogItems();
  const { data: regions } = useRegions();
  const createPriceRule = useCreatePriceRule();

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<FormValues>({
      defaultValues: { ruleType: "PROMOTIONAL" },
    });

  const catalogItemOptions: ComboboxOption[] = useMemo(
    () =>
      (catalogItems ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        description: `${item.code} · ₹${Number(item.basePrice).toLocaleString("en-IN")}`,
      })),
    [catalogItems],
  );

  const regionOptions: ComboboxOption[] = useMemo(
    () =>
      (regions ?? []).map((region) => ({
        value: region.id,
        label: region.name,
        description: region.code,
      })),
    [regions],
  );

  async function onSubmit(values: FormValues) {
    try {
      await createPriceRule.mutateAsync({
        catalogItemId: values.catalogItemId,
        regionId: values.regionId || undefined,
        ruleType: values.ruleType,
        value: Number(values.value),
        effectiveFrom: new Date(values.effectiveFrom).toISOString(),
        effectiveTo: values.effectiveTo
          ? new Date(values.effectiveTo).toISOString()
          : undefined,
      });
      toast.success("Price rule created");
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create a price rule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Catalog item</Label>
            <Combobox
              items={catalogItemOptions}
              value={watch("catalogItemId") || null}
              onValueChange={(value) => setValue("catalogItemId", value ?? "")}
              placeholder="Search catalog item…"
              emptyMessage="No catalog items found."
            />
          </div>
          <div className="space-y-2">
            <Label>Region (optional)</Label>
            <Combobox
              items={regionOptions}
              value={watch("regionId") || null}
              onValueChange={(value) => setValue("regionId", value ?? "")}
              placeholder="All regions"
              emptyMessage="No regions found."
            />
          </div>
          <div className="space-y-2">
            <Label>Rule type</Label>
            <Select
              value={watch("ruleType")}
              onValueChange={(value) =>
                setValue("ruleType", (value ?? "PROMOTIONAL") as PriceRuleType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">
              Value (absolute for REGION_OVERRIDE, % for PROMOTIONAL)
            </Label>
            <Input id="value" type="number" step="0.01" {...register("value")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="effectiveFrom">Effective from</Label>
            <Input id="effectiveFrom" type="date" {...register("effectiveFrom")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="effectiveTo">Effective to (optional)</Label>
            <Input id="effectiveTo" type="date" {...register("effectiveTo")} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createPriceRule.isPending}>
              {createPriceRule.isPending ? "Saving…" : "Create price rule"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
