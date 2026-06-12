import Link from "next/link";
import type { Match, Prediction } from "@/lib/types";
import { TeamFlag } from "./TeamFlag";
import { LocalTime } from "./LocalTime";
import { LiveBadge } from "./LiveBadge";
import { stageLabel } from "@/lib/format";
import { POINTS_COLOR } from "@/lib/scoring";

export default function MatchCard({
  match,
  prediction,
}: {
  match: Match;
  prediction?: Prediction | null;
}) {
  const finished = match.status === "FINISHED";
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const kickedOff = new Date(match.kickoff).getTime() <= Date.now();

  return (
    <Link
      href={`/games/${match.id}`}
      className="block rounded-xl border bg-white p-3 transition hover:border-pitch-600 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>{stageLabel(match.stage, match.group_name)}</span>
        <span>
          {live ? (
            <LiveBadge />
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
      </div>
    </Link>
  );
}
