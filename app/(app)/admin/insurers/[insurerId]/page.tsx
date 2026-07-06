import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { requireAdmin } from "@/lib/admin";
import { type Insurer } from "@/types/policy";
import { updateInsurer } from "../../actions";

export default async function AdminInsurerEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ insurerId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { insurerId } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: insurer } = await supabase
    .from("insurers")
    .select("*")
    .eq("id", insurerId)
    .maybeSingle<Insurer>();
  if (!insurer) notFound();

  const updateAction = updateInsurer.bind(null, insurer.id);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <Link href="/admin/insurers" className="text-sm text-brand-700">
        ← Insurers
      </Link>
      <h1 className="text-2xl font-semibold text-ink">{insurer.brand_name}</h1>

      {error && <Notice tone="danger">{error}</Notice>}

      <form action={updateAction} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <Label>
            Brand name
            <Input name="brandName" defaultValue={insurer.brand_name} required />
          </Label>
          <Label>
            Legal entity name
            <Input
              name="legalEntityName"
              defaultValue={insurer.legal_entity_name ?? ""}
            />
          </Label>
          <Label>
            Underwriter name
            <Input
              name="underwriterName"
              defaultValue={insurer.underwriter_name ?? ""}
            />
          </Label>
          <Label>
            APRA registered name
            <Input name="apraName" defaultValue={insurer.apra_registered_name ?? ""} />
          </Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label>
              Claims phone
              <Input
                name="claimsPhone"
                type="tel"
                defaultValue={insurer.claims_phone ?? ""}
              />
            </Label>
            <Label>
              Claims email
              <Input
                name="claimsEmail"
                type="email"
                defaultValue={insurer.claims_email ?? ""}
              />
            </Label>
          </div>
          <Label>
            Website URL
            <Input
              name="websiteUrl"
              type="url"
              defaultValue={insurer.website_url ?? ""}
            />
          </Label>
          <Label>
            Complaints URL
            <Input
              name="complaintsUrl"
              type="url"
              defaultValue={insurer.complaints_url ?? ""}
            />
          </Label>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="activeStatus"
              defaultChecked={insurer.active_status}
              className="h-4 w-4 min-h-0 accent-brand-600"
            />
            Active (available for users to select)
          </label>
        </Card>
        <Button type="submit">Save changes</Button>
      </form>
    </Container>
  );
}
