"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  Package,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Briefcase,
  BarChart3,
  UserRound,
  IdCard,
  Network,
  Building2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";
import { isRegionalAdminOrAbove } from "@/lib/permissions";
import { HR_PERMISSIONS, useMyPermissions } from "@/features/auth/use-my-permissions";
import { motion, AnimatePresence } from "framer-motion";

type ModuleId = "sales" | "hrms";

// Business modules. Each is shown only if the user holds its entry
// permission; which one is "current" is derived from the URL, so deep links
// and the back button always land in the right module.
const MODULES: { id: ModuleId; label: string; icon: typeof Briefcase; home: string; permission: string }[] = [
  { id: "sales", label: "Sales", icon: Briefcase, home: "/dashboard", permission: "sales.lead.view" },
  { id: "hrms", label: "HRMS", icon: IdCard, home: "/hr/employees", permission: HR_PERMISSIONS.EMPLOYEE_VIEW },
];

export function moduleForPath(pathname: string): ModuleId {
  return pathname === "/hr" || pathname.startsWith("/hr/") ? "hrms" : "sales";
}

const SALES_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/sales-queries/dashboard", label: "Query Dashboard", icon: BarChart3 },
  { href: "/catalog/items", label: "Catalog", icon: Package },
];

const HR_NAV: NavItem[] = [
  { href: "/hr/employees", label: "Employees", icon: Users },
  { href: "/hr/employees/new", label: "Onboard Employee", icon: UserPlus, permission: HR_PERMISSIONS.EMPLOYEE_MANAGE },
  { href: "/hr/organization/chart", label: "Org Chart", icon: Network },
  { href: "/hr/organization", label: "Organization", icon: Building2, permission: HR_PERMISSIONS.ORG_MANAGE },
  { href: "/hr/me", label: "My Profile", icon: UserRound },
];

const ADMIN_NAV = [
  { href: "/admin/regions", label: "Regions", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
  { href: "/admin/permissions", label: "Permissions", icon: ShieldCheck },
  { href: "/admin/picklists", label: "Picklists", icon: ShieldCheck },
];

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Permission key needed to see this item (the API enforces it regardless). */
  permission?: string;
}

// Sibling routes can share a path prefix (e.g. "/sales-queries" is a prefix of
// both "/sales-queries/dashboard" and a query detail page "/sales-queries/:id").
// A plain "does this href prefix-match the pathname" check would highlight
// every matching ancestor at once — only the single most specific (longest)
// matching href should count as the active item.
function findActiveHref(pathname: string, items: NavItem[]): string | undefined {
  let best: string | undefined;
  for (const item of items) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

function SidebarSection({
  title,
  items,
  pathname,
  defaultOpen = true,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const activeHref = findActiveHref(pathname, items);
  const containsActive = activeHref !== undefined;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md px-2 py-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-sidebar-foreground"
        aria-expanded={open}
      >
        <span>{title}</span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pb-2">
              {items.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <ChevronRight className="ml-auto size-3.5 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && containsActive ? (
        <div className="h-0.5 w-8 mx-2 rounded-full bg-sidebar-primary/60" />
      ) : null}
    </div>
  );
}

function ModuleSwitcher({ current }: { current: ModuleId }) {
  const router = useRouter();
  const { has, isLoading } = useMyPermissions();
  const available = MODULES.filter((module) => has(module.permission));
  // One module (or still loading) — nothing to switch between.
  if (isLoading || available.length < 2) return null;

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-sidebar-accent/60 p-1" role="tablist" aria-label="Module">
      {available.map((module) => {
        const active = module.id === current;
        const Icon = module.icon;
        return (
          <button
            key={module.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !active && router.push(module.home)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-sidebar text-sidebar-foreground shadow-sm"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {module.label}
          </button>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const showAdmin = isRegionalAdminOrAbove(user?.role);
  const currentModule = moduleForPath(pathname);
  const { has } = useMyPermissions();
  const hrNav = HR_NAV.filter((item) => !item.permission || has(item.permission));

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border md:flex relative z-10">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <FileText className="size-[18px]" />
        </div>
        <span className="font-semibold tracking-tight text-[15px] text-sidebar-foreground">
          IRIS CRM
        </span>
      </div>

      <nav className="flex-1 space-y-5 p-3 overflow-y-auto custom-scrollbar">
        <ModuleSwitcher current={currentModule} />
        {currentModule === "hrms" ? (
          <SidebarSection title="People" items={hrNav} pathname={pathname} />
        ) : (
          <SidebarSection title="Sales Pipeline" items={SALES_NAV} pathname={pathname} />
        )}
        {showAdmin && (
          <SidebarSection title="Administration" items={ADMIN_NAV} pathname={pathname} />
        )}
      </nav>
    </aside>
  );
}
