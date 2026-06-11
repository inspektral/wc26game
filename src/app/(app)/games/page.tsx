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

  // Group by UTC date.
  const groups = new Map<string, Match[]>();
  for (const m of allMatches) {
    const k = dateKey(m.kickoff);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Matches</h1>
      {[...groups.entries()].map(([key, ms]) => (
        <section key={key}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            <LocalTime iso={ms[0].kickoff} mode="date" />
          </h2>
          <div className="space-y-2">
            {ms.map((m) => (
              <MatchCard key={m.id} match={m} prediction={predByMatch.get(m.id) ?? null} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
