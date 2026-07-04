import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Claim } from "@/types/claims";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOwnClaim(claimId: string): Promise<Claim> {
  if (!UUID_PATTERN.test(claimId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle<Claim>();

  if (!claim) notFound();
  return claim;
}
