"use client";

import { use } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreatePermissionOverride,
  useDeletePermissionOverride,
  useEffectivePermissions,
} from "@/features/identity/hooks";
import { PermissionOverrideForm } from "@/features/identity/components/permission-override-form";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const PERMISSION_MAPPINGS: Record<string, string> = {
  "sales.catalog.view": "View Sales Catalog",
  "sales.lead.view": "View Lead Info",
  "sales.lead.create": "Create New Lead",
  "sales.opportunity.view": "View Opportunities",
  "sales.opportunity.create": "Create Opportunity",
  "sales.opportunity.win": "Win Opportunity",
  "sales.quotation.view": "View Quotations",
  "sales.quotation.create": "Create Quotation",
  "sales.amc.view": "AMC Access View",
  "sales.project.view": "Project Timeline",
};

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useEffectivePermissions(id);
  const createOverride = useCreatePermissionOverride(id);
  const deleteOverride = useDeletePermissionOverride(id);

  async function onRemove(permissionKey: string) {
    try {
      await deleteOverride.mutateAsync(permissionKey);
      toast.success("Override removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onToggle(permissionKey: string, currentGranted: boolean) {
    if (!data) return;
    
    const wantGranted = !currentGranted;
    const isDefaultGranted = data.roleDefaults?.includes(permissionKey) ?? false;

    try {
      if (wantGranted) {
        if (isDefaultGranted) {
          // Inherently granted, so a DENY override must exist. Remove it.
          await deleteOverride.mutateAsync(permissionKey);
        } else {
          // Not inherently granted, add a GRANT override.
          await createOverride.mutateAsync({
            permissionKey,
            effect: "GRANT",
            reason: "Quick toggle",
          });
        }
      } else {
        if (isDefaultGranted) {
          // Inherently granted, add a DENY override.
          await createOverride.mutateAsync({
            permissionKey,
            effect: "DENY",
            reason: "Quick toggle",
          });
        } else {
          // Not inherently granted, so a GRANT override must exist. Remove it.
          await deleteOverride.mutateAsync(permissionKey);
        }
      }
      toast.success(`Permission ${wantGranted ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        title="Effective permissions"
        description="Role defaults plus any feature-level overrides for this user."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-border col-span-1">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase">
              Effective permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(PERMISSION_MAPPINGS).map(([key, label]) => {
                  const isGranted = data?.effectivePermissions?.includes(key) || false;
                  return (
                    <div key={key} className="flex items-center justify-between group">
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <button
                        onClick={() => onToggle(key, isGranted)}
                        disabled={createOverride.isPending || deleteOverride.isPending}
                        className={cn(
                          "relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
                          isGranted
                            ? "bg-primary border border-primary/20"
                            : "bg-muted border border-border",
                          (createOverride.isPending || deleteOverride.isPending) && "opacity-50 cursor-not-allowed"
                        )}
                        aria-checked={isGranted}
                        role="switch"
                      >
                        <motion.div
                          layout
                          className={cn(
                            "flex size-4 items-center justify-center rounded-full shadow-sm transition-colors",
                            isGranted ? "bg-background" : "bg-background/60"
                          )}
                          initial={false}
                          animate={{
                            x: isGranted ? 24 : 4,
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-border col-span-1">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase">
              Active overrides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6">
            {(data?.overrides ?? []).length ? (
              data?.overrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{override.permissionKey}</p>
                    <p className="text-xs text-muted-foreground">
                      {override.effect}
                      {override.reason ? ` — ${override.reason}` : ""}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(override.permissionKey)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No overrides — this user has role defaults only.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-2 border-border">
          <CardHeader>
            <CardTitle className="text-base">Add an override</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionOverrideForm userId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
