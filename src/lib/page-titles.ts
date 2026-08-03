// Maps a pathname to a human-readable section label for the browser tab
// title. Ordered most-specific first — checked as a prefix match, so a
// nested route (e.g. "/catalog/price-rules") must appear before its parent
// ("/catalog") or the parent would always win.
const ROUTE_TITLES: { prefix: string; label: string }[] = [
  { prefix: "/admin/users/", label: "User Permissions" }, // /admin/users/:id/permissions
  { prefix: "/admin/regions", label: "Regions" },
  { prefix: "/admin/users", label: "Users" },
  { prefix: "/admin/permissions", label: "Permissions" },
  { prefix: "/admin/picklists", label: "Picklists" },
  { prefix: "/catalog/price-rules", label: "Price Rules" },
  { prefix: "/catalog", label: "Catalog" },
  { prefix: "/leads/", label: "Lead Details" },
  { prefix: "/leads", label: "Leads" },
  { prefix: "/opportunities/", label: "Opportunity Details" },
  { prefix: "/opportunities", label: "Opportunities" },
  { prefix: "/sales-queries/", label: "Sales Query Details" },
  { prefix: "/sales-queries", label: "Sales Queries" },
  { prefix: "/dashboard", label: "Dashboard" },
  { prefix: "/profile", label: "Profile" },
  { prefix: "/settings", label: "Settings" },
];

export function getSectionTitle(pathname: string): string {
  const match = ROUTE_TITLES.find((route) => pathname.startsWith(route.prefix));
  return match?.label ?? "Dashboard";
}
