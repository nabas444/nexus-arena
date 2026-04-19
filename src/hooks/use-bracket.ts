import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BracketTeam {
  id: string;
  tournament_id: string;
  name: string;
  tag: string;
  logo_color: string;
  seed: number | null;
}

export interface BracketMatch {
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
  next_match_id: string | null;
  next_slot: "A" | "B" | null;
  starts_at: string | null;
}

export const teamsKey = (tournamentId: string) => ["bracket-teams", tournamentId] as const;
export const matchesKey = (tournamentId: string) => ["bracket-matches", tournamentId] as const;

export function useTournamentTeams(tournamentId: string | undefined) {
  return useQuery({
    queryKey: teamsKey(tournamentId ?? ""),
    enabled: !!tournamentId,
    queryFn: async (): Promise<BracketTeam[]> => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("id,tournament_id,name,tag,logo_color,seed")
        .eq("tournament_id", tournamentId!)
        .order("seed", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as BracketTeam[];
    },
  });
}

export function useBracketMatches(tournamentId: string | undefined) {
  return useQuery({
    queryKey: matchesKey(tournamentId ?? ""),
    enabled: !!tournamentId,
    queryFn: async (): Promise<BracketMatch[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id,tournament_id,round,position,team_a_id,team_b_id,score_a,score_b,status,best_of,winner_id,next_match_id,next_slot,starts_at"
        )
        .eq("tournament_id", tournamentId!)
        .order("round", { ascending: true })
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BracketMatch[];
    },
  });
}

export function useAddTeam(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; tag: string; logo_color?: string }) => {
      const { error } = await supabase.from("tournament_teams").insert({
        tournament_id: tournamentId,
        name: input.name.trim(),
        tag: input.tag.trim().toUpperCase().slice(0, 4),
        logo_color: input.logo_color ?? randomLogoColor(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamsKey(tournamentId) });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useRemoveTeam(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("tournament_teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamsKey(tournamentId) });
      qc.invalidateQueries({ queryKey: matchesKey(tournamentId) });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

/**
 * Standard single-elimination seeding: pairs top seed vs bottom seed at every level.
 * Input: count (must be power of 2). Returns 0-indexed positions.
 * For 8: [0,7,3,4,1,6,2,5] — match 0: seed1 vs seed8, match 1: seed4 vs seed5, etc.
 */
function seedOrder(n: number): number[] {
  let order = [0];
  while (order.length < n) {
    const next: number[] = [];
    const size = order.length * 2;
    for (const s of order) {
      next.push(s);
      next.push(size - 1 - s);
    }
    order = next;
  }
  return order;
}

export function useGenerateBracket(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { teams: BracketTeam[]; bestOf?: number }) => {
      const { teams, bestOf = 3 } = input;
      const n = teams.length;
      if (n < 2) throw new Error("Need at least 2 teams to generate a bracket.");
      if ((n & (n - 1)) !== 0) {
        throw new Error(`Team count (${n}) must be a power of 2 (2, 4, 8, 16, 32...).`);
      }

      // Wipe any previous bracket for this tournament
      const { error: delErr } = await supabase
        .from("matches")
        .delete()
        .eq("tournament_id", tournamentId);
      if (delErr) throw delErr;

      // Assign seeds 1..n if missing (use existing order)
      const seeded = teams.map((t, i) => ({ ...t, seed: t.seed ?? i + 1 }));
      seeded.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

      const order = seedOrder(n); // length n, gives seed indexes for round 1 slots
      const totalRounds = Math.log2(n);

      // Build matches per round, latest round first so we know IDs to point to
      // Strategy: insert all rounds, then update next_match_id/next_slot via id mapping.
      // Pre-generate UUIDs client-side to wire next pointers in one pass.
      const newId = () => crypto.randomUUID();
      type Row = {
        id: string;
        tournament_id: string;
        round: number;
        position: number;
        team_a_id: string | null;
        team_b_id: string | null;
        status: "upcoming";
        best_of: number;
        next_match_id: string | null;
        next_slot: "A" | "B" | null;
      };
      const rows: Row[] = [];
      const roundMatches: Row[][] = [];

      for (let r = 0; r < totalRounds; r++) {
        const matchesInRound = n / Math.pow(2, r + 1);
        const arr: Row[] = [];
        for (let p = 0; p < matchesInRound; p++) {
          arr.push({
            id: newId(),
            tournament_id: tournamentId,
            round: r,
            position: p,
            team_a_id: null,
            team_b_id: null,
            status: "upcoming",
            best_of: r === totalRounds - 1 ? Math.max(bestOf, 5) : bestOf,
            next_match_id: null,
            next_slot: null,
          });
        }
        roundMatches.push(arr);
        rows.push(...arr);
      }

      // Wire next pointers
      for (let r = 0; r < totalRounds - 1; r++) {
        const cur = roundMatches[r];
        const next = roundMatches[r + 1];
        for (let p = 0; p < cur.length; p++) {
          const target = next[Math.floor(p / 2)];
          cur[p].next_match_id = target.id;
          cur[p].next_slot = p % 2 === 0 ? "A" : "B";
        }
      }

      // Place seeds into round 0
      for (let i = 0; i < order.length / 2; i++) {
        const aIdx = order[i * 2];
        const bIdx = order[i * 2 + 1];
        roundMatches[0][i].team_a_id = seeded[aIdx]?.id ?? null;
        roundMatches[0][i].team_b_id = seeded[bIdx]?.id ?? null;
      }

      // Persist seed assignment back to teams
      const seedUpdates = seeded.map((t, i) =>
        supabase.from("tournament_teams").update({ seed: i + 1 }).eq("id", t.id)
      );
      await Promise.all(seedUpdates);

      const { error: insErr } = await supabase.from("matches").insert(rows);
      if (insErr) throw insErr;

      // Mark tournament ongoing
      await supabase.from("tournaments").update({ status: "ongoing" }).eq("id", tournamentId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchesKey(tournamentId) });
      qc.invalidateQueries({ queryKey: teamsKey(tournamentId) });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdateMatchScore(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { match: BracketMatch; scoreA: number; scoreB: number }) => {
      const { match, scoreA, scoreB } = input;
      const winsNeeded = Math.ceil(match.best_of / 2);
      let status: "upcoming" | "live" | "completed" = "live";
      let winner_id: string | null = null;

      if (scoreA === 0 && scoreB === 0) status = "upcoming";
      if (scoreA >= winsNeeded && scoreA > scoreB) {
        status = "completed";
        winner_id = match.team_a_id;
      } else if (scoreB >= winsNeeded && scoreB > scoreA) {
        status = "completed";
        winner_id = match.team_b_id;
      }

      const { error } = await supabase
        .from("matches")
        .update({ score_a: scoreA, score_b: scoreB, status, winner_id })
        .eq("id", match.id);
      if (error) throw error;

      // Propagate to next match
      if (winner_id && match.next_match_id && match.next_slot) {
        const patch = match.next_slot === "A"
          ? { team_a_id: winner_id }
          : { team_b_id: winner_id };
        const { error: nErr } = await supabase
          .from("matches")
          .update(patch)
          .eq("id", match.next_match_id);
        if (nErr) throw nErr;
      } else if (!winner_id && match.next_match_id && match.next_slot) {
        // Score was rolled back below decisive — clear feeder slot in next match
        const patch = match.next_slot === "A"
          ? { team_a_id: null }
          : { team_b_id: null };
        await supabase.from("matches").update(patch).eq("id", match.next_match_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchesKey(tournamentId) });
    },
  });
}

function randomLogoColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `${hue} 90% 60%`;
}
