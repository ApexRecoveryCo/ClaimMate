import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getOwnClaim } from "@/lib/claims";
import { formatDate } from "@/lib/format";
import {
  CLAIM_STATUS_META,
  CLAIM_TYPE_META,
  claimTypeLabel,
} from "@/types/claims";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

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
