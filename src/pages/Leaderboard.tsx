import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { teams } from "@/lib/mock-data";

const Leaderboard = () => {
  const sorted = [...teams].sort((a, b) => a.rank - b.rank);

  return (
    <AppShell>
      <div className="container py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-mono text-[10px] tracking-[0.25em] text-secondary">// GLOBAL RANKINGS</span>
          <h1 className="font-display text-3xl md:text-5xl font-black mt-1">
            World <span className="text-gradient-accent">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">Live ELO rankings updated every match.</p>
        </motion.div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto">
          {[sorted[1], sorted[0], sorted[2]].map((t, idx) => {
            const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
            const heights = ["h-32", "h-44", "h-24"];
            const colors = ["secondary", "primary", "accent"] as const;
            const c = colors[idx];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="mb-3 flex flex-col items-center">
                  {place === 1 && <Crown className="h-6 w-6 text-warning mb-1 animate-pulse" />}
                  <TeamLogo team={t} size={place === 1 ? "lg" : "md"} />
                  <div className="font-display font-bold text-sm mt-2 text-center">{t.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{t.rating} ELO</div>
                </div>
                <div
                  className={`${heights[idx]} w-full rounded-t-lg flex items-start justify-center pt-2 font-display font-black text-2xl border-t-2`}
                  style={{
                    background: `linear-gradient(180deg, hsl(var(--${c}) / 0.25) 0%, hsl(var(--${c}) / 0.05) 100%)`,
                    borderColor: `hsl(var(--${c}))`,
                    boxShadow: `0 0 30px hsl(var(--${c}) / 0.25)`,
                  }}
                >
                  #{place}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_80px_120px_100px_140px] gap-3 px-4 py-3 border-b border-border bg-background/40 font-mono text-[10px] tracking-widest text-muted-foreground">
            <div>RANK</div>
            <div>TEAM</div>
            <div className="text-right">ELO</div>
            <div className="text-right">W / L</div>
            <div className="text-right hidden md:block">REGION</div>
            <div className="text-right">MOMENTUM</div>
          </div>
          {sorted.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[60px_1fr_80px_120px_100px_140px] gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-primary/5 transition group"
            >
              <div className="flex items-center">
                <span className={`font-display font-bold text-lg tabular-nums ${
                  t.rank === 1 ? "text-warning" : t.rank <= 3 ? "text-primary" : "text-muted-foreground"
                }`}>
                  {String(t.rank).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <TeamLogo team={t} size="sm" />
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm truncate group-hover:text-primary transition">{t.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{t.tag}</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold tabular-nums self-center">{t.rating}</div>
              <div className="text-right self-center font-mono text-sm">
                <span className="text-success">{t.wins}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-destructive">{t.losses}</span>
              </div>
              <div className="text-right hidden md:flex items-center justify-end font-mono text-xs text-muted-foreground">{t.region}</div>
              <div className="self-center">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-momentum" style={{ width: `${t.momentum}%` }} />
                  </div>
                  <span className="font-mono text-[10px] tabular-nums w-6 text-right">{t.momentum}</span>
                  {t.momentum >= 75 && <Flame className="h-3 w-3 text-accent" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Leaderboard;
