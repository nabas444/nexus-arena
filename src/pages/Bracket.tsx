import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Pencil, Sparkles, Trophy, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamManager } from "@/components/TeamManager";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  BracketMatch,
  BracketTeam,
  matchesKey,
  useBracketMatches,
  useTournamentTeams,
  useUpdateMatchScore,
} from "@/hooks/use-bracket";
import { useTournaments } from "@/hooks/use-tournaments";
import { formatPrize } from "@/lib/mock-data";

const MATCH_W = 256;
const MATCH_H = 88;
const ROUND_GAP = 80;
const VERTICAL_GAP = 24;

function getMatchY(roundIdx: number, position: number): number {
  const slotHeight = MATCH_H + VERTICAL_GAP;
  const groupSize = Math.pow(2, roundIdx);
  const offset = (groupSize * slotHeight - MATCH_H) / 2;
  return position * groupSize * slotHeight + offset - ((groupSize - 1) * VERTICAL_GAP) / 2;
}

const roundLabel = (round: number, totalRounds: number) => {
  const remaining = Math.pow(2, totalRounds - round);
  if (remaining === 2) return "Grand Final";
  if (remaining === 4) return "Semifinals";
  if (remaining === 8) return "Quarterfinals";
  return `Round of ${remaining}`;
};

interface MatchCardProps {
  match: BracketMatch;
  teamMap: Map<string, BracketTeam>;
  roundIdx: number;
  index: number;
  isOwner: boolean;
  onEdit: (m: BracketMatch) => void;
  editingId: string | null;
  onSave: (m: BracketMatch, a: number, b: number) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const MatchCard = ({
  match,
  teamMap,
  roundIdx,
  index,
  isOwner,
  onEdit,
  editingId,
  onSave,
  onCancel,
  saving,
}: MatchCardProps) => {
  const teamA = match.team_a_id ? teamMap.get(match.team_a_id) : undefined;
  const teamB = match.team_b_id ? teamMap.get(match.team_b_id) : undefined;
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isUpcoming = match.status === "upcoming";
  const editing = editingId === match.id;

  const [a, setA] = useState<string>(match.score_a?.toString() ?? "0");
  const [b, setB] = useState<string>(match.score_b?.toString() ?? "0");
  useEffect(() => {
    if (editing) {
      setA(match.score_a?.toString() ?? "0");
      setB(match.score_b?.toString() ?? "0");
    }
  }, [editing, match.score_a, match.score_b]);

  const Row = ({
    team,
    score,
    isWinner,
    isTop,
  }: {
    team?: BracketTeam;
    score?: number | null;
    isWinner: boolean;
    isTop: boolean;
  }) => (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 ${isTop ? "border-b border-border/60" : ""} ${
        isWinner ? "bg-primary/5" : ""
      }`}
    >
      {team ? (
        <>
          <div
            className="h-5 w-5 rounded grid place-items-center font-display font-bold text-[9px] flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(${team.logo_color}))`,
              color: "hsl(240 30% 5%)",
            }}
          >
            {team.tag}
          </div>
          <div
            className={`flex-1 min-w-0 text-xs font-semibold truncate ${
              isWinner ? "text-foreground" : "text-foreground/80"
            }`}
          >
            {team.name}
          </div>
          <div
            className={`font-display font-bold tabular-nums text-sm ${
              isWinner ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {score ?? "—"}
          </div>
        </>
      ) : (
        <div className="flex-1 text-xs font-mono text-muted-foreground/50 italic">TBD</div>
      )}
    </div>
  );

  const canEdit = isOwner && teamA && teamB && !editing;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: roundIdx * 0.08 + index * 0.03 }}
      className="absolute"
      style={{
        left: roundIdx * (MATCH_W + ROUND_GAP),
        top: getMatchY(roundIdx, index),
        width: MATCH_W,
      }}
    >
      <div
        className={`relative rounded-lg overflow-hidden bg-card border transition-all duration-300 ${
          isLive
            ? "border-live/50 shadow-[0_0_20px_hsl(var(--live)/0.3)]"
            : isCompleted
            ? "border-border"
            : "border-border/60"
        } ${editing ? "ring-2 ring-primary" : ""}`}
        style={{ height: editing ? undefined : MATCH_H }}
      >
        <div className="flex items-center justify-between px-2.5 py-1 bg-background/50 border-b border-border/60">
          <span className="font-mono text-[9px] tracking-widest text-muted-foreground">
            BO{match.best_of} · M{roundIdx + 1}.{index + 1}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 font-mono text-[9px] text-live font-bold">
              <span className="live-dot" /> LIVE
            </span>
          )}
          {isUpcoming && match.starts_at && (
            <span className="font-mono text-[9px] text-muted-foreground">
              {new Date(match.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {isCompleted && <span className="font-mono text-[9px] text-success">FINAL</span>}
          {canEdit && (
            <button
              onClick={() => onEdit(match)}
              className="text-muted-foreground hover:text-primary"
              aria-label="Edit score"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-10">{teamA?.tag ?? "A"}</span>
              <Input
                type="number"
                min={0}
                max={match.best_of}
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-10">{teamB?.tag ?? "B"}</span>
              <Input
                type="number"
                min={0}
                max={match.best_of}
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-gradient-primary text-primary-foreground"
                disabled={saving}
                onClick={() => onSave(match, Number(a) || 0, Number(b) || 0)}
              >
                {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Row team={teamA} score={match.score_a} isWinner={match.winner_id === teamA?.id} isTop />
            <Row team={teamB} score={match.score_b} isWinner={match.winner_id === teamB?.id} isTop={false} />
          </>
        )}
      </div>
    </motion.div>
  );
};

const Connectors = ({ totalRounds }: { totalRounds: number }) => {
  const lines: JSX.Element[] = [];
  for (let r = 0; r < totalRounds - 1; r++) {
    const matchesInRound = Math.pow(2, totalRounds - 1 - r);
    for (let i = 0; i < matchesInRound / 2; i++) {
      const y1 = getMatchY(r, i * 2) + MATCH_H / 2;
      const y2 = getMatchY(r, i * 2 + 1) + MATCH_H / 2;
      const yMid = (y1 + y2) / 2;
      const x1 = r * (MATCH_W + ROUND_GAP) + MATCH_W;
      const x2 = (r + 1) * (MATCH_W + ROUND_GAP);
      const xMid = x1 + ROUND_GAP / 2;
      lines.push(
        <g key={`c-${r}-${i}`} stroke="hsl(var(--border))" strokeWidth="1.5" fill="none">
          <path d={`M ${x1} ${y1} L ${xMid} ${y1} L ${xMid} ${y2} L ${x1} ${y2}`} />
          <path d={`M ${xMid} ${yMid} L ${x2} ${yMid}`} />
        </g>
      );
    }
  }
  return <>{lines}</>;
};

const Bracket = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: tournaments = [] } = useTournaments();
  const tournament = tournaments.find((t) => t.id === id);
  const { data: teams = [], isLoading: teamsLoading } = useTournamentTeams(id);
  const { data: matches = [], isLoading: matchesLoading } = useBracketMatches(id);
  const updateScore = useUpdateMatchScore(id ?? "");

  const isOwner = !!(user && tournament?.organizerId && user.id === tournament.organizerId);
  const qc = useQueryClient();

  // Realtime subscriptions for live score updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`bracket-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `tournament_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: matchesKey(id) });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) + 1 : 0;
  const firstRoundMatches = totalRounds > 0 ? matches.filter((m) => m.round === 0).length : 0;
  const totalWidth = Math.max(totalRounds, 1) * MATCH_W + Math.max(totalRounds - 1, 0) * ROUND_GAP;
  const totalHeight = Math.max(firstRoundMatches, 1) * (MATCH_H + VERTICAL_GAP);

  const handleSave = async (m: BracketMatch, scoreA: number, scoreB: number) => {
    try {
      await updateScore.mutateAsync({ match: m, scoreA, scoreB });
      toast.success("Score saved");
      setEditingId(null);
    } catch (err) {
      toast.error("Could not save score", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  if (!tournament) {
    return (
      <AppShell>
        <div className="container py-20 text-center font-mono text-muted-foreground">
          // TOURNAMENT NOT FOUND
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container pt-8 pb-4 space-y-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// BRACKET ENGINE</span>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-1">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black">{tournament.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tournament.game} ·{" "}
                {tournament.format === "single-elim" ? "Single Elimination" : "Double Elimination"} ·{" "}
                {teams.length}/{tournament.maxTeams} Teams
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest">PRIZE POOL</div>
                <div className="font-display text-2xl font-black text-gradient">
                  {formatPrize(tournament.prizePool)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="neon-border bg-gradient-card p-4 flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gradient-accent grid place-items-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-mono text-[10px] tracking-widest text-accent">AI MATCH INSIGHT</div>
            <div className="text-sm">
              {matches.length === 0
                ? "Generate a bracket to unlock predictions and key player highlights."
                : "Predictions update in real time as scores come in."}
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-accent/40 text-accent hover:bg-accent/10">
            View Full Analysis
          </Button>
        </div>

        {isOwner && (
          <TeamManager
            tournamentId={tournament.id}
            maxTeams={tournament.maxTeams}
            teams={teams}
            hasBracket={matches.length > 0}
          />
        )}
      </div>

      {teamsLoading || matchesLoading ? (
        <div className="container pb-20 flex items-center justify-center text-muted-foreground font-mono text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          // LOADING BRACKET
        </div>
      ) : matches.length === 0 ? (
        <div className="container pb-20">
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-10 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-md bg-muted grid place-items-center">
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold">No bracket yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isOwner
                ? "Add teams above (a power of 2) and hit Generate bracket to lock in seedings."
                : "The organizer hasn't generated the bracket yet. Check back when registration closes."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="container pb-2">
            <div className="flex items-center justify-between glass rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="font-mono text-xs w-12 text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest hidden sm:block">
                SCROLL TO EXPLORE
              </div>
            </div>
          </div>

          <div className="container pb-12">
            <div className="rounded-xl border border-border bg-background/40 overflow-auto">
              <div className="p-8" style={{ width: "max-content" }}>
                <div className="flex gap-[80px] mb-4 sticky top-0">
                  {Array.from({ length: totalRounds }).map((_, i) => (
                    <div key={i} style={{ width: MATCH_W }} className="text-center">
                      <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                        ROUND {i + 1}
                      </div>
                      <div className="font-display text-sm font-bold mt-0.5">
                        {roundLabel(i, totalRounds)}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="relative origin-top-left transition-transform"
                  style={{
                    width: totalWidth,
                    height: totalHeight,
                    transform: `scale(${zoom})`,
                  }}
                >
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={totalWidth}
                    height={totalHeight}
                  >
                    <Connectors totalRounds={totalRounds} />
                  </svg>

                  {matches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      teamMap={teamMap}
                      roundIdx={m.round}
                      index={m.position}
                      isOwner={isOwner}
                      editingId={editingId}
                      onEdit={(match) => setEditingId(match.id)}
                      onCancel={() => setEditingId(null)}
                      onSave={handleSave}
                      saving={updateScore.isPending}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
};

export default Bracket;
