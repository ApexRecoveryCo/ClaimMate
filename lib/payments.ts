import { type SupabaseClient } from "@supabase/supabase-js";

// Payments are env-gated: with no Stripe configuration, evidence packs are
// free (useful for development and early beta). Configure all three env vars
// to charge for packs.
export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_ID &&
      process.env.STRIPE_WEBHOOK_SECRET,
  );
}

export async function hasClaimPackPurchase(
  supabase: SupabaseClient,
  claimId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("purchases")
    .select("id")
    .eq("claim_id", claimId)
    .eq("user_id", userId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}
