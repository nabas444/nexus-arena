import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Globe2,
  Loader2,
  Lock,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TournamentMatchFeed } from "@/components/TournamentMatchFeed";
import { useAuth } from "@/hooks/use-auth";
import { useTournaments, useUpdateTournamentStatus } from "@/hooks/use-tournaments";
import { useAddTeam, useTournamentTeams, useBracketMatches, useGenerateBracket } from "@/hooks/use-bracket";
import { formatPrize } from "@/lib/formatters";
import type { Tournament } from "@/lib/tournament-types";

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  open: { label: "Open Registration", className: "bg-success/15 text-success border-success/30" },
  ongoing: { label: "● Live", className: "bg-live/15 text-live border-live/40" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border" },
};

// Standard esports prize split (top heavy). Sums to 100.
const PRIZE_SPLITS: Record<number, number[]> = {
  1: [100],
  2: [70, 30],
  3: [55, 28, 17],
  4: [50, 25, 15, 10],
  6: [45, 22, 13, 10, 5, 5],
  8: [40, 20, 12, 8, 5, 5, 5, 5],
};

function getPrizeSplit(places: number): number[] {
  if (PRIZE_SPLITS[places]) return PRIZE_SPLITS[places];
  // Fall back to top 4 if odd team counts
  if (places >= 8) return PRIZE_SPLITS[8];
  if (places >= 4) return PRIZE_SPLITS[4];
  return PRIZE_SPLITS[2];
}

const TournamentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: tournaments = [], isLoading: tLoading } = useTournaments();
  const tournament = tournaments.find((t) => t.id === id);
  const { data: teams = [], isLoading: teamsLoading } = useTournamentTeams(id);
  const { data: matches = [] } = useBracketMatches(id);

  const addTeam = useAddTeam(id ?? "");
  const updateStatus = useUpdateTournamentStatus();
  const generateBracket = useGenerateBracket(id ?? "");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");

  const isOwner = !!(user && tournament?.organizerId && user.id === tournament.organizerId);
  const hasBracket = matches.length > 0;
  const isFull = tournament ? teams.length >= tournament.maxTeams : false;
  const isOpen = tournament?.status === "open";
  const canRegister = !!user && isOpen && !isFull && !hasBracket && !isOwner;

  const prizeBreakdown = useMemo(() => {
    if (!tournament) return [];
    const places = Math.min(8, Math.max(2, Math.floor(tournament.maxTeams / 2)));
    const split = getPrizeSplit(places);
    return split.map((pct, i) => ({
      place: i + 1,
      pct,
      amount: Math.round((tournament.prizePool * pct) / 100),
    }));
  }, [tournament]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;
    if (!user) {
      toast.error("Sign in to register your team");
      return;
    }
    try {
      await addTeam.mutateAsync({ name, tag });
      toast.success("Team registered", { description: `${name} is in. Good luck.` });
      setName("");
      setTag("");
    } catch (err) {
      toast.error("Could not register", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleStatusChange = async (next: Tournament["status"]) => {
    if (!tournament || tournament.status === next) return;

    // Auto-regenerate bracket when going Draft/Open -> Ongoing so it always
    // reflects the latest registered teams. Trim to the nearest power of 2.
    const goingLive =
      next === "ongoing" && (tournament.status === "draft" || tournament.status === "open");

    if (goingLive) {
      if (teams.length < 2) {
        toast.error("Need at least 2 registered teams", {
          description: "Register more teams before launching the bracket.",
        });
        return;
      }
      const fitted = Math.pow(2, Math.floor(Math.log2(teams.length)));
      const bracketTeams = teams.slice(0, fitted);
      const trimmed = teams.length - fitted;
      try {
        // generateBracket wipes any prior matches, reseeds, and sets status=ongoing.
        await generateBracket.mutateAsync({ teams: bracketTeams });
        toast.success("Bracket generated", {
          description:
            trimmed > 0
              ? `${fitted} teams seeded — ${trimmed} extra trimmed to fit a power-of-2 bracket.`
              : `${fitted} teams seeded into the bracket.`,
        });
      } catch (err) {
        toast.error("Could not generate bracket", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
      return;
    }

    try {
      await updateStatus.mutateAsync({ id: tournament.id, status: next });
      toast.success("Status updated", {
        description: `Tournament is now ${statusBadge[next].label}.`,
      });
    } catch (err) {
      toast.error("Could not update status", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  if (tLoading) {
    return (
      <AppShell>
        <div className="container py-20 flex items-center justify-center text-muted-foreground font-mono text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> // LOADING TOURNAMENT
        </div>
      </AppShell>
    );
  }

  if (!tournament) {
    return (
      <AppShell>
        <div className="container py-20 text-center space-y-3">
          <div className="font-mono text-muted-foreground">// TOURNAMENT NOT FOUND</div>
          <Button asChild variant="outline">
            <Link to="/tournaments">Back to tournaments</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const status = statusBadge[tournament.status];
  const fillPct = (teams.length / tournament.maxTeams) * 100;

  return (
    <AppShell>
      {/* HERO */}
      <div
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, hsl(${tournament.bannerHue} 80% 22%) 0%, hsl(${(tournament.bannerHue + 60) % 360} 70% 14%) 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, hsl(${tournament.bannerHue} 100% 60% / 0.4) 0%, transparent 55%)`,
          }}
        />
        <div className="container relative py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`border font-mono text-[10px] ${status.className}`}>{status.label}</Badge>
              <span className="font-mono text-[10px] tracking-[0.25em] text-foreground/60">
                // {tournament.game.toUpperCase()}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black leading-tight">
              {tournament.title}
            </h1>
            <p className="text-foreground/80 max-w-2xl">
              Hosted by <span className="font-semibold text-foreground">{tournament.organizer}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                {tournament.format === "single-elim" ? "SINGLE ELIM" : "DOUBLE ELIM"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(tournament.startDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5" />
                {tournament.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {teams.length}/{tournament.maxTeams} teams
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container py-10 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* MAIN COLUMN */}
        <div className="space-y-8 min-w-0">
          {/* Organizer status switcher */}
          {isOwner && (
            <section className="rounded-xl border border-primary/30 bg-gradient-card p-5 space-y-4 shadow-[var(--glow-primary)]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// ORGANIZER CONTROLS</span>
                  <h2 className="font-display text-lg font-bold mt-1">Tournament status</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Flip the lifecycle in real time. Updates broadcast instantly to every viewer.
                  </p>
                </div>
                {(updateStatus.isPending || generateBracket.isPending) && (
                  <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {generateBracket.isPending ? "GENERATING BRACKET…" : "SAVING…"}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["draft", "open", "ongoing", "completed"] as const).map((s, i) => {
                  const meta = statusBadge[s];
                  const active = tournament.status === s;
                  const busy = updateStatus.isPending || generateBracket.isPending;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      disabled={busy || active}
                      className={`group relative rounded-lg border px-3 py-3 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 shadow-[var(--glow-primary)]"
                          : "border-border bg-background/40 hover:border-primary/40 hover:bg-background/60"
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="font-mono text-[9px] tracking-widest text-muted-foreground">
                        STEP {i + 1}
                      </div>
                      <div className={`font-display text-sm font-bold mt-1 ${active ? "text-primary" : ""}`}>
                        {meta.label.replace("● ", "")}
                      </div>
                      {active && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                // {tournament.status === "draft" && "DRAFT — registration not yet open"}
                {tournament.status === "open" && "OPEN — teams can sign up"}
                {tournament.status === "ongoing" && "ONGOING — bracket is live"}
                {tournament.status === "completed" && "COMPLETED — tournament has wrapped"}
              </p>
              {(tournament.status === "draft" || tournament.status === "open") && (
                <p className="font-mono text-[10px] text-primary/80">
                  // SWITCH TO ONGOING → BRACKET AUTO-GENERATES FROM {teams.length} REGISTERED TEAM
                  {teams.length === 1 ? "" : "S"}
                  {teams.length >= 2 &&
                    teams.length !== Math.pow(2, Math.floor(Math.log2(teams.length))) &&
                    ` (TRIMMED TO ${Math.pow(2, Math.floor(Math.log2(teams.length)))} FOR POWER-OF-2)`}
                </p>
              )}
            </section>
          )}

          {/* Prize pool + breakdown */}
          <section className="rounded-xl border border-border bg-gradient-card p-6 space-y-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">PRIZE POOL</div>
                <div className="font-display text-4xl md:text-5xl font-black text-gradient">
                  {formatPrize(tournament.prizePool)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">DISTRIBUTED ACROSS</div>
                <div className="font-display text-lg font-bold">{prizeBreakdown.length} places</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {prizeBreakdown.map(({ place, pct, amount }) => (
                <div
                  key={place}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-md grid place-items-center font-display font-black text-xs ${
                        place === 1
                          ? "bg-warning/20 text-warning"
                          : place === 2
                          ? "bg-secondary/20 text-secondary"
                          : place === 3
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {place}
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold">
                        {place === 1 ? "Champion" : place === 2 ? "Runner-up" : `${place}${nth(place)} place`}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{pct}% of pool</div>
                    </div>
                  </div>
                  <div className="font-display text-base font-bold tabular-nums">{formatPrize(amount)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Rules */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// RULES</span>
            </div>
            <h2 className="font-display text-xl font-bold">Tournament Rules</h2>
            {tournament.rules ? (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{tournament.rules}</p>
            ) : (
              <ul className="text-sm text-foreground/80 space-y-2">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  Standard{" "}
                  {tournament.format === "single-elim" ? "single-elimination" : "double-elimination"} bracket — one
                  loss and you're out.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  All matches are best-of-3; finals are best-of-5.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  Teams must check in 15 minutes before their scheduled match.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  No-show or forfeit results in immediate elimination.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  Organizer rulings are final.
                </li>
              </ul>
            )}
          </section>

          {/* Registered teams */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] tracking-[0.25em] text-secondary">// ROSTER</span>
                <h2 className="font-display text-xl font-bold mt-1">Registered Teams</h2>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-black tabular-nums">
                  {teams.length}
                  <span className="text-muted-foreground text-base">/{tournament.maxTeams}</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest">SLOTS</div>
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-700"
                style={{ width: `${fillPct}%` }}
              />
            </div>

            {teamsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground font-mono text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> // LOADING TEAMS
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 font-mono text-xs text-muted-foreground">
                // NO TEAMS REGISTERED YET — BE THE FIRST
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-2">
                {teams.map((t, i) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2"
                  >
                    <div
                      className="h-9 w-9 rounded grid place-items-center font-display font-black text-[10px] flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${t.logo_color}))`,
                        color: "hsl(240 30% 5%)",
                      }}
                    >
                      {t.tag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm truncate">{t.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        SEED #{t.seed ?? i + 1}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Live / recent / upcoming match feed */}
          <TournamentMatchFeed tournamentId={tournament.id} />
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          {/* Registration form */}
          <section className="rounded-xl border border-primary/30 bg-gradient-card p-5 space-y-4 shadow-[var(--glow-primary)]">
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// REGISTER</span>
              <h2 className="font-display text-lg font-bold mt-1">Join this tournament</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isOpen
                  ? "Open registration — sign your team up below."
                  : tournament.status === "ongoing"
                  ? "The bracket is already locked. Catch the action live."
                  : tournament.status === "completed"
                  ? "This tournament has wrapped. Check back for the next one."
                  : "The organizer hasn't opened registration yet."}
              </p>
            </div>

            {!user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Sign in to register a team
                </div>
                <Button asChild className="w-full bg-gradient-primary text-primary-foreground font-bold">
                  <Link to="/auth">Sign in to register</Link>
                </Button>
              </div>
            ) : isOwner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> You are the organizer — manage teams from
                  the bracket.
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/bracket/${tournament.id}`}>
                    Manage bracket <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : !canRegister ? (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  {isFull
                    ? "All slots are full."
                    : hasBracket
                    ? "The bracket has been generated — registration closed."
                    : "Registration isn't open right now."}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/bracket/${tournament.id}`}>
                    View bracket <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] tracking-widest text-muted-foreground">TEAM NAME</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Cosmic Wolves"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] tracking-widest text-muted-foreground">TAG (2-4)</label>
                  <Input
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
                    placeholder="CWLF"
                    maxLength={4}
                    className="font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!name.trim() || tag.length < 2 || addTeam.isPending}
                  className="w-full bg-gradient-primary text-primary-foreground font-bold"
                >
                  {addTeam.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Register team
                </Button>
                <p className="text-[10px] font-mono text-muted-foreground">
                  // {tournament.maxTeams - teams.length} SLOT(S) REMAINING
                </p>
              </form>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <span className="font-mono text-[10px] tracking-[0.25em] text-accent">// LINKS</span>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to={`/bracket/${tournament.id}`}>
                View bracket <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/match-day">
                Live match feed <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
};

function nth(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default TournamentDetail;
