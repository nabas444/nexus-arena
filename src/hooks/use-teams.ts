import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  tag: string;
  slug: string;
  logo_color: string;
  bio: string | null;
  region: string;
  captain_id: string;
  verified: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { handle: string; display_name: string | null; avatar_url: string | null };
}

export interface TeamInvite {
  id: string;
  team_id: string;
  invited_handle: string;
  invited_user_id: string | null;
  invited_by: string;
  status: string;
  created_at: string;
  team?: Team;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
    setTeams((data as Team[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("teams-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => load())
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [load]);

  return { teams, loading, refresh: load };
}

export function useTeam(slug: string | undefined) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data: t } = await supabase.from("teams").select("*").eq("slug", slug).maybeSingle();
    setTeam((t as Team) ?? null);
    if (t) {
      const [{ data: m }, { data: inv }] = await Promise.all([
        supabase.from("team_members").select("*").eq("team_id", (t as Team).id),
        supabase.from("team_invites").select("*").eq("team_id", (t as Team).id).eq("status", "pending"),
      ]);
      const userIds = ((m as TeamMember[]) ?? []).map((x) => x.user_id);
      let profilesMap = new Map<string, any>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,handle,display_name,avatar_url")
          .in("user_id", userIds);
        profilesMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      }
      setMembers(
        ((m as TeamMember[]) ?? []).map((x) => ({ ...x, profile: profilesMap.get(x.user_id) }))
      );
      setInvites((inv as TeamInvite[]) ?? []);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
    if (!slug) return;
    const ch = supabase
      .channel(`team-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_invites" }, () => load())
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [slug, load]);

  return { team, members, invites, loading, refresh: load };
}

export function useMyInvites(userId: string | undefined) {
  const [invites, setInvites] = useState<TeamInvite[]>([]);

  const load = useCallback(async () => {
    if (!userId) return setInvites([]);
    const { data } = await supabase
      .from("team_invites")
      .select("*, team:teams(*)")
      .eq("invited_user_id", userId)
      .eq("status", "pending");
    setInvites((data as any) ?? []);
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const ch = supabase
      .channel(`my-invites-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_invites", filter: `invited_user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [userId, load]);

  return { invites, refresh: load };
}

export function useMyTeams(userId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([]);
  const load = useCallback(async () => {
    if (!userId) return setTeams([]);
    const { data: m } = await supabase.from("team_members").select("team_id").eq("user_id", userId);
    const ids = (m ?? []).map((x: any) => x.team_id);
    if (!ids.length) return setTeams([]);
    const { data: t } = await supabase.from("teams").select("*").in("id", ids);
    setTeams((t as Team[]) ?? []);
  }, [userId]);
  useEffect(() => {
    load();
  }, [load]);
  return { teams, refresh: load };
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
