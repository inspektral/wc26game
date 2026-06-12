import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import { LocalTime } from "@/components/LocalTime";
import { dateKey } from "@/lib/format";
import type { Match, Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: matches }, { data: preds }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user!.id),
  ]);

  const predByMatch = new Map<number, Prediction>();
  (preds ?? []).forEach((p) => predByMatch.set(p.match_id, p as Prediction));
  const predFor = (id: number) => predByMatch.get(id) ?? null;

  const allMatches = (matches ?? []) as Match[];

  if (allMatches.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-600">
        <p className="font-semibold">No fixtures loaded yet.</p>
        <p className="mt-1 text-sm">
          Run the sync job (<code>/api/sync</code>) to pull the World Cup schedule.
        </p>
      </div>
    );
  }

  const now = Date.now();
  const isLive = (m: Match) => m.status === "IN_PLAY" || m.status === "PAUSED";
  const isFinished = (m: Match) => m.status === "FINISHED";

  // "Up next": anything live right now, plus the next batch of matches that kick
  // off at the soonest upcoming time (handles simultaneous kickoffs cleanly).
  const live = allMatches.filter(isLive);
  const upcoming = allMatches.filter(
    (m) => !isLive(m) && !isFinished(m) && new Date(m.kickoff).getTime() > now
  );
  const nextKickoff = upcoming[0]?.kickoff;
  const nextSlot = nextKickoff ? upcoming.filter((m) => m.kickoff === nextKickoff) : [];
  const upNext = [...live, ...nextSlot];

  // "All matches": full schedule grouped by date; finished games are dimmed.
  const groups = new Map<string, Match[]>();
  for (const m of allMatches) {
    const k = dateKey(m.kickoff);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  return (
    <div className="space-y-8">
      {upNext.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-pitch-700">
            Up next
          </h2>
          <div className="space-y-2">
            {upNext.map((m) => (
              <MatchCard key={m.id} match={m} prediction={predFor(m.id)} highlight />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          All matches
        </h2>
        <div className="space-y-6">
          {[...groups.entries()].map(([key, ms]) => {
            const allPast = ms.every(isFinished);
            return (
              <div key={key}>
                <h3
                  className={`mb-2 text-xs font-bold uppercase tracking-wide ${
                    allPast ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  <LocalTime iso={ms[0].kickoff} mode="date" />
                </h3>
                <div className="space-y-2">
                  {ms.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      prediction={predFor(m.id)}
                      past={isFinished(m)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
