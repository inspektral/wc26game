"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetches the current server component on an interval (used while a match is
// live) so the score/last-updated refresh without a manual reload. Only as
// fresh as the latest sync, but saves the user from hitting reload.
export function AutoRefresh({ seconds = 45 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
