import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Loader2, Shield, BadgeCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTeams, slugify } from "@/hooks/use-teams";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const Teams = () => {
  const { teams, loading } = useTeams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState("Global");
  const [bio, setBio] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/auth");
    if (!name.trim() || !tag.trim()) return;
    setCreating(true);
    const slug = slugify(name);
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        tag: tag.trim().toUpperCase().slice(0, 5),
        slug,
        region,
        bio: bio.trim() || null,
        captain_id: user.id,
      })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error("Could not create team", { description: error.message });
      return;
    }
    toast.success("Team created");
    setOpen(false);
    setName(""); setTag(""); setBio("");
    navigate(`/teams/${data.slug}`);
  };

  return (
    <AppShell>
      <div className="container py-10 space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// ROSTERS</span>
            <h1 className="font-display text-3xl md:text-5xl font-black">
              The <span className="text-gradient">Teams</span>
            </h1>
            <p className="text-muted-foreground mt-1">Persistent squads that carry across every tournament.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold">
                <Plus className="h-4 w-4 mr-2" /> New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Forge your team</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Team name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tag</Label>
                    <Input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={5} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Region</Label>
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating} className="bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)]">
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-mono text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> // LOADING TEAMS
          </div>
        ) : teams.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center space-y-3">
            <Users className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No teams yet. Be the first to forge one.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/teams/${t.slug}`}
                  className="glass rounded-xl p-5 border border-border hover:border-primary/60 transition-colors flex items-center gap-4 group"
                >
                  <TeamLogo team={t} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-bold truncate">{t.name}</h3>
                      {t.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                      [{t.tag}] · {t.region}
                    </div>
                    {t.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.bio}</p>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Teams;
