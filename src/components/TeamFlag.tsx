/* eslint-disable @next/next/no-img-element */

// Tiny presentational helper for a team's crest + name. Crests come from
// football-data.org; we fall back to the 3-letter code if there's no image.
export function TeamFlag({
  name,
  code,
  crest,
  align = "left",
}: {
  name: string;
  code: string | null;
  crest: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {crest ? (
        <img
          src={crest}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0 object-contain"
        />
      ) : (
        <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
          {code ?? "?"}
        </span>
      )}
      <span className="truncate font-medium">{name}</span>
    </div>
  );
}
