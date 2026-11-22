"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useHrDepartments } from "@/features/hrms/organization/hooks";
import { useRegions, useUserDirectory } from "@/features/identity/hooks";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDesignations, useUpdateEmployee, useUpdateMyEmployee } from "@/features/hrms/employees/hooks";
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, LIFECYCLE_LABELS, toDateInput } from "@/features/hrms/constants";
import { NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Employee } from "@/types/entities";

type ContactValues = {
  phone: string;
  personalEmail: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRel: string;
};

type HrValues = ContactValues & {
  dateOfBirth: string;
  gender: string;
  designationId: string;
  departmentId: string;
  reportingToId: string;
  regionId: string;
  employmentType: string;
  lifecycleStatus: string;
  joiningDate: string;
  probationStartsOn: string;
  probationEndsOn: string;
  confirmedOn: string;
  noticePeriodDays: string;
  exitDate: string;
  workLocation: string;
  effectiveDate: string;
  note: string;
};

function contactDefaults(employee: Employee): ContactValues {
  return {
    phone: employee.phone ?? "",
    personalEmail: employee.personalEmail ?? "",
    currentAddress: employee.currentAddress ?? "",
    permanentAddress: employee.permanentAddress ?? "",
    emergencyContactName: employee.emergencyContactName ?? "",
    emergencyContactPhone: employee.emergencyContactPhone ?? "",
    emergencyContactRel: employee.emergencyContactRel ?? "",
  };
}

function hrDefaults(employee: Employee): HrValues {
  return {
    ...contactDefaults(employee),
    dateOfBirth: toDateInput(employee.dateOfBirth),
    gender: employee.gender ?? "",
    designationId: employee.designationId ?? "",
    departmentId: employee.departmentId ?? "",
    reportingToId: employee.user.reportingTo?.id ?? "",
    regionId: employee.user.regionId,
    employmentType: employee.employmentType,
    lifecycleStatus: employee.lifecycleStatus,
    joiningDate: toDateInput(employee.joiningDate),
    probationStartsOn: toDateInput(employee.probationStartsOn),
    probationEndsOn: toDateInput(employee.probationEndsOn),
    confirmedOn: toDateInput(employee.confirmedOn),
    noticePeriodDays: employee.noticePeriodDays?.toString() ?? "",
    exitDate: toDateInput(employee.exitDate),
    workLocation: employee.workLocation ?? "",
    effectiveDate: "",
    note: "",
  };
}

// Blank inputs mean "cleared" (null), not "unchanged" — the form always
// sends the full set of fields it shows.
const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

