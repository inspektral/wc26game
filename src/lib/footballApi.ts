import type { MatchStatus } from "./types";

// Minimal shape of the football-data.org /v4/competitions/{code}/matches payload.
interface FdTeam {
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}
type FdGoals = { home: number | null; away: number | null };
interface FdScore {
  duration?: string; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
  fullTime: FdGoals; // = regularTime + extraTime + penalties
  halfTime?: FdGoals;
  regularTime?: FdGoals; // score after 90' (only present beyond regulation)
  extraTime?: FdGoals; // goals scored in extra time only
  penalties?: FdGoals;
}
interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string | null;
  group: string | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: FdScore;
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
  result_note: string | null; // e.g. "pens 3–4" or "a.e.t." — null for normal results
}

// Score used for predictions: full time INCLUDING extra time but EXCLUDING the
// penalty shootout. football-data's `fullTime` = regular + extra + penalties,
// so we subtract the shootout back out.
function scoredGoals(score: FdScore): { home: number | null; away: number | null } {
  const ft = score.fullTime ?? { home: null, away: null };
  const penH = score.penalties?.home ?? 0;
  const penA = score.penalties?.away ?? 0;
  return {
    home: ft.home == null ? null : ft.home - penH,
    away: ft.away == null ? null : ft.away - penA,
  };
}

function resultNote(score: FdScore): string | null {
  if (score.duration === "PENALTY_SHOOTOUT" && score.penalties) {
    return `pens ${score.penalties.home}–${score.penalties.away}`;
  }
  if (score.duration === "EXTRA_TIME") return "a.e.t.";
  return null;
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

  return (data.matches ?? []).map((m) => {
    const goals = scoredGoals(m.score ?? { fullTime: { home: null, away: null } });
    return {
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
      home_score: goals.home,
      away_score: goals.away,
      result_note: resultNote(m.score ?? { fullTime: { home: null, away: null } }),
    };
  });
}
