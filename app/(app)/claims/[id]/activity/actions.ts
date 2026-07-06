"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TIMELINE_EVENT_TYPES,
  type TimelineEventType,
} from "@/types/timeline";

async function requireOwnClaim(claimId: string) {
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

  return { supabase, user, claim };
}

export async function createCallLog(claimId: string, formData: FormData) {
  const callDate = String(formData.get("callDate") ?? "");
  const organisation = String(formData.get("organisation") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const person = String(formData.get("person") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const promises = String(formData.get("promises") ?? "").trim();
  const nextSteps = String(formData.get("nextSteps") ?? "").trim();
  const addToTimeline = formData.get("addToTimeline") === "on";

  const fail = (message: string): never => {
    // redirect() throws, so this never returns.
    redirect(
      `/claims/${claimId}/calls/new?error=${encodeURIComponent(message)}`,
    );
  };

  if (!callDate || Number.isNaN(Date.parse(callDate))) {
    fail("Enter when the call happened.");
  }
  if (!organisation) fail("Enter who the call was with.");
  if (!summary) fail("Add a short summary of the call.");

  const { supabase, user, claim } = await requireOwnClaim(claimId);
  if (!claim) fail("Claim not found.");

  const { error } = await supabase.from("call_logs").insert({
    claim_id: claimId,
    user_id: user.id,
    call_date: new Date(callDate).toISOString(),
    organisation,
    person_spoken_to: person || null,
    phone_number: phone || null,
    summary,
    promises_made: promises || null,
    next_steps: nextSteps || null,
  });

  if (error) fail("We couldn't save the call. Please try again.");

  if (addToTimeline) {
    await supabase.from("timeline_events").insert({
      claim_id: claimId,
      user_id: user.id,
      event_date: callDate.slice(0, 10),
      event_type: "call",
      title: `Call with ${organisation}`,
      description: summary,
      source: "system",
    });
  }

  revalidatePath(`/claims/${claimId}`);
  redirect(`/claims/${claimId}/calls`);
}

export async function deleteCallLog(claimId: string, callId: string) {
  const { supabase, user } = await requireOwnClaim(claimId);

  await supabase
    .from("call_logs")
    .delete()
    .eq("id", callId)
    .eq("user_id", user.id);

  revalidatePath(`/claims/${claimId}/calls`);
  redirect(`/claims/${claimId}/calls`);
}

export async function createTimelineEvent(claimId: string, formData: FormData) {
  const eventDate = String(formData.get("eventDate") ?? "");
  const eventType = String(formData.get("eventType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fail = (message: string): never => {
    // redirect() throws, so this never returns.
    redirect(
      `/claims/${claimId}/timeline/new?error=${encodeURIComponent(message)}`,
    );
  };

  if (!eventDate || Number.isNaN(Date.parse(eventDate))) {
    fail("Enter the date this happened.");
  }
  if (!TIMELINE_EVENT_TYPES.includes(eventType as TimelineEventType)) {
    fail("Choose what kind of event this is.");
  }
  if (!title) fail("Give this event a short title.");

  const { supabase, user, claim } = await requireOwnClaim(claimId);
  if (!claim) fail("Claim not found.");

  const { error } = await supabase.from("timeline_events").insert({
    claim_id: claimId,
    user_id: user.id,
    event_date: eventDate,
    event_type: eventType,
    title,
    description: description || null,
    source: "user",
  });

  if (error) fail("We couldn't save the event. Please try again.");

  revalidatePath(`/claims/${claimId}/timeline`);
  redirect(`/claims/${claimId}/timeline`);
}

export async function updateTimelineEvent(
  claimId: string,
  eventId: string,
  formData: FormData,
) {
  const eventDate = String(formData.get("eventDate") ?? "");
  const eventType = String(formData.get("eventType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fail = (message: string): never => {
    // redirect() throws, so this never returns.
    redirect(
      `/claims/${claimId}/timeline/${eventId}?error=${encodeURIComponent(message)}`,
    );
  };

  if (!eventDate || Number.isNaN(Date.parse(eventDate))) {
    fail("Enter the date this happened.");
  }
  if (!TIMELINE_EVENT_TYPES.includes(eventType as TimelineEventType)) {
    fail("Choose what kind of event this is.");
  }
  if (!title) fail("Give this event a short title.");

  const { supabase, user } = await requireOwnClaim(claimId);

  const { error } = await supabase
    .from("timeline_events")
    .update({
      event_date: eventDate,
      event_type: eventType,
      title,
      description: description || null,
    })
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) fail("We couldn't save your changes. Please try again.");

  revalidatePath(`/claims/${claimId}/timeline`);
  redirect(`/claims/${claimId}/timeline`);
}

export async function deleteTimelineEvent(claimId: string, eventId: string) {
  const { supabase, user } = await requireOwnClaim(claimId);

  await supabase
    .from("timeline_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  revalidatePath(`/claims/${claimId}/timeline`);
  redirect(`/claims/${claimId}/timeline`);
}
