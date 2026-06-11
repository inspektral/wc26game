"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendMagicLink } from "@/app/actions";

const initial: { error?: string; sent?: boolean } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-pitch-600 py-2.5 font-semibold text-white hover:bg-pitch-700 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send me a login link"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(sendMagicLink, initial);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-pitch-700">⚽ WC26 Predictions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Predict the scores, beat your friends. Enter your email and we&apos;ll send
          you a magic login link — no password needed.
        </p>

        {state?.sent ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            ✅ Check your inbox for the login link.
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-pitch-600"
            />
            <SubmitButton />
            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
