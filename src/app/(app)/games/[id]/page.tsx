import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TeamFlag } from "@/components/TeamFlag";
import PredictionForm from "@/components/PredictionForm";
import { LocalTime } from "@/components/LocalTime";
import { hasKickedOff, stageLabel } from "@/lib/format";
import { POINTS_COLOR, POINTS_LABEL } from "@/lib/scoring";
import { computeStats } from "@/lib/stats";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

interface OtherPick {
  user_id: string;
  home_score: number;
  away_score: number;
  points: number;
  profiles: { display_name: string } | null;
}

export default async function GameDetail({ params }: { params: { id: string } }) {
  const matchId = Number(params.id);
  if (!Number.isInteger(matchId)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (!match) notFound();

  const m = match as Match;
  const kickedOff = hasKickedOff(m.kickoff);
  const finished = m.status === "FINISHED";

  const { data: mine } = await supabase
    .from("predictions")
    .select("home_score, away_score, points")
    .eq("match_id", matchId)
    .eq("user_id", user!.id)
    .maybeSingle();

  // Chill group: everyone's picks + group stats are visible from the start.
  // Read via the service client so this doesn't depend on the RLS read policy.
  const admin = createServiceClient();
  const { data: picks } = await admin
    .from("predictions")
    .select("user_id, home_score, away_score, points, profiles(display_name)")
    .eq("match_id", matchId);
  const others = (picks ?? []) as unknown as OtherPick[];
  const stats = computeStats(others);

  return (
    <div className="space-y-6">
      <Link href="/games" className="text-sm text-gray-500 hover:text-pitch-700">
        ← All matches
      </Link>

      {/* Scoreboard */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="mb-3 text-center text-xs text-gray-500">
          {stageLabel(m.stage, m.group_name)} · <LocalTime iso={m.kickoff} mode="date" /> ·{" "}
          <LocalTime iso={m.kickoff} mode="time" />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamFlag name={m.home_team} code={m.home_code} crest={m.home_crest} />
          <div className="rounded-xl bg-gray-100 px-4 py-2 text-center text-3xl font-extrabold tabular-nums">
            {kickedOff && m.home_score !== null
              ? `${m.home_score} : ${m.away_score}`
              : "vs"}
          </div>
          <TeamFlag name={m.away_team} code={m.away_code} crest={m.away_crest} align="right" />
        </div>
        {finished && (
          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            Full time
          </p>
        )}
      </div>

      {/* Your prediction */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Your prediction</h2>
        {!kickedOff ? (
          <PredictionForm
            matchId={m.id}
            homeTeam={m.home_team}
            awayTeam={m.away_team}
            initialHome={mine?.home_score ?? null}
            initialAway={mine?.away_score ?? null}
          />
        ) : mine ? (
          <div className="flex items-center justify-between rounded-xl border bg-white p-4">
            <span className="text-2xl font-bold tabular-nums">
              {mine.home_score}–{mine.away_score}
            </span>
            {finished && (
              <span className={`rounded px-2 py-1 text-sm font-semibold ${POINTS_COLOR[mine.points]}`}>
                +{mine.points} · {POINTS_LABEL[mine.points]}
              </span>
            )}
          </div>
        ) : (
          <p className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            Match locked — you didn&apos;t predict this one.
          </p>
        )}
        {!kickedOff && (
          <p className="mt-2 text-xs text-gray-400">
            Predictions lock at kickoff — you can change yours until then.
          </p>
        )}
      </section>

      {/* Group stats + everyone's picks */}
      {stats && stats.total > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">The group ({stats.total})</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={m.home_code ?? "Home"} value={`${stats.home_win_pct ?? 0}%`} />
            <Stat label="Draw" value={`${stats.draw_pct ?? 0}%`} />
            <Stat label={m.away_code ?? "Away"} value={`${stats.away_win_pct ?? 0}%`} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat
              label="Avg predicted score"
              value={`${stats.avg_home ?? 0} – ${stats.avg_away ?? 0}`}
            />
            <Stat
              label="Most common pick"
              value={stats.top_score ? stats.top_score.replace("-", "–") : "—"}
              sub={stats.top_score_pct ? `${stats.top_score_pct}%` : undefined}
            />
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Everyone&apos;s picks</h2>
          <div className="divide-y rounded-xl border bg-white">
            {others
              .slice()
              .sort((a, b) => b.points - a.points)
              .map((o) => (
                <div key={o.user_id} className="flex items-center justify-between px-4 py-2.5">
                  <Link
                    href={`/users/${o.user_id}`}
                    className="font-medium hover:text-pitch-700"
                  >
                    {o.profiles?.display_name ?? "Player"}
                    {o.user_id === user!.id && (
                      <span className="ml-1 text-xs text-gray-400">(you)</span>
                    )}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">
                      {o.home_score}–{o.away_score}
                    </span>
                    {finished && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${POINTS_COLOR[o.points]}`}>
                        +{o.points}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  );
}
