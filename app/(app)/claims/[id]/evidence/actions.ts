"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EVIDENCE_BUCKET,
  EVIDENCE_CATEGORIES,
  type EvidenceCategory,
} from "@/types/evidence";

interface UploadedFileMeta {
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function recordEvidence(
  claimId: string,
  files: UploadedFileMeta[],
  category: string,
  capturedAt: string,
  notes: string,
) {
  if (!EVIDENCE_CATEGORIES.includes(category as EvidenceCategory)) {
    return { error: "Choose a category for this evidence." };
  }
  if (files.length === 0) {
    return { error: "Choose at least one file to add." };
  }

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
  if (!claim) return { error: "Claim not found." };

  const expectedPrefix = `${user.id}/${claimId}/`;
  if (files.some((f) => !f.storagePath.startsWith(expectedPrefix))) {
    return { error: "One of the uploaded files could not be verified." };
  }

  const { data: inserted, error } = await supabase
    .from("evidence_items")
    .insert(
      files.map((f) => ({
        claim_id: claimId,
        user_id: user.id,
        storage_path: f.storagePath,
        file_name: f.fileName,
        file_type: f.fileType,
        file_size: f.fileSize,
        category,
        captured_at: capturedAt || null,
        user_notes: notes.trim() || null,
        source_type: "upload",
      })),
    )
    .select("id");

  if (error) {
    return { error: "We couldn't save the evidence details. Please try again." };
  }

  await supabase.from("timeline_events").insert({
    claim_id: claimId,
    user_id: user.id,
    event_date: new Date().toISOString().slice(0, 10),
    event_type: "evidence",
    title: `Added ${files.length} evidence item${files.length === 1 ? "" : "s"}`,
    linked_evidence_ids: (inserted ?? []).map((row) => row.id),
    source: "system",
  });

  revalidatePath(`/claims/${claimId}`);
  return {};
}

export async function updateEvidence(
  claimId: string,
  evidenceId: string,
  formData: FormData,
) {
  const category = String(formData.get("category") ?? "");
  const capturedAt = String(formData.get("capturedAt") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!EVIDENCE_CATEGORIES.includes(category as EvidenceCategory)) {
    redirect(
      `/claims/${claimId}/evidence/${evidenceId}?error=${encodeURIComponent("Choose a category.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("evidence_items")
    .update({
      category,
      captured_at: capturedAt || null,
      user_notes: notes.trim() || null,
    })
    .eq("id", evidenceId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/claims/${claimId}/evidence/${evidenceId}?error=${encodeURIComponent("We couldn't save your changes.")}`,
    );
  }

  revalidatePath(`/claims/${claimId}`);
  redirect(`/claims/${claimId}/evidence/${evidenceId}`);
}

export async function deleteEvidence(claimId: string, evidenceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("evidence_items")
    .select("storage_path")
    .eq("id", evidenceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (item) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([item.storage_path]);
    await supabase
      .from("evidence_items")
      .delete()
      .eq("id", evidenceId)
      .eq("user_id", user.id);
  }

  revalidatePath(`/claims/${claimId}`);
  redirect(`/claims/${claimId}`);
}
