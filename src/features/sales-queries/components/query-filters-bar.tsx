"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDepartments } from "@/features/departments/hooks";
import { PRIORITY_OPTIONS, STATUS_LABELS, STATUS_ORDER } from "@/features/sales-queries/constants";
import type { ListSalesQueriesFilters } from "@/features/sales-queries/api";

export function QueryFiltersBar({
  filters,
  onChange,
}: {
  filters: ListSalesQueriesFilters;
  onChange: (filters: ListSalesQueriesFilters) => void;
}) {
  const { data: departments = [] } = useDepartments();
  const hasFilters = !!(filters.status || filters.priority || filters.departmentId);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Select
        value={filters.status}
        onValueChange={(value) => onChange({ ...filters, status: value as ListSalesQueriesFilters["status"] })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ORDER.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) => onChange({ ...filters, priority: value as ListSalesQueriesFilters["priority"] })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.departmentId}
        onValueChange={(value) => onChange({ ...filters, departmentId: value ?? undefined })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
