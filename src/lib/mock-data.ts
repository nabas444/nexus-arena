// Mock data for Nexus Arena visual prototype.
// All teams/tournaments/matches are fictional and used purely for UI rendering.

export type TeamStatus = "online" | "offline" | "in-match";
export type MatchStatus = "live" | "upcoming" | "completed";
export type TournamentStatus = "draft" | "open" | "ongoing" | "completed";
export type TournamentFormat = "single-elim" | "double-elim";

export interface Team {
  id: string;
  name: string;
  tag: string;
  logoColor: string; // hsl tuple as CSS string
  rank: number;
  rating: number; // ELO-like
  wins: number;
  losses: number;
  momentum: number; // 0-100
  region: string;
  status: TeamStatus;
}

export interface Player {
  id: string;
  handle: string;
  role: string;
  rating: number;
  kdr: number;
  isStar?: boolean;
}

export interface Match {
  id: string;
  round: number;
  position: number; // vertical position within round
  teamA?: Team;
  teamB?: Team;
  scoreA?: number;
  scoreB?: number;
  status: MatchStatus;
  startsAt?: string; // ISO
  bestOf: number;
  winnerId?: string;
}

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
  bannerHue: number; // 0-360 for gradient
  organizer: string;
  viewers?: number;
}

const team = (
  id: string,
  name: string,
  tag: string,
  logoColor: string,
  rank: number,
  rating: number,
  wins: number,
  losses: number,
  momentum: number,
  region = "EU",
  status: TeamStatus = "online"
): Team => ({ id, name, tag, logoColor, rank, rating, wins, losses, momentum, region, status });

export const teams: Team[] = [
  team("t1", "Quantum Surge", "QSR", "187 100% 55%", 1, 2480, 38, 6, 92, "EU", "in-match"),
  team("t2", "Void Reapers", "VRP", "270 95% 65%", 2, 2410, 35, 9, 78, "NA", "online"),
  team("t3", "Neon Phantoms", "NPH", "320 100% 60%", 3, 2380, 33, 11, 65, "APAC", "online"),
  team("t4", "Iron Sentinels", "IRS", "45 100% 60%", 4, 2350, 31, 12, 58, "EU", "in-match"),
  team("t5", "Crimson Echo", "CRE", "0 95% 60%", 5, 2310, 30, 14, 71, "NA", "online"),
  team("t6", "Stellar Drift", "STD", "190 90% 60%", 6, 2280, 28, 15, 44, "SA", "offline"),
  team("t7", "Hollow Kings", "HLK", "260 80% 60%", 7, 2240, 27, 16, 38, "EU", "online"),
  team("t8", "Apex Wraiths", "APW", "142 90% 55%", 8, 2210, 26, 17, 81, "NA", "in-match"),
  team("t9", "Nova Strike", "NVS", "30 95% 60%", 9, 2180, 24, 18, 52, "APAC", "online"),
  team("t10", "Cipher Knights", "CPK", "210 95% 60%", 10, 2150, 23, 19, 33, "EU", "online"),
  team("t11", "Oblivion Pact", "OBP", "300 90% 60%", 11, 2120, 22, 20, 47, "NA", "offline"),
  team("t12", "Frost Wardens", "FRW", "180 95% 60%", 12, 2095, 21, 21, 28, "EU", "online"),
];

export const tournaments: Tournament[] = [
  {
    id: "tour1",
    title: "Midnight Arena Cup",
    game: "Tactical FPS",
    format: "double-elim",
    status: "ongoing",
    prizePool: 250000,
    maxTeams: 16,
    registeredTeams: 16,
    startDate: "2025-04-12",
    region: "Global",
    bannerHue: 270,
    organizer: "Nexus Esports",
    viewers: 142503,
  },
  {
    id: "tour2",
    title: "Summer Showdown 2025",
    game: "MOBA Championship",
    format: "single-elim",
    status: "open",
    prizePool: 500000,
    maxTeams: 32,
    registeredTeams: 21,
    startDate: "2025-05-20",
    region: "EU + NA",
    bannerHue: 187,
    organizer: "Vanguard League",
  },
  {
    id: "tour3",
    title: "Phantom League Finals",
    game: "Battle Royale",
    format: "single-elim",
    status: "ongoing",
    prizePool: 120000,
    maxTeams: 8,
    registeredTeams: 8,
    startDate: "2025-04-15",
    region: "APAC",
    bannerHue: 320,
    organizer: "Phantom Org",
    viewers: 38421,
  },
  {
    id: "tour4",
    title: "Rookie Rumble Open",
    game: "Tactical FPS",
    format: "single-elim",
    status: "open",
    prizePool: 25000,
    maxTeams: 64,
    registeredTeams: 47,
    startDate: "2025-04-28",
    region: "Global",
    bannerHue: 142,
    organizer: "Open Circuit",
  },
  {
    id: "tour5",
    title: "Apex Invitational",
    game: "Hero Shooter",
    format: "double-elim",
    status: "completed",
    prizePool: 1000000,
    maxTeams: 12,
    registeredTeams: 12,
    startDate: "2025-03-02",
    region: "Global",
    bannerHue: 30,
    organizer: "Apex Productions",
  },
  {
    id: "tour6",
    title: "Cyber Clash Weekly",
    game: "Tactical FPS",
    format: "single-elim",
    status: "draft",
    prizePool: 5000,
    maxTeams: 16,
    registeredTeams: 0,
    startDate: "2025-05-05",
    region: "EU",
    bannerHue: 210,
    organizer: "Community",
  },
];

