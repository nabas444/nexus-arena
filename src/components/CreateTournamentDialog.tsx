import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Trophy, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultTournamentValues,
  tournamentFormSchema,
  type TournamentFormValues,
} from "@/lib/tournament-schema";
import { useCreateTournament } from "@/hooks/use-tournaments";

interface Props {
  trigger?: React.ReactNode;
}

export const CreateTournamentDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const create = useCreateTournament();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: defaultTournamentValues,
    mode: "onBlur",
  });

  const hue = form.watch("bannerHue");

  const onSubmit = async (values: TournamentFormValues) => {
    try {
      await create.mutateAsync(values);
      toast.success("Tournament created", {
        description: `${values.title} is now ${values.status === "open" ? "open for registration" : "saved as draft"}.`,
      });
      form.reset(defaultTournamentValues);
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create tournament";
      toast.error("Creation failed", { description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold h-11">
            <Sparkles className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-gradient-primary grid place-items-center shadow-[var(--glow-primary)]">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Spin up a new arena</DialogTitle>
              <DialogDescription>
                Configure the tournament. You can publish it now or keep it as a draft.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Banner preview */}
        <div
          className="relative h-20 rounded-lg overflow-hidden border border-border"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 80% 30%) 0%, hsl(${(hue + 60) % 360} 70% 20%) 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 30%, hsl(${hue} 100% 60% / 0.6) 0%, transparent 50%)`,
            }}
          />
          <div className="absolute inset-0 grid place-items-center font-mono text-[10px] tracking-[0.3em] text-foreground/80">
            BANNER PREVIEW
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Midnight Arena Cup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="game"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game</FormLabel>
                    <FormControl>
                      <Input placeholder="Tactical FPS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer</FormLabel>
                    <FormControl>
                      <Input placeholder="Nexus Esports" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single-elim">Single Elimination</SelectItem>
                        <SelectItem value="double-elim">Double Elimination</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft (private)</SelectItem>
                        <SelectItem value="open">Open registration</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max teams</FormLabel>
                    <FormControl>
                      <Input type="number" min={2} max={256} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prizePool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize pool (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input placeholder="Global / EU / NA / APAC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bannerHue"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Banner color (hue)</FormLabel>
                    <FormControl>
                      <Input type="range" min={0} max={360} step={1} {...field} className="h-2" />
                    </FormControl>
                    <FormDescription className="font-mono text-[10px]">HUE: {hue}°</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Rules (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Best of 3 in group stage, BO5 from quarterfinals..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold"
              >
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Launch tournament
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
