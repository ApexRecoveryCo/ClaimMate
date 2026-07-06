"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDraft } from "@/lib/ai/client";
import { PROMPT_VERSION, policyAnswerPrompt } from "@/lib/ai/prompts";
import { matchPolicyDocuments, retrieveClauses } from "@/lib/policy/retrieval";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { type Claim } from "@/types/claims";
import {
  CLAUSE_CATEGORY_LABELS,
  type CustomerPolicy,
  type PolicyDocument,
} from "@/types/policy";

export async function savePolicyDetails(claimId: string, formData: FormData) {
  const insurerId = String(formData.get("insurerId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const policyNumber = String(formData.get("policyNumber") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const excess = String(formData.get("excess") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claim } = await supabase
    .from("claims")
    .select("id")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!claim) {
    redirect(`/claims/${claimId}/policy?error=${encodeURIComponent("Claim not found.")}`);
  }

  if (productId && insurerId) {
    const { data: product } = await supabase
      .from("insurance_products")
      .select("id")
      .eq("id", productId)
      .eq("insurer_id", insurerId)
      .maybeSingle();
    if (!product) {
      redirect(
        `/claims/${claimId}/policy?error=${encodeURIComponent("That product doesn't belong to the selected insurer.")}`,
      );
    }
  }

  const values = {
    user_id: user.id,
    claim_id: claimId,
    insurer_id: insurerId || null,
    product_id: productId || null,
    policy_number: policyNumber || null,
    policy_start_date: startDate || null,
    policy_end_date: endDate || null,
    excess_amount: excess ? Number(excess) : null,
  };

  const { data: existing } = await supabase
    .from("customer_policies")
    .select("id")
    .eq("claim_id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("customer_policies")
        .update(values)
        .eq("id", existing.id)
    : await supabase.from("customer_policies").insert(values);

  if (error) {
    redirect(
      `/claims/${claimId}/policy?error=${encodeURIComponent("We couldn't save your policy details.")}`,
    );
  }

  revalidatePath(`/claims/${claimId}/policy`);
  redirect(`/claims/${claimId}/policy`);
}

export interface PolicyAnswer {
  text: string;
  sources: Array<{
    documentTitle: string;
    sectionTitle: string | null;
    pageNumber: number | null;
    category: string;
  }>;
}

export async function askPolicyQuestion(
  claimId: string,
  question: string,
): Promise<PolicyAnswer | { error: string }> {
  const trimmed = question.trim();
  if (trimmed.length < 5) {
    return { error: "Ask a question about your policy — a few words is fine." };
  }

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

  const { data: customerPolicy } = await supabase
    .from("customer_policies")
    .select("*")
    .eq("claim_id", claimId)
    .eq("user_id", user.id)
    .maybeSingle<CustomerPolicy>();

  if (!customerPolicy || !customerPolicy.product_id) {
    return {
      error:
        "I can help organise your claim, but I need your policy details first — add your insurer and product above.",
    };
  }

  const documents = await matchPolicyDocuments(
    supabase,
    customerPolicy,
    claim.incident_date,
  );
  if (documents.length === 0) {
    return {
      error:
        "No policy documents in our library match your product and incident date yet, so I can't explain the cover. You can still organise evidence — and check the wording directly with your insurer.",
    };
  }

  const retrieved = await retrieveClauses(
    supabase,
    trimmed,
    documents.map((d) => d.id),
  );
  if (retrieved.length === 0) {
    return {
      error:
        "I couldn't find approved policy wording relevant to that question. Try different words, or ask your insurer to point you to the right section.",
    };
  }

  const docById = new Map<string, PolicyDocument>(
    documents.map((d) => [d.id, d]),
  );

  const clausesBlock = retrieved
    .map(({ clause }) => {
      const doc = docById.get(clause.document_id);
      return `[${doc?.document_title ?? "Policy document"}${clause.section_title ? ` — ${clause.section_title}` : ""}${clause.page_number ? `, page ${clause.page_number}` : ""}] (${CLAUSE_CATEGORY_LABELS[clause.clause_category]})
${clause.clause_text}`;
    })
    .join("\n\n");

  const policyContext = [
    `Claim type: ${claim.claim_type}`,
    `Incident date: ${formatDate(claim.incident_date)}`,
    `Matched documents: ${documents.map((d) => `${d.document_title}${d.effective_from ? ` (effective from ${formatDate(d.effective_from)})` : ""}`).join("; ")}`,
    `Policy number: ${customerPolicy.policy_number ?? "Not provided"}`,
    `Excess on schedule: ${customerPolicy.excess_amount != null ? `$${customerPolicy.excess_amount}` : "Not provided — the Policy Schedule confirms this"}`,
  ].join("\n");

  const built = policyAnswerPrompt(trimmed, clausesBlock, policyContext);
  const result = await generateDraft(built.system, built.prompt);
  if ("error" in result) return result;

  const inputHash = createHash("sha256")
    .update(`${built.system}\n${built.prompt}`)
    .digest("hex");

  const { data: output } = await supabase
    .from("ai_outputs")
    .insert({
      claim_id: claimId,
      user_id: user.id,
      output_type: "policy_answer",
      prompt_version: PROMPT_VERSION,
      input_hash: inputHash,
      response_text: result.text,
    })
    .select("id")
    .single();

  if (output) {
    await supabase.from("policy_answer_sources").insert(
      retrieved.map(({ clause, similarity }) => ({
        ai_output_id: output.id,
        user_id: user.id,
        policy_clause_id: clause.id,
        document_id: clause.document_id,
        page_number: clause.page_number,
        relevance_score: similarity,
      })),
    );
  }

  return {
    text: result.text,
    sources: retrieved.map(({ clause }) => ({
      documentTitle:
        docById.get(clause.document_id)?.document_title ?? "Policy document",
      sectionTitle: clause.section_title,
      pageNumber: clause.page_number,
      category: CLAUSE_CATEGORY_LABELS[clause.clause_category],
    })),
  };
}
