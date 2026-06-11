"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateDisplayName } from "@/app/actions";

const initial: { error?: string; saved?: boolean } = {};

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export default function DisplayNameForm({ current }: { current: string }) {
  const [state, formAction] = useFormState(updateDisplayName, initial);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="display_name"
        defaultValue={current}
        maxLength={30}
        className="w-40 rounded-lg border px-2 py-1.5 text-sm outline-none focus:border-pitch-600"
      />
      <Save />
      {state?.saved && <span className="text-xs text-green-700">Saved</span>}
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
