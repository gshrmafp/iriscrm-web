"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { StatusBadge, leadStatusTone } from "@/components/status-badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { LeadFormDialog } from "@/features/leads/components/lead-form-dialog";
import { useLeads, useLeadStatusSummary } from "@/features/leads/hooks";
import { usePicklistLabelResolver } from "@/features/picklists/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { useAuth } from "@/features/auth/AuthProvider";
import type { ListLeadsFilters } from "@/features/leads/api";
import type { Lead, LeadStatus } from "@/types/entities";

// Admins/managers can see every lead in their region already (server-enforced
// in leadService.list's scopeWhere) — this just controls whether the "view
// on behalf of a user" filter UI is shown at all. A Sales Executive is
// hard-restricted server-side to their own leads regardless of this filter.
const CAN_FILTER_BY_OWNER: string[] = ["SUPER_ADMIN", "REGIONAL_ADMIN", "SALES_MANAGER"];

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "LOST", label: "Lost" },
];

function useColumns(): ColumnDef<Lead>[] {
  const resolveLabel = usePicklistLabelResolver();
  return [
    { accessorKey: "refNo", header: "Ref #" },
    { accessorKey: "contactName", header: "Contact" },
    { accessorKey: "companyName", header: "Company" },
    {
      accessorKey: "productInterest",
      header: "Product interest",
      cell: ({ row }) =>
        row.original.productInterest === "OTHER" && row.original.productInterestOther
          ? row.original.productInterestOther
          : resolveLabel("PRODUCT_INTEREST", row.original.productInterest),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) =>
        row.original.source === "OTHER" && row.original.sourceOther
          ? row.original.sourceOther
          : resolveLabel("LEAD_SOURCE", row.original.source),
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
  const { user } = useAuth();
  const { data: users = [] } = useUserDirectory();
  const canFilterByOwner = !!user && CAN_FILTER_BY_OWNER.includes(user.role);
  const { data: statusSummary = [] } = useLeadStatusSummary(filters.ownerId);

  const userOptions: ComboboxOption[] = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [users],
  );
  const selectedOwnerName = users.find((u) => u.id === filters.ownerId)?.name;

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Capture and qualify inbound leads and enquiries."
        actions={<LeadFormDialog />}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          placeholder="Search by contact, company, phone or email…"
          defaultValue={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value || undefined, page: 1 }))
          }
          className="w-full max-w-sm rounded-xl border border-border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <select
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: (event.target.value || undefined) as LeadStatus | undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {canFilterByOwner ? (
          <div className="w-full max-w-xs">
            <Combobox
              items={userOptions}
              value={filters.ownerId ?? null}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, ownerId: value ?? undefined, page: 1 }))
              }
              placeholder="View leads by user…"
              emptyMessage="No users found."
            />
          </div>
        ) : null}
      </div>
      {canFilterByOwner && filters.ownerId ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {selectedOwnerName ?? "This user"}&apos;s leads —
          </span>
          {STATUS_OPTIONS.map((option) => {
            const count = statusSummary.find((s) => s.status === option.value)?.count ?? 0;
            return (
              <span key={option.value} className="flex items-center gap-1">
                <StatusBadge label={option.label} tone={leadStatusTone(option.value)} />
                <span className="font-medium text-foreground">{count}</span>
              </span>
            );
          })}
          <span className="ml-auto text-muted-foreground">
            Total: <span className="font-medium text-foreground">{data?.total ?? 0}</span>
          </span>
        </div>
      ) : null}
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
