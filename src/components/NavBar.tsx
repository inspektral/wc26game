import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function NavBar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = "";
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    name = data?.display_name ?? "";
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <Link href="/games" className="text-lg font-extrabold text-pitch-700">
          ⚽ WC26
        </Link>
        <Link href="/games" className="text-sm font-medium text-gray-700 hover:text-pitch-700">
          Games
        </Link>
        <Link href="/leaderboard" className="text-sm font-medium text-gray-700 hover:text-pitch-700">
          Leaderboard
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {user && (
            <>
              <Link
                href={`/users/${user.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-pitch-700"
              >
                {name}
              </Link>
              <form action={signOut}>
                <button className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
              </form>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
