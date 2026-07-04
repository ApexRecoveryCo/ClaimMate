export const EVIDENCE_CATEGORIES = [
  "damage_photo",
  "receipt",
  "quote",
  "report",
  "correspondence",
  "policy_document",
  "video",
  "other",
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  damage_photo: "Damage photos",
  receipt: "Receipts",
  quote: "Quotes and estimates",
  report: "Reports",
  correspondence: "Letters and emails",
  policy_document: "Policy documents",
  video: "Videos",
  other: "Other",
};

export interface EvidenceItem {
  id: string;
  claim_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  category: EvidenceCategory;
  captured_at: string | null;
  user_notes: string | null;
  ai_summary: string | null;
  source_type: "upload" | "manual";
  created_at: string;
  updated_at: string;
}

export const EVIDENCE_BUCKET = "claim-evidence";

export const EVIDENCE_MAX_BYTES = 50 * 1024 * 1024;

export const EVIDENCE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
];

export function isImageType(fileType: string) {
  return fileType.startsWith("image/");
}
