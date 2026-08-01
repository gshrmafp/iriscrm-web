"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PriceRuleForm } from "@/features/catalog/components/price-rule-form";

export default function PriceRulesPage() {
  return (
    <div>
      <PageHeader
        title="Price rules"
        description="Region overrides, volume slabs, customer-tier and promotional pricing on top of the base catalog price."
      />
      <PriceRuleForm />
    </div>
  );
}
