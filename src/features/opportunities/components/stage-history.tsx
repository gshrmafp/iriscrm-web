import { format } from "date-fns";
import type { StageHistoryEntry } from "@/types/entities";

export function StageHistory({ entries }: { entries: StageHistoryEntry[] }) {
  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">No stage changes yet.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="border-l-2 pl-4 text-sm">
          <p className="font-medium">
            {entry.fromStage ? `${entry.fromStage} → ` : ""}
            {entry.toStage}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(entry.createdAt), "PPp")}
          </p>
          {entry.remark ? (
            <p className="text-muted-foreground">{entry.remark}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
