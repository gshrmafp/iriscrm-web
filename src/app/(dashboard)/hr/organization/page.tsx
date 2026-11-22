"use client";

import Link from "next/link";
import { Network } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HR_PERMISSIONS, useMyPermissions } from "@/features/auth/use-my-permissions";
import { DepartmentsTab } from "@/features/hrms/organization/components/departments-tab";
import { DesignationsTab } from "@/features/hrms/organization/components/designations-tab";
import { TemplatesTab } from "@/features/hrms/organization/components/templates-tab";

export default function OrganizationPage() {
  const { has, isLoading } = useMyPermissions();

  if (!isLoading && !has(HR_PERMISSIONS.ORG_MANAGE)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Organization" />
        <p className="text-sm text-muted-foreground">Only HR can manage the organization structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Organization"
        description="Departments, designations and onboarding checklists."
        actions={
          <Button variant="outline" size="sm" render={<Link href="/hr/organization/chart" />}>
            <Network className="size-4" /> Org chart
          </Button>
        }
      />
      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="designations">Designations</TabsTrigger>
          {has(HR_PERMISSIONS.SETTINGS_MANAGE) ? <TabsTrigger value="templates">Onboarding templates</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="designations" className="mt-4">
          <DesignationsTab />
        </TabsContent>
        {has(HR_PERMISSIONS.SETTINGS_MANAGE) ? (
          <TabsContent value="templates" className="mt-4">
            <TemplatesTab />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
