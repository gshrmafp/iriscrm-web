"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { StatusBadge, leadStatusTone } from "@/components/status-badge";
import { LeadFormDialog } from "@/features/leads/components/lead-form-dialog";
import { useLeads } from "@/features/leads/hooks";
import { usePicklistLabelResolver } from "@/features/picklists/hooks";
import type { ListLeadsFilters } from "@/features/leads/api";
import type { Lead } from "@/types/entities";

function useColumns(): ColumnDef<Lead>[] {
  const resolveLabel = usePicklistLabelResolver();
  return [
    { accessorKey: "refNo", header: "Ref #" },
    { accessorKey: "contactName", header: "Contact" },
    { accessorKey: "companyName", header: "Company" },
    {
      accessorKey: "productInterest",
      header: "Product interest",
      cell: ({ row }) => resolveLabel("PRODUCT_INTEREST", row.original.productInterest),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => resolveLabel("LEAD_SOURCE", row.original.source),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={row.original.status}
          tone={leadStatusTone(row.original.status)}
        />
      ),
    },
  ];
}

const DEFAULT_FILTERS: ListLeadsFilters = { page: 1, pageSize: 25 };

export default function LeadsPage() {
  const [filters, setFilters] = useState<ListLeadsFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useLeads(filters);
  const router = useRouter();
  const columns = useColumns();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Capture and qualify inbound leads and enquiries."
        actions={<LeadFormDialog />}
      />
      <div className="mb-4 flex items-center gap-2">
        <input
          placeholder="Search by contact, company, phone or email…"
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
        emptyMessage="No leads yet — capture your first lead to get started."
        onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
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
