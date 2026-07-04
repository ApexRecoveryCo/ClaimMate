"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { ingestPolicyDocument } from "@/lib/policy/ingest";
import {
  CLAUSE_CATEGORIES,
  DOCUMENT_TYPES,
  PRODUCT_TYPES,
  type ClauseCategory,
  type DocumentType,
  type ProductType,
} from "@/types/policy";

export async function createInsurer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const brandName = String(formData.get("brandName") ?? "").trim();
  if (!brandName) {
    redirect(`/admin/insurers?error=${encodeURIComponent("Brand name is required.")}`);
  }

  await supabase.from("insurers").insert({
    brand_name: brandName,
    legal_entity_name: String(formData.get("legalEntityName") ?? "").trim() || null,
    underwriter_name: String(formData.get("underwriterName") ?? "").trim() || null,
    apra_registered_name: String(formData.get("apraName") ?? "").trim() || null,
    website_url: String(formData.get("websiteUrl") ?? "").trim() || null,
    claims_phone: String(formData.get("claimsPhone") ?? "").trim() || null,
    claims_email: String(formData.get("claimsEmail") ?? "").trim() || null,
    complaints_url: String(formData.get("complaintsUrl") ?? "").trim() || null,
  });

  revalidatePath("/admin/insurers");
  redirect("/admin/insurers");
}

export async function updateInsurer(insurerId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const brandName = String(formData.get("brandName") ?? "").trim();
  if (!brandName) {
    redirect(
      `/admin/insurers/${insurerId}?error=${encodeURIComponent("Brand name is required.")}`,
    );
  }

  await supabase
    .from("insurers")
    .update({
      brand_name: brandName,
      legal_entity_name: String(formData.get("legalEntityName") ?? "").trim() || null,
      underwriter_name: String(formData.get("underwriterName") ?? "").trim() || null,
      apra_registered_name: String(formData.get("apraName") ?? "").trim() || null,
      website_url: String(formData.get("websiteUrl") ?? "").trim() || null,
      claims_phone: String(formData.get("claimsPhone") ?? "").trim() || null,
      claims_email: String(formData.get("claimsEmail") ?? "").trim() || null,
      complaints_url: String(formData.get("complaintsUrl") ?? "").trim() || null,
      active_status: formData.get("activeStatus") === "on",
    })
    .eq("id", insurerId);

  revalidatePath("/admin/insurers");
  redirect("/admin/insurers");
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const insurerId = String(formData.get("insurerId") ?? "");
  const productName = String(formData.get("productName") ?? "").trim();
  const productType = String(formData.get("productType") ?? "");

  if (!insurerId || !productName || !PRODUCT_TYPES.includes(productType as ProductType)) {
    redirect(
      `/admin/products?error=${encodeURIComponent("Insurer, product name and type are required.")}`,
    );
  }

  await supabase.from("insurance_products").insert({
    insurer_id: insurerId,
    product_name: productName,
    product_type: productType,
    cover_category: String(formData.get("coverCategory") ?? "").trim() || null,
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

interface NewDocumentInput {
  insurerId: string;
  productId: string;
  documentType: string;
  documentTitle: string;
  versionName: string;
  issueDate: string;
  effectiveFrom: string;
  effectiveTo: string;
  sourceUrl: string;
  storagePath: string;
  modifiesDocumentId: string;
}

export async function createPolicyDocument(input: NewDocumentInput) {
  const { supabase } = await requireAdmin();

  if (!input.insurerId || !input.productId) {
    return { error: "Choose the insurer and product." };
  }
  if (!DOCUMENT_TYPES.includes(input.documentType as DocumentType)) {
    return { error: "Choose a document type." };
  }
  if (!input.documentTitle.trim()) {
    return { error: "Enter the document title." };
  }
  if (!input.sourceUrl.trim()) {
    return { error: "Record the official source URL for this document." };
  }
  if (!input.storagePath) {
    return { error: "Upload the PDF first." };
  }

  let sourceDomain: string | null = null;
  try {
    sourceDomain = new URL(input.sourceUrl).hostname;
  } catch {
    return { error: "The source URL doesn't look like a valid URL." };
  }

  const { data, error } = await supabase
    .from("policy_documents")
    .insert({
      insurer_id: input.insurerId,
      product_id: input.productId,
      document_type: input.documentType,
      document_title: input.documentTitle.trim(),
      version_name: input.versionName.trim() || null,
      modifies_document_id: input.modifiesDocumentId || null,
      issue_date: input.issueDate || null,
      effective_from: input.effectiveFrom || null,
      effective_to: input.effectiveTo || null,
      source_url: input.sourceUrl.trim(),
      source_domain: sourceDomain,
      storage_path: input.storagePath,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "The document couldn't be saved. Try again." };
  }

  revalidatePath("/admin/documents");
  return { documentId: data.id as string };
}

export async function runIngestion(documentId: string) {
  await requireAdmin();
  const result = await ingestPolicyDocument(documentId);

  const message = result.error
    ? result.error
    : `Extracted ${result.clausesCreated} draft clauses from ${result.pagesProcessed} pages${result.embedded ? " (with embeddings)" : ""}. Review and approve them before they're used in answers.`;

  revalidatePath(`/admin/documents/${documentId}`);
  redirect(
    `/admin/documents/${documentId}?${result.error ? "error" : "message"}=${encodeURIComponent(message)}`,
  );
}

export async function setDocumentStatus(documentId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!["active", "superseded", "archived"].includes(status)) return;

  await supabase
    .from("policy_documents")
    .update({ document_status: status })
    .eq("id", documentId);

  revalidatePath(`/admin/documents/${documentId}`);
  redirect(`/admin/documents/${documentId}`);
}

export async function reviewClause(clauseId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const decision = String(formData.get("decision") ?? "");
  const category = String(formData.get("category") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/admin/review");

  if (!["approved", "rejected", "draft"].includes(decision)) return;
  if (!CLAUSE_CATEGORIES.includes(category as ClauseCategory)) return;

  await supabase
    .from("policy_clauses")
    .update({
      clause_category: category,
      plain_english_summary: summary || null,
      approval_status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", clauseId);

  revalidatePath("/admin/review");
  redirect(returnTo);
}
