import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { PolicyQA } from "@/components/policy/PolicyQA";
import { isAiConfigured } from "@/lib/ai/client";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import {
  PRODUCT_TYPE_LABELS,
  type CustomerPolicy,
  type InsuranceProduct,
  type Insurer,
} from "@/types/policy";
import { savePolicyDetails } from "./actions";

export default async function ClaimPolicyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const [{ data: insurers }, { data: products }, { data: customerPolicy }, { count: scheduleCount }] =
    await Promise.all([
      supabase
        .from("insurers")
        .select("*")
        .eq("active_status", true)
        .order("brand_name")
        .returns<Insurer[]>(),
      supabase
        .from("insurance_products")
        .select("*")
        .eq("active_status", true)
        .order("product_name")
        .returns<InsuranceProduct[]>(),
      supabase
        .from("customer_policies")
        .select("*")
        .eq("claim_id", claim.id)
        .maybeSingle<CustomerPolicy>(),
      supabase
        .from("evidence_items")
        .select("id", { count: "exact", head: true })
        .eq("claim_id", claim.id)
        .eq("category", "policy_document"),
    ]);

  const saveAction = savePolicyDetails.bind(null, claim.id);
  const insurerList = insurers ?? [];
  const productList = products ?? [];
  const hasSchedule = (scheduleCount ?? 0) > 0;

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
          ← Back to claim
        </Link>
        <h1 className="text-2xl font-semibold text-ink">Your policy</h1>
        <p className="text-sm text-ink-muted">
          Link your insurance details so ClaimMate can find the policy wording
          that applies to your claim.
        </p>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      {insurerList.length === 0 ? (
        <Notice tone="info">
          The policy library doesn&apos;t have any insurers yet, so policy
          questions aren&apos;t available. Everything else in your claim still
          works.
        </Notice>
      ) : (
        <form action={saveAction} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <Label>
              Insurer
              <Select
                name="insurerId"
                defaultValue={customerPolicy?.insurer_id ?? ""}
              >
                <option value="">Not sure yet</option>
                {insurerList.map((insurer) => (
                  <option key={insurer.id} value={insurer.id}>
                    {insurer.brand_name}
                  </option>
                ))}
              </Select>
            </Label>
            <Label>
              Product
              <Select
                name="productId"
                defaultValue={customerPolicy?.product_id ?? ""}
              >
                <option value="">Not sure yet</option>
                {productList.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} (
                    {PRODUCT_TYPE_LABELS[product.product_type]})
                  </option>
                ))}
              </Select>
            </Label>
            <Label>
              Policy number{" "}
              <span className="font-normal text-ink-muted">(optional)</span>
              <Input
                name="policyNumber"
                defaultValue={customerPolicy?.policy_number ?? ""}
              />
            </Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Label>
                Policy start date
                <Input
                  type="date"
                  name="startDate"
                  defaultValue={customerPolicy?.policy_start_date ?? ""}
                />
              </Label>
              <Label>
                Policy end date
                <Input
                  type="date"
                  name="endDate"
                  defaultValue={customerPolicy?.policy_end_date ?? ""}
                />
              </Label>
            </div>
            <Label>
              Excess amount ($){" "}
              <span className="font-normal text-ink-muted">(from your Policy Schedule)</span>
              <Input
                type="number"
                name="excess"
                min="0"
                step="0.01"
                defaultValue={customerPolicy?.excess_amount ?? ""}
              />
            </Label>
          </Card>
          <Button type="submit">Save policy details</Button>
        </form>
      )}

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold text-ink">Your Policy Schedule</h2>
        {hasSchedule ? (
          <p className="text-sm text-ink-muted">
            You&apos;ve added policy documents to your evidence — good. The
            schedule confirms your excess, sums insured and optional extras.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              The PDS explains the general cover, but your Policy Schedule or
              Certificate of Insurance confirms what applies to you — your
              excess, sums insured and optional extras. Add it as evidence
              under &quot;Policy documents&quot;.
            </p>
            <Link
              href={`/claims/${claim.id}/evidence/new`}
              className="text-sm font-medium text-brand-700"
            >
              Add your Policy Schedule →
            </Link>
          </>
        )}
      </Card>

      <PolicyQA
        claimId={claim.id}
        aiConfigured={isAiConfigured()}
        hasPolicyDetails={Boolean(customerPolicy?.product_id)}
      />
    </Container>
  );
}
