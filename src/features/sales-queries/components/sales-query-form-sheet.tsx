"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCreateSalesQuery } from "@/features/sales-queries/hooks";
import { MEETING_TYPE_OPTIONS, PRIORITY_OPTIONS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";

const salesQuerySchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  companyName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  meetingType: z.enum(["WALK_IN", "SCHEDULED", "REFERRAL"]),
  visitDate: z.string().optional(),
  visitLocation: z.string().optional(),
  requirement: z.string().min(1, "Describe the requirement"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  productInterest: z.string().optional(),
  estimatedValue: z.string().optional(),
});

type SalesQueryFormValues = z.infer<typeof salesQuerySchema>;

export function SalesQueryFormSheet() {
  const [open, setOpen] = useState(false);
  const createQuery = useCreateSalesQuery();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesQueryFormValues>({
    resolver: zodResolver(salesQuerySchema),
    defaultValues: { meetingType: "WALK_IN", priority: "MEDIUM" },
  });

  async function onSubmit(values: SalesQueryFormValues) {
    try {
      await createQuery.mutateAsync({
        ...values,
        contactEmail: values.contactEmail || undefined,
        visitDate: values.visitDate ? new Date(values.visitDate).toISOString() : undefined,
        estimatedValue: values.estimatedValue ? Number(values.estimatedValue) : undefined,
      });
      toast.success("Query captured");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <Plus className="size-4" />
        New Query
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Capture a customer query</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Customer information
          </p>
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer name</Label>
            <Input id="customerName" {...register("customerName")} />
            {errors.customerName ? (
              <p className="text-sm text-destructive">{errors.customerName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" {...register("companyName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input id="contactPhone" {...register("contactPhone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail ? (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            ) : null}
          </div>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Visit information
          </p>
          <div className="space-y-2">
            <Label>Meeting type</Label>
            <Select
              value={watch("meetingType")}
              onValueChange={(value) =>
                setValue("meetingType", (value ?? "WALK_IN") as SalesQueryFormValues["meetingType"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visitDate">Visit date</Label>
            <Input id="visitDate" type="date" {...register("visitDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visitLocation">Location</Label>
            <Input id="visitLocation" {...register("visitLocation")} />
          </div>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Requirement details
          </p>
          <div className="space-y-2">
            <Label htmlFor="requirement">Requirement</Label>
            <Textarea id="requirement" rows={4} {...register("requirement")} />
            {errors.requirement ? (
              <p className="text-sm text-destructive">{errors.requirement.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="productInterest">Product interested</Label>
            <Input id="productInterest" {...register("productInterest")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Budget / estimated value</Label>
            <Input id="estimatedValue" type="number" {...register("estimatedValue")} />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={watch("priority")}
              onValueChange={(value) =>
                setValue("priority", (value ?? "MEDIUM") as SalesQueryFormValues["priority"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={createQuery.isPending}>
              {createQuery.isPending ? "Saving…" : "Save query"}
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
