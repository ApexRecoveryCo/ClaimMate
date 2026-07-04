export type AiOutputType = "summary" | "evidence_gaps" | "follow_up_email";

export const EMAIL_TONES = [
  "Polite and neutral",
  "Firm but respectful",
  "Warm and appreciative",
] as const;

export interface AiOutput {
  id: string;
  claim_id: string;
  user_id: string;
  output_type: AiOutputType;
  prompt_version: string;
  input_hash: string;
  response_text: string;
  created_at: string;
}
