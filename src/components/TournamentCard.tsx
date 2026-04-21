import { motion } from "framer-motion";
import { Trophy, Users, Calendar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Tournament } from "@/lib/tournament-types";
import { formatPrize } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/use-auth";
import { useDeleteTournament, type TournamentWithOwner } from "@/hooks/use-tournaments";
import { toast } from "sonner";

const statusConfig: Record<Tournament["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  open: { label: "Open Registration", className: "bg-success/15 text-success border-success/30" },
  ongoing: { label: "● Live", className: "bg-live/15 text-live border-live/40" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
};

interface Props {
  tournament: Tournament | TournamentWithOwner;
  index?: number;
}

export const TournamentCard = ({ tournament: t, index = 0 }: Props) => {
  const status = statusConfig[t.status];
  const fillPct = (t.registeredTeams / t.maxTeams) * 100;
  const { user } = useAuth();
  const del = useDeleteTournament();
  const ownerId = (t as TournamentWithOwner).organizerId;
  const isOwner = !!(user && ownerId && user.id === ownerId);

  const handleDelete = async () => {
    try {
      await del.mutateAsync(t.id);
      toast.success("Tournament deleted");
    } catch (e) {
      toast.error("Could not delete", { description: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link
        to={`/tournaments/${t.id}`}
        className="block relative overflow-hidden rounded-xl bg-gradient-card border border-border hover:border-primary/40 transition-all duration-300"
        style={{
          boxShadow: "0 8px 32px -12px hsl(240 50% 0% / 0.5)",
        }}
      >
        {/* Banner */}
        <div
          className="relative h-32 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${t.bannerHue} 80% 30%) 0%, hsl(${(t.bannerHue + 60) % 360} 70% 20%) 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 30%, hsl(${t.bannerHue} 100% 60% / 0.6) 0%, transparent 50%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100% / 0.12) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.12) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {t.status === "ongoing" && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur px-2.5 py-1 rounded-full border border-live/40">
              <span className="live-dot" />
              <span className="font-mono text-[10px] font-bold text-live tracking-wider">LIVE</span>
            </div>
          )}
          {t.status === "open" && (
            <Badge className={`absolute top-3 right-3 ${status.className} border font-mono text-[10px]`}>
              {status.label}
            </Badge>
          )}
          {/* Prize */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/70 to-transparent">
            <div className="font-mono text-[10px] tracking-[0.2em] text-foreground/70">PRIZE POOL</div>
            <div className="font-display text-2xl font-bold text-gradient">{formatPrize(t.prizePool)}</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display font-bold text-base leading-tight group-hover:text-primary transition-colors">
              {t.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t.game} · {t.organizer}</p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {t.format === "single-elim" ? "SINGLE ELIM" : "DOUBLE ELIM"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(t.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <span>{t.region}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /> TEAMS
              </span>
              <span className="text-foreground">
                {t.registeredTeams}<span className="text-muted-foreground">/{t.maxTeams}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-700"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, hsl(${t.bannerHue} 100% 60% / 0.15), transparent 60%)`,
          }}
        />
      </Link>

      {isOwner && (
        <div className="absolute top-3 left-3 z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 bg-background/80 backdrop-blur border-border hover:border-destructive/60 hover:text-destructive"
                aria-label="Delete tournament"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this tournament?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes “{t.title}”. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </motion.div>
  );
};
