"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEmployeeStatutory, useUpsertEmployeeStatutory } from "@/features/hrms/employees/hooks";
import { Field, FieldGrid } from "@/features/hrms/employees/components/profile-fields";
import { getApiErrorMessage } from "@/lib/api-client";

type Values = {
  bankName: string;
  bankAccount: string;
  ifsc: string;
  pan: string;
  aadhaar: string;
  uan: string;
  pfNumber: string;
  esiNumber: string;
};

const EMPTY: Values = { bankName: "", bankAccount: "", ifsc: "", pan: "", aadhaar: "", uan: "", pfNumber: "", esiNumber: "" };

// The form never shows stored values back (they may be masked); fields left
// blank are not sent, so only what HR types is changed.
function StatutoryEditSheet({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false);
  const upsert = useUpsertEmployeeStatutory(employeeId);
  const { register, handleSubmit, reset } = useForm<Values>({ defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  async function onSubmit(values: Values) {
    const payload = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim() !== "").map(([k, v]) => [k, v.trim()]));
    if (Object.keys(payload).length === 0) {
      toast.error("Enter at least one value to update");
      return;
    }
    try {
      await upsert.mutateAsync(payload);
      toast.success("Bank & statutory details saved");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const field = (name: keyof Values, label: string, placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} placeholder={placeholder} autoComplete="off" {...register(name)} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-3.5" /> Update
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Update bank & statutory details</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          <p className="text-xs text-muted-foreground">
            Only fill in what you want to change — blank fields keep their current value. Values are stored encrypted.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("bankName", "Bank name")}
            {field("ifsc", "IFSC", "HDFC0001234")}
            {field("bankAccount", "Account number")}
            {field("pan", "PAN", "ABCDE1234F")}
            {field("aadhaar", "Aadhaar", "12 digits")}
            {field("uan", "UAN", "12 digits")}
            {field("pfNumber", "PF number")}
            {field("esiNumber", "ESI number")}
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function StatutoryPanel({ employeeId, canManage }: { employeeId: string; canManage: boolean }) {
  const { data, isLoading, isError } = useEmployeeStatutory(employeeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bank & statutory</CardTitle>
        {canManage ? (
          <CardAction>
            <StatutoryEditSheet employeeId={employeeId} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have access to these details.</p>
        ) : (
          <>
            {data.masked ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" /> Sensitive numbers are partly hidden.
              </p>
            ) : null}
            <FieldGrid>
              <Field label="Bank" value={data.bankName} />
              <Field label="IFSC" value={data.ifsc} />
              <Field label="Account number" value={data.bankAccount} />
              <Field label="PAN" value={data.pan} />
              <Field label="Aadhaar" value={data.aadhaar} />
              <Field label="UAN" value={data.uan} />
              <Field label="PF number" value={data.pfNumber} />
              <Field label="ESI number" value={data.esiNumber} />
            </FieldGrid>
          </>
        )}
      </CardContent>
    </Card>
  );
}
