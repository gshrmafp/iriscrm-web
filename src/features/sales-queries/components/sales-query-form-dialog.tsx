"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ClipboardList, Contact, MapPin, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogClose,
} from "@/components/ui/dialog";
import { useCreateSalesQuery, useUpdateSalesQuery } from "@/features/sales-queries/hooks";
import { MEETING_TYPE_OPTIONS, PRIORITY_OPTIONS } from "@/features/sales-queries/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import type { SalesQuery } from "@/types/entities";

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Contact;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

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

function toDefaultValues(query?: SalesQuery): Partial<SalesQueryFormValues> {
  if (!query) return { meetingType: "WALK_IN", priority: "MEDIUM" };
  return {
    customerName: query.customerName,
    companyName: query.companyName ?? undefined,
    contactPhone: query.contactPhone ?? undefined,
    contactEmail: query.contactEmail ?? undefined,
    meetingType: query.meetingType,
    visitDate: query.visitDate ? query.visitDate.slice(0, 10) : undefined,
    visitLocation: query.visitLocation ?? undefined,
    requirement: query.requirement,
    priority: query.priority,
    productInterest: query.productInterest ?? undefined,
    estimatedValue: query.estimatedValue ?? undefined,
  };
}

// Handles both creating a new query (default) and editing an existing one
// (pass `query`) — the two flows share every field, differing only in which
// mutation fires and how the dialog is triggered/titled. Same fluid
// two-column layout as LeadFormDialog for visual consistency between the
// app's two main capture forms.
export function SalesQueryFormDialog({ query }: { query?: SalesQuery }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!query;
  const createQuery = useCreateSalesQuery();
  const updateQuery = useUpdateSalesQuery(query?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesQueryFormValues>({
    resolver: zodResolver(salesQuerySchema),
    defaultValues: toDefaultValues(query),
  });

  async function onSubmit(values: SalesQueryFormValues) {
    const payload = {
      ...values,
      contactEmail: values.contactEmail || undefined,
      visitDate: values.visitDate ? new Date(values.visitDate).toISOString() : undefined,
      estimatedValue: values.estimatedValue ? Number(values.estimatedValue) : undefined,
    };
    try {
      if (isEdit) {
        await updateQuery.mutateAsync(payload);
        toast.success("Query updated");
      } else {
        await createQuery.mutateAsync(payload);
        toast.success("Query captured");
        reset();
      }
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const isPending = isEdit ? updateQuery.isPending : createQuery.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next, eventDetails) => {
        // Accidental clicks outside the form (or a stray Escape press) are a
        // common way to lose an in-progress query — require an explicit
        // Cancel/X/successful-submit to close instead.
        if (!next && (eventDetails.reason === "outside-press" || eventDetails.reason === "escape-key")) {
          eventDetails.cancel();
          return;
        }
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant={isEdit ? "outline" : "default"} />}>
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Edit" : "New Query"}
      </DialogTrigger>
      {/* Fluid width/height — scales continuously with the viewport instead
          of snapping between fixed Tailwind breakpoints, capped so it never
          exceeds the viewport itself. Mirrors LeadFormDialog. */}
      <DialogContent className="flex max-h-[90vh] w-[min(94vw,68rem)] flex-col gap-5 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit query" : "Capture a customer query"}</DialogTitle>
        </DialogHeader>
        {/* The form is the flex column that actually owns the available
            height: the two-column field grid is the only scrollable region,
            while the footer sits outside that scroll area so Save/Cancel
            stay pinned and visible even if fields overflow on a short
            viewport. */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-x-8 gap-y-5 overflow-y-auto py-0.5 pr-1 md:grid-cols-2">
            <div className="space-y-5">
              <FormSection icon={Contact} title="Customer information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      Customer name <span className="text-destructive">*</span>
                    </Label>
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
                </div>
              </FormSection>

              <Separator />

              <FormSection icon={MapPin} title="Visit information">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visitDate">Visit date</Label>
                    <Input id="visitDate" type="date" {...register("visitDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitLocation">Location</Label>
                    <Input id="visitLocation" {...register("visitLocation")} />
                  </div>
                </div>
              </FormSection>
            </div>

            <div className="space-y-5 md:border-l md:pl-8">
              <FormSection icon={ClipboardList} title="Requirement details">
                <div className="space-y-2">
                  <Label htmlFor="requirement">
                    Requirement <span className="text-destructive">*</span>
                  </Label>
                  <Textarea id="requirement" rows={4} {...register("requirement")} />
                  {errors.requirement ? (
                    <p className="text-sm text-destructive">{errors.requirement.message}</p>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productInterest">Product interested</Label>
                    <Input id="productInterest" {...register("productInterest")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Budget / estimated value</Label>
                    <Input id="estimatedValue" type="number" {...register("estimatedValue")} />
                  </div>
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
              </FormSection>
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 shrink-0 p-6 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save query"}
            </Button>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
