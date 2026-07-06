import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { requireAdmin } from "@/lib/admin";
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  type InsuranceProduct,
  type Insurer,
} from "@/types/policy";
import { createProduct } from "../actions";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();

  const [{ data: products }, { data: insurers }] = await Promise.all([
    supabase
      .from("insurance_products")
      .select("*")
      .order("product_name")
      .returns<InsuranceProduct[]>(),
    supabase
      .from("insurers")
      .select("*")
      .order("brand_name")
      .returns<Insurer[]>(),
  ]);

  const insurerName = new Map(
    (insurers ?? []).map((insurer) => [insurer.id, insurer.brand_name]),
  );

  return (
    <Container className="flex flex-col gap-6 py-8">
      <Link href="/admin" className="text-sm text-brand-700">
        ← Admin
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Products</h1>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="flex flex-col gap-2">
        {(products ?? []).map((product) => (
          <Card key={product.id} className="py-3 sm:py-3">
            <span className="font-medium text-ink">{product.product_name}</span>
            <span className="text-sm text-ink-muted">
              {" "}
              — {insurerName.get(product.insurer_id) ?? "Unknown insurer"} ·{" "}
              {PRODUCT_TYPE_LABELS[product.product_type]}
            </span>
          </Card>
        ))}
        {(products ?? []).length === 0 && (
          <p className="text-sm text-ink-muted">
            No products yet — add the first one below.
          </p>
        )}
      </div>

      <form action={createProduct} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold text-ink">Add a product</h2>
          <Label>
            Insurer
            <Select name="insurerId" required defaultValue="">
              <option value="" disabled>
                Choose an insurer
              </option>
              {(insurers ?? []).map((insurer) => (
                <option key={insurer.id} value={insurer.id}>
                  {insurer.brand_name}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Product name
            <Input
              name="productName"
              required
              placeholder="e.g. Home and Contents Insurance"
            />
          </Label>
          <Label>
            Product type
            <Select name="productType" defaultValue="home_and_contents">
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PRODUCT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Cover category{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <Input name="coverCategory" placeholder="e.g. Standard cover" />
          </Label>
        </Card>
        <Button type="submit">Add product</Button>
      </form>
    </Container>
  );
}
