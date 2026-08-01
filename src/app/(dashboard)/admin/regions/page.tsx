"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { RegionFormDialog } from "@/features/identity/components/region-form-dialog";
import { useRegions, useUpdateRegion } from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Region } from "@/types/entities";

function RegionStatusToggle({ region }: { region: Region }) {
  const updateRegion = useUpdateRegion();

  async function onToggle(active: boolean) {
    try {
      await updateRegion.mutateAsync({ id: region.id, active });
      toast.success(active ? `${region.name} activated` : `${region.name} deactivated`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={region.active}
        onCheckedChange={onToggle}
        disabled={updateRegion.isPending}
      />
      <StatusBadge label={region.active ? "Active" : "Inactive"} tone={region.active ? "success" : "neutral"} />
    </div>
  );
}

const columns: ColumnDef<Region>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => <RegionStatusToggle region={row.original} />,
  },
];

export default function RegionsPage() {
  const { data, isLoading } = useRegions();

  return (
    <div>
      <PageHeader
        title="Regions"
        description="Geographic business units, each with its own Admin and RBAC scope."
        actions={<RegionFormDialog />}
      />
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        emptyMessage="No regions yet."
      />
    </div>
  );
}
