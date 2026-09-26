import { format } from "date-fns";
import { Phone, Mail, Users2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FollowUp } from "@/types/entities";

const CHANNEL_ICON: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users2,
};

export function FollowUpTimeline({ followUps }: { followUps: FollowUp[] }) {
  if (!followUps.length) {
    return (
      <p className="text-sm text-muted-foreground">No follow-ups logged yet.</p>
    );
  }

  return (
    <ol className="space-y-2">
      {followUps.map((followUp) => {
        const ChannelIcon = CHANNEL_ICON[followUp.channel] ?? Phone;
        return (
          <li
            key={followUp.id}
            className="rounded-lg border border-border/60 bg-background p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ChannelIcon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <Badge variant="outline" className="capitalize">
                    {followUp.channel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(followUp.createdAt), "PPp")}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {followUp.note}
                </p>
                {followUp.nextActionAt ? (
                  <div className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-amber-700 dark:text-amber-500">
                    <Clock className="size-3" />
                    Next action: {format(new Date(followUp.nextActionAt), "PPp")}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
