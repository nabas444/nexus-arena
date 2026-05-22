import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Shield } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { TeamLogo } from "@/components/TeamLogo";
import { supabase } from "@/integrations/supabase/client";
import type { Team } from "@/hooks/use-teams";

interface Profile {
  user_id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const PlayerProfile = () => {
  const { handle } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<(Team & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id,handle,display_name,avatar_url,created_at")
        .eq("handle", handle.toLowerCase())
        .maybeSingle();
      if (cancelled) return;
      setProfile((p as Profile) ?? null);
      if (p) {
        const { data: m } = await supabase
          .from("team_members")
          .select("role,team:teams(*)")
          .eq("user_id", (p as Profile).user_id);
        const ts = (m ?? [])
          .map((x: any) => x.team && ({ ...x.team, role: x.role }))
          .filter(Boolean);
        setTeams(ts);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [handle]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground font-mono text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> // LOADING PILOT
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="container py-20 text-center space-y-3">
          <h1 className="font-display text-3xl">Pilot not found</h1>
        </div>
      </AppShell>
    );
  }

  const initials = profile.handle.slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="container py-10 max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-border flex items-center gap-5"
        >
          <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-accent grid place-items-center font-display text-2xl font-bold ring-2 ring-border">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// PILOT</span>
            <h1 className="font-display text-3xl md:text-4xl font-black truncate">
              {profile.display_name || profile.handle}
            </h1>
            <div className="font-mono text-xs text-muted-foreground">@{profile.handle}</div>
          </div>
        </motion.div>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Teams
          </h2>
          {teams.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">
              Not on any team yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {teams.map((t) => (
                <Link
                  key={t.id}
                  to={`/teams/${t.slug}`}
                  className="glass rounded-xl p-4 border border-border hover:border-primary/60 transition-colors flex items-center gap-3"
                >
                  <TeamLogo team={t} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold truncate">{t.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                      [{t.tag}] · {t.role}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default PlayerProfile;
