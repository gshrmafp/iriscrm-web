"use client";

import { use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Switch } from "@/components/ui/switch";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useRegions,
  useUpdateUser,
  useUpdateUserStatus,
  useUser,
  useUserDirectory,
} from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { ROLES } from "@/lib/permissions";
import type { Role } from "@/types/entities";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const ROLE_OPTIONS = Object.keys(ROLES) as Role[];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.custom<Role>((val) => ROLE_OPTIONS.includes(val as Role)),
  regionId: z.string().min(1, "Region is required"),
  reportingToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { data: user, isLoading } = useUser(id);
  const { data: regions = [] } = useRegions();
  const { data: directory = [] } = useUserDirectory();
  const updateUser = useUpdateUser(id);
  const updateStatus = useUpdateUserStatus();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Populate the form once the user loads (and again if a different user id
  // is navigated to) — can't use defaultValues since the data arrives async.
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        regionId: user.regionId,
        reportingToId: user.reportingToId ?? undefined,
      });
    }
  }, [user, reset]);

  const regionOptions: ComboboxOption[] = useMemo(
    () => regions.map((region) => ({ value: region.id, label: region.name, description: region.code })),
    [regions],
  );
  const managerOptions: ComboboxOption[] = useMemo(
    () =>
      directory
        .filter((u) => u.id !== id)
        .map((u) => ({ value: u.id, label: u.name, description: u.email })),
    [directory, id],
  );

  async function onSubmit(values: FormValues) {
    try {
      await updateUser.mutateAsync({
        ...values,
        reportingToId: values.reportingToId || null,
      });
      toast.success("User updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onToggleStatus(next: boolean) {
    if (!user) return;
    try {
      await updateStatus.mutateAsync({ id: user.id, status: next ? "ACTIVE" : "INACTIVE" });
      toast.success(next ? "User activated" : "User deactivated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading || !user) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const isSelf = user.id === currentUser?.id;
  const isActive = user.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Button variant="outline" onClick={() => router.push(`/admin/permissions?userId=${user.id}`)}>
            <ShieldCheck className="size-4" />
            Manage permissions
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Avatar size="lg">
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <StatusBadge label={ROLES[user.role]?.label ?? user.role} tone="info" />
            <div className="flex items-center gap-2.5 pt-2">
              <Switch
                checked={isActive}
                onCheckedChange={onToggleStatus}
                disabled={updateStatus.isPending || isSelf}
              />
              <StatusBadge label={isActive ? "Active" : "Inactive"} tone={isActive ? "success" : "neutral"} />
            </div>
            {isSelf ? (
              <p className="text-xs text-muted-foreground">You cannot change your own account status.</p>
            ) : null}
            {user.createdAt ? (
              <p className="text-xs text-muted-foreground">
                Created {new Date(user.createdAt).toLocaleDateString()}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={watch("role") ?? user.role}
                  onValueChange={(value) => setValue("role", value as Role, { shouldDirty: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLES[role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Combobox
                  items={regionOptions}
                  value={watch("regionId") || null}
                  onValueChange={(value) => setValue("regionId", value ?? "", { shouldValidate: true, shouldDirty: true })}
                  placeholder="Search a region…"
                  emptyMessage="No regions found."
                />
                {errors.regionId ? (
                  <p className="text-sm text-destructive">{errors.regionId.message}</p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Reports to (optional)</Label>
                <Combobox
                  items={managerOptions}
                  value={watch("reportingToId") || null}
                  onValueChange={(value) => setValue("reportingToId", value ?? undefined, { shouldDirty: true })}
                  placeholder="Search by name or email…"
                  emptyMessage="No employees found."
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={updateUser.isPending || !isDirty}>
                  {updateUser.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
