"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCreateUser, useRegions, useUserDirectory } from "@/features/identity/hooks";
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
  password: z.string().min(8, "At least 8 characters"),
  role: z.custom<Role>((val) => ROLE_OPTIONS.includes(val as Role)),
  regionId: z.string().min(1, "Region is required"),
  reportingToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UserFormSheet() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();
  const { data: regions } = useRegions();
  const { data: users = [] } = useUserDirectory();

  // Creating a new user — there's no existing region value to preserve, so
  // deactivated regions are simply not offered.
  const regionOptions: ComboboxOption[] = useMemo(
    () =>
      (regions ?? [])
        .filter((region) => region.active)
        .map((region) => ({ value: region.id, label: region.name, description: region.code })),
    [regions],
  );

  const managerOptions: ComboboxOption[] = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name,
        description: u.email,
        icon: (
          <Avatar size="sm">
            <AvatarFallback>{initials(u.name)}</AvatarFallback>
          </Avatar>
        ),
      })),
    [users],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "SALES_EXECUTIVE" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createUser.mutateAsync({
        ...values,
        reportingToId: values.reportingToId || undefined,
      });
      toast.success("User created");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <Plus className="size-4" /> New user
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create user</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={watch("role")}
              onValueChange={(value) =>
                setValue("role", (value ?? "SALES_EXECUTIVE") as Role)
              }
            >
              <SelectTrigger>
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
              onValueChange={(value) => setValue("regionId", value ?? "", { shouldValidate: true })}
              placeholder="Search a region…"
              emptyMessage="No regions found."
            />
            {errors.regionId ? (
              <p className="text-sm text-destructive">
                {errors.regionId.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Reports to (optional)</Label>
            <Combobox
              items={managerOptions}
              value={watch("reportingToId") || null}
              onValueChange={(value) => setValue("reportingToId", value ?? undefined)}
              placeholder="Search by name or email…"
              emptyMessage="No employees found."
            />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Saving…" : "Create user"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
