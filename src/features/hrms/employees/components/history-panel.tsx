"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployeeHistory } from "@/features/hrms/employees/hooks";
import { HISTORY_EVENT_LABELS, LIFECYCLE_LABELS, formatHrDate } from "@/features/hrms/constants";
import type { EmployeeLifecycleEvent, EmployeeLifecycleStatus } from "@/types/entities";

function describe(event: EmployeeLifecycleEvent, label: string | null) {
  if (!label) return "None";
  if (event.eventType === "STATUS_CHANGE" || event.eventType === "JOINED") {
    return LIFECYCLE_LABELS[label as EmployeeLifecycleStatus] ?? label;
  }
  return label;
}

export function HistoryPanel({ employeeId }: { employeeId: string }) {
  const { data: events = [], isLoading } = useEmployeeHistory(employeeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Employment history</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ol className="relative space-y-5 border-l pl-5">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                <p className="text-sm font-medium">{HISTORY_EVENT_LABELS[event.eventType] ?? event.eventType}</p>
                <p className="text-sm text-muted-foreground">
                  {event.eventType === "JOINED" ? (
                    <>
                      Joined as <span className="text-foreground">{describe(event, event.toLabel)}</span>
                    </>
                  ) : (
                    <>
                      {describe(event, event.fromLabel)} → <span className="text-foreground">{describe(event, event.toLabel)}</span>
                    </>
                  )}
                </p>
                {event.note ? <p className="mt-0.5 text-sm italic text-muted-foreground">“{event.note}”</p> : null}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Effective {formatHrDate(event.effectiveDate)}
                  {event.actorName ? ` · by ${event.actorName}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
