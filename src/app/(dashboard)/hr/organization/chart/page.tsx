"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, employeeStatusTone } from "@/components/status-badge";
import { useOrgChart, useHrDepartments } from "@/features/hrms/organization/hooks";
import { EmployeeAvatar } from "@/features/hrms/employees/components/employee-avatar";
import { NativeSelect } from "@/features/hrms/employees/components/profile-fields";
import { LIFECYCLE_LABELS } from "@/features/hrms/constants";
import { cn } from "@/lib/utils";
import type { OrgChartNode } from "@/types/entities";

type TreeNode = OrgChartNode & { children: TreeNode[]; teamSize: number };

// The API returns a flat, scoped list. Anyone whose manager isn't in the list
// (no manager, or a manager outside your view) becomes a root.
function buildTree(nodes: OrgChartNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>(nodes.map((n) => [n.userId, { ...n, children: [], teamSize: 0 }]));
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.reportingToId ? byId.get(node.reportingToId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  const size = (n: TreeNode, seen: Set<string>): number => {
    if (seen.has(n.userId)) return 0; // guards against bad data loops
    seen.add(n.userId);
    n.teamSize = n.children.reduce((sum, c) => sum + 1 + size(c, seen), 0);
    return n.teamSize;
  };
  const seen = new Set<string>();
  roots.forEach((r) => size(r, seen));
  // Big teams first, then alphabetical.
  const sort = (list: TreeNode[]) => {
    list.sort((a, b) => b.teamSize - a.teamSize || a.name.localeCompare(b.name));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

function matches(node: OrgChartNode, query: string) {
  const q = query.toLowerCase();
  return (
    node.name.toLowerCase().includes(q) ||
    node.userId.toLowerCase().includes(q) ||
    (node.designation?.name.toLowerCase().includes(q) ?? false)
  );
}

// Ids of every ancestor of a matching node, so search results are visible.
function ancestorsOfMatches(roots: TreeNode[], query: string): Set<string> {
  const open = new Set<string>();
  const walk = (node: TreeNode, path: string[]): boolean => {
    let hit = matches(node, query);
    for (const child of node.children) if (walk(child, [...path, node.userId])) hit = true;
    if (hit) path.forEach((id) => open.add(id));
    return hit || matches(node, query);
  };
  roots.forEach((r) => walk(r, []));
  return open;
}

function NodeRow({
  node,
  depth,
  expanded,
  toggle,
  query,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  query: string;
}) {
  const isOpen = expanded.has(node.userId);
  const highlighted = query.length > 1 && matches(node, query);
  return (
    <li>
      <div
        className={cn("flex items-center gap-2 rounded-lg py-1.5 pr-2 transition-colors hover:bg-muted/60", highlighted && "bg-primary/10")}
        style={{ paddingLeft: `${depth * 22 + 4}px` }}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => toggle(node.userId)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label={isOpen ? `Collapse ${node.name}'s team` : `Expand ${node.name}'s team`}
            aria-expanded={isOpen}
          >
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        <EmployeeAvatar name={node.name} size="sm" />
        <Link href={`/hr/employees/${node.userId}`} className="min-w-0 flex-1 hover:underline">
          <span className="block truncate text-sm font-medium">{node.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {[node.designation?.name, node.department?.name, node.region?.name].filter(Boolean).join(" · ") || node.userId}
          </span>
        </Link>
        {node.lifecycleStatus !== "CONFIRMED" ? (
          <span className="hidden sm:inline">
            <StatusBadge label={LIFECYCLE_LABELS[node.lifecycleStatus]} tone={employeeStatusTone(node.lifecycleStatus)} />
          </span>
        ) : null}
        {node.teamSize > 0 ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground" title="Everyone in their reporting line">
            {node.teamSize}
          </span>
        ) : null}
      </div>
      {isOpen && node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <NodeRow key={child.userId} node={child} depth={depth + 1} expanded={expanded} toggle={toggle} query={query} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function OrgChartPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [query, setQuery] = useState("");
  const { data: nodes = [], isLoading } = useOrgChart(departmentId ? { departmentId } : {});
  const { data: departments = [] } = useHrDepartments();
  const roots = useMemo(() => buildTree(nodes), [nodes]);

  // null = default view (roots open); otherwise the user's explicit choice.
  const [manual, setManual] = useState<Set<string> | null>(null);
  const defaultOpen = useMemo(() => new Set(roots.map((r) => r.userId)), [roots]);
  const searchOpen = useMemo(() => (query.length > 1 ? ancestorsOfMatches(roots, query) : null), [roots, query]);
  const expanded = searchOpen ? new Set([...(manual ?? defaultOpen), ...searchOpen]) : (manual ?? defaultOpen);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setManual(next);
  };
  const expandAll = () => setManual(new Set(nodes.map((n) => n.userId)));
  const collapseAll = () => setManual(new Set());

  return (
    <div className="space-y-4">
      <PageHeader title="Org chart" description="Reporting lines across the people you can see. Numbers show everyone in a person's reporting line." />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a person or designation…" className="pl-8" />
        </div>
        <div className="w-52">
          <NativeSelect
            value={departmentId}
            onChange={setDepartmentId}
            placeholder="All departments"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
        <Button variant="outline" size="sm" onClick={expandAll}>
          <ChevronsUpDown className="size-3.5" /> Expand all
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          <ChevronsDownUp className="size-3.5" /> Collapse
        </Button>
      </div>
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : roots.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No one to show for these filters.</p>
          ) : (
            <ul className="space-y-0.5">
              {roots.map((root) => (
                <NodeRow key={root.userId} node={root} depth={0} expanded={expanded} toggle={toggle} query={query} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
