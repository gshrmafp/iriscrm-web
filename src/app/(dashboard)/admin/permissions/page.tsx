"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, Shield, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  useCreatePermissionOverride,
  useDeletePermissionOverride,
  useEffectivePermissions,
  useUsers,
} from "@/features/identity/hooks";
import { PermissionOverrideForm } from "@/features/identity/components/permission-override-form";
import { PERMISSION_CATALOG } from "@/lib/permission-catalog";
import { ROLES } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function UserList({
  selectedUserId,
  onSelect,
}: {
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers({ search: search || undefined, pageSize: 50 });
  const users = data?.items ?? [];

  return (
    <Card className="md:col-span-1 h-fit">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select user
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="max-h-[32rem] space-y-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Loading…</p>
          ) : users.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No users found.</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onSelect(u.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  selectedUserId === u.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <div className="font-medium text-sm">{u.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ROLES[u.role]?.label ?? u.role}
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UserPermissionsPanel({ userId }: { userId: string }) {
  const { data, isLoading } = useEffectivePermissions(userId);
  const createOverride = useCreatePermissionOverride(userId);
  const deleteOverride = useDeletePermissionOverride(userId);
  const isMutating = createOverride.isPending || deleteOverride.isPending;

  const overrideByKey = useMemo(
    () => new Map((data?.overrides ?? []).map((o) => [o.permissionKey, o] as const)),
    [data?.overrides],
  );

  async function onToggle(permissionKey: string, currentlyGranted: boolean) {
    if (!data) return;
    const wantGranted = !currentlyGranted;
    const isDefaultGranted = data.roleDefaults?.includes(permissionKey) ?? false;

    try {
      if (wantGranted === isDefaultGranted) {
        // Toggling back to the role default — remove whatever override exists.
        if (overrideByKey.has(permissionKey)) {
          await deleteOverride.mutateAsync(permissionKey);
        }
      } else {
        await createOverride.mutateAsync({
          permissionKey,
          effect: wantGranted ? "GRANT" : "DENY",
          reason: "Toggled from Permissions Management",
        });
      }
      toast.success(wantGranted ? "Permission enabled" : "Permission disabled");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onRemoveOverride(permissionKey: string) {
    try {
      await deleteOverride.mutateAsync(permissionKey);
      toast.success("Override removed — reverted to role default");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading || !data) {
    return (
      <Card className="md:col-span-3">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading permissions…</p>
        </CardContent>
      </Card>
    );
  }

  const overrideCount = data.overrides?.length ?? 0;

  return (
    <div className="space-y-6 md:col-span-3">
      <Card>
        <CardHeader className="flex-row items-center gap-3 border-b border-border pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">User overrides</CardTitle>
            <p className="text-sm text-muted-foreground">
              Explicitly grant or deny permissions beyond the {ROLES[data.role]?.label ?? data.role} role
              default. Toggle on to make a feature visible/usable for this user, off to hide it.
            </p>
          </div>
          {overrideCount > 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {overrideCount} active override{overrideCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {PERMISSION_CATALOG.map((group) => (
            <div key={group.group} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.group}
              </h3>
              <div className="divide-y divide-border rounded-xl border border-border">
                {group.items.map((perm) => {
                  const isGranted = data.effectivePermissions?.includes(perm.key) ?? false;
                  const override = overrideByKey.get(perm.key);
                  return (
                    <div key={perm.key} className="flex items-center justify-between gap-4 p-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{perm.label}</span>
                          {override ? (
                            <StatusBadge
                              label={override.effect === "GRANT" ? "Granted" : "Denied"}
                              tone={override.effect === "GRANT" ? "success" : "danger"}
                            />
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                      <Switch
                        checked={isGranted}
                        onCheckedChange={() => onToggle(perm.key, isGranted)}
                        disabled={isMutating}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {overrideCount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active overrides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.overrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{override.permissionKey}</p>
                  <p className="text-xs text-muted-foreground">
                    {override.effect}
                    {override.reason ? ` — ${override.reason}` : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => onRemoveOverride(override.permissionKey)}>
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Free-form override entry — covers any permission key not (yet)
          listed in PERMISSION_CATALOG's toggle grid above, plus optional
          expiry. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add an override</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionOverrideForm userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PermissionsPage() {
  const searchParams = useSearchParams();
  // Lets the user-details page's "Manage permissions" link deep-link
  // straight to that user instead of landing on an empty picker.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    () => searchParams.get("userId"),
  );

  return (
    <div>
      <PageHeader
        title="Permissions Management"
        description="Select a user to grant or deny individual permissions beyond their role default."
      />
      <div className="grid gap-6 md:grid-cols-4">
        <UserList selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
        {selectedUserId ? (
          <UserPermissionsPanel key={selectedUserId} userId={selectedUserId} />
        ) : (
          <Card className="md:col-span-3">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Select a user to manage their permissions.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
