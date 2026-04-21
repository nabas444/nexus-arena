import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LiveMatchRow } from "@/hooks/use-live-matches";

const SELECT = `
  id,tournament_id,round,position,team_a_id,team_b_id,score_a,score_b,status,best_of,winner_id,starts_at,updated_at,
  team_a:tournament_teams!matches_team_a_id_fkey(id,name,tag,logo_color),
  team_b:tournament_teams!matches_team_b_id_fkey(id,name,tag,logo_color),
  tournament:tournaments!matches_tournament_id_fkey(id,title,game)
`;

export interface TournamentMatchRow extends LiveMatchRow {
  updated_at: string;
}

export const tournamentRecentResultsKey = (tournamentId: string) =>
  ["tournament-recent-results", tournamentId] as const;

export const tournamentUpcomingKey = (tournamentId: string) =>
  ["tournament-upcoming", tournamentId] as const;

/**
 * Recent completed matches for a tournament (most-recent first), with realtime sync.
 */
export function useTournamentRecentResults(tournamentId: string | undefined, limit = 6) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;
    const channel = supabase
      .channel(`t-results-${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `tournament_id=eq.${tournamentId}` },
        () => {
          qc.invalidateQueries({ queryKey: tournamentRecentResultsKey(tournamentId) });
          qc.invalidateQueries({ queryKey: tournamentUpcomingKey(tournamentId) });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, qc]);

  return useQuery({
    queryKey: tournamentRecentResultsKey(tournamentId ?? ""),
    enabled: !!tournamentId,
    queryFn: async (): Promise<TournamentMatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(SELECT)
        .eq("tournament_id", tournamentId!)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as TournamentMatchRow[];
    },
  });
}

/**
 * Upcoming matches for a tournament that already have both teams assigned.
 * Earliest rounds first so users see the next playable matches.
 */
export function useTournamentUpcoming(tournamentId: string | undefined, limit = 6) {
  return useQuery({
    queryKey: tournamentUpcomingKey(tournamentId ?? ""),
    enabled: !!tournamentId,
    queryFn: async (): Promise<TournamentMatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(SELECT)
        .eq("tournament_id", tournamentId!)
        .eq("status", "upcoming")
        .not("team_a_id", "is", null)
        .not("team_b_id", "is", null)
        .order("round", { ascending: true })
        .order("position", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as TournamentMatchRow[];
    },
  });
}
