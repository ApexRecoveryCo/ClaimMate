import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Everything the user has stored, as one JSON file. File contents aren't
// included — evidence metadata lists the storage paths instead.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, claims, evidence, timeline, calls, aiOutputs, policies, exports] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("claims").select("*"),
      supabase.from("evidence_items").select("*"),
      supabase.from("timeline_events").select("*"),
      supabase.from("call_logs").select("*"),
      supabase.from("ai_outputs").select("*"),
      supabase.from("customer_policies").select("*"),
      supabase.from("claim_exports").select("*"),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    claims: claims.data ?? [],
    evidence_items: evidence.data ?? [],
    timeline_events: timeline.data ?? [],
    call_logs: calls.data ?? [],
    ai_outputs: aiOutputs.data ?? [],
    customer_policies: policies.data ?? [],
    claim_exports: exports.data ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="claimmate-export.json"',
    },
  });
}
