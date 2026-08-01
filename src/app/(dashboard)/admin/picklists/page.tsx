"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PicklistManager } from "@/features/picklists/components/picklist-manager";

export default function PicklistsPage() {
  return (
    <div>
      <PageHeader
        title="Picklists"
        description="Manage the Lead Source and Product Interest options available across the app."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <PicklistManager listType="LEAD_SOURCE" title="Lead Source" />
        <PicklistManager listType="PRODUCT_INTEREST" title="Product Interest" />
      </div>
    </div>
  );
}
