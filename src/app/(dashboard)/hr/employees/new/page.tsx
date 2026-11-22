"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Stepper } from "@/components/ui/stepper";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { HR_PERMISSIONS, useMyPermissions } from "@/features/auth/use-my-permissions";
import { useRegions, useUserDirectory } from "@/features/identity/hooks";
import { useDesignations } from "@/features/hrms/employees/hooks";
import { useHrDepartments } from "@/features/hrms/organization/hooks";
import { useOnboardEmployee, useOnboardingTemplates } from "@/features/hrms/onboarding/hooks";
import { Field, FieldGrid, NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import {
  EMPLOYMENT_TYPE_LABELS,
  GENDER_LABELS,
  LIFECYCLE_LABELS,
  TASK_OWNER_LABELS,
  formatHrDate,
} from "@/features/hrms/constants";
import { getApiErrorMessage } from "@/lib/api-client";
import { ROLES } from "@/lib/permissions";
import type { EmployeeLifecycleStatus, EmploymentType, Gender, Role } from "@/types/entities";

const STEPS = [
  { label: "Account", description: "Login & reporting" },
  { label: "Job", description: "Role in the company" },
  { label: "Personal", description: "Contact details" },
  { label: "Checklist", description: "Review & create" },
];

// Only a Super Admin can hand these out (the API enforces the same rule).
const PRIVILEGED_ROLES: Role[] = ["SUPER_ADMIN", "REGIONAL_ADMIN", "HR_ADMIN"];
const JOIN_STATUSES: EmployeeLifecycleStatus[] = ["ONBOARDING", "PROBATION", "CONFIRMED"];
const MOBILE_REGEX = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Values = {
  name: string;
  email: string;
  password: string;
  role: Role;
  regionId: string;
  reportingToId: string;
  designationId: string;
  departmentId: string;
  employmentType: EmploymentType;
  lifecycleStatus: EmployeeLifecycleStatus;
  joiningDate: string;
  probationEndsOn: string;
  noticePeriodDays: string;
  workLocation: string;
  phone: string;
  personalEmail: string;
  dateOfBirth: string;
  gender: string;
  templateId: string;
};

type Errors = Partial<Record<keyof Values, string>>;

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return `${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}!9`;
}

function addMonths(isoDate: string, months: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function validate(step: number, v: Values): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!v.name.trim()) e.name = "Name is required";
    if (!EMAIL_REGEX.test(v.email.trim())) e.email = "Enter a valid work email";
    if (v.password.length < 8) e.password = "At least 8 characters";
    if (!v.regionId) e.regionId = "Choose a branch";
  }
  if (step === 2) {
    if (!v.joiningDate) e.joiningDate = "Joining date is required";
    if (v.probationEndsOn && v.joiningDate && v.probationEndsOn < v.joiningDate) e.probationEndsOn = "Must be after the joining date";
    if (v.noticePeriodDays && !/^\d{1,3}$/.test(v.noticePeriodDays)) e.noticePeriodDays = "Days, 0–365";
  }
  if (step === 3) {
    if (v.phone && !MOBILE_REGEX.test(v.phone.trim())) e.phone = "Enter a valid 10-digit mobile number";
    if (v.personalEmail && !EMAIL_REGEX.test(v.personalEmail.trim())) e.personalEmail = "Enter a valid email";
  }
  return e;
}

