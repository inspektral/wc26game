import type { MatchStatus } from "./types";

// Minimal shape of the football-data.org /v4/competitions/{code}/matches payload.
interface FdTeam {
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}
interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string | null;
  group: string | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

export interface NormalizedMatch {
  external_id: number;
  home_team: string;
  away_team: string;
  home_code: string | null;
  away_code: string | null;
  home_crest: string | null;
  away_crest: string | null;
  kickoff: string;
  stage: string | null;
  group_name: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
}

function normalizeStatus(s: string): MatchStatus {
  const allowed: MatchStatus[] = [
    "SCHEDULED", "TIMED", "IN_PLAY", "PAUSED",
    "FINISHED", "SUSPENDED", "POSTPONED", "CANCELLED",
  ];
  return (allowed as string[]).includes(s) ? (s as MatchStatus) : "SCHEDULED";
}

export async function fetchMatches(): Promise<NormalizedMatch[]> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  const comp = process.env.FOOTBALL_DATA_COMPETITION || "WC";
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN is not set");

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${comp}/matches`,
    {
      headers: { "X-Auth-Token": token },
      // Always fetch fresh data when syncing.
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { matches: FdMatch[] };

  return (data.matches ?? []).map((m) => ({
    external_id: m.id,
    home_team: m.homeTeam?.name ?? m.homeTeam?.shortName ?? "TBD",
    away_team: m.awayTeam?.name ?? m.awayTeam?.shortName ?? "TBD",
    home_code: m.homeTeam?.tla ?? null,
    away_code: m.awayTeam?.tla ?? null,
    home_crest: m.homeTeam?.crest ?? null,
    away_crest: m.awayTeam?.crest ?? null,
    kickoff: m.utcDate,
    stage: m.stage,
    group_name: m.group,
    status: normalizeStatus(m.status),
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
  }));
}
