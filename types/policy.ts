export const PRODUCT_TYPES = [
  "home_building",
  "home_contents",
  "home_and_contents",
  "landlord",
  "comprehensive_car",
  "other",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  home_building: "Home building",
  home_contents: "Home contents",
  home_and_contents: "Home and contents",
  landlord: "Landlord insurance",
  comprehensive_car: "Comprehensive car",
  other: "Other",
};

export const DOCUMENT_TYPES = [
  "pds",
  "spds",
  "key_facts_sheet",
  "tmd",
  "policy_wording",
  "claims_guide",
  "complaints_info",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pds: "Product Disclosure Statement (PDS)",
  spds: "Supplementary PDS (SPDS)",
  key_facts_sheet: "Key Facts Sheet",
  tmd: "Target Market Determination",
  policy_wording: "Policy wording / booklet",
  claims_guide: "Claims guide",
  complaints_info: "Complaints / IDR information",
  other: "Other",
};

export const CLAUSE_CATEGORIES = [
  "covered_event",
  "exclusion",
  "limit",
  "customer_obligation",
  "claim_condition",
  "definition",
  "complaint",
  "other",
] as const;

export type ClauseCategory = (typeof CLAUSE_CATEGORIES)[number];

export const CLAUSE_CATEGORY_LABELS: Record<ClauseCategory, string> = {
  covered_event: "Covered event",
  exclusion: "Exclusion",
  limit: "Limit or amount",
  customer_obligation: "Customer obligation",
  claim_condition: "Claim condition",
  definition: "Definition",
  complaint: "Complaints and escalation",
  other: "Other",
};

export interface Insurer {
  id: string;
  brand_name: string;
  legal_entity_name: string | null;
  underwriter_name: string | null;
  apra_registered_name: string | null;
  website_url: string | null;
  claims_phone: string | null;
  claims_email: string | null;
  complaints_url: string | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceProduct {
  id: string;
  insurer_id: string;
  product_name: string;
  product_type: ProductType;
  cover_category: string | null;
  state_availability: string[] | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyDocument {
  id: string;
  insurer_id: string;
  product_id: string;
  document_type: DocumentType;
  document_title: string;
  version_name: string | null;
  modifies_document_id: string | null;
  issue_date: string | null;
  effective_from: string | null;
  effective_to: string | null;
  source_url: string;
  source_domain: string | null;
  storage_path: string;
  file_hash: string | null;
  document_status: "active" | "superseded" | "archived";
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyClause {
  id: string;
  document_id: string;
  insurer_id: string;
  product_id: string;
  section_title: string | null;
  section_number: string | null;
  page_number: number | null;
  clause_text: string;
  clause_category: ClauseCategory;
  plain_english_summary: string | null;
  approval_status: "draft" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPolicy {
  id: string;
  user_id: string;
  claim_id: string | null;
  insurer_id: string | null;
  product_id: string | null;
  policy_document_id: string | null;
  policy_number: string | null;
  policy_start_date: string | null;
  policy_end_date: string | null;
  excess_amount: number | null;
  sum_insured_building: number | null;
  sum_insured_contents: number | null;
  optional_extras: string[] | null;
  uploaded_schedule_path: string | null;
  created_at: string;
  updated_at: string;
}

export const POLICY_DOCUMENTS_BUCKET = "policy-documents";
