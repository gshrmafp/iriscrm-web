"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useMyEmployee } from "@/features/hrms/employees/hooks";
import { EmployeeProfile } from "@/features/hrms/employees/components/employee-profile";

export default function MyProfilePage() {
  const { data: employee, isLoading, isError } = useMyEmployee();

  return (
    <div>
      <PageHeader title="My profile" description="Your employment record, contact details and documents." />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError || !employee ? (
        <p className="text-sm text-muted-foreground">No employee record is linked to your account yet. Contact HR.</p>
      ) : (
        <EmployeeProfile employee={employee} />
      )}
    </div>
  );
}
