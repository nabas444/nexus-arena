import { motion } from "framer-motion";
import { ArrowRight, Radio, Trophy, Zap, TrendingUp, Eye, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { TournamentCard } from "@/components/TournamentCard";
import { TeamLogo } from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { tournaments, liveMatches, teams, featuredTournament, formatPrize, formatViewers } from "@/lib/mock-data";

const Hub = () => {
  const live = tournaments.filter((t) => t.status === "ongoing");
  const open = tournaments.filter((t) => t.status === "open");

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, hsl(270 100% 50% / 0.25), transparent 40%), radial-gradient(circle at 20% 80%, hsl(187 100% 50% / 0.18), transparent 40%)`,
          }}
        />
        <div className="container relative py-16 md:py-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-[11px] font-mono tracking-widest"
            >
              <span className="live-dot" />
              <span className="text-foreground/90">LIVE NOW · {live.length} TOURNAMENTS · {formatViewers(180924)} WATCHING</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight"
            >
              ENTER THE
              <br />
              <span className="text-gradient">NEXUS ARENA.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Run, join, and spectate elite esports tournaments. Real-time brackets,
              AI match insights, and immersive Match Day mode — built for competitors who play to win.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold tracking-wide shadow-[var(--glow-primary)] h-12 px-6">
                <Link to="/tournaments">
                  Browse Tournaments <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border hover:border-primary/60 hover:bg-primary/5 h-12 px-6 font-bold tracking-wide">
                <Link to="/match-day">
                  <Radio className="mr-2 h-4 w-4 text-live" />
                  Match Day Mode
                </Link>
              </Button>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-3 pt-6 max-w-lg"
            >
              {[
                { label: "PRIZES PAID", value: "$12.4M" },
                { label: "ACTIVE TEAMS", value: "8,420" },
                { label: "TOURNAMENTS", value: "1,203" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-lg px-3 py-2.5">
                  <div className="font-display text-xl font-bold text-gradient">{s.value}</div>
                  <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Featured live card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-5"
          >
            <div className="relative neon-border bg-gradient-card overflow-hidden">
              <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="live-dot" />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-live font-bold">LIVE FEATURE</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {formatViewers(featuredTournament.viewers || 0)}
                  </span>
                </div>

                <div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{featuredTournament.game.toUpperCase()}</div>
                  <h3 className="font-display text-2xl font-bold mt-1">{featuredTournament.title}</h3>
                  <div className="font-display text-3xl font-black text-gradient mt-2">{formatPrize(featuredTournament.prizePool)}</div>
                </div>

                {liveMatches[0] && (
                  <div className="rounded-lg bg-background/50 border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground tracking-widest">
                      <span>QUARTERFINAL · BO3</span>
                      <span className="text-live flex items-center gap-1"><span className="live-dot" /> MAP 2</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TeamLogo team={liveMatches[0].teamA!} />
                        <div className="min-w-0">
                          <div className="font-display font-bold text-sm truncate">{liveMatches[0].teamA?.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">RANK #{liveMatches[0].teamA?.rank}</div>
                        </div>
                      </div>
                      <div className="font-display font-black text-2xl tabular-nums text-center">
                        <span className="text-primary">{liveMatches[0].scoreA ?? 0}</span>
                        <span className="text-muted-foreground mx-1.5">:</span>
                        <span className="text-secondary">{liveMatches[0].scoreB ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse text-right">
                        <TeamLogo team={liveMatches[0].teamB!} />
                        <div className="min-w-0">
                          <div className="font-display font-bold text-sm truncate">{liveMatches[0].teamB?.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">RANK #{liveMatches[0].teamB?.rank}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button asChild className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground font-bold tracking-wide">
                  <Link to={`/bracket/${featuredTournament.id}`}>
                    View Bracket <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIVE TOURNAMENTS */}
      <section className="container py-12 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="h-4 w-4 text-live" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-live">LIVE NOW</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Tournaments On Fire</h2>
          </div>
          <Link to="/tournaments" className="text-sm font-semibold text-primary hover:text-primary-glow flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {live.map((t, i) => <TournamentCard key={t.id} tournament={t} index={i} />)}
        </div>
      </section>

      {/* OPEN REGISTRATION */}
      <section className="container py-8 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-success" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-success">JOIN NOW</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Open Registration</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {open.map((t, i) => <TournamentCard key={t.id} tournament={t} index={i} />)}
        </div>
      </section>

      {/* TOP TEAMS */}
      <section className="container py-12 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-secondary">GLOBAL ELITE</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Top Teams This Season</h2>
          </div>
          <Link to="/leaderboard" className="text-sm font-semibold text-primary hover:text-primary-glow flex items-center gap-1">
            Full rankings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teams.slice(0, 4).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 hover:border-primary/40 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <TeamLogo team={t} />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-sm truncate group-hover:text-primary transition">{t.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">RANK #{t.rank} · {t.region}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground tracking-widest">MOMENTUM</span>
                  <span className="text-foreground tabular-nums">{t.momentum}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-momentum transition-all"
                    style={{ width: `${t.momentum}%` }}
                  />
                  {t.momentum >= 75 && (
                    <Zap className="absolute -top-1 right-1 h-3.5 w-3.5 text-accent animate-pulse" />
                  )}
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] pt-1">
                  <span className="text-success">{t.wins}W</span>
                  <span className="text-destructive">{t.losses}L</span>
                  <span className="text-muted-foreground tabular-nums">{t.rating} ELO</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default Hub;
