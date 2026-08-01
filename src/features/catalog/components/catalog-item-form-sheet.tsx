"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useCreateCatalogItem,
  useUpdateCatalogItem,
} from "@/features/catalog/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { CatalogItem } from "@/types/entities";

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  basePrice: z.number().nonnegative(),
  taxClass: z.string().min(1, "Tax class is required"),
});

type FormValues = z.infer<typeof schema>;

export function CatalogItemFormSheet({ item }: { item?: CatalogItem }) {
  const [open, setOpen] = useState(false);
  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem(item?.id ?? "");
  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { ...item, basePrice: Number(item.basePrice) }
      : {
          code: "",
          name: "",
          category: "",
          unit: "",
          basePrice: 0,
          taxClass: "GST18",
        },
  });

  useEffect(() => {
    if (item) reset({ ...item, basePrice: Number(item.basePrice) });
  }, [item, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEditing) {
        await updateItem.mutateAsync(values);
        toast.success("Catalog item updated");
      } else {
        await createItem.mutateAsync(values);
        toast.success("Catalog item created");
        reset();
      }
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant={isEditing ? "outline" : "default"}
            size={isEditing ? "sm" : "default"}
          />
        }
      >
        {isEditing ? (
          "Edit"
        ) : (
          <>
            <Plus className="size-4" /> New item
          </>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Edit catalog item" : "Create catalog item"}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" disabled={isEditing} {...register("code")} />
            {errors.code ? (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register("category")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" placeholder="pcs" {...register("unit")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base price (₹)</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              {...register("basePrice", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxClass">Tax class</Label>
            <Input id="taxClass" placeholder="GST18" {...register("taxClass")} />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
