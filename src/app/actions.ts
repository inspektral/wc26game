"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---- auth -----------------------------------------------------------------

// Turn a display name into a stable, email-shaped login id. The name IS the
// identity: same name => same account (everyone shares the group password).
function nameToEmail(name: string): string {
  const slug =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "player";
  return `${slug}@wc26.game`;
}

// No-email login: pick a display name + enter the shared group password.
// Verified against GROUP_PASSWORD, then mapped onto a Supabase email/password
// account behind the scenes so all RLS / anti-cheat keeps working unchanged.
export async function login(_prev: unknown, formData: FormData) {
  const name = String(formData.get("display_name") || "").trim();
  const code = String(formData.get("group_code") || "");

  if (name.length < 2 || name.length > 30) {
    return { error: "Pick a display name (2–30 characters)." };
  }
  if (!process.env.GROUP_PASSWORD) {
    return { error: "Server is missing GROUP_PASSWORD — set it in the env." };
  }
  if (code !== process.env.GROUP_PASSWORD) {
    return { error: "Wrong group password." };
  }

  const email = nameToEmail(name);
  const password = process.env.GROUP_PASSWORD;
  const supabase = createClient();

  // Returning player: just sign in.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // First time with this name: create the account.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (signUpError) return { error: signUpError.message };
    if (!data.session) {
      return {
        error:
          "Email confirmation is still ON in Supabase. Turn it OFF (Authentication → Providers → Email) and try again.",
      };
    }
  }

  redirect("/games");
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