function ContactFields({ register }: { register: ReturnType<typeof useForm<ContactValues>>["register"] }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input id="phone" inputMode="tel" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personalEmail">Personal email</Label>
          <Input id="personalEmail" type="email" {...register("personalEmail")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currentAddress">Current address</Label>
        <Textarea id="currentAddress" rows={2} {...register("currentAddress")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="permanentAddress">Permanent address</Label>
        <Textarea id="permanentAddress" rows={2} {...register("permanentAddress")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Emergency contact</Label>
          <Input id="emergencyContactName" {...register("emergencyContactName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Their phone</Label>
          <Input id="emergencyContactPhone" inputMode="tel" {...register("emergencyContactPhone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactRel">Relationship</Label>
          <Input id="emergencyContactRel" {...register("emergencyContactRel")} />
        </div>
      </div>
    </>
  );
}

// Employee's own contact details (PATCH /hrms/employees/me).
export function ContactEditSheet({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateMyEmployee();
  const { register, handleSubmit, reset } = useForm<ContactValues>({ defaultValues: contactDefaults(employee) });

  useEffect(() => {
    if (open) reset(contactDefaults(employee));
  }, [open, employee, reset]);

  async function onSubmit(values: ContactValues) {
    try {
      await update.mutateAsync(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, orNull(value)])));
      toast.success("Contact details updated");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-3.5" /> Edit contact details
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit contact details</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          <ContactFields register={register} />
          <SheetFooter className="px-0">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// HR edit of personal + employment details (PATCH /hrms/employees/:id).
export function EmployeeEditSheet({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateEmployee(employee.userId);
  const { data: designations = [] } = useDesignations();
  const { data: departments = [] } = useHrDepartments(true);
  const { data: directory = [] } = useUserDirectory();
  const { user } = useAuth();
  // Branch transfers are Super Admin only (the API enforces the same rule).
  const canTransfer = user?.role === "SUPER_ADMIN";
  const { data: regions = [] } = useRegions();
  const { register, handleSubmit, reset, watch, setValue } = useForm<HrValues>({ defaultValues: hrDefaults(employee) });

  useEffect(() => {
    if (open) reset(hrDefaults(employee));
  }, [open, employee, reset]);

  const managerOptions: ComboboxOption[] = useMemo(
    () => directory.filter((u) => u.id !== employee.userId).map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [directory, employee.userId],
  );

  const values = watch();
  const trackedChange =
    values.lifecycleStatus !== employee.lifecycleStatus ||
    values.departmentId !== (employee.departmentId ?? "") ||
    values.designationId !== (employee.designationId ?? "") ||
    values.reportingToId !== (employee.user.reportingTo?.id ?? "") ||
    values.regionId !== employee.user.regionId;

  async function onSubmit(form: HrValues) {
    try {
      await update.mutateAsync({
        phone: orNull(form.phone),
        personalEmail: orNull(form.personalEmail),
        currentAddress: orNull(form.currentAddress),
        permanentAddress: orNull(form.permanentAddress),
        emergencyContactName: orNull(form.emergencyContactName),
        emergencyContactPhone: orNull(form.emergencyContactPhone),
        emergencyContactRel: orNull(form.emergencyContactRel),
        dateOfBirth: orNull(form.dateOfBirth),
        gender: (orNull(form.gender) as Employee["gender"]) ?? null,
        designationId: orNull(form.designationId),
        departmentId: orNull(form.departmentId),
        reportingToId: orNull(form.reportingToId),
        ...(canTransfer && form.regionId !== employee.user.regionId ? { regionId: form.regionId } : {}),
        employmentType: form.employmentType as Employee["employmentType"],
        lifecycleStatus: form.lifecycleStatus as Employee["lifecycleStatus"],
        joiningDate: orNull(form.joiningDate),
        probationStartsOn: orNull(form.probationStartsOn),
        probationEndsOn: orNull(form.probationEndsOn),
        confirmedOn: orNull(form.confirmedOn),
        noticePeriodDays: form.noticePeriodDays.trim() === "" ? null : Number(form.noticePeriodDays),
        exitDate: orNull(form.exitDate),
        workLocation: orNull(form.workLocation),
        ...(form.effectiveDate ? { effectiveDate: form.effectiveDate } : {}),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
      });
      toast.success("Employee updated");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-3.5" /> Edit
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit {employee.user.name}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employment</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="designationId">Designation</Label>
              <NativeSelect
                id="designationId"
                value={values.designationId}
                onChange={(v) => setValue("designationId", v)}
                placeholder="Not set"
                options={designations.filter((d) => d.active || d.id === employee.designationId).map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <NativeSelect
                id="departmentId"
                value={values.departmentId}
                onChange={(v) => setValue("departmentId", v)}
                placeholder="Not set"
                options={departments.filter((d) => d.active || d.id === employee.departmentId).map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Reporting manager</Label>
              <Combobox
                items={managerOptions}
                value={values.reportingToId || null}
                onValueChange={(v) => setValue("reportingToId", v ?? "")}
                placeholder="Search by name or email…"
                emptyMessage="No people found."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment type</Label>
              <NativeSelect id="employmentType" value={values.employmentType} onChange={(v) => setValue("employmentType", v)} options={options(EMPLOYMENT_TYPE_LABELS)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifecycleStatus">Status</Label>
              <NativeSelect id="lifecycleStatus" value={values.lifecycleStatus} onChange={(v) => setValue("lifecycleStatus", v)} options={options(LIFECYCLE_LABELS)} />
            </div>
            {canTransfer ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="regionId">Branch</Label>
                <NativeSelect
                  id="regionId"
                  value={values.regionId}
                  onChange={(v) => setValue("regionId", v)}
                  options={regions.filter((r) => r.active || r.id === employee.user.regionId).map((r) => ({ value: r.id, label: r.name }))}
                />
                {values.regionId !== employee.user.regionId ? (
                  <p className="text-xs text-warning-foreground dark:text-warning">
                    Transferring moves them out of the current branch HR&apos;s view. Check their reporting manager too.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Date of joining</Label>
              <Input id="joiningDate" type="date" {...register("joiningDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workLocation">Work location</Label>
              <Input id="workLocation" {...register("workLocation")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probationStartsOn">Probation starts</Label>
              <Input id="probationStartsOn" type="date" {...register("probationStartsOn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probationEndsOn">Probation ends</Label>
              <Input id="probationEndsOn" type="date" {...register("probationEndsOn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmedOn">Confirmed on</Label>
              <Input id="confirmedOn" type="date" {...register("confirmedOn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noticePeriodDays">Notice period (days)</Label>
              <Input id="noticePeriodDays" type="number" min={0} max={365} {...register("noticePeriodDays")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitDate">Exit date</Label>
              <Input id="exitDate" type="date" {...register("exitDate")} />
            </div>
          </div>

          {trackedChange ? (
            <div className="grid gap-4 rounded-lg border border-dashed p-3 sm:grid-cols-2">
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Status, department, designation, manager and branch changes are recorded in the employment history.
                {values.lifecycleStatus === "EXITED" && employee.lifecycleStatus !== "EXITED"
                  ? " Marking as Exited also deactivates their login."
                  : ""}
              </p>
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective from</Label>
                <Input id="effectiveDate" type="date" {...register("effectiveDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Input id="note" placeholder="Reason for the change" {...register("note")} />
              </div>
            </div>
          ) : null}

          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <NativeSelect id="gender" value={values.gender} onChange={(v) => setValue("gender", v)} placeholder="Not set" options={options(GENDER_LABELS)} />
            </div>
          </div>
          <ContactFields register={register as unknown as ReturnType<typeof useForm<ContactValues>>["register"]} />

          <SheetFooter className="px-0">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
