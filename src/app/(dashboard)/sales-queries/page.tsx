"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, queryPriorityTone, salesQueryStatusTone } from "@/components/status-badge";
import { SalesQueryFormDialog } from "@/features/sales-queries/components/sales-query-form-dialog";
import { QueryKanbanBoard } from "@/features/sales-queries/components/query-kanban-board";
import { QueryFiltersBar } from "@/features/sales-queries/components/query-filters-bar";
import { useSalesQueries } from "@/features/sales-queries/hooks";
import { STATUS_LABELS } from "@/features/sales-queries/constants";
import type { ListSalesQueriesFilters } from "@/features/sales-queries/api";
import type { SalesQuery } from "@/types/entities";

const columns: ColumnDef<SalesQuery>[] = [
  { accessorKey: "refNo", header: "Ref #" },
  { accessorKey: "customerName", header: "Customer" },
  { accessorFn: (row) => row.department?.name ?? "—", header: "Department", id: "department" },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <StatusBadge label={row.original.priority} tone={queryPriorityTone(row.original.priority)} />
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={STATUS_LABELS[row.original.status]}
        tone={salesQueryStatusTone(row.original.status)}
      />
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
  },
];

const DEFAULT_FILTERS: ListSalesQueriesFilters = { page: 1, pageSize: 25 };

export default function SalesQueriesPage() {
  const [filters, setFilters] = useState<ListSalesQueriesFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useSalesQueries(filters);
  const router = useRouter();

  // Any change to filters other than page/pageSize itself should reset back to page 1.
  const handleFiltersChange = (next: ListSalesQueriesFilters) => {
    setFilters({ ...next, page: 1, pageSize: filters.pageSize });
  };

  return (
    <div>
      <PageHeader
        title="Sales Queries"
        description="Customer requirements captured from the field, tracked until resolved."
        actions={<SalesQueryFormDialog />}
      />
      <QueryFiltersBar filters={filters} onChange={handleFiltersChange} />
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <QueryKanbanBoard queries={data?.items ?? []} />
        </TabsContent>
        <TabsContent value="list">
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage="No sales queries yet — capture one from a customer visit to get started."
            onRowClick={(query) => router.push(`/sales-queries/${query.id}`)}
          />
          <PaginationBar
            page={data?.page ?? filters.page ?? 1}
            pageSize={data?.pageSize ?? filters.pageSize ?? 25}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 0}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setFilters((prev) => ({ ...prev, pageSize, page: 1 }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
