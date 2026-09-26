"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { StatusBadge, leadStatusTone, opportunityStageTone } from "@/components/status-badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeads, useLeadStatusSummary } from "@/features/leads/hooks";
import { useUserDirectory } from "@/features/identity/hooks";
import { useAuth } from "@/features/auth/AuthProvider";
import type { ListLeadsFilters } from "@/features/leads/api";
import type { Lead, LeadStageFilter, LeadStatus } from "@/types/entities";

// Folds Opportunity.stage's FOLLOWUP sub-step into "Quotation" (Meeting is
// now its own distinct stage), same as the Lead Journey accordion on the
// Lead Detail page (QUOTATION_STAGE_ALIASES).
const QUOTATION_STAGE_ALIASES = ["QUOTATION", "FOLLOWUP"];

function deriveLeadStage(lead: Lead): { label: string; tone: Parameters<typeof StatusBadge>[0]["tone"] } {
  const oppStage = lead.opportunity?.stage;
  if (lead.status === "LOST" || oppStage === "LOST") return { label: "Lost", tone: "danger" };
  if (oppStage === "PURCHASE_ORDER") return { label: "PO (Purchase Order)", tone: opportunityStageTone("PURCHASE_ORDER") };
  if (oppStage === "MEETING") return { label: "Meeting", tone: opportunityStageTone("MEETING") };
  if (oppStage && QUOTATION_STAGE_ALIASES.includes(oppStage)) {
    return { label: "Quotation", tone: opportunityStageTone("QUOTATION") };
  }
  if (lead.status === "QUALIFIED") return { label: "Qualified", tone: leadStatusTone("QUALIFIED") };
  if ((lead.currentStep ?? 1) >= 2) return { label: "Contacted", tone: leadStatusTone("NEW") };
  return { label: "New Visit / Lead", tone: leadStatusTone("NEW") };
}

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

const STAGE_OPTIONS: { value: LeadStageFilter; label: string }[] = [
  { value: "NEW_LEAD", label: "New Visit / Lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "QUOTATION", label: "Quotation" },
  { value: "MEETING", label: "Meeting" },
  { value: "PURCHASE_ORDER", label: "PO (Purchase Order)" },
  { value: "LOST", label: "Lost" },
];

const STAGE_FILTER_VALUES = new Set(STAGE_OPTIONS.map((o) => o.value));

function isLeadStageFilter(value: string | null): value is LeadStageFilter {
  return !!value && STAGE_FILTER_VALUES.has(value as LeadStageFilter);
}

function useColumns(nameFor: (id: string) => string): ColumnDef<Lead>[] {
  return [
    { accessorKey: "refNo", header: "Ref #" },
    {
      accessorKey: "contactName",
      header: "Contact",
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          {row.original.contactName || <span className="italic text-muted-foreground">Pending</span>}
          {(row.original.currentStep ?? 3) < 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
              Draft
            </Badge>
          )}
        </span>
      ),
    },
    { accessorKey: "companyName", header: "Company" },
    {
      accessorKey: "visitLocation",
      header: "Visit location",
      cell: ({ row }) => row.original.visitLocation || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const stage = deriveLeadStage(row.original);
        return <StatusBadge label={stage.label} tone={stage.tone} />;
      },
    },
    {
      accessorKey: "createdBy",
      header: "Created by",
      cell: ({ row }) => nameFor(row.original.createdBy),
    },
  ];
}

const DEFAULT_FILTERS: ListLeadsFilters = { page: 1, pageSize: 25 };

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ListLeadsFilters>(() => {
    const stageParam = searchParams.get("stage");
    const ownerIdParam = searchParams.get("ownerId");
    return {
      ...DEFAULT_FILTERS,
      ...(isLeadStageFilter(stageParam) ? { stage: stageParam } : {}),
      ...(ownerIdParam ? { ownerId: ownerIdParam } : {}),
    };
  });
  const { data, isLoading } = useLeads(filters);
  const router = useRouter();
  const { user } = useAuth();
  const { data: users = [] } = useUserDirectory();
  const canFilterByOwner = !!user && CAN_FILTER_BY_OWNER.includes(user.role);
  const { data: statusSummary = [] } = useLeadStatusSummary(filters.ownerId);

  const userOptions: ComboboxOption[] = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [users],
  );
  const selectedOwnerName = users.find((u) => u.id === filters.ownerId)?.name;
  const nameFor = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name] as const));
    return (id: string) => map.get(id) ?? id;
  }, [users]);
  const columns = useColumns(nameFor);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Capture and qualify inbound leads and enquiries."
        actions={
          <Button size="sm" onClick={() => router.push("/leads/new")}>
            <Plus className="size-4" />
            New Lead
          </Button>
        }
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
          value={filters.stage ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              stage: (event.target.value || undefined) as LeadStageFilter | undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="">All statuses</option>
          {STAGE_OPTIONS.map((option) => (
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
