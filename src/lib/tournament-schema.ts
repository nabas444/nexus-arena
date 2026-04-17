import { z } from "zod";

export const tournamentFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80, "Max 80 characters"),
  game: z.string().trim().min(2, "Game is required").max(60),
  organizer: z.string().trim().min(2, "Organizer name is required").max(60),
  format: z.enum(["single-elim", "double-elim"]),
  status: z.enum(["draft", "open"]),
  maxTeams: z.coerce.number().int().min(2, "Min 2 teams").max(256, "Max 256 teams"),
  prizePool: z.coerce.number().int().min(0, "Cannot be negative").max(100_000_000),
  startDate: z.string().min(1, "Start date is required"),
  region: z.string().trim().min(2).max(40),
  bannerHue: z.coerce.number().int().min(0).max(360),
  rules: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

export const defaultTournamentValues: TournamentFormValues = {
  title: "",
  game: "",
  organizer: "",
  format: "single-elim",
  status: "draft",
  maxTeams: 16,
  prizePool: 0,
  startDate: new Date().toISOString().slice(0, 10),
  region: "Global",
  bannerHue: 270,
  rules: "",
};
