import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Eye, Clock, Sparkles, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { liveMatches, upcomingMatches, formatViewers, bracket } from "@/lib/mock-data";

function useCountdown(targetIso?: string) {
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

const featured = liveMatches[0] ?? bracket[4];

const MatchDay = () => {
  const next = upcomingMatches[0];
  const countdown = useCountdown(next?.startsAt);
  const [viewers, setViewers] = useState(142503);

  useEffect(() => {
    const id = setInterval(() => setViewers((v) => v + Math.floor(Math.random() * 30 - 10)), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <AppShell>
      <div className="container py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-live" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-live">// MATCH DAY MODE</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-black mt-1">
            Live <span className="text-gradient-accent">Battlefield</span>
          </h1>
        </motion.div>

        {/* FEATURED LIVE MATCH — immersive */}
        {featured?.teamA && featured.teamB && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl border border-live/40"
            style={{
              background: `radial-gradient(circle at 25% 50%, hsl(${featured.teamA.logoColor} / 0.25), transparent 50%), radial-gradient(circle at 75% 50%, hsl(${featured.teamB.logoColor} / 0.25), transparent 50%), hsl(var(--surface-1))`,
              boxShadow: "0 0 60px hsl(var(--live) / 0.15)",
            }}
          >
            {/* Animated grid overlay */}
            <div
              className="absolute inset-0 opacity-20"
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
                  <span className="font-mono text-[10px] font-bold text-live tracking-[0.2em]">LIVE · MAP 2 / 3</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="flex items-center gap-1.5 text-foreground/80">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="tabular-nums">{viewers.toLocaleString()}</span>
                  </span>
                  <span className="text-muted-foreground">QF · BO3</span>
                </div>
              </div>

              {/* Teams + score */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-center">
                {[featured.teamA, featured.teamB].map((team, idx) => {
                  const isLeft = idx === 0;
                  const score = isLeft ? featured.scoreA : featured.scoreB;
                  return (
                    <div key={team.id} className={`flex flex-col items-center text-center md:${isLeft ? "items-end md:text-right" : "items-start md:text-left"}`}>
                      <TeamLogo team={team} size="lg" />
                      <div className="font-display text-2xl md:text-3xl font-black mt-3">{team.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
                        {team.region} · RANK #{team.rank} · {team.rating} ELO
                      </div>
                      {/* Momentum */}
                      <div className="mt-3 w-full max-w-[200px] space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-muted-foreground tracking-widest flex items-center gap-1">
                            <Flame className="h-3 w-3 text-accent" /> MOMENTUM
                          </span>
                          <span className="tabular-nums">{team.momentum}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${team.momentum}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full bg-gradient-momentum"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="text-center order-first md:order-none">
                  <div className="font-display font-black text-6xl md:text-8xl tabular-nums leading-none">
                    <span className="text-primary" style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.6)" }}>
                      {featured.scoreA ?? 0}
                    </span>
                    <span className="text-muted-foreground/40 mx-3 md:mx-4">:</span>
                    <span className="text-secondary" style={{ textShadow: "0 0 30px hsl(var(--secondary) / 0.6)" }}>
                      {featured.scoreB ?? 0}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-3">CURRENT SERIES</div>
                </div>
              </div>

              {/* AI insight */}
              <div className="mt-8 max-w-2xl mx-auto rounded-lg bg-background/50 border border-accent/30 px-4 py-3 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-mono text-[10px] tracking-widest text-accent mr-2">AI INSIGHT</span>
                  Star duelist <span className="font-bold text-foreground">Vex0r</span> on a 12-frag streak — momentum heavily favors {featured.teamA.name}.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Up next + secondary live */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Countdown */}
          <div className="neon-border bg-gradient-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-secondary">NEXT MATCH IN</span>
            </div>
            <div className="font-mono font-bold text-4xl md:text-5xl tabular-nums text-gradient leading-none">{countdown}</div>
            {next?.teamA && next?.teamB ? (
              <div className="mt-5 flex items-center gap-3 text-sm">
                <TeamLogo team={next.teamA} size="sm" />
                <span className="font-display font-bold">{next.teamA.tag}</span>
                <span className="text-muted-foreground font-mono text-xs">VS</span>
                <span className="font-display font-bold">{next.teamB.tag}</span>
                <TeamLogo team={next.teamB} size="sm" />
              </div>
            ) : (
              <div className="mt-5 text-sm text-muted-foreground">Quarterfinal · BO5</div>
            )}
          </div>

          {/* Other live matches */}
          <div className="lg:col-span-2 space-y-3">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">// OTHER LIVE FEEDS</div>
            {liveMatches.slice(1).concat(liveMatches.slice(0, 1)).map((m, i) => m.teamA && m.teamB && (
              <motion.div
                key={m.id + i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-lg p-3 flex items-center gap-4 hover:border-live/40 transition cursor-pointer"
              >
                <span className="live-dot flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamLogo team={m.teamA} size="sm" />
                  <span className="font-display font-bold text-sm truncate">{m.teamA.tag}</span>
                </div>
                <div className="font-display font-black text-lg tabular-nums">
                  <span className="text-primary">{m.scoreA ?? 0}</span>
                  <span className="text-muted-foreground mx-1.5">:</span>
                  <span className="text-secondary">{m.scoreB ?? 0}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="font-display font-bold text-sm truncate">{m.teamB.tag}</span>
                  <TeamLogo team={m.teamB} size="sm" />
                </div>
                <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-muted-foreground flex-shrink-0">
                  <Eye className="h-3 w-3" /> {formatViewers(Math.floor(Math.random() * 50000) + 5000)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default MatchDay;
