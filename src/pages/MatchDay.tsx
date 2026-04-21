import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Eye,
  Clock,
  Sparkles,
  Flame,
  Trophy,
  ArrowRight,
  WifiOff,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLiveMatches, useUpcomingMatches, type LiveMatchRow } from "@/hooks/use-live-matches";

function useCountdown(targetIso?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!targetIso) return "--:--:--";
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface MiniTeam {
  id: string;
  name: string;
  tag: string;
  logo_color: string;
}

function TeamBadge({ team, size = "md" }: { team: MiniTeam; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-12 w-12 text-xs",
    lg: "h-20 w-20 text-base",
  }[size];
  return (
    <div
      className={`${sizeClass} relative rounded-md grid place-items-center font-display font-black flex-shrink-0 clip-hex`}
      style={{
        background: `linear-gradient(135deg, hsl(${team.logo_color}) 0%, hsl(${team.logo_color
          .split(" ")
          .map((p, i) => (i === 0 ? String((parseInt(p) + 40) % 360) : p))
          .join(" ")}) 100%)`,
        color: "hsl(240 30% 5%)",
        boxShadow: `0 0 24px hsl(${team.logo_color} / 0.55)`,
      }}
      aria-label={team.name}
    >
      {team.tag}
    </div>
  );
}

/** Series momentum (0-100) derived from current score share. */
function momentumPct(scoreA: number, scoreB: number): { a: number; b: number } {
  const total = scoreA + scoreB;
  if (total === 0) return { a: 50, b: 50 };
  const a = Math.round((scoreA / total) * 100);
  return { a, b: 100 - a };
}

