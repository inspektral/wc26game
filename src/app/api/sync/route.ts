import { NextResponse, type NextRequest } from "next/server";
import { fetchMatches } from "@/lib/footballApi";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pulls fixtures + results from football-data.org, upserts them, and recomputes
// every prediction's points. Protected by CRON_SECRET.
//
// Trigger via:
//   - Vercel Cron (see vercel.json) — sends "Authorization: Bearer <CRON_SECRET>"
//   - manually / external cron:  GET /api/sync?secret=<CRON_SECRET>
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qp = request.nextUrl.searchParams.get("secret");
  const ok = secret && (auth === `Bearer ${secret}` || qp === secret);
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const matches = await fetchMatches();
    if (matches.length === 0) {
      return NextResponse.json({ ok: true, upserted: 0, note: "no matches returned" });
    }

    const supabase = createServiceClient();

    const rows = matches.map((m) => ({ ...m, updated_at: new Date().toISOString() }));
    const { error: upsertError } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "external_id" });
    if (upsertError) throw upsertError;

    const { error: rpcError } = await supabase.rpc("recompute_points");
    if (rpcError) throw rpcError;

    return NextResponse.json({
      ok: true,
      upserted: rows.length,
      finished: rows.filter((r) => r.status === "FINISHED").length,
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
