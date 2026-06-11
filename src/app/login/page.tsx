"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/app/actions";

const initial: { error?: string } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-pitch-600 py-2.5 font-semibold text-white hover:bg-pitch-700 disabled:opacity-60"
    >
      {pending ? "Joining…" : "Join the game"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initial);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-pitch-700">⚽ WC26 Predictions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Predict the scores, beat your friends. Pick a name and enter the group
          password to join.
        </p>

        <form action={formAction} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Display name
            </label>
            <input
              name="display_name"
              required
              maxLength={30}
              autoComplete="username"
              placeholder="e.g. Phil"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-pitch-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Group password
            </label>
            <input
              name="group_code"
              type="password"
              required
              autoComplete="current-password"
              placeholder="shared with your group"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-pitch-600"
            />
          </div>
          <SubmitButton />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>

        <p className="mt-4 text-xs text-gray-400">
          Use the same name each time to keep your predictions. No email needed.
        </p>
      </div>
    </main>
  );
}
