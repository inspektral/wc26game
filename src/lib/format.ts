// All times are rendered in the viewer's local timezone by the browser, but we
// also need stable server-side strings. We use a fixed locale + explicit tz so
// server and client markup match (avoids hydration mismatches).

const DATE_HEADER = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function dateKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD (UTC) — stable grouping key
}

export function formatDateHeader(iso: string): string {
  return DATE_HEADER.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return `${TIME.format(new Date(iso))} UTC`;
}

export function hasKickedOff(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group stage",
  LAST_16: "Round of 16",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
};

const SHORT_STAGE: Record<string, string> = {
  LAST_16: "R16",
  ROUND_OF_16: "R16",
  QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF",
  THIRD_PLACE: "3rd",
  FINAL: "F",
};

// Compact tag: just the group letter ("A"), or a short stage code for knockouts.
export function groupOrStageShort(stage: string | null, group: string | null): string {
  if (group) return group.replace(/group[_ ]?/i, "").trim();
  return stage ? SHORT_STAGE[stage] ?? "" : "";
}

export function stageLabel(stage: string | null, group: string | null): string {
  if (group) return group.replace("GROUP_", "Group ").replace("GROUP", "Group ");
  if (stage && STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  return stage ? stage.replaceAll("_", " ") : "";
}
