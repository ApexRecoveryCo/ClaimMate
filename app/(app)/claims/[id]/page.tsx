import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  CLAIM_STATUS_META,
  CLAIM_TYPE_META,
  claimTypeLabel,
} from "@/types/claims";
import {
  EVIDENCE_BUCKET,
  EVIDENCE_CATEGORY_LABELS,
  isImageType,
  type EvidenceItem,
} from "@/types/evidence";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: evidence } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("claim_id", claim.id)
    .order("created_at", { ascending: false })
    .returns<EvidenceItem[]>();
  const evidenceItems = evidence ?? [];

  const imagePaths = evidenceItems
    .filter((item) => isImageType(item.file_type))
    .map((item) => item.storage_path);
  const { data: signedThumbs } = imagePaths.length
    ? await supabase.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrls(imagePaths, 3600)
    : { data: [] };
  const thumbUrlByPath = new Map(
    (signedThumbs ?? [])
      .filter((entry) => entry.signedUrl)
      .map((entry) => [entry.path, entry.signedUrl]),
  );

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-sm text-brand-700">
          ← All claims
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">{claim.title}</h1>
          <Badge tone={CLAIM_STATUS_META[claim.status].tone}>
            {CLAIM_STATUS_META[claim.status].label}
          </Badge>
        </div>
        <p className="text-sm text-ink-muted">
          {claimTypeLabel(claim)} · Incident on{" "}
          {formatDate(claim.incident_date)}
        </p>
      </div>

      {claim.urgent_needs && (
        <Card className="border-warning-600/40 bg-warning-50">
          <h2 className="text-sm font-semibold text-warning-600">
            Urgent needs
          </h2>
          <p className="mt-1 text-sm text-ink">{claim.urgent_needs}</p>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">What happened</h2>
        <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
          {claim.description}
        </p>
        {claim.incident_location && (
          <p className="text-sm text-ink-muted">
            Location: {claim.incident_location}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold text-ink">Insurance details</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Insurer</dt>
            <dd className="text-ink">{claim.insurer_name ?? "Not added yet"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Claim number</dt>
            <dd className="text-ink">{claim.claim_number ?? "Not added yet"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Policy number</dt>
            <dd className="text-ink">
              {claim.policy_number ?? "Not added yet"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Status</dt>
            <dd className="text-ink">{CLAIM_STATUS_META[claim.status].label}</dd>
          </div>
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Evidence</h2>
          <span className="text-sm text-ink-muted">
            {evidenceItems.length === 0
              ? "None added yet"
              : `${evidenceItems.length} item${evidenceItems.length === 1 ? "" : "s"} added`}
          </span>
        </div>
        {evidenceItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {evidenceItems.map((item) => {
              const thumb = thumbUrlByPath.get(item.storage_path);
              return (
                <Link
                  key={item.id}
                  href={`/claims/${claim.id}/evidence/${item.id}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted"
                >
                  {thumb ? (
                    /* Signed URLs are short-lived and query-stringed;
                       next/image optimisation would break them. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.user_notes ?? item.file_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-ink-muted">
                      {EVIDENCE_CATEGORY_LABELS[item.category]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        <Link
          href={`/claims/${claim.id}/evidence/new`}
          className={buttonClassName("primary")}
        >
          Add evidence
        </Link>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Your policy</h2>
        <p className="text-sm text-ink-muted">
          Link your insurer and product, then ask plain-English questions
          answered only from verified policy wording.
        </p>
        <Link
          href={`/claims/${claim.id}/policy`}
          className={buttonClassName("secondary")}
        >
          Policy details and questions
        </Link>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">AI tools</h2>
        <p className="text-sm text-ink-muted">
          Generate an editable claim summary, a missing-evidence checklist or
          a follow-up email — drafted only from what&apos;s in this claim.
        </p>
        <Link
          href={`/claims/${claim.id}/ai`}
          className={buttonClassName("secondary")}
        >
          Open AI tools
        </Link>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Timeline and calls</h2>
        <p className="text-sm text-ink-muted">
          Keep a record of what happened and every conversation with your
          insurer.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/claims/${claim.id}/timeline`}
            className={buttonClassName("secondary")}
          >
            View timeline
          </Link>
          <Link
            href={`/claims/${claim.id}/calls`}
            className={buttonClassName("secondary")}
          >
            Call log
          </Link>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">
          Evidence you may want to collect
        </h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
          {CLAIM_TYPE_META[claim.claim_type].suggestedEvidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-xs text-ink-muted">
          This is a general starting point, not a required list — your insurer
          can confirm what they need.
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Evidence pack</h2>
        <p className="text-sm text-ink-muted">
          Export everything as one organised PDF — evidence, timeline, calls
          and summaries.
        </p>
        <Link
          href={`/claims/${claim.id}/export`}
          className={buttonClassName("primary")}
        >
          Build evidence pack
        </Link>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/claims/${claim.id}/edit`}
          className={buttonClassName("secondary")}
        >
          Edit claim details
        </Link>
      </div>
    </Container>
  );
}
