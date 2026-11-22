"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { LayoutGrid, List, UserPlus } from "lucide-react";
import { HR_PERMISSIONS, useMyPermissions } from "@/features/auth/use-my-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { StatusBadge, employeeStatusTone } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHrDepartments } from "@/features/hrms/organization/hooks";
import { useDesignations, useEmployees } from "@/features/hrms/employees/hooks";
import { EmployeeAvatar } from "@/features/hrms/employees/components/employee-avatar";
import { EMPLOYMENT_TYPE_LABELS, LIFECYCLE_LABELS, formatHrDate } from "@/features/hrms/constants";
import type { ListEmployeesFilters } from "@/features/hrms/employees/api";
import type { Employee, EmployeeLifecycleStatus, EmploymentType } from "@/types/entities";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const DEFAULT_FILTERS: ListEmployeesFilters = { page: 1, pageSize: 25, sortBy: "name", sortOrder: "asc" };

const columns: ColumnDef<Employee>[] = [
  {
    id: "employee",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <EmployeeAvatar name={row.original.user.name} />
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.userId} · {row.original.user.email}
          </p>
        </div>
      </div>
    ),
  },
  { id: "designation", header: "Designation", cell: ({ row }) => row.original.designation?.name ?? "—" },
  { id: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
  { id: "manager", header: "Reports to", cell: ({ row }) => row.original.user.reportingTo?.name ?? "—" },
  {
    id: "location",
    header: "Branch",
    cell: ({ row }) => (
      <span>
        {row.original.user.region.name} <span className="text-muted-foreground">({row.original.user.region.code})</span>
      </span>
    ),
  },
  { id: "joined", header: "Joined", cell: ({ row }) => formatHrDate(row.original.joiningDate) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge label={LIFECYCLE_LABELS[row.original.lifecycleStatus]} tone={employeeStatusTone(row.original.lifecycleStatus)} />
    ),
  },
];

function EmployeeCard({ employee, onClick }: { employee: Employee; onClick: () => void }) {
  return (
    <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" onClick={onClick}>
      <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
        <EmployeeAvatar name={employee.user.name} size="lg" />
        <div className="min-w-0 max-w-full">
          <p className="truncate font-medium">{employee.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{employee.designation?.name ?? "No designation"}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {employee.userId} · {employee.department?.name ?? "No department"}
        </p>
        <StatusBadge label={LIFECYCLE_LABELS[employee.lifecycleStatus]} tone={employeeStatusTone(employee.lifecycleStatus)} />
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(!next || next === ALL ? undefined : String(next))}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder={placeholder}>
          {(selected: string) => (selected === ALL ? placeholder : options.find((o) => o.value === selected)?.label ?? placeholder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ListEmployeesFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"list" | "grid">("list");
  const { data, isLoading } = useEmployees(filters);
  const { data: departments = [] } = useHrDepartments(true);
  const canOnboard = useMyPermissions().has(HR_PERMISSIONS.EMPLOYEE_MANAGE);
  const { data: designations = [] } = useDesignations();

  const update = (patch: Partial<ListEmployeesFilters>) => setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  const open = (employee: Employee) => router.push(`/hr/employees/${employee.userId}`);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Everyone you can see in the organization, with their role, team and status."
        actions={
          canOnboard ? (
            <Button size="sm" render={<Link href="/hr/employees/new" />}>
              <UserPlus className="size-4" /> Onboard employee
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          placeholder="Search name, email, employee ID or phone…"
          defaultValue={filters.search}
          onChange={(event) => update({ search: event.target.value || undefined })}
          className="w-full max-w-sm rounded-xl border border-border bg-card px-4 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/50"
        />
        <FilterSelect
          value={filters.departmentId}
          onChange={(departmentId) => update({ departmentId })}
          placeholder="All departments"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
        <FilterSelect
          value={filters.designationId}
          onChange={(designationId) => update({ designationId })}
          placeholder="All designations"
          options={designations.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))}
        />
        <FilterSelect
          value={filters.lifecycleStatus}
          onChange={(value) => update({ lifecycleStatus: value as EmployeeLifecycleStatus | undefined })}
          placeholder="Active statuses"
          options={Object.entries(LIFECYCLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          value={filters.employmentType}
          onChange={(value) => update({ employmentType: value as EmploymentType | undefined })}
          placeholder="All types"
          options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={(value) => {
            const [sortBy, sortOrder] = (value ?? "name:asc").split(":") as [ListEmployeesFilters["sortBy"], ListEmployeesFilters["sortOrder"]];
            update({ sortBy, sortOrder });
          }}
          placeholder="Sort: Name A–Z"
          options={[
            { value: "name:asc", label: "Sort: Name A–Z" },
            { value: "joiningDate:desc", label: "Sort: Newest joiners" },
            { value: "joiningDate:asc", label: "Sort: Longest serving" },
          ]}
        />
        <div className="ml-auto flex rounded-lg border border-border p-0.5">
          {(["list", "grid"] as const).map((mode) => (
            <Button
              key={mode}
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={mode === "list" ? "List view" : "Grid view"}
              aria-pressed={view === mode}
              className={cn(view === mode && "bg-muted")}
              onClick={() => setView(mode)}
            >
              {mode === "list" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
            </Button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} emptyMessage="No employees match these filters." onRowClick={open} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No employees match these filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.items.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} onClick={() => open(employee)} />
          ))}
        </div>
      )}

      <PaginationBar
        page={data?.page ?? filters.page ?? 1}
        pageSize={data?.pageSize ?? filters.pageSize ?? 25}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setFilters((prev) => ({ ...prev, pageSize, page: 1 }))}
      />
    </div>
  );
}
