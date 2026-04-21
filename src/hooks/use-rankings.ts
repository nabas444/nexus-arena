import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankedTeam {
  id: string;
  name: string;
  tag: string;
  logo_color: string;
  tournament_id: string;
  wins: number;
  losses: number;
  matches_played: number;
  win_rate: number; // 0-100
  momentum: number; // 0-100, weighted by recency
  rating: number; // synthetic ELO-ish score
  rank: number;
}

interface MatchRow {
  id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  winner_id: string | null;
  status: string;
  updated_at: string;
  tournament_id?: string;
}

interface TeamRow {
  id: string;
  name: string;
  tag: string;
  logo_color: string;
  tournament_id: string;
}

const BASE_RATING = 1500;
const WIN_DELTA = 28;
const LOSS_DELTA = 18;

export interface RankingFilters {
  region?: string; // "all" or a region name
  game?: string; // "all" or a game name
  tournamentId?: string; // "all" or a tournament id
}

export const rankingsKey = (filters?: RankingFilters) =>
  [
    "team-rankings",
    filters?.region ?? "all",
    filters?.game ?? "all",
    filters?.tournamentId ?? "all",
  ] as const;

export function useTeamRankings(filters: RankingFilters = {}) {
  const region = filters.region && filters.region !== "all" ? filters.region : undefined;
  const game = filters.game && filters.game !== "all" ? filters.game : undefined;
  const tournamentId =
    filters.tournamentId && filters.tournamentId !== "all" ? filters.tournamentId : undefined;

  return useQuery({
    queryKey: rankingsKey(filters),
    queryFn: async (): Promise<RankedTeam[]> => {
      // Resolve which tournament IDs are in scope based on filters
      let scopedTournamentIds: string[] | null = null;
      if (tournamentId) {
        scopedTournamentIds = [tournamentId];
      } else if (region || game) {
        let q = supabase.from("tournaments").select("id");
        if (region) q = q.eq("region", region);
        if (game) q = q.eq("game", game);
        const { data: regionT, error: rErr } = await q;
        if (rErr) throw rErr;
        scopedTournamentIds = (regionT ?? []).map((t) => t.id);
        if (scopedTournamentIds.length === 0) return [];
      }

      const teamsQuery = supabase
        .from("tournament_teams")
        .select("id,name,tag,logo_color,tournament_id");
      const matchesQuery = supabase
        .from("matches")
        .select("id,team_a_id,team_b_id,winner_id,status,updated_at,tournament_id")
        .eq("status", "completed")
        .order("updated_at", { ascending: true });

      if (scopedTournamentIds) {
        teamsQuery.in("tournament_id", scopedTournamentIds);
        matchesQuery.in("tournament_id", scopedTournamentIds);
      }

      const [{ data: teams, error: tErr }, { data: matches, error: mErr }] = await Promise.all([
        teamsQuery,
        matchesQuery,
      ]);
      if (tErr) throw tErr;
      if (mErr) throw mErr;

      const teamRows = (teams ?? []) as TeamRow[];
      const matchRows = (matches ?? []) as MatchRow[];

      const stats = new Map<
        string,
        { wins: number; losses: number; rating: number; recent: number[] }
      >();
      for (const t of teamRows) {
        stats.set(t.id, { wins: 0, losses: 0, rating: BASE_RATING, recent: [] });
      }

      for (const m of matchRows) {
        if (!m.winner_id || !m.team_a_id || !m.team_b_id) continue;
        const loserId = m.winner_id === m.team_a_id ? m.team_b_id : m.team_a_id;
        const w = stats.get(m.winner_id);
        const l = stats.get(loserId);
        if (w) {
          w.wins += 1;
          w.rating += WIN_DELTA;
          w.recent.push(1);
        }
        if (l) {
          l.losses += 1;
          l.rating = Math.max(1000, l.rating - LOSS_DELTA);
          l.recent.push(0);
        }
      }

      const ranked: RankedTeam[] = teamRows.map((t) => {
        const s = stats.get(t.id)!;
        const played = s.wins + s.losses;
        const win_rate = played === 0 ? 0 : Math.round((s.wins / played) * 100);
        // Momentum: weighted average of last 5 results (most recent counts most)
        const recent = s.recent.slice(-5);
        let momentum = 50; // neutral default
        if (recent.length > 0) {
          let weightSum = 0;
          let acc = 0;
          recent.forEach((r, i) => {
            const w = i + 1;
            weightSum += w;
            acc += r * w;
          });
          momentum = Math.round((acc / weightSum) * 100);
        }
        return {
          id: t.id,
          name: t.name,
          tag: t.tag,
          logo_color: t.logo_color,
          tournament_id: t.tournament_id,
          wins: s.wins,
          losses: s.losses,
          matches_played: played,
          win_rate,
          momentum,
          rating: s.rating,
          rank: 0,
        };
      });

      ranked.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
      });
      ranked.forEach((t, i) => (t.rank = i + 1));
      return ranked;
    },
  });
}

export interface PlatformStats {
  totalPrizePool: number;
  activeTeams: number;
  totalTournaments: number;
  liveTournaments: number;
}

export const platformStatsKey = ["platform-stats"] as const;

export function usePlatformStats() {
  return useQuery({
    queryKey: platformStatsKey,
    queryFn: async (): Promise<PlatformStats> => {
      const [{ data: tournaments, error: tErr }, { count: teamCount, error: cErr }] =
        await Promise.all([
          supabase.from("tournaments").select("prize_pool,status"),
          supabase.from("tournament_teams").select("id", { count: "exact", head: true }),
        ]);
      if (tErr) throw tErr;
      if (cErr) throw cErr;
      const totalPrizePool = (tournaments ?? []).reduce(
        (sum, t: { prize_pool: number }) => sum + Number(t.prize_pool ?? 0),
        0
      );
      const liveTournaments = (tournaments ?? []).filter(
        (t: { status: string }) => t.status === "ongoing"
      ).length;
      return {
        totalPrizePool,
        activeTeams: teamCount ?? 0,
        totalTournaments: (tournaments ?? []).length,
        liveTournaments,
      };
    },
  });
}
