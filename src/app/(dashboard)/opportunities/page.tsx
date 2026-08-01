"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatusBadge,
  opportunityStageTone,
} from "@/components/status-badge";
import { PipelineBoard } from "@/features/opportunities/components/pipeline-board";
import { useOpportunities } from "@/features/opportunities/hooks";
import type { ListOpportunitiesFilters } from "@/features/opportunities/api";
import type { Opportunity } from "@/types/entities";

const columns: ColumnDef<Opportunity>[] = [
  { accessorKey: "dealType", header: "Deal type" },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => `₹${Number(row.original.value).toLocaleString("en-IN")}`,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => (
      <StatusBadge
        label={row.original.stage}
        tone={opportunityStageTone(row.original.stage)}
      />
    ),
  },
  {
    accessorKey: "expectedClose",
    header: "Expected close",
    cell: ({ row }) =>
      row.original.expectedClose
        ? new Date(row.original.expectedClose).toLocaleDateString()
        : "—",
  },
];

const DEFAULT_FILTERS: ListOpportunitiesFilters = { page: 1, pageSize: 25 };

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<ListOpportunitiesFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useOpportunities(filters);
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Pipeline of qualified deals moving toward Won or Lost."
      />
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <PipelineBoard opportunities={data?.items ?? []} />
        </TabsContent>
        <TabsContent value="list">
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage="No opportunities yet."
            onRowClick={(opportunity) =>
              router.push(`/opportunities/${opportunity.id}`)
            }
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
