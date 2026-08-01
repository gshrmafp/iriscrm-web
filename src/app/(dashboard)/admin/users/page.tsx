"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { StatusBadge } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/AuthProvider";
import { UserFormSheet } from "@/features/identity/components/user-form-sheet";
import { useUsers, useUpdateUserStatus, useRegions } from "@/features/identity/hooks";
import type { ListUsersFilters } from "@/features/identity/api";
import { getApiErrorMessage } from "@/lib/api-client";
import { ROLES } from "@/lib/permissions";
import type { Region, User } from "@/types/entities";

function UserStatusToggle({ user }: { user: User }) {
  const { user: currentUser } = useAuth();
  const updateStatus = useUpdateUserStatus();
  const isActive = user.status === "ACTIVE";
  const isSelf = user.id === currentUser?.id;

  async function onToggle(next: boolean) {
    try {
      await updateStatus.mutateAsync({ id: user.id, status: next ? "ACTIVE" : "INACTIVE" });
      toast.success(next ? `${user.name} activated` : `${user.name} deactivated`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        disabled={updateStatus.isPending || isSelf}
        title={isSelf ? "You cannot change your own account status" : undefined}
      />
      <StatusBadge label={isActive ? "Active" : "Inactive"} tone={isActive ? "success" : "neutral"} />
    </div>
  );
}

function useColumns(regionMap: Map<string, Region>): ColumnDef<User>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <StatusBadge label={ROLES[row.original.role]?.label ?? row.original.role} tone="info" />
      ),
    },
    {
      accessorKey: "regionId",
      header: "Region",
      cell: ({ row }) => {
        const region = regionMap.get(row.original.regionId);
        if (!region) return <span className="text-muted-foreground">—</span>;
        return (
          <span>
            {region.name} <span className="text-muted-foreground">({region.code})</span>
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <UserStatusToggle user={row.original} />,
    },
  ];
}

const DEFAULT_FILTERS: ListUsersFilters = { page: 1, pageSize: 25 };

export default function UsersPage() {
  const [filters, setFilters] = useState<ListUsersFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useUsers(filters);
  const { data: regions = [] } = useRegions();
  const regionMap = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const columns = useColumns(regionMap);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage platform users, roles and per-user permission overrides."
        actions={<UserFormSheet />}
      />
      <div className="mb-4 flex items-center gap-2">
        <input
          placeholder="Search by name or email…"
          defaultValue={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value || undefined, page: 1 }))
          }
          className="w-full max-w-sm rounded-xl border border-border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No users yet."
        onRowClick={(user) => router.push(`/admin/users/${user.id}/permissions`)}
      />
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
