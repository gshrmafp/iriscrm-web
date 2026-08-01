"use client";

import { useMemo } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDepartments } from "@/features/departments/hooks";

export function DepartmentSelect({
  value,
  onValueChange,
  regionId,
}: {
  value?: string;
  onValueChange: (departmentId: string) => void;
  /** Only departments scoped to this region (or global — regionId: null) are offered. */
  regionId?: string;
}) {
  const { data: departments = [], isLoading } = useDepartments();

  const options: ComboboxOption[] = useMemo(
    () =>
      departments
        .filter((department) => !regionId || !department.regionId || department.regionId === regionId)
        .map((department) => ({ value: department.id, label: department.name })),
    [departments, regionId],
  );

  return (
    <Combobox
      items={options}
      value={value ?? null}
      onValueChange={(next) => next && onValueChange(next)}
      placeholder={isLoading ? "Loading…" : "Search a department…"}
      emptyMessage="No departments found."
    />
  );
}
