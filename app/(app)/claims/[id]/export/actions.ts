"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { renderClaimPack, type ExportSections } from "@/lib/export/pdf";
import { hasClaimPackPurchase, isStripeConfigured } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import { type Claim } from "@/types/claims";
import {
  EVIDENCE_BUCKET,
  isImageType,
  type EvidenceItem,
} from "@/types/evidence";
import { type CallLog, type TimelineEvent } from "@/types/timeline";
import {
  PRODUCT_TYPE_LABELS,
  type CustomerPolicy,
  type InsuranceProduct,
  type Insurer,
} from "@/types/policy";

const EXPORTS_BUCKET = "claim-exports";
const MAX_EMBEDDED_IMAGES = 12;
const EMBEDDABLE_TYPES = new Set(["image/jpeg", "image/png"]);

export async function startClaimPackCheckout(
  claimId: string,
): Promise<{ checkoutUrl: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Payments aren't configured on this server." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claim } = await supabase
    .from("claims")
    .select("id, title")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; title: string }>();
  if (!claim) return { error: "Claim not found." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email: user.email,
      metadata: { claim_id: claim.id, user_id: user.id },
      success_url: `${siteUrl}/claims/${claim.id}/export?purchase=success`,
      cancel_url: `${siteUrl}/claims/${claim.id}/export?purchase=cancelled`,
    });
    if (!session.url) return { error: "Checkout couldn't be started. Try again." };
    return { checkoutUrl: session.url };
  } catch {
    return { error: "Checkout couldn't be started. Try again." };
  }
}

export async function generateExportPack(
  claimId: string,
  sections: ExportSections,
): Promise<
  { downloadUrl: string } | { error: string; needsPurchase?: boolean }
> {
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
  if (!claim) return { error: "Claim not found." };

  if (
    isStripeConfigured() &&
    !(await hasClaimPackPurchase(supabase, claimId, user.id))
  ) {
    return {
      error: "This claim's evidence pack hasn't been unlocked yet.",
      needsPurchase: true,
    };
  }

  const [
    { data: evidence },
    { data: timeline },
    { data: calls },
    { data: aiSummaryRow },
    { data: policyAnswerRow },
    { data: customerPolicy },
  ] = await Promise.all([
    supabase
      .from("evidence_items")
      .select("*")
      .eq("claim_id", claimId)
      .order("created_at", { ascending: true })
      .returns<EvidenceItem[]>(),
    supabase
      .from("timeline_events")
      .select("*")
      .eq("claim_id", claimId)
      .order("event_date", { ascending: true })
      .returns<TimelineEvent[]>(),
    supabase
      .from("call_logs")
      .select("*")
      .eq("claim_id", claimId)
      .order("call_date", { ascending: true })
      .returns<CallLog[]>(),
    supabase
      .from("ai_outputs")
      .select("response_text")
      .eq("claim_id", claimId)
      .eq("output_type", "summary")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ response_text: string }>(),
    supabase
      .from("ai_outputs")
      .select("response_text")
      .eq("claim_id", claimId)
      .eq("output_type", "policy_answer")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ response_text: string }>(),
    supabase
      .from("customer_policies")
      .select("*")
      .eq("claim_id", claimId)
      .maybeSingle<CustomerPolicy>(),
  ]);

  let policySummary: string | null = null;
  if (customerPolicy?.insurer_id && customerPolicy.product_id) {
    const [{ data: insurer }, { data: product }] = await Promise.all([
      supabase
        .from("insurers")
        .select("brand_name")
        .eq("id", customerPolicy.insurer_id)
        .maybeSingle<Pick<Insurer, "brand_name">>(),
      supabase
        .from("insurance_products")
        .select("product_name, product_type")
        .eq("id", customerPolicy.product_id)
        .maybeSingle<Pick<InsuranceProduct, "product_name" | "product_type">>(),
    ]);
    if (insurer && product) {
      policySummary = `${insurer.brand_name} — ${product.product_name} (${PRODUCT_TYPE_LABELS[product.product_type]})`;
    }
  }

  // Embed a bounded number of JPEG/PNG originals; other files are listed
  // with their metadata only.
  const evidenceItems = evidence ?? [];
  const withImages: Array<EvidenceItem & { imageDataUri: string | null }> = [];
  let embedded = 0;
  for (const item of evidenceItems) {
    let imageDataUri: string | null = null;
    if (
      sections.evidence &&
      embedded < MAX_EMBEDDED_IMAGES &&
      isImageType(item.file_type) &&
      EMBEDDABLE_TYPES.has(item.file_type)
    ) {
      const { data: file } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .download(item.storage_path);
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageDataUri = `data:${item.file_type};base64,${buffer.toString("base64")}`;
        embedded += 1;
      }
    }
    withImages.push({ ...item, imageDataUri });
  }

  let pdf: Buffer;
  try {
    pdf = await renderClaimPack({
      claim,
      evidence: withImages,
      timeline: timeline ?? [],
      calls: calls ?? [],
      aiSummary: sections.aiSummary ? (aiSummaryRow?.response_text ?? null) : null,
      policyAnswer: sections.policyAnswer
        ? (policyAnswerRow?.response_text ?? null)
        : null,
      policySummary,
      generatedAtIso: new Date().toISOString(),
      sections,
    });
  } catch {
    return { error: "The PDF couldn't be generated. Please try again." };
  }

  const storagePath = `${user.id}/${claimId}/${randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(EXPORTS_BUCKET)
    .upload(storagePath, pdf, { contentType: "application/pdf" });
  if (uploadError) {
    return { error: "The PDF couldn't be saved. Please try again." };
  }

  const sectionsIncluded = Object.entries(sections)
    .filter(([, included]) => included)
    .map(([name]) => name);

  await supabase.from("claim_exports").insert({
    claim_id: claimId,
    user_id: user.id,
    storage_path: storagePath,
    sections_included: sectionsIncluded,
  });

  const { data: signed } = await supabase.storage
    .from(EXPORTS_BUCKET)
    .createSignedUrl(storagePath, 3600, {
      download: `${claim.title.replace(/[^\w\- ]+/g, "")}. Evidence pack.pdf`,
    });

  revalidatePath(`/claims/${claimId}/export`);
  if (!signed?.signedUrl) {
    return { error: "The pack was created but the download link failed — check previous exports below." };
  }
  return { downloadUrl: signed.signedUrl };
}
