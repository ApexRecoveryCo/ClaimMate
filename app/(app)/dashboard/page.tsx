import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  CLAIM_STATUS_META,
  claimTypeLabel,
  type Claim,
} from "@/types/claims";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claims } = await supabase
    .from("claims")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<Claim[]>();

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Your claims</h1>
        <Link href="/claims/new" className={buttonClassName("primary", "w-auto")}>
          Start a claim
        </Link>
      </div>

      {!claims || claims.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <h2 className="text-lg font-medium text-ink">No claims yet</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            When something goes wrong, start a claim and ClaimMate will help
            you collect the right evidence, step by step.
          </p>
          <Link href="/claims/new" className={buttonClassName("primary")}>
            Start your first claim
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((claim) => (
            <Link key={claim.id} href={`/claims/${claim.id}`} className="block">
              <Card className="flex flex-col gap-2 transition-colors hover:border-brand-300">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium text-ink">{claim.title}</h2>
                  <Badge tone={CLAIM_STATUS_META[claim.status].tone}>
                    {CLAIM_STATUS_META[claim.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-ink-muted">
                  {claimTypeLabel(claim)} · Incident on{" "}
                  {formatDate(claim.incident_date)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
