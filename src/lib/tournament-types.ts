// Shared tournament-domain types — no mock data.

export type TournamentStatus = "draft" | "open" | "ongoing" | "completed";
export type TournamentFormat = "single-elim" | "double-elim";

export interface Tournament {
  id: string;
  title: string;
  game: string;
  format: TournamentFormat;
  status: TournamentStatus;
  prizePool: number;
  maxTeams: number;
  registeredTeams: number;
  startDate: string;
  region: string;
  bannerHue: number;
  organizer: string;
  rules?: string | null;
}
