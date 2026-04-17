import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tournament } from "@/lib/mock-data";
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
};

const rowToTournament = (r: DBRow): Tournament => ({
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
});

export const tournamentsQueryKey = ["tournaments"] as const;

export function useTournaments() {
  return useQuery({
    queryKey: tournamentsQueryKey,
    queryFn: async (): Promise<Tournament[]> => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id,title,game,format,status,prize_pool,max_teams,registered_teams,start_date,region,banner_hue,organizer")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DBRow[]).map(rowToTournament);
    },
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TournamentFormValues): Promise<Tournament> => {
      const payload = {
        title: values.title,
        game: values.game,
        organizer: values.organizer,
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
        .select("id,title,game,format,status,prize_pool,max_teams,registered_teams,start_date,region,banner_hue,organizer")
        .single();
      if (error) throw error;
      return rowToTournament(data as DBRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentsQueryKey });
    },
  });
}
