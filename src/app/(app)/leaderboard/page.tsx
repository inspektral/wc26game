import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .order("exact_hits", { ascending: false });

  const rows = (data ?? []) as LeaderboardRow[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Leaderboard</h1>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-3 py-2">Player</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell" title="Exact scores">3s</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell" title="Goal difference">2s</th>
              <th className="hidden px-3 py-2 text-center sm:table-cell" title="Correct winner">1s</th>
              <th className="px-3 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={r.id} className={r.id === user!.id ? "bg-pitch-50" : ""}>
                <td className="px-3 py-2 font-semibold text-gray-400">{i + 1}</td>
                <td className="px-3 py-2">
                  <Link href={`/users/${r.id}`} className="font-medium hover:text-pitch-700">
                    {r.display_name}
                    {r.id === user!.id && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                  </Link>
                </td>
                <td className="hidden px-3 py-2 text-center tabular-nums text-gray-600 sm:table-cell">{r.exact_hits}</td>
                <td className="hidden px-3 py-2 text-center tabular-nums text-gray-600 sm:table-cell">{r.diff_hits}</td>
                <td className="hidden px-3 py-2 text-center tabular-nums text-gray-600 sm:table-cell">{r.winner_hits}</td>
                <td className="px-3 py-2 text-right text-base font-extrabold tabular-nums">
                  {r.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No players yet.</p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Scoring: exact score = 3 · correct goal difference = 2 · correct winner = 1.
      </p>
    </div>
  );
}
