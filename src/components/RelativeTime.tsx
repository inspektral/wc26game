"use client";

import { useEffect, useState } from "react";

// "kicks off in 3h 20m" style countdown for upcoming matches. Client-only so it
// stays live; renders nothing on first paint to avoid an SSR/CSR mismatch.
export function RelativeTime({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const diffMin = Math.floor((new Date(iso).getTime() - now) / 60000);
  if (diffMin <= 0) return <>starting…</>;
  if (diffMin < 60) return <>in {diffMin}m</>;

  const hours = Math.floor(diffMin / 60);
  if (hours < 24) {
    const mins = diffMin % 60;
    return <>in {hours}h{mins ? ` ${mins}m` : ""}</>;
  }
  return <>in {Math.floor(hours / 24)}d</>;
}
