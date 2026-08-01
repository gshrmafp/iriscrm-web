"use client";

import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { StatusBadge, quotationStatusTone } from "@/components/status-badge";
import { LineItemsTable } from "@/features/quotations/components/line-items-table";
import { QuotationBuilderDialog } from "@/features/quotations/components/quotation-builder-dialog";
import {
  useApproveQuotation,
  useRejectQuotation,
  useSendQuotation,
  useSubmitQuotation,
} from "@/features/quotations/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { canApproveQuotation } from "@/lib/permissions";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Quotation } from "@/types/entities";

function QuotationActions({
  quotation,
  opportunityId,
}: {
  quotation: Quotation;
  opportunityId: string;
}) {
  const { user } = useAuth();
  const submit = useSubmitQuotation(opportunityId);
  const approve = useApproveQuotation(opportunityId);
  const reject = useRejectQuotation(opportunityId);
  const send = useSendQuotation(opportunityId);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {quotation.status === "DRAFT" ? (
        <>
          <Button
            size="sm"
            disabled={submit.isPending}
            onClick={() =>
              run(() => submit.mutateAsync(quotation.id), "Submitted for issue")
            }
          >
            Submit
          </Button>
          <QuotationBuilderDialog
            opportunityId={opportunityId}
            revising={{ id: quotation.id }}
          />
        </>
      ) : null}
      {quotation.status === "PENDING_APPROVAL" && canApproveQuotation(user?.role) ? (
        <>
          <Button
            size="sm"
            disabled={approve.isPending}
            onClick={() =>
              run(() => approve.mutateAsync(quotation.id), "Quotation approved")
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reject.isPending}
            onClick={() =>
              run(() => reject.mutateAsync(quotation.id), "Quotation rejected")
            }
          >
            Reject
          </Button>
        </>
      ) : null}
      {quotation.status === "APPROVED" ? (
        <Button
          size="sm"
          disabled={send.isPending}
          onClick={() => run(() => send.mutateAsync(quotation.id), "Marked as sent")}
        >
          Send to customer
        </Button>
      ) : null}
    </div>
  );
}

export function VersionHistory({
  quotations,
  opportunityId,
}: {
  quotations: Quotation[];
  opportunityId: string;
}) {
  if (!quotations.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No quotations yet for this opportunity.
      </p>
    );
  }

  const sorted = [...quotations].sort((a, b) => b.version - a.version);

  return (
    <Accordion defaultValue={sorted[0] ? [sorted[0].id] : []}>
      {sorted.map((quotation) => (
        <AccordionItem key={quotation.id} value={quotation.id}>
          <AccordionTrigger>
            <div className="flex flex-1 items-center justify-between pr-4">
              <span>
                v{quotation.version} · ₹
                {Number(quotation.grandTotal).toLocaleString("en-IN")}
              </span>
              <StatusBadge
                label={quotation.status}
                tone={quotationStatusTone(quotation.status)}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <LineItemsTable lines={quotation.lines} />
            <QuotationActions
              quotation={quotation}
              opportunityId={opportunityId}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
