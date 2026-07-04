import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { requireAdmin } from "@/lib/admin";
import { type Insurer } from "@/types/policy";
import { createInsurer } from "../actions";

export default async function AdminInsurersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: insurers } = await supabase
    .from("insurers")
    .select("*")
    .order("brand_name")
    .returns<Insurer[]>();

  return (
    <Container className="flex flex-col gap-6 py-8">
      <Link href="/admin" className="text-sm text-brand-700">
        ← Admin
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Insurers</h1>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="flex flex-col gap-2">
        {(insurers ?? []).map((insurer) => (
          <Link
            key={insurer.id}
            href={`/admin/insurers/${insurer.id}`}
            className="block"
          >
            <Card className="flex items-center justify-between gap-2 py-3 transition-colors hover:border-brand-300 sm:py-3">
              <div>
                <span className="font-medium text-ink">{insurer.brand_name}</span>
                {insurer.underwriter_name && (
                  <span className="text-sm text-ink-muted">
                    {" "}
                    — underwritten by {insurer.underwriter_name}
                  </span>
                )}
              </div>
              {!insurer.active_status && (
                <span className="text-xs text-ink-muted">inactive</span>
              )}
            </Card>
          </Link>
        ))}
        {(insurers ?? []).length === 0 && (
          <p className="text-sm text-ink-muted">No insurers yet — add the first one below.</p>
        )}
      </div>

      <form action={createInsurer} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold text-ink">Add an insurer</h2>
          <Label>
            Brand name
            <Input name="brandName" required placeholder="e.g. AAMI" />
          </Label>
          <Label>
            Legal entity name
            <Input name="legalEntityName" placeholder="e.g. AAI Limited" />
          </Label>
          <Label>
            Underwriter name
            <Input name="underwriterName" />
          </Label>
          <Label>
            APRA registered name
            <Input name="apraName" />
          </Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label>
              Claims phone
              <Input name="claimsPhone" type="tel" />
            </Label>
            <Label>
              Claims email
              <Input name="claimsEmail" type="email" />
            </Label>
          </div>
          <Label>
            Website URL
            <Input name="websiteUrl" type="url" />
          </Label>
          <Label>
            Complaints URL
            <Input name="complaintsUrl" type="url" />
          </Label>
        </Card>
        <Button type="submit">Add insurer</Button>
      </form>
    </Container>
  );
}
