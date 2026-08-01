"use client";

import Link from "next/link";
import { ChevronRight, Palette, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/features/auth/AuthProvider";
import { isRegionalAdminOrAbove } from "@/lib/permissions";

function SettingsLinkRow({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg p-3 -mx-3 transition-colors hover:bg-muted"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const showPermissions = isRegionalAdminOrAbove(user?.role);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and app preferences." />

      <div className="max-w-xl space-y-6">
        <Card>
          <CardContent className="space-y-1">
            <SettingsLinkRow
              href="/profile"
              icon={UserRound}
              title="Profile"
              description="View your name, email, role, and region."
            />
            {showPermissions ? (
              <SettingsLinkRow
                href="/admin/permissions"
                icon={ShieldCheck}
                title="Permissions"
                description="Manage role-based and per-user permission overrides."
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Appearance</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
              </div>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
