import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  EVIDENCE_BUCKET,
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
  isImageType,
  type EvidenceItem,
} from "@/types/evidence";
import { deleteEvidence, updateEvidence } from "../actions";

export default async function EvidenceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; evidenceId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, evidenceId } = await params;
  const { error } = await searchParams;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("id", evidenceId)
    .eq("claim_id", claim.id)
    .maybeSingle<EvidenceItem>();
  if (!item) notFound();

  const { data: signed } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(item.storage_path, 3600);
  const signedUrl = signed?.signedUrl ?? null;

  const updateAction = updateEvidence.bind(null, claim.id, item.id);
  const deleteAction = deleteEvidence.bind(null, claim.id, item.id);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
          ← Back to claim
        </Link>
        <h1 className="break-words text-2xl font-semibold text-ink">
          {item.file_name}
        </h1>
        <p className="text-sm text-ink-muted">
          {EVIDENCE_CATEGORY_LABELS[item.category]} · Added{" "}
          {formatDate(item.created_at)}
        </p>
      </div>

      <Card className="overflow-hidden p-0 sm:p-0">
        {signedUrl && isImageType(item.file_type) ? (
          /* Signed URLs are short-lived and query-stringed; next/image
             optimisation would cache/rewrite them, so use a plain img. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signedUrl}
            alt={item.user_notes ?? item.file_name}
            className="max-h-[70vh] w-full object-contain"
          />
        ) : signedUrl && item.file_type.startsWith("video/") ? (
          <video src={signedUrl} controls className="max-h-[70vh] w-full" />
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-ink-muted">
              Preview isn&apos;t available for this file type.
            </p>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand-700"
              >
                Open file in a new tab
              </a>
            )}
          </div>
        )}
      </Card>

      {signedUrl && (
        <p className="text-xs text-ink-muted">
          This private link expires after an hour. Only you can open your
          evidence files.
        </p>
      )}

      {item.ai_summary && (
        <Card className="flex flex-col gap-2">
          <h2 className="font-semibold text-ink">AI summary</h2>
          <p className="text-sm text-ink">{item.ai_summary}</p>
          <p className="text-xs text-ink-muted">
            AI-generated draft — check it before relying on it.
          </p>
        </Card>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <form action={updateAction} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold text-ink">Details</h2>
          <Label>
            Category
            <Select name="category" defaultValue={item.category}>
              {EVIDENCE_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {EVIDENCE_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            When was this taken or received?
            <Input
              type="date"
              name="capturedAt"
              defaultValue={item.captured_at ?? ""}
            />
          </Label>
          <Label>
            Notes
            <Textarea
              name="notes"
              rows={3}
              defaultValue={item.user_notes ?? ""}
              placeholder="Anything that helps explain this file"
            />
          </Label>
        </Card>
        <Button type="submit">Save details</Button>
      </form>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Remove this file</h2>
        <p className="text-sm text-ink-muted">
          This permanently deletes the file and its notes from your claim.
        </p>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            variant="danger"
            confirmMessage="Delete this file permanently? This can't be undone."
          >
            Delete file
          </ConfirmSubmitButton>
        </form>
      </Card>
    </Container>
  );
}
