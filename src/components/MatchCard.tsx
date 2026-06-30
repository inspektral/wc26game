/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Match, Prediction } from "@/lib/types";
import { TeamFlag } from "./TeamFlag";
import { LocalTime } from "./LocalTime";
import { LiveBadge } from "./LiveBadge";
import { MatchPeriod } from "./MatchPeriod";
import { RelativeTime } from "./RelativeTime";
import { groupOrStageShort, isLiveMatch, stageLabel } from "@/lib/format";
import { POINTS_COLOR } from "@/lib/scoring";

export default function MatchCard({
  match,
  prediction,
  highlight = false,
  past = false,
}: {
  match: Match;
  prediction?: Prediction | null;
  highlight?: boolean;
  past?: boolean;
}) {
  const finished = match.status === "FINISHED";
  const live = isLiveMatch(match.status, match.kickoff);
  const kickedOff = new Date(match.kickoff).getTime() <= Date.now();

  // Compact single-row card for finished matches (less to scroll past).
  if (past) {
    return (
      <Link
        href={`/games/${match.id}`}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:shadow-sm"
      >
        <span className="w-5 shrink-0 text-center text-[10px] font-bold text-gray-400">
          {groupOrStageShort(match.stage, match.group_name)}
        </span>
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <span className="flex min-w-0 items-center justify-end gap-1">
            <span className="truncate">{match.home_team}</span>
            {match.home_crest && (
              <img src={match.home_crest} alt="" className="h-4 w-4 shrink-0 object-contain" />
            )}
          </span>
          <span className="font-bold tabular-nums">
            {match.home_score}–{match.away_score}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            {match.away_crest && (
              <img src={match.away_crest} alt="" className="h-4 w-4 shrink-0 object-contain" />
            )}
            <span className="truncate">{match.away_team}</span>
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-medium text-gray-400">
          {match.result_note ?? "FT"}
        </span>
        {prediction && (
          <span
            className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold ${POINTS_COLOR[prediction.points]}`}
          >
            +{prediction.points}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/games/${match.id}`}
      className={`block rounded-xl border p-3 transition hover:shadow-sm ${
        live
          ? "border-red-500 ring-1 ring-red-500/40"
          : highlight
            ? "border-pitch-600 ring-1 ring-pitch-600/40 hover:border-pitch-700"
            : "hover:border-pitch-600"
      } ${past ? "border-gray-300 bg-gray-200" : "bg-white"}`}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>{stageLabel(match.stage, match.group_name)}</span>
        <span>
          {live ? (
            <span className="inline-flex items-center gap-1.5">
              <LiveBadge />
              <MatchPeriod kickoff={match.kickoff} status={match.status} />
            </span>
          ) : finished ? (
            "Full time"
          ) : (
            <LocalTime iso={match.kickoff} mode="time" />
          )}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamFlag name={match.home_team} code={match.home_code} crest={match.home_crest} />
        <div
          className={`min-w-[52px] rounded-lg px-2 py-1 text-center font-bold tabular-nums ${
            live ? "bg-red-50 text-red-700" : "bg-gray-100"
          }`}
        >
          {kickedOff && match.home_score !== null
            ? `${match.home_score} : ${match.away_score}`
            : "vs"}
        </div>
        <TeamFlag
          name={match.away_team}
          code={match.away_code}
          crest={match.away_crest}
          align="right"
        />
      </div>

      {match.result_note && (
        <p className="mt-1.5 text-center text-[11px] font-medium text-gray-500">
          {match.result_note}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between text-xs">
        {prediction ? (
          <span className="text-gray-600">
            Your pick:{" "}
            <span className="font-semibold tabular-nums">
              {prediction.home_score}–{prediction.away_score}
            </span>
          </span>
        ) : kickedOff ? (
          <span className="text-gray-400">No pick</span>
        ) : (
          <span className="font-medium text-pitch-700">Tap to predict →</span>
        )}

        {finished && prediction && (
          <span className={`rounded px-1.5 py-0.5 font-semibold ${POINTS_COLOR[prediction.points]}`}>
            +{prediction.points}
          </span>
        )}
        {highlight && !kickedOff && !finished && (
          <span className="font-semibold text-pitch-700">
            <RelativeTime iso={match.kickoff} />
          </span>
        )}
      </div>
    </Link>
  );
}
