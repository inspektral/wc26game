"use client";

import { useEffect, useState } from "react";

// The free football-data tier gives no match clock, so we show a coarse PERIOD
// rather than a misleading minute. "Half-time" is exact (API PAUSED status);
// first vs second half is inferred from elapsed time, so it's only fuzzy right
// around the boundary — but it never shows a precise number that can't be trusted.
function halfLabel(kickoffMs: number, now: number): string {
  const elapsedMin = Math.floor((now - kickoffMs) / 60000);
  return elapsedMin < 60 ? "First half" : "Second half";
}

export function MatchPeriod({ kickoff, status }: { kickoff: string; status: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (status !== "IN_PLAY" && status !== "PAUSED") return null;
  if (status === "PAUSED") {
    return <span className="text-xs font-bold text-green-600">Half-time</span>;
  }
  if (now === null) return null; // first paint: avoid SSR/CSR mismatch

  return (
    <span className="text-xs font-bold text-green-600">
      {halfLabel(new Date(kickoff).getTime(), now)}
    </span>
  );
}