function FormField({ id, label, error, hint, children }: { id?: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const options = <T extends string>(labels: Record<T, string>, keys?: T[]) =>
  (keys ?? (Object.keys(labels) as T[])).map((value) => ({ value, label: labels[value] }));

export default function OnboardEmployeePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const { has, isLoading: permissionsLoading } = useMyPermissions();
  const canOnboard = has(HR_PERMISSIONS.EMPLOYEE_MANAGE);
  const { data: regions = [] } = useRegions();
  const { data: directory = [] } = useUserDirectory();
  const { data: designations = [] } = useDesignations();
  const { data: departments = [] } = useHrDepartments();
  const { data: templates = [] } = useOnboardingTemplates(canOnboard);
  const onboard = useOnboardEmployee();

  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [values, setValues] = useState<Values>(() => ({
    name: "",
    email: "",
    password: generatePassword(),
    role: "SALES_EXECUTIVE",
    regionId: user?.regionId ?? "",
    reportingToId: "",
    designationId: "",
    departmentId: "",
    employmentType: "FULL_TIME",
    lifecycleStatus: "ONBOARDING",
    joiningDate: today,
    probationEndsOn: "",
    noticePeriodDays: "30",
    workLocation: "",
    phone: "",
    personalEmail: "",
    dateOfBirth: "",
    gender: "",
    templateId: "",
  }));
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  // Default to the first active template once templates load.
  const activeTemplates = templates.filter((t) => t.active);
  const templateId = values.templateId || (activeTemplates[0]?.id ?? "");
  const template = templates.find((t) => t.id === templateId);

  const roleKeys = (Object.keys(ROLES) as Role[]).filter((r) => isSuperAdmin || !PRIVILEGED_ROLES.includes(r));
  const managerOptions: ComboboxOption[] = useMemo(
    () => directory.map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [directory],
  );
  const lookup = <T extends { id: string; name: string }>(list: T[], id: string) => list.find((x) => x.id === id)?.name;

  function next() {
    const found = validate(step, values);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep((s) => Math.min(s + 1, STEPS.length));
  }

  async function submit() {
    for (const s of [1, 2, 3]) {
      const found = validate(s, values);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(s);
        return;
      }
    }
    const blank = (v: string) => (v.trim() === "" ? null : v.trim());
    try {
      const employee = await onboard.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        regionId: values.regionId,
        reportingToId: blank(values.reportingToId),
        designationId: blank(values.designationId),
        departmentId: blank(values.departmentId),
        employmentType: values.employmentType,
        lifecycleStatus: values.lifecycleStatus as "ONBOARDING" | "PROBATION" | "CONFIRMED",
        joiningDate: values.joiningDate,
        probationEndsOn: blank(values.probationEndsOn),
        noticePeriodDays: values.noticePeriodDays ? Number(values.noticePeriodDays) : null,
        workLocation: blank(values.workLocation),
        phone: blank(values.phone),
        personalEmail: blank(values.personalEmail),
        dateOfBirth: blank(values.dateOfBirth),
        gender: (blank(values.gender) as Gender | null) ?? null,
        templateId: templateId || null,
      });
      toast.success(`${employee.user.name} onboarded as ${employee.userId}`, {
        description: "Share the temporary password with them securely.",
      });
      router.push(`/hr/employees/${employee.userId}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (!permissionsLoading && !canOnboard) {
    return (
      <div className="space-y-4">
        <PageHeader title="Onboard employee" />
        <p className="text-sm text-muted-foreground">Only HR can onboard new employees.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/hr/employees" />}>
        <ArrowLeft className="size-4" /> Employees
      </Button>
      <PageHeader title="Onboard employee" description="Creates their IRIS login, employee record and onboarding checklist together." />
      <Stepper steps={STEPS} currentStep={step} className="px-2" />

      <Card>
        <CardContent className="space-y-6 pt-2">
          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="name" label="Full name" error={errors.name}>
                <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} autoFocus />
              </FormField>
              <FormField id="email" label="Work email (login)" error={errors.email}>
                <Input id="email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
              </FormField>
              <FormField id="password" label="Temporary password" error={errors.password} hint="They can change it after first sign-in.">
                <div className="flex gap-2">
                  <Input id="password" value={values.password} onChange={(e) => set("password", e.target.value)} autoComplete="off" className="font-mono" />
                  <Button type="button" variant="outline" size="icon" aria-label="Generate password" onClick={() => set("password", generatePassword())}>
                    <KeyRound className="size-4" />
                  </Button>
                </div>
              </FormField>
              <FormField id="role" label="App role" hint="Controls what they can do in IRIS.">
                <NativeSelect id="role" value={values.role} onChange={(v) => set("role", v as Role)} options={roleKeys.map((r) => ({ value: r, label: ROLES[r].label }))} />
              </FormField>
              <FormField id="regionId" label="Branch" error={errors.regionId} hint={isSuperAdmin ? undefined : "You can onboard into your own branch."}>
                {isSuperAdmin ? (
                  <NativeSelect
                    id="regionId"
                    value={values.regionId}
                    onChange={(v) => set("regionId", v)}
                    placeholder="Choose a branch"
                    options={regions.filter((r) => r.active).map((r) => ({ value: r.id, label: r.name }))}
                  />
                ) : (
                  <Input id="regionId" value={lookup(regions, values.regionId) ?? values.regionId} disabled />
                )}
              </FormField>
              <FormField label="Reporting manager">
                <Combobox
                  items={managerOptions}
                  value={values.reportingToId || null}
                  onValueChange={(v) => set("reportingToId", v ?? "")}
                  placeholder="Search by name or email…"
                  emptyMessage="No people found."
                />
              </FormField>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="designationId" label="Designation">
                <NativeSelect
                  id="designationId"
                  value={values.designationId}
                  onChange={(v) => set("designationId", v)}
                  placeholder="Not set"
                  options={designations.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>
              <FormField id="departmentId" label="Department">
                <NativeSelect
                  id="departmentId"
                  value={values.departmentId}
                  onChange={(v) => set("departmentId", v)}
                  placeholder="Not set"
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>
              <FormField id="employmentType" label="Employment type">
                <NativeSelect id="employmentType" value={values.employmentType} onChange={(v) => set("employmentType", v as EmploymentType)} options={options(EMPLOYMENT_TYPE_LABELS)} />
              </FormField>
              <FormField id="lifecycleStatus" label="Starting status">
                <NativeSelect
                  id="lifecycleStatus"
                  value={values.lifecycleStatus}
                  onChange={(v) => set("lifecycleStatus", v as EmployeeLifecycleStatus)}
                  options={options(LIFECYCLE_LABELS, JOIN_STATUSES)}
                />
              </FormField>
              <FormField id="joiningDate" label="Joining date" error={errors.joiningDate}>
                <Input id="joiningDate" type="date" value={values.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
              </FormField>
              <FormField id="probationEndsOn" label="Probation ends" error={errors.probationEndsOn}>
                <div className="flex gap-2">
                  <Input id="probationEndsOn" type="date" value={values.probationEndsOn} onChange={(e) => set("probationEndsOn", e.target.value)} />
                  {[3, 6].map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0"
                      disabled={!values.joiningDate}
                      onClick={() => set("probationEndsOn", addMonths(values.joiningDate, m))}
                    >
                      {m}m
                    </Button>
                  ))}
                </div>
              </FormField>
              <FormField id="noticePeriodDays" label="Notice period (days)" error={errors.noticePeriodDays}>
                <Input id="noticePeriodDays" inputMode="numeric" value={values.noticePeriodDays} onChange={(e) => set("noticePeriodDays", e.target.value)} />
              </FormField>
              <FormField id="workLocation" label="Work location">
                <Input id="workLocation" value={values.workLocation} onChange={(e) => set("workLocation", e.target.value)} placeholder="e.g. Gurugram office" />
              </FormField>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="phone" label="Mobile" error={errors.phone}>
                <Input id="phone" inputMode="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
              </FormField>
              <FormField id="personalEmail" label="Personal email" error={errors.personalEmail}>
                <Input id="personalEmail" type="email" value={values.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
              </FormField>
              <FormField id="dateOfBirth" label="Date of birth">
                <Input id="dateOfBirth" type="date" max={today} value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </FormField>
              <FormField id="gender" label="Gender">
                <NativeSelect id="gender" value={values.gender} onChange={(v) => set("gender", v)} placeholder="Not set" options={options(GENDER_LABELS)} />
              </FormField>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Optional — the employee can fill in addresses and emergency contacts themselves under My Profile. Bank and
                statutory details are added on their profile after onboarding.
              </p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-6">
              <FormField id="templateId" label="Onboarding checklist">
                <NativeSelect
                  id="templateId"
                  value={templateId}
                  onChange={(v) => set("templateId", v)}
                  placeholder="No checklist"
                  options={activeTemplates.map((t) => ({ value: t.id, label: `${t.name} (${t.tasks.length} tasks)` }))}
                />
              </FormField>
              {template ? (
                <ul className="divide-y rounded-lg border">
                  {template.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {values.joiningDate
                          ? formatHrDate(new Date(Date.parse(`${values.joiningDate}T00:00:00Z`) + t.dueOffsetDays * 86_400_000).toISOString())
                          : `Day ${t.dueOffsetDays}`}
                      </span>
                      <StatusBadge label={TASK_OWNER_LABELS[t.owner]} tone={t.owner === "HR" ? "purple" : t.owner === "MANAGER" ? "info" : "teal"} />
                    </li>
                  ))}
                </ul>
              ) : null}

              <Card size="sm" className="bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGrid>
                    <Field label="Name" value={values.name} />
                    <Field label="Work email" value={values.email} />
                    <Field label="App role" value={ROLES[values.role]?.label} />
                    <Field label="Branch" value={lookup(regions, values.regionId)} />
                    <Field label="Reports to" value={directory.find((u) => u.id === values.reportingToId)?.name} />
                    <Field label="Designation" value={lookup(designations, values.designationId)} />
                    <Field label="Department" value={lookup(departments, values.departmentId)} />
                    <Field label="Type · status" value={`${EMPLOYMENT_TYPE_LABELS[values.employmentType]} · ${LIFECYCLE_LABELS[values.lifecycleStatus]}`} />
                    <Field label="Joining date" value={values.joiningDate ? formatHrDate(`${values.joiningDate}T00:00:00Z`) : null} />
                    <Field label="Probation ends" value={values.probationEndsOn ? formatHrDate(`${values.probationEndsOn}T00:00:00Z`) : null} />
                  </FieldGrid>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || onboard.isPending}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < STEPS.length ? (
              <Button type="button" onClick={next}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={onboard.isPending}>
                <Check className="size-4" /> {onboard.isPending ? "Creating…" : "Create employee"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
