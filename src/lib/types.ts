export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED";

export interface Match {
  id: number;
  external_id: number;
  home_team: string;
  away_team: string;
  home_code: string | null;
  away_code: string | null;
  home_crest: string | null;
  away_crest: string | null;
  kickoff: string; // ISO timestamp
  stage: string | null;
  group_name: string | null;
  status: MatchStatus;
  home_score: number | null; // full time incl. extra time, excl. penalties
  away_score: number | null;
  result_note: string | null; // e.g. "pens 3–4" / "a.e.t." for knockout matches
  updated_at: string; // ISO timestamp of the last sync that touched this row
}

export interface Prediction {
  id: number;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points: number;
}

export interface Profile {
  id: string;
  display_name: string;
}

export interface LeaderboardRow {
  id: string;
  display_name: string;
  total_points: number;
  exact_hits: number;
  diff_hits: number;
  winner_hits: number;
  scored_matches: number;
  predictions_made: number;
}

export interface MatchStats {
  total: number;
  avg_home: number | null;
  avg_away: number | null;
  home_win_pct: number | null;
  draw_pct: number | null;
  away_win_pct: number | null;
  top_score: string | null;
  top_score_pct: number | null;
}
