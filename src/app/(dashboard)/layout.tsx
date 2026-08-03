"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSectionTitle } from "@/lib/page-titles";
import { ROLES } from "@/lib/permissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Tab title reflects the section currently open plus the signed-in user's
  // role, e.g. "Leads · Sales Manager — IRIS CRM" — so switching between
  // tabs/roles is distinguishable at a glance instead of every tab reading
  // the same static "IRIS CRM — Sales" from the root layout's metadata.
  //
  // On a hard/full navigation, Next re-applies that static metadata title
  // to the DOM shortly after hydration, silently overwriting a plain
  // `document.title = ...` assignment here. A MutationObserver keeps our
  // computed title authoritative no matter when Next re-syncs it.
  useEffect(() => {
    const section = getSectionTitle(pathname);
    const roleLabel = user?.role ? ROLES[user.role]?.label : undefined;
    const desired = roleLabel ? `${section} · ${roleLabel} — IRIS CRM` : `${section} — IRIS CRM`;

    document.title = desired;

    // Observe the whole <head>, not just the current <title> node: Next
    // replaces the title element wholesale (not just its text) when it
    // re-syncs, which would orphan an observer attached to the old node.
    const observer = new MutationObserver(() => {
      if (document.title !== desired) document.title = desired;
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname, user?.role]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
