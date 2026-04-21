import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tournament } from "@/lib/tournament-types";
import type { TournamentFormValues } from "@/lib/tournament-schema";

type DBRow = {
  id: string;
  title: string;
  game: string;
  format: "single-elim" | "double-elim";
  status: "draft" | "open" | "ongoing" | "completed";
  prize_pool: number;
  max_teams: number;
  registered_teams: number;
  start_date: string;
  region: string;
  banner_hue: number;
  organizer: string;
  organizer_id: string | null;
  rules: string | null;
};

export type TournamentWithOwner = Tournament & { organizerId: string | null };

const rowToTournament = (r: DBRow): TournamentWithOwner => ({
  id: r.id,
  title: r.title,
  game: r.game,
  format: r.format,
  status: r.status,
  prizePool: Number(r.prize_pool),
  maxTeams: r.max_teams,
  registeredTeams: r.registered_teams,
  startDate: r.start_date,
  region: r.region,
  bannerHue: r.banner_hue,
  organizer: r.organizer,
  organizerId: r.organizer_id,
  rules: r.rules,
});

const SELECT_COLS =
  "id,title,game,format,status,prize_pool,max_teams,registered_teams,start_date,region,banner_hue,organizer,organizer_id,rules";

export const tournamentsQueryKey = ["tournaments"] as const;

export function useTournaments() {
  return useQuery({
    queryKey: tournamentsQueryKey,
    queryFn: async (): Promise<TournamentWithOwner[]> => {
      const { data, error } = await supabase
        .from("tournaments")
        .select(SELECT_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DBRow[]).map(rowToTournament);
    },
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TournamentFormValues): Promise<TournamentWithOwner> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in to create a tournament.");

      const payload = {
        title: values.title,
        game: values.game,
        organizer: values.organizer,
        organizer_id: userData.user.id,
        format: values.format,
        status: values.status,
        max_teams: values.maxTeams,
        prize_pool: values.prizePool,
        start_date: values.startDate,
        region: values.region,
        banner_hue: values.bannerHue,
        rules: values.rules || null,
      };
      const { data, error } = await supabase
        .from("tournaments")
        .insert(payload)
        .select(SELECT_COLS)
        .single();
      if (error) throw error;
      return rowToTournament(data as DBRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentsQueryKey });
    },
  });
}

export function useDeleteTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournaments").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentsQueryKey });
    },
  });
}
