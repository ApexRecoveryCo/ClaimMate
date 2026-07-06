"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFolder } from "@/lib/storage-cleanup";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", user.id);

  redirect("/settings?message=Saved.");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Remove storage first — the row cascade can't reach the buckets.
  await removeStorageFolder(supabase, "claim-evidence", user.id);
  await removeStorageFolder(supabase, "claim-exports", user.id);

  const { error } = await supabase.rpc("delete_user");
  if (error) {
    redirect(
      `/settings?error=${encodeURIComponent("Your account couldn't be deleted. Contact support and we'll do it for you.")}`,
    );
  }

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
