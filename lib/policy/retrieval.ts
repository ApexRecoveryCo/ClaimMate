import { type SupabaseClient } from "@supabase/supabase-js";
import { embedTexts, isEmbeddingConfigured } from "@/lib/policy/embeddings";
import {
  type CustomerPolicy,
  type PolicyClause,
  type PolicyDocument,
} from "@/types/policy";

// Version matching per the planner: never assume the latest PDS applies.
// Prefer the document the customer confirmed; otherwise match the product's
// documents whose effective range covers the incident date, and pull in any
// SPDS that modifies a matched document.
export async function matchPolicyDocuments(
  supabase: SupabaseClient,
  customerPolicy: CustomerPolicy,
  incidentDate: string,
): Promise<PolicyDocument[]> {
  if (customerPolicy.policy_document_id) {
    const { data: confirmed } = await supabase
      .from("policy_documents")
      .select("*")
      .eq("id", customerPolicy.policy_document_id)
      .returns<PolicyDocument[]>();
    const base = confirmed ?? [];
    if (base.length > 0) {
      const { data: spds } = await supabase
        .from("policy_documents")
        .select("*")
        .in("modifies_document_id", base.map((d) => d.id))
        .returns<PolicyDocument[]>();
      return [...base, ...(spds ?? [])];
    }
  }

  if (!customerPolicy.product_id) return [];

  const { data: candidates } = await supabase
    .from("policy_documents")
    .select("*")
    .eq("product_id", customerPolicy.product_id)
    .neq("document_status", "archived")
    .returns<PolicyDocument[]>();

  const matched = (candidates ?? []).filter((doc) => {
    const from = doc.effective_from ?? "0000-01-01";
    const to = doc.effective_to ?? "9999-12-31";
    return from <= incidentDate && incidentDate <= to;
  });

  const matchedIds = new Set(matched.map((d) => d.id));
  const withSpds = [
    ...matched,
    ...(candidates ?? []).filter(
      (doc) =>
        doc.modifies_document_id &&
        matchedIds.has(doc.modifies_document_id) &&
        !matchedIds.has(doc.id),
    ),
  ];
  return withSpds;
}

export interface RetrievedClause {
  clause: PolicyClause;
  similarity: number | null;
}

export async function retrieveClauses(
  supabase: SupabaseClient,
  question: string,
  documentIds: string[],
  limit = 10,
): Promise<RetrievedClause[]> {
  if (documentIds.length === 0) return [];

  if (isEmbeddingConfigured()) {
    const embeddings = await embedTexts([question], "query");
    if (embeddings) {
      const { data } = await supabase.rpc("match_policy_clauses", {
        query_embedding: JSON.stringify(embeddings[0]),
        document_ids: documentIds,
        match_limit: limit,
      });
      if (data) {
        return (
          data as Array<{ clause: PolicyClause; similarity: number }>
        ).map((row) => ({ clause: row.clause, similarity: row.similarity }));
      }
    }
  }

  const { data } = await supabase.rpc("search_policy_clauses", {
    query: question,
    document_ids: documentIds,
    match_limit: limit,
  });
  return ((data as PolicyClause[]) ?? []).map((clause) => ({
    clause,
    similarity: null,
  }));
}
