import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server-side jobs with no user session
// (e.g. Stripe webhooks). Bypasses RLS — never import outside server code,
// and never use it for user-initiated reads/writes.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