// Build a 16-team single-elim bracket for "Midnight Arena Cup"
// Rounds: 0 = R16 (8 matches), 1 = QF (4), 2 = SF (2), 3 = Final (1)
const seeded = [...teams, ...teams.slice(0, 4)].slice(0, 16); // pad to 16

function buildBracket(): Match[] {
  const matches: Match[] = [];
  // Round 0: R16
  for (let i = 0; i < 8; i++) {
    const a = seeded[i * 2];
    const b = seeded[i * 2 + 1];
    const status: MatchStatus = i < 4 ? "completed" : i < 6 ? "live" : "upcoming";
    const scoreA = status === "upcoming" ? undefined : status === "live" ? Math.floor(Math.random() * 2) + 1 : a.rating > b.rating ? 2 : 0;
    const scoreB = status === "upcoming" ? undefined : status === "live" ? Math.floor(Math.random() * 2) : a.rating > b.rating ? 0 : 2;
    matches.push({
      id: `m-r0-${i}`,
      round: 0,
      position: i,
      teamA: a,
      teamB: b,
      scoreA,
      scoreB,
      status,
      bestOf: 3,
      startsAt: status === "upcoming" ? new Date(Date.now() + (i - 5) * 3600_000).toISOString() : undefined,
      winnerId: status === "completed" ? (a.rating > b.rating ? a.id : b.id) : undefined,
    });
  }
  // Round 1: QF (4) — winners of completed R16 match 0,1 advance; rest empty
  for (let i = 0; i < 4; i++) {
    const m1 = matches[i * 2];
    const m2 = matches[i * 2 + 1];
    const aWin = m1.winnerId ? (m1.teamA?.id === m1.winnerId ? m1.teamA : m1.teamB) : undefined;
    const bWin = m2.winnerId ? (m2.teamA?.id === m2.winnerId ? m2.teamA : m2.teamB) : undefined;
    const status: MatchStatus = i < 1 && aWin && bWin ? "completed" : i < 2 && aWin && bWin ? "upcoming" : "upcoming";
    matches.push({
      id: `m-r1-${i}`,
      round: 1,
      position: i,
      teamA: aWin,
      teamB: bWin,
      scoreA: status === "completed" ? 2 : undefined,
      scoreB: status === "completed" ? 1 : undefined,
      status,
      bestOf: 5,
      startsAt: new Date(Date.now() + (i + 4) * 3600_000).toISOString(),
      winnerId: status === "completed" ? aWin?.id : undefined,
    });
  }
  // Round 2: SF
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `m-r2-${i}`,
      round: 2,
      position: i,
      status: "upcoming",
      bestOf: 5,
      startsAt: new Date(Date.now() + (i + 12) * 3600_000).toISOString(),
    });
  }
  // Round 3: Final
  matches.push({
    id: "m-r3-0",
    round: 3,
    position: 0,
    status: "upcoming",
    bestOf: 7,
    startsAt: new Date(Date.now() + 36 * 3600_000).toISOString(),
  });
  return matches;
}

export const bracket: Match[] = buildBracket();
export const roundLabels = ["Round of 16", "Quarterfinals", "Semifinals", "Grand Final"];

export const liveMatches: Match[] = bracket.filter((m) => m.status === "live");
export const upcomingMatches: Match[] = bracket.filter((m) => m.status === "upcoming").slice(0, 4);

// Featured tournament for "watch live" sections
export const featuredTournament = tournaments[0];

export const players: Player[] = [
  { id: "p1", handle: "Vex0r", role: "Duelist", rating: 1.42, kdr: 1.8, isStar: true },
  { id: "p2", handle: "NoxByte", role: "Controller", rating: 1.21, kdr: 1.3 },
  { id: "p3", handle: "Echo.7", role: "Sentinel", rating: 1.18, kdr: 1.2 },
  { id: "p4", handle: "Krypt", role: "Initiator", rating: 1.31, kdr: 1.5, isStar: true },
  { id: "p5", handle: "Mirage", role: "Flex", rating: 1.09, kdr: 1.1 },
];

export function formatPrize(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
