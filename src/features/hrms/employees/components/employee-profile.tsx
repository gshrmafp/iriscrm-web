"use client";

import { Briefcase, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, employeeStatusTone } from "@/components/status-badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { HR_PERMISSIONS, useMyPermissions } from "@/features/auth/use-my-permissions";
import { EmployeeAvatar } from "@/features/hrms/employees/components/employee-avatar";
import { ContactEditSheet, EmployeeEditSheet } from "@/features/hrms/employees/components/employee-edit-sheet";
import { Field, FieldGrid } from "@/features/hrms/employees/components/profile-fields";
import { StatutoryPanel } from "@/features/hrms/employees/components/statutory-panel";
import { DocumentsPanel } from "@/features/hrms/employees/components/documents-panel";
import { HistoryPanel } from "@/features/hrms/employees/components/history-panel";
import { OnboardingPanel } from "@/features/hrms/onboarding/components/onboarding-panel";
import { useOnboardingChecklist } from "@/features/hrms/onboarding/hooks";
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, LIFECYCLE_LABELS, formatHrDate } from "@/features/hrms/constants";
import { ROLES } from "@/lib/permissions";
import type { Employee } from "@/types/entities";

function Meta({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function EmployeeProfile({ employee }: { employee: Employee }) {
  const { user } = useAuth();
  const { has } = useMyPermissions();
  const isSelf = user?.id === employee.userId;
  const canManage = has(HR_PERMISSIONS.EMPLOYEE_MANAGE);
  // The API only serves statutory details and documents to the employee
  // themselves or to HR; managers see profile + history only.
  const canSeePrivate = isSelf || canManage;
  const id = employee.userId;
  const { data: checklist } = useOnboardingChecklist(id);
  const showOnboarding = canManage || (checklist?.total ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <EmployeeAvatar name={employee.user.name} size="lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{employee.user.name}</h2>
              <StatusBadge label={LIFECYCLE_LABELS[employee.lifecycleStatus]} tone={employeeStatusTone(employee.lifecycleStatus)} />
              {employee.user.status === "INACTIVE" ? <StatusBadge label="Login disabled" tone="danger" /> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.userId}
              {employee.designation ? ` · ${employee.designation.name}` : ""}
              {employee.department ? ` · ${employee.department.name}` : ""}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <Meta icon={Mail}>{employee.user.email}</Meta>
              {employee.phone ? <Meta icon={Phone}>{employee.phone}</Meta> : null}
              <Meta icon={MapPin}>{employee.user.region?.name ?? employee.user.regionId}</Meta>
              <Meta icon={UserRound}>Reports to {employee.user.reportingTo?.name ?? "—"}</Meta>
              <Meta icon={Briefcase}>{ROLES[employee.user.role]?.label ?? employee.user.role}</Meta>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {isSelf ? <ContactEditSheet employee={employee} /> : null}
            {canManage && !isSelf ? <EmployeeEditSheet employee={employee} /> : null}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showOnboarding ? (
            <TabsTrigger value="onboarding">
              Onboarding
              {checklist && checklist.total > 0 ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  {checklist.done}/{checklist.total}
                </span>
              ) : null}
            </TabsTrigger>
          ) : null}
          {canSeePrivate ? <TabsTrigger value="statutory">Bank & statutory</TabsTrigger> : null}
          {canSeePrivate ? <TabsTrigger value="documents">Documents</TabsTrigger> : null}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGrid>
                <Field label="Employee code" value={employee.userId} />
                <Field label="Employment type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]} />
                <Field label="Designation" value={employee.designation?.name} />
                <Field label="Department" value={employee.department?.name} />
                <Field label="Branch" value={employee.user.region?.name} />
                <Field label="Work location" value={employee.workLocation} />
                <Field label="Joining date" value={employee.joiningDate ? formatHrDate(employee.joiningDate) : null} />
                <Field label="Notice period" value={employee.noticePeriodDays != null ? `${employee.noticePeriodDays} days` : null} />
                <Field label="Probation ends" value={employee.probationEndsOn ? formatHrDate(employee.probationEndsOn) : null} />
                <Field label="Confirmed on" value={employee.confirmedOn ? formatHrDate(employee.confirmedOn) : null} />
                {employee.exitDate ? <Field label="Exit date" value={formatHrDate(employee.exitDate)} /> : null}
              </FieldGrid>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGrid>
                <Field label="Phone" value={employee.phone} />
                <Field label="Personal email" value={employee.personalEmail} />
                <Field label="Date of birth" value={employee.dateOfBirth ? formatHrDate(employee.dateOfBirth) : null} />
                <Field label="Gender" value={employee.gender ? GENDER_LABELS[employee.gender] : null} />
                <Field label="Current address" value={employee.currentAddress} className="sm:col-span-2" />
                <Field label="Permanent address" value={employee.permanentAddress} className="sm:col-span-2" />
                <Field label="Emergency contact" value={employee.emergencyContactName} />
                <Field
                  label="Emergency phone"
                  value={
                    employee.emergencyContactPhone
                      ? `${employee.emergencyContactPhone}${employee.emergencyContactRel ? ` (${employee.emergencyContactRel})` : ""}`
                      : null
                  }
                />
              </FieldGrid>
            </CardContent>
          </Card>
        </TabsContent>

        {showOnboarding ? (
          <TabsContent value="onboarding" className="mt-4">
            <OnboardingPanel employeeId={id} canManage={canManage} isSelf={isSelf} />
          </TabsContent>
        ) : null}
        {canSeePrivate ? (
          <TabsContent value="statutory" className="mt-4">
            <StatutoryPanel employeeId={id} canManage={canManage} />
          </TabsContent>
        ) : null}
        {canSeePrivate ? (
          <TabsContent value="documents" className="mt-4">
            <DocumentsPanel employeeId={id} canManage={canManage} />
          </TabsContent>
        ) : null}
        <TabsContent value="history" className="mt-4">
          <HistoryPanel employeeId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
