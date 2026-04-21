import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, CheckCircle2, Clock, Loader2, Radio } from "lucide-react";
import {
  useTournamentRecentResults,
  useTournamentUpcoming,
  type TournamentMatchRow,
} from "@/hooks/use-tournament-matches";

interface Props {
  tournamentId: string;
}

const MiniBadge = ({
  team,
}: {
  team: { tag: string; logo_color: string };
}) => (
  <div
    className="h-7 w-7 rounded grid place-items-center font-display font-black text-[9px] flex-shrink-0"
    style={{
      background: `linear-gradient(135deg, hsl(${team.logo_color}))`,
      color: "hsl(240 30% 5%)",
    }}
    aria-hidden
  >
    {team.tag}
  </div>
);

const ResultRow = ({ m }: { m: TournamentMatchRow }) => {
  if (!m.team_a || !m.team_b) return null;
  const aWon = m.winner_id === m.team_a.id;
  const bWon = m.winner_id === m.team_b.id;
  const when = m.updated_at
    ? new Date(m.updated_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2 flex items-center gap-3">
      <span className="font-mono text-[9px] text-success tracking-widest flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> FINAL
      </span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MiniBadge team={m.team_a} />
        <span
          className={`font-display font-bold text-sm truncate ${
            aWon ? "text-foreground" : "text-muted-foreground/70"
          }`}
        >
          {m.team_a.name}
        </span>
      </div>
      <div className="font-display font-black tabular-nums text-base">
        <span className={aWon ? "text-primary" : "text-muted-foreground"}>{m.score_a ?? 0}</span>
        <span className="text-muted-foreground/50 mx-1">:</span>
        <span className={bWon ? "text-primary" : "text-muted-foreground"}>{m.score_b ?? 0}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span
          className={`font-display font-bold text-sm truncate ${
            bWon ? "text-foreground" : "text-muted-foreground/70"
          }`}
        >
          {m.team_b.name}
        </span>
        <MiniBadge team={m.team_b} />
      </div>
      <span className="font-mono text-[9px] text-muted-foreground hidden sm:block flex-shrink-0">
        R{m.round + 1} · BO{m.best_of}
      </span>
      {when && (
        <span className="font-mono text-[9px] text-muted-foreground hidden md:block flex-shrink-0">
          {when}
        </span>
      )}
    </div>
  );
};

const UpcomingRow = ({ m }: { m: TournamentMatchRow }) => {
  if (!m.team_a || !m.team_b) return null;
  const isLive = m.status === "live";
  const when = m.starts_at
    ? new Date(m.starts_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";
  return (
    <div
      className={`rounded-md border px-3 py-2 flex items-center gap-3 ${
        isLive
          ? "border-live/50 bg-live/5 shadow-[0_0_18px_hsl(var(--live)/0.15)]"
          : "border-border/60 bg-background/40"
      }`}
    >
      {isLive ? (
        <span className="flex items-center gap-1 font-mono text-[9px] text-live font-bold tracking-widest">
          <span className="live-dot" /> LIVE
        </span>
      ) : (
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest flex items-center gap-1">
          <Clock className="h-3 w-3" /> NEXT
        </span>
      )}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MiniBadge team={m.team_a} />
        <span className="font-display font-bold text-sm truncate">{m.team_a.name}</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">VS</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="font-display font-bold text-sm truncate">{m.team_b.name}</span>
        <MiniBadge team={m.team_b} />
      </div>
      <span className="font-mono text-[9px] text-muted-foreground hidden sm:block flex-shrink-0">
        R{m.round + 1} · BO{m.best_of}
      </span>
      <span className="font-mono text-[9px] text-muted-foreground hidden md:flex items-center gap-1 flex-shrink-0">
        <Calendar className="h-3 w-3" /> {when}
      </span>
    </div>
  );
};

export const TournamentMatchFeed = ({ tournamentId }: Props) => {
  const { data: recent = [], isLoading: rLoading } = useTournamentRecentResults(tournamentId);
  const { data: upcoming = [], isLoading: uLoading } = useTournamentUpcoming(tournamentId);

  const isEmpty = !rLoading && !uLoading && recent.length === 0 && upcoming.length === 0;

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] text-accent">// MATCH FEED</span>
          <h2 className="font-display text-xl font-bold mt-1">Live · Recent · Upcoming</h2>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground tracking-widest">
          <Radio className="h-3 w-3 text-live" /> REALTIME SYNC
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-8 font-mono text-xs text-muted-foreground">
          // NO MATCHES YET — GENERATE THE BRACKET TO POPULATE THE FEED
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Upcoming */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground flex items-center justify-between">
              <span>UPCOMING / LIVE</span>
              <Link
                to={`/bracket/${tournamentId}`}
                className="text-primary hover:underline flex items-center gap-1"
              >
                Bracket <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {uLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs py-4">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> // SYNCING
              </div>
            ) : upcoming.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center font-mono text-[11px] text-muted-foreground">
                // NO UPCOMING MATCHES
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                className="space-y-2"
              >
                {upcoming.map((m) => (
                  <motion.div
                    key={m.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  >
                    <UpcomingRow m={m} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Recent results */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">RECENT RESULTS</div>
            {rLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs py-4">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> // SYNCING
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center font-mono text-[11px] text-muted-foreground">
                // NO COMPLETED MATCHES YET
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                className="space-y-2"
              >
                {recent.map((m) => (
                  <motion.div
                    key={m.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  >
                    <ResultRow m={m} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
