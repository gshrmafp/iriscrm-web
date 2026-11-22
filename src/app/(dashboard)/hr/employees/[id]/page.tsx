"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployee } from "@/features/hrms/employees/hooks";
import { EmployeeProfile } from "@/features/hrms/employees/components/employee-profile";

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: employee, isLoading, isError } = useEmployee(id);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/hr/employees" />}>
        <ArrowLeft className="size-4" /> Employees
      </Button>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading employee…</p>
      ) : isError || !employee ? (
        <p className="text-sm text-muted-foreground">This employee doesn&apos;t exist or isn&apos;t visible to you.</p>
      ) : (
        <EmployeeProfile employee={employee} />
      )}
    </div>
  );
}
