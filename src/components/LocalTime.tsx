"use client";

import { useEffect, useState } from "react";
import { formatDateHeader, formatTime } from "@/lib/format";

type Mode = "time" | "date";

// Renders a kickoff time/date in the viewer's local timezone. The server can't
// know the visitor's tz, so it (and the first client render) emit a stable UTC
// fallback — then this swaps to local time after mount. No hydration mismatch.
export function LocalTime({ iso, mode }: { iso: string; mode: Mode }) {
  const fallback = mode === "time" ? formatTime(iso) : formatDateHeader(iso);
  const [text, setText] = useState(fallback);

  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions =
      mode === "time"
        ? { hour: "2-digit", minute: "2-digit" }
        : { weekday: "long", day: "numeric", month: "long" };
    setText(new Intl.DateTimeFormat(undefined, opts).format(new Date(iso)));
  }, [iso, mode]);

  return <span suppressHydrationWarning>{text}</span>;
}
