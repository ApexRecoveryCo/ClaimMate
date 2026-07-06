import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ExportPackBuilder } from "@/components/export/ExportPackBuilder";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

interface ClaimExport {
  id: string;
  storage_path: string;
  sections_included: string[];
  created_at: string;
}

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: exports } = await supabase
    .from("claim_exports")
    .select("id, storage_path, sections_included, created_at")
    .eq("claim_id", claim.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<ClaimExport[]>();

  const previous = exports ?? [];
  const { data: signed } = previous.length
    ? await supabase.storage
        .from("claim-exports")
        .createSignedUrls(
          previous.map((entry) => entry.storage_path),
          3600,
        )
    : { data: [] };
  const urlByPath = new Map(
    (signed ?? [])
      .filter((entry) => entry.signedUrl)
      .map((entry) => [entry.path, entry.signedUrl]),
  );

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
          ← Back to claim
        </Link>
        <h1 className="text-2xl font-semibold text-ink">Evidence pack</h1>
        <p className="text-sm text-ink-muted">
          One organised PDF of your claim — ready to keep, or send to your
          insurer or someone helping you.
        </p>
      </div>

      <ExportPackBuilder claimId={claim.id} />

      {previous.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h2 className="font-semibold text-ink">Previous exports</h2>
          {previous.map((entry) => {
            const url = urlByPath.get(entry.storage_path);
            return (
              <p key={entry.id} className="text-sm">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700"
                  >
                    {formatDateTime(entry.created_at)}
                  </a>
                ) : (
                  <span className="text-ink">{formatDateTime(entry.created_at)}</span>
                )}{" "}
                <span className="text-ink-muted">
                  — {entry.sections_included.length} section
                  {entry.sections_included.length === 1 ? "" : "s"}
                </span>
              </p>
            );
          })}
        </Card>
      )}
    </Container>
  );
}
