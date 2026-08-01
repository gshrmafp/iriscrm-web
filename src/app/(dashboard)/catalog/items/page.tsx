"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { StatusBadge } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/AuthProvider";
import { canEditCatalog } from "@/lib/permissions";
import { useCatalogItems, useUpdateCatalogItem } from "@/features/catalog/hooks";
import type { ListCatalogItemsFilters } from "@/features/catalog/api";
import { CatalogItemFormSheet } from "@/features/catalog/components/catalog-item-form-sheet";
import { getApiErrorMessage } from "@/lib/api-client";
import type { CatalogItem } from "@/types/entities";

function CatalogItemStatusToggle({ item, canEdit }: { item: CatalogItem; canEdit: boolean }) {
  const updateItem = useUpdateCatalogItem(item.id);

  async function onToggle(active: boolean) {
    try {
      await updateItem.mutateAsync({ active });
      toast.success(active ? `${item.name} activated` : `${item.name} deactivated`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      {canEdit ? (
        <Switch checked={item.active} onCheckedChange={onToggle} disabled={updateItem.isPending} />
      ) : null}
      <StatusBadge label={item.active ? "Active" : "Inactive"} tone={item.active ? "success" : "neutral"} />
    </div>
  );
}

const DEFAULT_FILTERS: ListCatalogItemsFilters = { page: 1, pageSize: 25 };

export default function CatalogItemsPage() {
  const [filters, setFilters] = useState<ListCatalogItemsFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useCatalogItems(filters);
  const { user } = useAuth();
  const canEdit = canEditCatalog(user?.role);

  const columns: ColumnDef<CatalogItem>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "unit", header: "Unit" },
    {
      accessorKey: "basePrice",
      header: "Base price",
      cell: ({ row }) => `₹${Number(row.original.basePrice).toLocaleString("en-IN")}`,
    },
    { accessorKey: "taxClass", header: "Tax class" },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => <CatalogItemStatusToggle item={row.original} canEdit={canEdit} />,
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: CatalogItem } }) => (
              <CatalogItemFormSheet item={row.original} />
            ),
          } satisfies ColumnDef<CatalogItem>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Master product/service catalog used by quotations and project BOMs."
        actions={
          <>
            <Button variant="outline" render={<Link href="/catalog/price-rules" />}>
              Price rules
            </Button>
            {canEdit ? <CatalogItemFormSheet /> : null}
          </>
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <input
          placeholder="Search by code or name…"
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
        emptyMessage="No catalog items yet."
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
