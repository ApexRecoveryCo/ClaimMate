"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { generateDraft } from "@/lib/ai/client";
import {
  PROMPT_VERSION,
  claimSummaryPrompt,
  evidenceGapPrompt,
  followUpEmailPrompt,
} from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  CLAIM_STATUS_META,
  claimTypeLabel,
  type Claim,
} from "@/types/claims";
import { EVIDENCE_CATEGORY_LABELS, type EvidenceItem } from "@/types/evidence";
import {
  TIMELINE_EVENT_LABELS,
  type CallLog,
  type TimelineEvent,
} from "@/types/timeline";
import { EMAIL_TONES, type AiOutputType } from "@/types/ai";

function describeClaim(claim: Claim) {
  return [
    `Title: ${claim.title}`,
    `Type: ${claimTypeLabel(claim)}`,
    `Incident date: ${formatDate(claim.incident_date)}`,
    `Location: ${claim.incident_location ?? "Not provided"}`,
    `Description: ${claim.description}`,
    `Urgent needs: ${claim.urgent_needs ?? "None recorded"}`,
    `Insurer: ${claim.insurer_name ?? "Not provided"}`,
    `Claim number: ${claim.claim_number ?? "Not provided"}`,
    `Policy number: ${claim.policy_number ?? "Not provided"}`,
    `Status: ${CLAIM_STATUS_META[claim.status].label}`,
  ].join("\n");
}

function describeEvidence(items: EvidenceItem[]) {
  if (items.length === 0) return "No evidence uploaded yet.";
  return items
    .map((item) => {
      const parts = [
        `- ${item.file_name} (${EVIDENCE_CATEGORY_LABELS[item.category]}`,
      ];
      if (item.captured_at) parts.push(`, captured ${formatDate(item.captured_at)}`);
      parts.push(")");
      if (item.user_notes) parts.push(` — notes: ${item.user_notes}`);
      if (item.ai_summary) parts.push(` — summary: ${item.ai_summary}`);
      return parts.join("");
    })
    .join("\n");
}

function describeTimeline(events: TimelineEvent[]) {
  if (events.length === 0) return "No timeline events recorded yet.";
  return events
    .map(
      (event) =>
        `- ${formatDate(event.event_date)} [${TIMELINE_EVENT_LABELS[event.event_type]}] ${event.title}${event.description ? ` — ${event.description}` : ""}`,
    )
    .join("\n");
}

function describeCalls(calls: CallLog[]) {
  if (calls.length === 0) return "No calls logged yet.";
  return calls
    .map((call) => {
      const lines = [
        `- ${formatDateTime(call.call_date)} with ${call.organisation}${call.person_spoken_to ? ` (spoke to ${call.person_spoken_to})` : ""}: ${call.summary}`,
      ];
      if (call.promises_made) lines.push(`  Promised: ${call.promises_made}`);
      if (call.next_steps) lines.push(`  Next steps: ${call.next_steps}`);
      return lines.join("\n");
    })
    .join("\n");
}

export async function generateAiDraft(
  claimId: string,
  outputType: AiOutputType,
  emailOptions?: { tone: string; goal: string },
): Promise<{ text: string } | { error: string }> {
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

  const [{ data: evidence }, { data: events }, { data: calls }] =
    await Promise.all([
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
    ]);

  const data = {
    claimData: describeClaim(claim),
    evidenceSummaries: describeEvidence(evidence ?? []),
    timelineEvents: describeTimeline(events ?? []),
    callLogs: describeCalls(calls ?? []),
  };

  let built: { system: string; prompt: string };
  if (outputType === "summary") {
    built = claimSummaryPrompt(data);
  } else if (outputType === "evidence_gaps") {
    built = evidenceGapPrompt(claimTypeLabel(claim), data);
  } else {
    const tone = emailOptions?.tone ?? "";
    const goal = emailOptions?.goal.trim() ?? "";
    if (!(EMAIL_TONES as readonly string[]).includes(tone)) {
      return { error: "Choose a tone for the email." };
    }
    if (!goal) {
      return { error: "Tell us what you want the email to achieve." };
    }
    const claimRecord = [
      data.claimData,
      "",
      "Evidence held:",
      data.evidenceSummaries,
      "",
      "Timeline:",
      data.timelineEvents,
      "",
      "Call history:",
      data.callLogs,
    ].join("\n");
    built = followUpEmailPrompt(tone, goal, claimRecord);
  }

  const result = await generateDraft(built.system, built.prompt);
  if ("error" in result) return result;

  const inputHash = createHash("sha256")
    .update(`${built.system}\n${built.prompt}`)
    .digest("hex");

  await supabase.from("ai_outputs").insert({
    claim_id: claimId,
    user_id: user.id,
    output_type: outputType,
    prompt_version: PROMPT_VERSION,
    input_hash: inputHash,
    response_text: result.text,
  });

  return { text: result.text };
}
