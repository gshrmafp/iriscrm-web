"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Clock,
  CheckSquare,
  Box,
  MessageCircleQuestion,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";
import { isRegionalAdminOrAbove } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";

const MODULES = [
  { id: "sales", label: "Sales Module", icon: Briefcase },
  { id: "attendance", label: "Attendance", icon: Clock },
  { id: "material", label: "Material Mgmt", icon: Box },
  { id: "task", label: "Task Mgmt", icon: CheckSquare },
];

const SALES_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/sales-queries", label: "Sales Queries", icon: MessageCircleQuestion },
  { href: "/sales-queries/dashboard", label: "Query Dashboard", icon: BarChart3 },
  { href: "/sales-queries/reports", label: "Query Reports", icon: FileText },
  { href: "/catalog/items", label: "Catalog", icon: Package },
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

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const showAdmin = isRegionalAdminOrAbove(user?.role);

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
        <SidebarSection title="Sales Pipeline" items={SALES_NAV} pathname={pathname} />
        {showAdmin && (
          <SidebarSection title="Administration" items={ADMIN_NAV} pathname={pathname} />
        )}
      </nav>
    </aside>
  );
}
