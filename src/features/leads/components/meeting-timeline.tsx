import { format } from "date-fns";
import { CalendarClock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LeadMeeting } from "@/types/entities";

export function MeetingTimeline({ meetings }: { meetings: LeadMeeting[] }) {
  if (!meetings.length) {
    return (
      <p className="text-sm text-muted-foreground">No meetings logged yet.</p>
    );
  }

  return (
    <ol className="space-y-2">
      {meetings.map((meeting) => (
        <li
          key={meeting.id}
          className="rounded-lg border border-border/60 bg-background p-3"
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CalendarClock className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <Badge variant="outline">Meeting</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(meeting.createdAt), "PPp")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {meeting.note}
              </p>
              {meeting.visitLocation ? (
                <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {meeting.visitLocation}
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
