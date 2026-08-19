"use client";

import { useMemo, useState } from "react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PipelineBoard } from "@/features/opportunities/components/pipeline-board";
import { useOpportunities, useOpportunityPipelineSummary } from "@/features/opportunities/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { useAuth } from "@/features/auth/AuthProvider";
import type { ListOpportunitiesFilters } from "@/features/opportunities/api";
import type { Opportunity } from "@/types/entities";

// Same scoping as the Leads page: admins/managers already see the whole
// region's opportunities server-side — this only controls whether the
// "view on behalf of a user" filter is shown.
const CAN_FILTER_BY_OWNER: string[] = ["SUPER_ADMIN", "REGIONAL_ADMIN", "SALES_MANAGER"];

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

// The board isn't paginated in the UI — it needs (up to) the whole scope's
// open pipeline to show accurate columns, not just one page of the list view.
const BOARD_PAGE_SIZE = 200;

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<ListOpportunitiesFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useOpportunities(filters);
  const { data: boardData } = useOpportunities({ ownerId: filters.ownerId, pageSize: BOARD_PAGE_SIZE });
  const { data: summary } = useOpportunityPipelineSummary(filters.ownerId);
  const router = useRouter();
  const { user } = useAuth();
  const { data: users = [] } = useUserDirectory();
  const canFilterByOwner = !!user && CAN_FILTER_BY_OWNER.includes(user.role);
  const userOptions: ComboboxOption[] = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [users],
  );

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Pipeline of qualified deals moving toward Won or Lost."
      />
      {canFilterByOwner ? (
        <div className="mb-4 w-full max-w-xs">
          <Combobox
            items={userOptions}
            value={filters.ownerId ?? null}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, ownerId: value ?? undefined, page: 1 }))
            }
            placeholder="View opportunities by user…"
            emptyMessage="No users found."
          />
        </div>
      ) : null}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <PipelineBoard opportunities={boardData?.items ?? []} summary={summary} />
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
