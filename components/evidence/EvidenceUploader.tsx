"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordEvidence } from "@/app/(app)/claims/[id]/evidence/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createClient } from "@/lib/supabase/client";
import {
  EVIDENCE_ACCEPTED_TYPES,
  EVIDENCE_BUCKET,
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
  EVIDENCE_MAX_BYTES,
} from "@/types/evidence";

interface EvidenceUploaderProps {
  userId: string;
  claimId: string;
}

export function EvidenceUploader({ userId, claimId }: EvidenceUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>("damage_photo");
  const [capturedAt, setCapturedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  function validate(selected: File[]): string | null {
    for (const file of selected) {
      if (!EVIDENCE_ACCEPTED_TYPES.includes(file.type)) {
        return `"${file.name}" isn't a supported file type. Use photos, PDFs or videos.`;
      }
      if (file.size > EVIDENCE_MAX_BYTES) {
        return `"${file.name}" is larger than 50 MB. Try a smaller file.`;
      }
    }
    return null;
  }

  function submit() {
    if (files.length === 0) {
      setError("Choose at least one photo, document or video.");
      return;
    }
    const validationError = validate(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const uploaded = [];

      for (const [index, file] of files.entries()) {
        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${claimId}/${crypto.randomUUID()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          setProgress(null);
          setError(
            `We couldn't upload "${file.name}". Check your connection and try again.`,
          );
          return;
        }
        uploaded.push({
          storagePath: path,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      }

      setProgress("Saving details…");
      const result = await recordEvidence(
        claimId,
        uploaded,
        category,
        capturedAt,
        notes,
      );
      setProgress(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(`/claims/${claimId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Card className="flex flex-col gap-4">
        <Label>
          Add photos, documents or videos
          <input
            type="file"
            multiple
            accept={EVIDENCE_ACCEPTED_TYPES.join(",")}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </Label>
        {files.length > 0 && (
          <p className="text-sm text-ink-muted">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
        )}
        <Label>
          What kind of evidence is this?
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {EVIDENCE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {EVIDENCE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          When was this taken or received?{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
          <Input
            type="date"
            max={today}
            value={capturedAt}
            onChange={(e) => setCapturedAt(e.target.value)}
          />
        </Label>
        <Label>
          Notes <span className="font-normal text-ink-muted">(optional)</span>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Taken the morning after the storm"
          />
        </Label>
      </Card>

      {error && <Notice tone="danger">{error}</Notice>}

      <Button type="submit" disabled={isPending}>
        {progress ?? "Add to claim"}
      </Button>
    </form>
  );
}
