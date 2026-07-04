import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// RLS enforces admin-only writes regardless; this guard just keeps
// non-admins out of the admin UI.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  if (!profile?.is_admin) redirect("/dashboard");
  return { supabase, user };
}
