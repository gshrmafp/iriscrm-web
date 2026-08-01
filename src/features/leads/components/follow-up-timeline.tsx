import { format } from "date-fns";
import type { FollowUp } from "@/types/entities";

export function FollowUpTimeline({ followUps }: { followUps: FollowUp[] }) {
  if (!followUps.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No follow-ups logged yet.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {followUps.map((followUp) => (
        <li key={followUp.id} className="border-l-2 pl-4">
          <div className="flex items-center gap-2 text-sm font-medium capitalize">
            {followUp.channel}
            <span className="text-xs font-normal text-muted-foreground">
              {format(new Date(followUp.createdAt), "PPp")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{followUp.note}</p>
          {followUp.nextActionAt ? (
            <p className="mt-1 text-xs text-warning-foreground dark:text-warning">
              Next action: {format(new Date(followUp.nextActionAt), "PPp")}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
