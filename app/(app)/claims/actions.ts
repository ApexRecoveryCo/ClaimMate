"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CLAIM_STATUSES,
  CLAIM_TYPES,
  CLAIM_TYPE_META,
  type ClaimStatus,
  type ClaimType,
} from "@/types/claims";
import { formatDate } from "@/lib/format";

export interface NewClaimInput {
  claimType: string;
  claimTypeOther: string;
  title: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  urgentNeeds: string;
  insurerName: string;
  claimNumber: string;
  policyNumber: string;
  status: string;
}

function validateClaimFields(input: NewClaimInput): string | null {
  if (!CLAIM_TYPES.includes(input.claimType as ClaimType)) {
    return "Choose what happened from the list.";
  }
  if (input.claimType === "other" && !input.claimTypeOther.trim()) {
    return "Tell us in a few words what happened.";
  }
  if (!input.incidentDate) {
    return "Enter the date it happened.";
  }
  if (Number.isNaN(Date.parse(input.incidentDate))) {
    return "Enter a valid date.";
  }
  if (new Date(input.incidentDate) > new Date()) {
    return "The incident date can't be in the future.";
  }
  if (input.description.trim().length < 20) {
    return "Describe what happened in a little more detail (at least 20 characters).";
  }
  if (!CLAIM_STATUSES.includes(input.status as ClaimStatus)) {
    return "Choose a claim status.";
  }
  return null;
}

export async function createClaim(input: NewClaimInput) {
  const error = validateClaimFields(input);
  if (error) return { error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const claimType = input.claimType as ClaimType;
  const title =
    input.title.trim() ||
    `${CLAIM_TYPE_META[claimType].label} — ${formatDate(input.incidentDate)}`;

  const { data, error: insertError } = await supabase
    .from("claims")
    .insert({
      user_id: user.id,
      title,
      claim_type: claimType,
      claim_type_other:
        claimType === "other" ? input.claimTypeOther.trim() : null,
      insurer_name: input.insurerName.trim() || null,
      claim_number: input.claimNumber.trim() || null,
      policy_number: input.policyNumber.trim() || null,
      incident_date: input.incidentDate,
      incident_location: input.incidentLocation.trim() || null,
      description: input.description.trim(),
      status: input.status as ClaimStatus,
      urgent_needs: input.urgentNeeds.trim() || null,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    return { error: "We couldn't save your claim. Please try again." };
  }

  redirect(`/claims/${data.id}`);
}

export async function updateClaim(claimId: string, formData: FormData) {
  const input: NewClaimInput = {
    claimType: String(formData.get("claimType") ?? ""),
    claimTypeOther: String(formData.get("claimTypeOther") ?? ""),
    title: String(formData.get("title") ?? ""),
    incidentDate: String(formData.get("incidentDate") ?? ""),
    incidentLocation: String(formData.get("incidentLocation") ?? ""),
    description: String(formData.get("description") ?? ""),
    urgentNeeds: String(formData.get("urgentNeeds") ?? ""),
    insurerName: String(formData.get("insurerName") ?? ""),
    claimNumber: String(formData.get("claimNumber") ?? ""),
    policyNumber: String(formData.get("policyNumber") ?? ""),
    status: String(formData.get("status") ?? ""),
  };

  const error = validateClaimFields(input);
  if (error) {
    redirect(`/claims/${claimId}/edit?error=${encodeURIComponent(error)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const claimType = input.claimType as ClaimType;
  const { error: updateError } = await supabase
    .from("claims")
    .update({
      title: input.title.trim() || `${CLAIM_TYPE_META[claimType].label} claim`,
      claim_type: claimType,
      claim_type_other:
        claimType === "other" ? input.claimTypeOther.trim() : null,
      insurer_name: input.insurerName.trim() || null,
      claim_number: input.claimNumber.trim() || null,
      policy_number: input.policyNumber.trim() || null,
      incident_date: input.incidentDate,
      incident_location: input.incidentLocation.trim() || null,
      description: input.description.trim(),
      status: input.status as ClaimStatus,
      urgent_needs: input.urgentNeeds.trim() || null,
    })
    .eq("id", claimId)
    .eq("user_id", user.id);

  if (updateError) {
    redirect(
      `/claims/${claimId}/edit?error=${encodeURIComponent(
        "We couldn't save your changes. Please try again.",
      )}`,
    );
  }

  revalidatePath(`/claims/${claimId}`);
  redirect(`/claims/${claimId}`);
}

export async function deleteClaim(claimId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("claims").delete().eq("id", claimId).eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
