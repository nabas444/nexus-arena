import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TournamentCard } from "@/components/TournamentCard";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { Input } from "@/components/ui/input";
import { Tournament } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useTournaments } from "@/hooks/use-tournaments";

type FilterStatus = "all" | Tournament["status"];

const filters: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ongoing", label: "Live" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

const Tournaments = () => {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [query, setQuery] = useState("");
  const { data: tournaments = [], isLoading, isError, error } = useTournaments();

  const filtered = tournaments.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (query && !`${t.title} ${t.game} ${t.organizer}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="container py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div className="space-y-2">
            <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// TOURNAMENT GRID</span>
            <h1 className="font-display text-3xl md:text-5xl font-black">
              All <span className="text-gradient">Tournaments</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Find your next battlefield. Filter by status, format, or game.
            </p>
          </div>
          <CreateTournamentDialog />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tournaments..."
              className="pl-9 bg-card border-border focus-visible:border-primary/60 focus-visible:ring-primary/20 h-11"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {filters.map((f) => (
              <Button
                key={f.value}
                onClick={() => setFilter(f.value)}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                className={
                  filter === f.value
                    ? "bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold"
                    : "border-border hover:border-primary/40 font-semibold"
                }
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-mono text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            // LOADING TOURNAMENTS
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-destructive font-mono text-sm">
            // FAILED TO LOAD: {error instanceof Error ? error.message : "unknown error"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-muted-foreground font-mono text-sm">
              {tournaments.length === 0
                ? "// NO TOURNAMENTS YET — BE THE FIRST TO HOST ONE"
                : "// NO TOURNAMENTS MATCH YOUR FILTERS"}
            </div>
            {tournaments.length === 0 && <CreateTournamentDialog />}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t, i) => (
              <TournamentCard key={t.id} tournament={t} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Tournaments;
