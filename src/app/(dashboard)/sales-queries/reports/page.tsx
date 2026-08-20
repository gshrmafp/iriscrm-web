"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DepartmentSelect } from "@/features/departments/components/department-select";
import { useUserDirectory } from "@/features/identity/hooks";
import { useRunReport } from "@/features/sales-queries/hooks";
import type { ReportQueryParams } from "@/features/sales-queries/api";
import { getApiErrorMessage } from "@/lib/api-client";

// Report rows are generic key/value records shaped by whichever report ran
// (see repository.ts#runReport) — these two helpers turn raw keys/values into
// something readable without each report needing its own column definitions.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function humanizeHeader(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return format(parsed, "PP p");
  }
  if (typeof value === "object") {
    // Defensive only — every report is expected to return flat rows now
    // (see repository.ts#runReport), so this should never actually render.
    return JSON.stringify(value);
  }
  return String(value);
}

const REPORT_TYPE_OPTIONS: { value: ReportQueryParams["reportType"]; label: string }[] = [
  { value: "sales_conversion", label: "Sales conversion" },
  { value: "pending_queries", label: "Pending queries" },
  { value: "follow_ups", label: "Follow-ups" },
  { value: "employee_performance", label: "Employee performance" },
  { value: "department_performance", label: "Department performance" },
  { value: "resolution_time", label: "Resolution time" },
  { value: "lost_opportunity", label: "Lost opportunity" },
  { value: "monthly_sales", label: "Monthly sales" },
];

export default function SalesQueryReportsPage() {
  const [reportType, setReportType] = useState<ReportQueryParams["reportType"]>("sales_conversion");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [departmentId, setDepartmentId] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const { data: users = [] } = useUserDirectory();
  const runReport = useRunReport();

  const columns = useMemo(() => (rows && rows.length > 0 ? Object.keys(rows[0]) : []), [rows]);

  function buildParams(format: "json" | "csv"): ReportQueryParams {
    return {
      reportType,
      fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
      toDate: toDate ? new Date(toDate).toISOString() : undefined,
      departmentId,
      userId,
      format,
    };
  }

  async function onRun() {
    try {
      const result = await runReport.mutateAsync(buildParams("json"));
      setRows(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onExportCsv() {
    try {
      const result = await runReport.mutateAsync(buildParams("csv"));
      const blob = result as Blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Query Reports"
        description="Run a report over the sales queries you have access to, and export it as CSV."
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Report</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportQueryParams["reportType"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <DepartmentSelect value={departmentId} onValueChange={setDepartmentId} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>User</Label>
            <Select
              value={userId ?? "__any__"}
              onValueChange={(value) => setUserId(value === "__any__" || !value ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">Any user</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button onClick={onRun} disabled={runReport.isPending}>
              {runReport.isPending ? "Running…" : "Run report"}
            </Button>
            <Button variant="outline" onClick={onExportCsv} disabled={runReport.isPending}>
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {rows ? (
        <Card>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rows for this report/filter combination.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {humanizeHeader(col)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((col) => (
                          <TableCell key={col} className="whitespace-nowrap">
                            {formatCellValue(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
