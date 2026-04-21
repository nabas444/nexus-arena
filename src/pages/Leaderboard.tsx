import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Crown, Loader2, Users, Filter, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { useTeamRankings } from "@/hooks/use-rankings";
import { useTournaments } from "@/hooks/use-tournaments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Leaderboard = () => {
  const [region, setRegion] = useState<string>("all");
  const [game, setGame] = useState<string>("all");
  const [tournamentId, setTournamentId] = useState<string>("all");

  const { data: tournaments = [] } = useTournaments();
  const { data: sorted = [], isLoading } = useTeamRankings({ region, game, tournamentId });

  const regions = useMemo(() => {
    const set = new Set<string>();
    tournaments.forEach((t) => t.region && set.add(t.region));
    return Array.from(set).sort();
  }, [tournaments]);

  const games = useMemo(() => {
    const set = new Set<string>();
    tournaments.forEach((t) => t.game && set.add(t.game));
    return Array.from(set).sort();
  }, [tournaments]);

  const tournamentsInScope = useMemo(() => {
    return tournaments.filter((t) => {
      if (region !== "all" && t.region !== region) return false;
      if (game !== "all" && t.game !== game) return false;
      return true;
    });
  }, [tournaments, region, game]);

  const isFiltered = region !== "all" || game !== "all" || tournamentId !== "all";
  const activeTournament = tournaments.find((t) => t.id === tournamentId);

  const resetTournamentIfNeeded = (nextRegion: string, nextGame: string) => {
    if (tournamentId === "all") return;
    const stillValid = tournaments.some(
      (t) =>
        t.id === tournamentId &&
        (nextRegion === "all" || t.region === nextRegion) &&
        (nextGame === "all" || t.game === nextGame)
    );
    if (!stillValid) setTournamentId("all");
  };

  const handleRegionChange = (v: string) => {
    setRegion(v);
    resetTournamentIfNeeded(v, game);
  };

  const handleGameChange = (v: string) => {
    setGame(v);
    resetTournamentIfNeeded(region, v);
  };

  const clearFilters = () => {
    setRegion("all");
    setGame("all");
    setTournamentId("all");
  };

  const activeChipLabel = activeTournament
    ? activeTournament.title
    : [game !== "all" ? game : null, region !== "all" ? region : null].filter(Boolean).join(" · ");

  return (
    <AppShell>
      <div className="container py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-mono text-[10px] tracking-[0.25em] text-secondary">// GLOBAL RANKINGS</span>
          <h1 className="font-display text-3xl md:text-5xl font-black mt-1">
            World <span className="text-gradient-accent">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Live ratings derived from every completed match across the platform.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] tracking-widest md:pr-2 md:border-r md:border-border">
            <Filter className="h-3.5 w-3.5" /> FILTERS
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1 min-w-[160px]">
              <Select value={region} onValueChange={handleRegionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={tournamentId} onValueChange={setTournamentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tournament" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tournaments</SelectItem>
                  {tournamentsInScope.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isFiltered && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {activeTournament ? activeTournament.title : `Region: ${region}`}
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-mono text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> // CALCULATING RANKINGS
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-border bg-gradient-card p-12 text-center max-w-xl mx-auto">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">
              {isFiltered ? "No teams match this filter" : "No teams ranked yet"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isFiltered
                ? "Try widening the filters or clear them to see the global leaderboard."
                : "Once organizers register teams and complete matches, the leaderboard fills up automatically. Hosts a tournament to seed the grid."}
            </p>
          </div>
        ) : (
          <>
            {/* Podium — only when we have at least 3 teams */}
            {sorted.length >= 3 && (
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
            )}

            {/* Full table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_80px_120px_140px] gap-3 px-4 py-3 border-b border-border bg-background/40 font-mono text-[10px] tracking-widest text-muted-foreground">
                <div>RANK</div>
                <div>TEAM</div>
                <div className="text-right">ELO</div>
                <div className="text-right">W / L</div>
                <div className="text-right">MOMENTUM</div>
              </div>
              {sorted.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="grid grid-cols-[60px_1fr_80px_120px_140px] gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-primary/5 transition group"
                >
                  <div className="flex items-center">
                    <span
                      className={`font-display font-bold text-lg tabular-nums ${
                        t.rank === 1
                          ? "text-warning"
                          : t.rank <= 3
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {String(t.rank).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamLogo team={t} size="sm" />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm truncate group-hover:text-primary transition">
                        {t.name}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{t.tag}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold tabular-nums self-center">{t.rating}</div>
                  <div className="text-right self-center font-mono text-sm">
                    <span className="text-success">{t.wins}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-destructive">{t.losses}</span>
                  </div>
                  <div className="self-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-momentum"
                          style={{ width: `${t.momentum}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] tabular-nums w-6 text-right">
                        {t.momentum}
                      </span>
                      {t.momentum >= 75 && <Flame className="h-3 w-3 text-accent" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Leaderboard;
