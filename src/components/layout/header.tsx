"use client";

import { useAuth } from "@/features/auth/AuthProvider";
import { ROLES } from "@/lib/permissions";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 bg-background/80 z-10 sticky top-0 backdrop-blur-md">
      <div className="min-w-0 flex flex-col justify-center">
        <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
          Welcome back, {firstName}
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Here&apos;s what&apos;s happening with your pipeline today.
        </p>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 p-0.5">
          <ThemeToggle />
          <NotificationBell />
        </div>
        <div className="mx-1 h-7 w-px bg-border hidden md:block" />
        <div className="text-right leading-tight hidden md:block">
          <p className="text-sm font-medium text-foreground">{user?.name ?? user?.email}</p>
          <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">
            {user?.role ? ROLES[user.role]?.label : ""}
          </p>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
