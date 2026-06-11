"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// ---- auth -----------------------------------------------------------------

export async function sendMagicLink(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Enter your email." };

  const origin = headers().get("origin") ?? "";
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { sent: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---- predictions ----------------------------------------------------------

export async function savePrediction(_prev: unknown, formData: FormData) {
  const matchId = Number(formData.get("match_id"));
  const home = Number(formData.get("home_score"));
  const away = Number(formData.get("away_score"));

  if (!Number.isInteger(matchId)) return { error: "Bad match." };
  if (![home, away].every((n) => Number.isInteger(n) && n >= 0 && n <= 30)) {
    return { error: "Scores must be whole numbers between 0 and 30." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // RLS enforces "only before kickoff" and "only your own row".
  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: home,
      away_score: away,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    return {
      error:
        "Could not save — the match may have already kicked off.",
    };
  }

  revalidatePath(`/games/${matchId}`);
  revalidatePath("/games");
  return { saved: true };
}

// ---- profile --------------------------------------------------------------

export async function updateDisplayName(_prev: unknown, formData: FormData) {
  const name = String(formData.get("display_name") || "").trim();
  if (name.length < 2 || name.length > 30) {
    return { error: "Name must be 2–30 characters." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/users/${user.id}`);
  return { saved: true };
}
