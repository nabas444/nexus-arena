import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  BadgeCheck,
  UserPlus,
  Crown,
  LogOut,
  Trash2,
  Send,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/hooks/use-teams";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const TeamDetail = () => {
  const { slug } = useParams();
  const { team, members, invites, loading } = useTeam(slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [sending, setSending] = useState(false);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground font-mono text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> // LOADING TEAM
        </div>
      </AppShell>
    );
  }

  if (!team) {
    return (
      <AppShell>
        <div className="container py-20 text-center space-y-3">
          <h1 className="font-display text-3xl">Team not found</h1>
          <Link to="/teams" className="text-primary underline">Back to teams</Link>
        </div>
      </AppShell>
    );
  }

  const isCaptain = user?.id === team.captain_id;
  const isMember = members.some((m) => m.user_id === user?.id);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !handle.trim()) return;
    setSending(true);
    const clean = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const { error } = await supabase.from("team_invites").insert({
      team_id: team.id,
      invited_handle: clean,
      invited_by: user.id,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send invite", { description: error.message });
      return;
    }
    setHandle("");
    toast.success(`Invite sent to @${clean}`);
  };

  const cancelInvite = async (id: string) => {
    const { error } = await supabase.from("team_invites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invite cancelled");
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
  };

  const leaveTeam = async () => {
    if (!user) return;
    const me = members.find((m) => m.user_id === user.id);
    if (!me) return;
    const { error } = await supabase.from("team_members").delete().eq("id", me.id);
    if (error) return toast.error(error.message);
    toast.success("Left team");
    navigate("/teams");
  };

  const disbandTeam = async () => {
    if (!confirm("Disband this team permanently?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", team.id);
    if (error) return toast.error(error.message);
    toast.success("Team disbanded");
    navigate("/teams");
  };

  return (
    <AppShell>
      <div className="container py-10 space-y-8 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-border flex flex-col md:flex-row items-start md:items-center gap-6"
        >
          <TeamLogo team={team} size="lg" />
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// SQUAD</span>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl md:text-4xl font-black">{team.name}</h1>
              {team.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
              <Badge variant="outline" className="font-mono">[{team.tag}]</Badge>
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              {team.region} · {members.length} member{members.length === 1 ? "" : "s"}
            </div>
            {team.bio && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{team.bio}</p>}
          </div>
          <div className="flex gap-2">
            {isMember && !isCaptain && (
              <Button variant="outline" size="sm" onClick={leaveTeam}>
                <LogOut className="h-4 w-4 mr-2" /> Leave
              </Button>
            )}
            {isCaptain && (
              <Button variant="outline" size="sm" onClick={disbandTeam} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Disband
              </Button>
            )}
          </div>
        </motion.div>

        {/* Roster */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Roster
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {members.map((m) => {
              const isCap = m.user_id === team.captain_id;
              return (
                <div
                  key={m.id}
                  className="glass rounded-xl p-4 border border-border flex items-center gap-3"
                >
                  <Link to={`/u/${m.profile?.handle ?? ""}`} className="contents">
                    <div className="h-10 w-10 rounded-full bg-gradient-accent grid place-items-center font-display text-xs font-bold overflow-hidden">
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (m.profile?.handle ?? "??").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">
                          {m.profile?.display_name || m.profile?.handle || "Unknown"}
                        </span>
                        {isCap && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        @{m.profile?.handle ?? "—"} · {m.role}
                      </div>
                    </div>
                  </Link>
                  {isCaptain && !isCap && (
                    <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)} aria-label="Remove">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Invites - captain only */}
        {isCaptain && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Invites
            </h2>
            <form onSubmit={sendInvite} className="flex gap-2 glass rounded-xl p-3 border border-border">
              <span className="font-mono text-muted-foreground self-center">@</span>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="player_handle"
                maxLength={24}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !handle} className="bg-gradient-primary text-primary-foreground border-transparent">
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Invite
              </Button>
            </form>
            {invites.length > 0 && (
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between glass rounded-lg p-3 border border-border"
                  >
                    <div className="font-mono text-sm">
                      @{inv.invited_handle}{" "}
                      <span className="text-muted-foreground text-xs">
                        {inv.invited_user_id ? "· pending" : "· awaiting signup"}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => cancelInvite(inv.id)}>
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
};

export default TeamDetail;
