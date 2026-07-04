import Link from "next/link";
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
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_META,
  CLAIM_TYPES,
  CLAIM_TYPE_META,
} from "@/types/claims";
import { deleteClaim, updateClaim } from "../../actions";

export default async function EditClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const claim = await getOwnClaim(id);

  const updateAction = updateClaim.bind(null, claim.id);
  const deleteAction = deleteClaim.bind(null, claim.id);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
          ← Back to claim
        </Link>
        <h1 className="text-2xl font-semibold text-ink">Edit claim</h1>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <form action={updateAction} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <Label>
            Claim name
            <Input name="title" defaultValue={claim.title} required />
          </Label>
          <Label>
            Claim type
            <Select name="claimType" defaultValue={claim.claim_type}>
              {CLAIM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CLAIM_TYPE_META[type].label}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            If &quot;something else&quot;, what happened?
            <Input
              name="claimTypeOther"
              defaultValue={claim.claim_type_other ?? ""}
            />
          </Label>
          <Label>
            Incident date
            <Input
              type="date"
              name="incidentDate"
              defaultValue={claim.incident_date}
              required
            />
          </Label>
          <Label>
            Location
            <Input
              name="incidentLocation"
              defaultValue={claim.incident_location ?? ""}
            />
          </Label>
          <Label>
            Description
            <Textarea
              name="description"
              defaultValue={claim.description}
              required
              minLength={20}
            />
          </Label>
          <Label>
            Urgent needs
            <Textarea
              name="urgentNeeds"
              rows={2}
              defaultValue={claim.urgent_needs ?? ""}
            />
          </Label>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold text-ink">Insurance details</h2>
          <Label>
            Insurer name
            <Input name="insurerName" defaultValue={claim.insurer_name ?? ""} />
          </Label>
          <Label>
            Claim number
            <Input name="claimNumber" defaultValue={claim.claim_number ?? ""} />
          </Label>
          <Label>
            Policy number
            <Input
              name="policyNumber"
              defaultValue={claim.policy_number ?? ""}
            />
          </Label>
          <Label>
            Claim status
            <Select name="status" defaultValue={claim.status}>
              {CLAIM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CLAIM_STATUS_META[status].label}
                </option>
              ))}
            </Select>
          </Label>
        </Card>

        <Button type="submit">Save changes</Button>
      </form>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Delete this claim</h2>
        <p className="text-sm text-ink-muted">
          This permanently removes the claim. Evidence files linked to it will
          no longer be accessible.
        </p>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            variant="danger"
            confirmMessage="Delete this claim permanently? This can't be undone."
          >
            Delete claim
          </ConfirmSubmitButton>
        </form>
      </Card>
    </Container>
  );
}
