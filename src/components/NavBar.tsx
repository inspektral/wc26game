import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "./NavLinks";

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
      <nav className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:gap-4">
        <Link href="/games" className="shrink-0 text-lg font-extrabold text-pitch-700">
          ⚽<span className="hidden sm:inline"> WC26</span>
        </Link>
        <NavLinks />
        {user && (
          <Link
            href={`/users/${user.id}`}
            className="ml-auto max-w-[40%] truncate text-sm font-semibold text-gray-900 hover:text-pitch-700"
          >
            {name}
          </Link>
        )}
      </nav>
    </header>
  );
}
