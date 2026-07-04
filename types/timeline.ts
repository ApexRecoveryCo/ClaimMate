export interface CallLog {
  id: string;
  claim_id: string;
  user_id: string;
  call_date: string;
  organisation: string;
  person_spoken_to: string | null;
  phone_number: string | null;
  summary: string;
  promises_made: string | null;
  next_steps: string | null;
  created_at: string;
}

export const TIMELINE_EVENT_TYPES = [
  "incident",
  "call",
  "correspondence",
  "insurer_update",
  "status_change",
  "evidence",
  "note",
  "other",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  incident: "Incident",
  call: "Phone call",
  correspondence: "Letter or email",
  insurer_update: "Insurer update",
  status_change: "Status change",
  evidence: "Evidence added",
  note: "Note",
  other: "Other",
};

export interface TimelineEvent {
  id: string;
  claim_id: string;
  user_id: string;
  event_date: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  linked_evidence_ids: string[] | null;
  source: "user" | "ai" | "system";
  created_at: string;
  updated_at: string;
}
