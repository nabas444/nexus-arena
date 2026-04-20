import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LiveMatchRow {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: "upcoming" | "live" | "completed";
  best_of: number;
  winner_id: string | null;
  starts_at: string | null;
  team_a: { id: string; name: string; tag: string; logo_color: string } | null;
  team_b: { id: string; name: string; tag: string; logo_color: string } | null;
  tournament: { id: string; title: string; game: string } | null;
}

export const liveMatchesKey = ["live-matches"] as const;
export const upcomingMatchesKey = ["upcoming-matches"] as const;

const SELECT = `
  id,tournament_id,round,position,team_a_id,team_b_id,score_a,score_b,status,best_of,winner_id,starts_at,
  team_a:tournament_teams!matches_team_a_id_fkey(id,name,tag,logo_color),
  team_b:tournament_teams!matches_team_b_id_fkey(id,name,tag,logo_color),
  tournament:tournaments!matches_tournament_id_fkey(id,title,game)
`;

export function useLiveMatches() {
  const qc = useQueryClient();

  // Realtime subscription — invalidate live + upcoming on any matches change
  useEffect(() => {
    const channel = supabase
      .channel("match-day-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          qc.invalidateQueries({ queryKey: liveMatchesKey });
          qc.invalidateQueries({ queryKey: upcomingMatchesKey });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: liveMatchesKey,
    queryFn: async (): Promise<LiveMatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(SELECT)
        .eq("status", "live")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LiveMatchRow[];
    },
    refetchOnWindowFocus: true,
  });
}

export function useUpcomingMatches() {
  return useQuery({
    queryKey: upcomingMatchesKey,
    queryFn: async (): Promise<LiveMatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(SELECT)
        .eq("status", "upcoming")
        .not("team_a_id", "is", null)
        .not("team_b_id", "is", null)
        .order("round", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as unknown as LiveMatchRow[];
    },
  });
}
