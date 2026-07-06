import Stripe from "stripe";
import { type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return new Response("Payments not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const stripe = new Stripe(secretKey);
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const claimId = session.metadata?.claim_id;
    const userId = session.metadata?.user_id;

    if (claimId && userId && session.payment_status === "paid") {
      const supabase = createServiceClient();
      if (!supabase) {
        return new Response("Service role not configured", { status: 503 });
      }
      // Idempotent on stripe_session_id; retried deliveries no-op.
      await supabase.from("purchases").upsert(
        {
          user_id: userId,
          claim_id: claimId,
          stripe_session_id: session.id,
          status: "paid",
        },
        { onConflict: "stripe_session_id" },
      );
    }
  }

  return Response.json({ received: true });
}
