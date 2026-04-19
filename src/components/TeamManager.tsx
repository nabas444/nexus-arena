import { useState } from "react";
import { Loader2, Plus, Trash2, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BracketTeam,
  useAddTeam,
  useGenerateBracket,
  useRemoveTeam,
} from "@/hooks/use-bracket";

interface Props {
  tournamentId: string;
  maxTeams: number;
  teams: BracketTeam[];
  hasBracket: boolean;
}

const isPowerOfTwo = (n: number) => n >= 2 && (n & (n - 1)) === 0;

export const TeamManager = ({ tournamentId, maxTeams, teams, hasBracket }: Props) => {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const addTeam = useAddTeam(tournamentId);
  const removeTeam = useRemoveTeam(tournamentId);
  const generate = useGenerateBracket(tournamentId);

  const isFull = teams.length >= maxTeams;
  const canGenerate = isPowerOfTwo(teams.length) && !hasBracket;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;
    try {
      await addTeam.mutateAsync({ name, tag });
      setName("");
      setTag("");
    } catch (err) {
      toast.error("Could not add team", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync({ teams });
      toast.success("Bracket generated", {
        description: `${teams.length} teams seeded — let the games begin.`,
      });
    } catch (err) {
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-primary grid place-items-center shadow-[var(--glow-primary)]">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-sm font-bold">Roster</div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
              {teams.length}/{maxTeams} TEAMS REGISTERED
            </div>
          </div>
        </div>

        {!hasBracket && (
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={!canGenerate || generate.isPending}
            className="bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold"
            title={
              !isPowerOfTwo(teams.length)
                ? "Need a power of 2 teams (2, 4, 8, 16...)"
                : "Generate bracket"
            }
          >
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate bracket
          </Button>
        )}
      </div>

      {!hasBracket && (
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name"
            maxLength={40}
            disabled={isFull}
            className="flex-1"
          />
          <Input
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
            placeholder="TAG"
            maxLength={4}
            disabled={isFull}
            className="sm:w-24 font-mono"
          />
          <Button
            type="submit"
            disabled={!name.trim() || !tag.trim() || isFull || addTeam.isPending}
            className="bg-gradient-accent text-accent-foreground font-bold"
          >
            {addTeam.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add
          </Button>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-6 font-mono text-xs text-muted-foreground">
          // NO TEAMS YET — ADD AT LEAST 2
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {teams.map((t, i) => (
            <li
              key={t.id}
              className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-xs"
            >
              <div
                className="h-6 w-6 rounded grid place-items-center font-display font-bold text-[9px] flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${t.logo_color}))`,
                  color: "hsl(240 30% 5%)",
                }}
              >
                {t.tag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold">{t.name}</div>
                <div className="font-mono text-[9px] text-muted-foreground">
                  SEED #{t.seed ?? i + 1}
                </div>
              </div>
              {!hasBracket && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${t.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {t.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        They will no longer be part of this tournament.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeTeam.mutate(t.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>
      )}

      {!hasBracket && !isPowerOfTwo(teams.length) && teams.length > 0 && (
        <p className="text-[11px] font-mono text-muted-foreground">
          // ADD {nextPowerOfTwo(teams.length) - teams.length} MORE TEAM(S) TO REACH {nextPowerOfTwo(teams.length)} —
          BRACKETS REQUIRE A POWER OF 2
        </p>
      )}
    </div>
  );
};

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 2);
}