function FeaturedMatch({ match }: { match: LiveMatchRow }) {
  const [viewers, setViewers] = useState(() => 8000 + Math.floor(Math.random() * 50000));
  useEffect(() => {
    const id = setInterval(
      () => setViewers((v) => Math.max(500, v + Math.floor(Math.random() * 80 - 30))),
      1500
    );
    return () => clearInterval(id);
  }, []);

  if (!match.team_a || !match.team_b) return null;
  const a = match.team_a;
  const b = match.team_b;
  const scoreA = match.score_a ?? 0;
  const scoreB = match.score_b ?? 0;
  const winsNeeded = Math.ceil(match.best_of / 2);
  const momentum = momentumPct(scoreA, scoreB);
  const roundLabel = `R${match.round + 1} · BO${match.best_of}`;

  return (
    <motion.div
      key={match.id}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl border border-live/40"
      style={{
        background: `radial-gradient(circle at 25% 50%, hsl(${a.logo_color} / 0.25), transparent 50%), radial-gradient(circle at 75% 50%, hsl(${b.logo_color} / 0.25), transparent 50%), hsl(var(--surface-1))`,
        boxShadow: "0 0 60px hsl(var(--live) / 0.15)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="scan-line absolute inset-0 pointer-events-none" />

      <div className="relative p-6 md:p-10">
        {/* Top strip */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-2 bg-live/15 border border-live/40 px-3 py-1.5 rounded-full">
            <span className="live-dot" />
            <span className="font-mono text-[10px] font-bold text-live tracking-[0.2em]">
              LIVE · FIRST TO {winsNeeded}
            </span>
          </div>
          {match.tournament && (
            <Link
              to={`/bracket/${match.tournament_id}`}
              className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{match.tournament.title}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1.5 text-foreground/80">
              <Eye className="h-3.5 w-3.5" />
              <span className="tabular-nums">{viewers.toLocaleString()}</span>
            </span>
            <span className="text-muted-foreground">{roundLabel}</span>
          </div>
        </div>

        {/* Teams + score */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-center">
          {[
            { team: a, score: scoreA, isLeft: true },
            { team: b, score: scoreB, isLeft: false },
          ].map(({ team, isLeft }) => (
            <div
              key={team.id}
              className={`flex flex-col items-center text-center ${
                isLeft ? "md:items-end md:text-right" : "md:items-start md:text-left"
              }`}
            >
              <TeamBadge team={team} size="lg" />
              <div className="font-display text-2xl md:text-3xl font-black mt-3">{team.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
                {team.tag}
              </div>
            </div>
          ))}

          <div className="text-center order-first md:order-none">
            <div className="font-display font-black text-6xl md:text-8xl tabular-nums leading-none">
              <motion.span
                key={`a-${scoreA}`}
                initial={{ scale: 1.4, color: "hsl(var(--accent))" }}
                animate={{ scale: 1, color: "hsl(var(--primary))" }}
                transition={{ duration: 0.5 }}
                className="inline-block"
                style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.6)" }}
              >
                {scoreA}
              </motion.span>
              <span className="text-muted-foreground/40 mx-3 md:mx-4">:</span>
              <motion.span
                key={`b-${scoreB}`}
                initial={{ scale: 1.4, color: "hsl(var(--accent))" }}
                animate={{ scale: 1, color: "hsl(var(--secondary))" }}
                transition={{ duration: 0.5 }}
                className="inline-block"
                style={{ textShadow: "0 0 30px hsl(var(--secondary) / 0.6)" }}
              >
                {scoreB}
              </motion.span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-3">
              CURRENT SERIES
            </div>
          </div>
        </div>

        {/* Momentum bar — full width, dual sided */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2 font-mono text-[10px] tracking-widest">
            <span className="text-primary flex items-center gap-1.5">
              <Flame className="h-3 w-3" /> {a.tag} · {momentum.a}%
            </span>
            <span className="text-muted-foreground">SERIES MOMENTUM</span>
            <span className="text-secondary flex items-center gap-1.5">
              {momentum.b}% · {b.tag} <Flame className="h-3 w-3" />
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-muted/60 overflow-hidden border border-border">
            <motion.div
              initial={{ width: "50%" }}
              animate={{ width: `${momentum.a}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0"
              style={{
                background: `linear-gradient(90deg, hsl(${a.logo_color}), hsl(var(--primary)))`,
                boxShadow: `0 0 12px hsl(${a.logo_color} / 0.5)`,
              }}
            />
            <motion.div
              initial={{ width: "50%" }}
              animate={{ width: `${momentum.b}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 right-0"
              style={{
                background: `linear-gradient(270deg, hsl(${b.logo_color}), hsl(var(--secondary)))`,
                boxShadow: `0 0 12px hsl(${b.logo_color} / 0.5)`,
              }}
            />
            {/* Center divider */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
          </div>
        </div>

        {/* AI insight */}
        <div className="mt-8 max-w-2xl mx-auto rounded-lg bg-background/50 border border-accent/30 px-4 py-3 flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
          <div className="text-sm">
            <span className="font-mono text-[10px] tracking-widest text-accent mr-2">AI INSIGHT</span>
            {scoreA === scoreB
              ? `Dead even at ${scoreA}-${scoreB} — next map decides the swing.`
              : scoreA > scoreB
              ? `${a.name} leads ${scoreA}-${scoreB} and is ${winsNeeded - scoreA} win(s) from advancing.`
              : `${b.name} leads ${scoreB}-${scoreA} and is ${winsNeeded - scoreB} win(s) from advancing.`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const MatchDay = () => {
  const { data: liveMatches = [], isLoading, error } = useLiveMatches();
  const { data: upcoming = [] } = useUpcomingMatches();
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState(false);

  // Auto-select first live match
  useEffect(() => {
    if (liveMatches.length === 0) {
      setFeaturedId(null);
      return;
    }
    if (!featuredId || !liveMatches.find((m) => m.id === featuredId)) {
      setFeaturedId(liveMatches[0].id);
    }
  }, [liveMatches, featuredId]);

  const featured = useMemo(
    () => liveMatches.find((m) => m.id === featuredId) ?? liveMatches[0] ?? null,
    [liveMatches, featuredId]
  );
  const next = upcoming[0];
  const countdown = useCountdown(next?.starts_at);

  // Lock body scroll + ESC to exit broadcast mode
  useEffect(() => {
    if (!broadcast) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBroadcast(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [broadcast]);

  // Auto-exit broadcast if no live match left
  useEffect(() => {
    if (broadcast && !featured) setBroadcast(false);
  }, [broadcast, featured]);

  return (
    <>
      {/* BROADCAST MODE — fullscreen, no nav */}
      <AnimatePresence>
        {broadcast && featured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background overflow-auto"
            role="dialog"
            aria-label="Broadcast mode"
          >
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground bg-card/80 backdrop-blur border border-border rounded-md px-2 py-1">
                <kbd className="font-sans">ESC</kbd> TO EXIT
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBroadcast(false)}
                className="bg-card/80 backdrop-blur"
              >
                <Minimize2 className="h-4 w-4 mr-1.5" /> Exit
                <X className="h-4 w-4 ml-1 sm:hidden" />
              </Button>
            </div>
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-7xl">
                <FeaturedMatch match={featured} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppShell>
        <div className="container py-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between gap-4 flex-wrap"
          >
            <div>
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-live" />
                <span className="font-mono text-[10px] tracking-[0.25em] text-live">// MATCH DAY MODE</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-black mt-1">
                Live <span className="text-gradient-accent">Battlefield</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-mono">
                {liveMatches.length > 0
                  ? `${liveMatches.length} match${liveMatches.length === 1 ? "" : "es"} streaming · realtime sync active`
                  : "No matches live right now — the grid is quiet."}
              </p>
            </div>
            <Button
              onClick={() => setBroadcast(true)}
              disabled={!featured}
              className="bg-gradient-primary text-primary-foreground font-bold shadow-[var(--glow-primary)]"
              title={featured ? "Enter broadcast mode" : "No live match to broadcast"}
            >
              <Maximize2 className="h-4 w-4 mr-2" /> Broadcast mode
            </Button>
          </motion.div>

        {isLoading && (
          <div className="rounded-2xl border border-border bg-card/50 p-12 text-center">
            <div className="font-mono text-xs text-muted-foreground tracking-widest">CONNECTING TO GRID…</div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-destructive" />
            <div className="text-sm">
              <div className="font-display font-bold">Stream offline</div>
              <div className="text-muted-foreground">Couldn't reach the match feed. Try again in a moment.</div>
            </div>
          </div>
        )}

        {/* FEATURED LIVE MATCH */}
        <AnimatePresence mode="wait">
          {featured ? (
            <FeaturedMatch match={featured} />
          ) : (
            !isLoading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-12 text-center"
              >
                <div className="scan-line absolute inset-0 pointer-events-none" />
                <Radio className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <div className="font-display text-2xl font-black mb-2">No Live Matches</div>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-5">
                  When organizers update a score on any active bracket, the match goes live here automatically.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/tournaments">Browse Tournaments</Link>
                </Button>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Up next + secondary live */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Countdown */}
          <div className="neon-border bg-gradient-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-secondary">NEXT MATCH</span>
            </div>
            {next?.team_a && next?.team_b ? (
              <>
                <div className="font-mono font-bold text-3xl tabular-nums text-gradient leading-none">
                  {next.starts_at ? countdown : "READY"}
                </div>
                <div className="mt-5 flex items-center gap-3 text-sm">
                  <TeamBadge team={next.team_a} size="sm" />
                  <span className="font-display font-bold">{next.team_a.tag}</span>
                  <span className="text-muted-foreground font-mono text-xs">VS</span>
                  <span className="font-display font-bold">{next.team_b.tag}</span>
                  <TeamBadge team={next.team_b} size="sm" />
                </div>
                <div className="mt-3 text-xs text-muted-foreground font-mono truncate">
                  {next.tournament?.title} · BO{next.best_of}
                </div>
              </>
            ) : (
              <>
                <div className="font-mono font-bold text-3xl tabular-nums text-muted-foreground/50 leading-none">
                  --:--:--
                </div>
                <div className="mt-5 text-sm text-muted-foreground">No upcoming matches scheduled</div>
              </>
            )}
          </div>

          {/* Other live matches */}
          <div className="lg:col-span-2 space-y-3">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
              // ALL LIVE FEEDS · CLICK TO FEATURE
            </div>
            {liveMatches.length === 0 && (
              <div className="glass rounded-lg p-4 text-sm text-muted-foreground text-center">
                No other live matches right now.
              </div>
            )}
            {liveMatches.map((m, i) =>
              m.team_a && m.team_b ? (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setFeaturedId(m.id)}
                  className={`glass rounded-lg p-3 flex items-center gap-4 transition cursor-pointer w-full text-left ${
                    m.id === featuredId
                      ? "border-live/60 shadow-[0_0_20px_hsl(var(--live)/0.2)]"
                      : "hover:border-live/40"
                  }`}
                >
                  <span className="live-dot flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamBadge team={m.team_a} size="sm" />
                    <span className="font-display font-bold text-sm truncate">{m.team_a.tag}</span>
                  </div>
                  <div className="font-display font-black text-lg tabular-nums">
                    <span className="text-primary">{m.score_a ?? 0}</span>
                    <span className="text-muted-foreground mx-1.5">:</span>
                    <span className="text-secondary">{m.score_b ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="font-display font-bold text-sm truncate">{m.team_b.tag}</span>
                    <TeamBadge team={m.team_b} size="sm" />
                  </div>
                  <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-muted-foreground flex-shrink-0">
                    BO{m.best_of}
                  </span>
                </motion.button>
              ) : null
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default MatchDay;
