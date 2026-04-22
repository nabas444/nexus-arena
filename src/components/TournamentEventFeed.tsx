import { AnimatePresence, motion } from "framer-motion";
import { Activity, CheckCircle2, Radio, Sparkles, Trophy } from "lucide-react";

import type { TournamentEvent, TournamentEventKind } from "@/hooks/use-tournament-events";

interface Props {
  events: TournamentEvent[];
}

const META: Record<
  TournamentEventKind,
  { icon: typeof Radio; tone: string; label: string }
> = {
  "bracket-regenerated": {
    icon: Sparkles,
    tone: "text-primary border-primary/30 bg-primary/10",
    label: "BRACKET",
  },
  "went-live": {
    icon: Radio,
    tone: "text-live border-live/40 bg-live/10",
    label: "LIVE",
  },
  completed: {
    icon: Trophy,
    tone: "text-warning border-warning/40 bg-warning/10",
    label: "FINAL",
  },
  "registration-open": {
    icon: CheckCircle2,
    tone: "text-success border-success/40 bg-success/10",
    label: "OPEN",
  },
};

function relTime(at: number): string {
  const diff = Math.max(0, Date.now() - at);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function TournamentEventFeed({ events }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] text-accent">// EVENT FEED</span>
          <h2 className="font-display text-xl font-bold mt-1">Live updates</h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          REAL-TIME
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 font-mono text-xs text-muted-foreground">
          // WAITING FOR ORGANIZER ACTIVITY…
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const meta = META[ev.kind];
              const Icon = meta.icon;
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
                >
                  <div
                    className={`h-8 w-8 rounded-md grid place-items-center border flex-shrink-0 ${meta.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                      <span className="font-display text-sm font-bold truncate">{ev.title}</span>
                      {typeof ev.matchCount === "number" && (
                        <span className="font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border border-border bg-background/60 text-foreground/80">
                          {ev.matchCount} MATCH{ev.matchCount === 1 ? "" : "ES"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ev.description}</div>
                    {ev.occurredAt && (
                      <div className="font-mono text-[10px] text-muted-foreground/80 mt-1">
                        // ORGANIZER TIMESTAMP {new Date(ev.occurredAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0 mt-1">
                    {relTime(ev.at)}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
