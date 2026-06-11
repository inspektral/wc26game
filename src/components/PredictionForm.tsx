"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { savePrediction } from "@/app/actions";

const initial: { error?: string; saved?: boolean } = {};

function Stepper({
  label,
  name,
  value,
  setValue,
}: {
  label: string;
  name: string;
  value: number;
  setValue: (n: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span className="max-w-[96px] truncate text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setValue(Math.max(0, value - 1))}
          className="h-9 w-9 shrink-0 rounded-full border text-lg font-bold text-gray-600 hover:bg-gray-100"
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <input
          name={name}
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          value={value}
          onChange={(e) => setValue(Math.max(0, Math.min(30, Number(e.target.value))))}
          className="w-12 rounded-lg border py-2 text-center text-2xl font-bold tabular-nums outline-none focus:border-pitch-600"
        />
        <button
          type="button"
          onClick={() => setValue(Math.min(30, value + 1))}
          className="h-9 w-9 shrink-0 rounded-full border text-lg font-bold text-gray-600 hover:bg-gray-100"
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function SaveButton({ existing }: { existing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-pitch-600 py-2.5 font-semibold text-white hover:bg-pitch-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : existing ? "Update prediction" : "Place prediction"}
    </button>
  );
}

export default function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  initialHome,
  initialAway,
}: {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  initialHome: number | null;
  initialAway: number | null;
}) {
  const [state, formAction] = useFormState(savePrediction, initial);
  const [home, setHome] = useState(initialHome ?? 0);
  const [away, setAway] = useState(initialAway ?? 0);
  const existing = initialHome !== null;

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-white p-4">
      <input type="hidden" name="match_id" value={matchId} />
      <div className="flex items-end justify-center gap-3">
        <Stepper label={homeTeam} name="home_score" value={home} setValue={setHome} />
        <span className="pb-2 text-xl font-bold text-gray-400">:</span>
        <Stepper label={awayTeam} name="away_score" value={away} setValue={setAway} />
      </div>
      <SaveButton existing={existing} />
      {state?.saved && <p className="text-center text-sm text-green-700">✅ Saved!</p>}
      {state?.error && <p className="text-center text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
