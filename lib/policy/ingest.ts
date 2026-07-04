import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { extractText, getDocumentProxy } from "unpdf";
import { isAiConfigured } from "@/lib/ai/client";
import { embedTexts, isEmbeddingConfigured } from "@/lib/policy/embeddings";
import { createClient } from "@/lib/supabase/server";
import {
  CLAUSE_CATEGORIES,
  POLICY_DOCUMENTS_BUCKET,
  type ClauseCategory,
  type PolicyDocument,
} from "@/types/policy";

const PAGES_PER_BATCH = 6;
const MAX_PAGES = 200;

interface ExtractedClause {
  section_title: string | null;
  section_number: string | null;
  page_number: number;
  clause_text: string;
  clause_category: ClauseCategory;
  plain_english_summary: string;
}

const CLAUSE_SCHEMA = {
  type: "object",
  properties: {
    clauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section_title: { type: ["string", "null"] },
          section_number: { type: ["string", "null"] },
          page_number: { type: "integer" },
          clause_text: { type: "string" },
          clause_category: {
            type: "string",
            enum: [...CLAUSE_CATEGORIES],
          },
          plain_english_summary: { type: "string" },
        },
        required: [
          "section_title",
          "section_number",
          "page_number",
          "clause_text",
          "clause_category",
          "plain_english_summary",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["clauses"],
  additionalProperties: false,
} as const;

export async function extractPdfPages(fileBytes: Uint8Array) {
  const pdf = await getDocumentProxy(fileBytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return text.slice(0, MAX_PAGES);
}

export function hashFile(fileBytes: Uint8Array) {
  return createHash("sha256").update(fileBytes).digest("hex");
}

async function extractClausesFromBatch(
  client: Anthropic,
  pages: string[],
  firstPageNumber: number,
): Promise<ExtractedClause[]> {
  const pageBlock = pages
    .map((page, index) => `--- Page ${firstPageNumber + index} ---\n${page}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system:
      "You extract clauses from insurance policy documents for a review queue. You never invent text: clause_text must be copied from the document. You classify each clause and write a short cautious plain-English summary. You do not provide advice or coverage opinions.",
    messages: [
      {
        role: "user",
        content: `Split the following insurance policy document pages into distinct clauses or sections. For each clause return the section title and number where visible, the page number it starts on, the exact clause text, a category, and a one-to-two sentence plain-English summary using cautious wording ("may", "appears to").

Skip page furniture (headers, footers, tables of contents). Prefer complete self-contained clauses over tiny fragments.

${pageBlock}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: CLAUSE_SCHEMA,
      },
    },
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  try {
    const parsed = JSON.parse(text) as { clauses: ExtractedClause[] };
    return parsed.clauses.filter((c) => c.clause_text.trim().length > 40);
  } catch {
    return [];
  }
}

export interface IngestResult {
  pagesProcessed: number;
  clausesCreated: number;
  embedded: boolean;
  error?: string;
}

export async function ingestPolicyDocument(
  documentId: string,
): Promise<IngestResult> {
  const failed = (error: string): IngestResult => ({
    pagesProcessed: 0,
    clausesCreated: 0,
    embedded: false,
    error,
  });

  if (!isAiConfigured()) {
    return failed(
      "Clause extraction needs the Claude API — add an ANTHROPIC_API_KEY first.",
    );
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("policy_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle<PolicyDocument>();
  if (!document) return failed("Document not found.");

  const { data: file } = await supabase.storage
    .from(POLICY_DOCUMENTS_BUCKET)
    .download(document.storage_path);
  if (!file) return failed("Couldn't download the PDF from storage.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pages = await extractPdfPages(bytes);
  if (pages.length === 0) {
    return failed("No text could be extracted from this PDF (it may be scanned images).");
  }

  const anthropic = new Anthropic();
  const clauses: ExtractedClause[] = [];
  for (let start = 0; start < pages.length; start += PAGES_PER_BATCH) {
    const batch = pages.slice(start, start + PAGES_PER_BATCH);
    const extracted = await extractClausesFromBatch(anthropic, batch, start + 1);
    clauses.push(...extracted);
  }

  if (clauses.length === 0) {
    return failed("No clauses were extracted — check the document content.");
  }

  let embeddings: number[][] | null = null;
  if (isEmbeddingConfigured()) {
    embeddings = await embedTexts(
      clauses.map(
        (c) => `${c.section_title ?? ""}\n${c.clause_text}`.trim(),
      ),
      "document",
    );
  }

  const rows = clauses.map((clause, index) => ({
    document_id: document.id,
    insurer_id: document.insurer_id,
    product_id: document.product_id,
    section_title: clause.section_title,
    section_number: clause.section_number,
    page_number: clause.page_number,
    clause_text: clause.clause_text,
    clause_category: clause.clause_category,
    plain_english_summary: clause.plain_english_summary,
    embedding: embeddings ? JSON.stringify(embeddings[index]) : null,
    approval_status: "draft",
  }));

  const { error: insertError } = await supabase
    .from("policy_clauses")
    .insert(rows);
  if (insertError) {
    return failed("Extracted clauses couldn't be saved. Try again.");
  }

  await supabase
    .from("policy_documents")
    .update({ last_checked_at: new Date().toISOString(), file_hash: hashFile(bytes) })
    .eq("id", document.id);

  return {
    pagesProcessed: pages.length,
    clausesCreated: rows.length,
    embedded: Boolean(embeddings),
  };
}
