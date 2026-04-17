import { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { ZoomIn, ZoomOut, Maximize2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { bracket, roundLabels, tournaments, Match, formatPrize } from "@/lib/mock-data";

const MATCH_W = 256;
const MATCH_H = 88;
const ROUND_GAP = 80;
const VERTICAL_GAP = 24;

const MatchCard = ({ match, index, roundIdx }: { match: Match; index: number; roundIdx: number }) => {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isUpcoming = match.status === "upcoming";
  const winnerId = match.winnerId;

  const TeamRow = ({ team, score, isWinner, isTop }: { team?: Match["teamA"]; score?: number; isWinner: boolean; isTop: boolean }) => (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 ${isTop ? "border-b border-border/60" : ""} ${isWinner ? "bg-primary/5" : ""}`}>
      {team ? (
        <>
          <div
            className="h-5 w-5 rounded grid place-items-center font-display font-bold text-[9px] flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(${team.logoColor}))`,
              color: "hsl(240 30% 5%)",
            }}
          >
            {team.tag}
          </div>
          <div className={`flex-1 min-w-0 text-xs font-semibold truncate ${isWinner ? "text-foreground" : "text-foreground/80"}`}>
            {team.name}
          </div>
          <div className={`font-display font-bold tabular-nums text-sm ${isWinner ? "text-primary" : "text-muted-foreground"}`}>
            {score ?? "—"}
          </div>
        </>
      ) : (
        <div className="flex-1 text-xs font-mono text-muted-foreground/50 italic">TBD</div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: roundIdx * 0.1 + index * 0.04 }}
      className="absolute"
      style={{
        left: roundIdx * (MATCH_W + ROUND_GAP),
        top: getMatchY(roundIdx, index),
        width: MATCH_W,
      }}
    >
      <div
        className={`relative rounded-lg overflow-hidden bg-card border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
          isLive
            ? "border-live/50 shadow-[0_0_20px_hsl(var(--live)/0.3)]"
            : isCompleted
            ? "border-border hover:border-primary/40"
            : "border-border/60 hover:border-secondary/40"
        }`}
        style={{ height: MATCH_H }}
      >
        {/* Status header */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-background/50 border-b border-border/60">
          <span className="font-mono text-[9px] tracking-widest text-muted-foreground">
            BO{match.bestOf} · M{roundIdx + 1}.{index + 1}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 font-mono text-[9px] text-live font-bold">
              <span className="live-dot" /> LIVE
            </span>
          )}
          {isUpcoming && match.startsAt && (
            <span className="font-mono text-[9px] text-muted-foreground">
              {new Date(match.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {isCompleted && <span className="font-mono text-[9px] text-success">FINAL</span>}
        </div>

        <TeamRow team={match.teamA} score={match.scoreA} isWinner={winnerId === match.teamA?.id} isTop />
        <TeamRow team={match.teamB} score={match.scoreB} isWinner={winnerId === match.teamB?.id} isTop={false} />
      </div>
    </motion.div>
  );
};

function getMatchY(roundIdx: number, position: number): number {
  const matchesInFirstRound = 8;
  const slotHeight = MATCH_H + VERTICAL_GAP;
  const groupSize = Math.pow(2, roundIdx);
  const offset = (groupSize * slotHeight - MATCH_H) / 2;
  return position * groupSize * slotHeight + offset - (groupSize - 1) * VERTICAL_GAP / 2;
  // Simpler: align to centerline of the two feeder matches
}

// Connector lines between rounds
const Connectors = ({ totalRounds }: { totalRounds: number }) => {
  const lines: JSX.Element[] = [];
  for (let r = 0; r < totalRounds - 1; r++) {
    const matchesInRound = Math.pow(2, totalRounds - 1 - r) / 2 * 2;
    const groupSize = Math.pow(2, r);
    const nextGroupSize = groupSize * 2;
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
  const [zoom, setZoom] = useState(1);
  const tournament = tournaments.find((t) => t.id === id) ?? tournaments[0];

  const totalRounds = 4;
  const totalWidth = totalRounds * MATCH_W + (totalRounds - 1) * ROUND_GAP;
  const totalHeight = 8 * (MATCH_H + VERTICAL_GAP);

  return (
    <AppShell>
      <div className="container pt-8 pb-4 space-y-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// BRACKET ENGINE</span>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-1">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black">{tournament.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tournament.game} · {tournament.format === "single-elim" ? "Single Elimination" : "Double Elimination"} · 16 Teams
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest">PRIZE POOL</div>
                <div className="font-display text-2xl font-black text-gradient">{formatPrize(tournament.prizePool)}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insight banner */}
        <div className="neon-border bg-gradient-card p-4 flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gradient-accent grid place-items-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-mono text-[10px] tracking-widest text-accent">AI MATCH INSIGHT</div>
            <div className="text-sm">
              <span className="font-bold">Quantum Surge</span> projected to advance — <span className="text-success font-bold">68% win probability</span> based on momentum and recent form.
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-accent/40 text-accent hover:bg-accent/10">
            View Full Analysis
          </Button>
        </div>

        {/* Bracket controls */}
        <div className="flex items-center justify-between glass rounded-lg px-3 py-2">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="font-mono text-xs w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setZoom(1)} aria-label="Reset zoom">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-widest hidden sm:block">DRAG TO PAN · SCROLL TO EXPLORE</div>
        </div>
      </div>

      {/* Bracket canvas */}
      <div className="container pb-12">
        <div className="rounded-xl border border-border bg-background/40 overflow-auto">
          <div className="p-8" style={{ width: "max-content" }}>
            {/* Round headers */}
            <div className="flex gap-[80px] mb-4 sticky top-0">
              {roundLabels.map((label, i) => (
                <div key={label} style={{ width: MATCH_W }} className="text-center">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">ROUND {i + 1}</div>
                  <div className="font-display text-sm font-bold mt-0.5">{label}</div>
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
              <svg className="absolute inset-0 pointer-events-none" width={totalWidth} height={totalHeight}>
                <Connectors totalRounds={totalRounds} />
              </svg>

              {bracket.map((m) => (
                <MatchCard key={m.id} match={m} index={m.position} roundIdx={m.round} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Bracket;
