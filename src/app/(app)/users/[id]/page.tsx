import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import DisplayNameForm from "@/components/DisplayNameForm";
import { signOut } from "@/app/actions";
import { POINTS_COLOR } from "@/lib/scoring";
import { LocalTime } from "@/components/LocalTime";
import { hasKickedOff, stageLabel } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PickRow {
  match_id: number;
  home_score: number;
  away_score: number;
  points: number;
  matches: {
    home_team: string;
    away_team: string;
    home_code: string | null;
    away_code: string | null;
    kickoff: string;
    stage: string | null;
    group_name: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
  } | null;
}

export default async function UserDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSelf = user!.id === params.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", params.id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: statsRow } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const stats = statsRow as LeaderboardRow | null;

  // Chill group: a player's full prediction record is visible to everyone.
  const admin = createServiceClient();
  const { data: picksData } = await admin
    .from("predictions")
    .select(
      "match_id, home_score, away_score, points, matches(home_team, away_team, home_code, away_code, kickoff, stage, group_name, status, home_score, away_score)"
    )
    .eq("user_id", params.id);

  const picks = ((picksData ?? []) as unknown as PickRow[])
    .filter((p) => p.matches)
    .sort((a, b) => (a.matches!.kickoff < b.matches!.kickoff ? 1 : -1));

  return (
    <div className="space-y-6">
      <Link href="/leaderboard" className="text-sm text-gray-500 hover:text-pitch-700">
        ← Leaderboard
      </Link>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{profile.display_name}</h1>
          <div className="text-right">
            <div className="text-3xl font-extrabold tabular-nums text-pitch-700">
              {stats?.total_points ?? 0}
            </div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>

        {isSelf && (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Display name</p>
              <DisplayNameForm current={profile.display_name} />
            </div>
            <form action={signOut}>
              <button className="rounded-lg border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">
                Sign out
              </button>
            </form>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Mini label="Exact" value={stats?.exact_hits ?? 0} />
          <Mini label="Goal diff" value={stats?.diff_hits ?? 0} />
          <Mini label="Winner" value={stats?.winner_hits ?? 0} />
          <Mini label="Played" value={stats?.scored_matches ?? 0} />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold">
          {isSelf ? "Your predictions" : "Predictions"}
        </h2>
        {picks.length === 0 ? (
          <p className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            {isSelf
              ? "No predictions yet — head to Matches and place some!"
              : "No predictions yet."}
          </p>
        ) : (
          <div className="divide-y rounded-xl border bg-white">
            {picks.map((p) => {
              const mt = p.matches!;
              const finished = mt.status === "FINISHED";
              const showResult = hasKickedOff(mt.kickoff) && mt.home_score !== null;
              return (
                <Link
                  key={p.match_id}
                  href={`/games/${p.match_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {mt.home_team} v {mt.away_team}
                    </div>
                    <div className="text-xs text-gray-400">
                      {stageLabel(mt.stage, mt.group_name)} · <LocalTime iso={mt.kickoff} mode="date" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-3">
                    <div className="text-right text-xs text-gray-500">
                      <div>
                        pick{" "}
                        <span className="font-semibold tabular-nums text-gray-800">
                          {p.home_score}–{p.away_score}
                        </span>
                      </div>
                      {showResult && (
                        <div>
                          actual{" "}
                          <span className="font-semibold tabular-nums text-gray-800">
                            {mt.home_score}–{mt.away_score}
                          </span>
                        </div>
                      )}
                    </div>
                    {finished && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${POINTS_COLOR[p.points]}`}
                      >
                        +{p.points}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
