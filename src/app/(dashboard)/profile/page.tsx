"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRegions } from "@/features/identity/hooks";
import { ROLES } from "@/lib/permissions";

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: regions = [] } = useRegions();
  const region = regions.find((r) => r.id === user?.regionId);

  return (
    <div>
      <PageHeader title="Profile" description="Your account information." />

      <Card className="max-w-xl">
        <CardHeader className="flex-row items-center gap-4">
          <Avatar size="lg" className="ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {initials(user?.name ?? user?.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{user?.name ?? "—"}</CardTitle>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{user?.role ? ROLES[user.role]?.label : "—"}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Region</span>
            <span className="font-medium">{region?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{user?.id ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
