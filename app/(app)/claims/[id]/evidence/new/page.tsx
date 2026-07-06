import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { EvidenceUploader } from "@/components/evidence/EvidenceUploader";
import { getOwnClaim } from "@/lib/claims";

export default async function AddEvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

  return (
    <Container className="flex flex-col gap-4 py-8">
      <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
        ← Back to claim
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Add evidence</h1>
      <p className="text-sm text-ink-muted">
        Photos straight from your phone camera work well. Files stay private
        to your account.
      </p>
      <EvidenceUploader userId={claim.user_id} claimId={claim.id} />
    </Container>
  );
}
