import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PolicyDocumentUploader } from "@/components/admin/PolicyDocumentUploader";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import {
  DOCUMENT_TYPE_LABELS,
  type InsuranceProduct,
  type Insurer,
  type PolicyDocument,
} from "@/types/policy";

export default async function AdminDocumentsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: documents }, { data: insurers }, { data: products }] =
    await Promise.all([
      supabase
        .from("policy_documents")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<PolicyDocument[]>(),
      supabase
        .from("insurers")
        .select("*")
        .order("brand_name")
        .returns<Insurer[]>(),
      supabase
        .from("insurance_products")
        .select("*")
        .order("product_name")
        .returns<InsuranceProduct[]>(),
    ]);

  const insurerName = new Map(
    (insurers ?? []).map((insurer) => [insurer.id, insurer.brand_name]),
  );

  return (
    <Container className="flex flex-col gap-6 py-8">
      <Link href="/admin" className="text-sm text-brand-700">
        ← Admin
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Policy documents</h1>

      <div className="flex flex-col gap-2">
        {(documents ?? []).map((doc) => (
          <Link key={doc.id} href={`/admin/documents/${doc.id}`} className="block">
            <Card className="flex flex-col gap-1 py-3 transition-colors hover:border-brand-300 sm:py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink">{doc.document_title}</span>
                <Badge
                  tone={
                    doc.document_status === "active"
                      ? "success"
                      : doc.document_status === "superseded"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {doc.document_status}
                </Badge>
              </div>
              <p className="text-sm text-ink-muted">
                {insurerName.get(doc.insurer_id) ?? "Unknown insurer"} ·{" "}
                {DOCUMENT_TYPE_LABELS[doc.document_type]}
                {doc.effective_from
                  ? ` · effective ${formatDate(doc.effective_from)}${doc.effective_to ? ` – ${formatDate(doc.effective_to)}` : " onward"}`
                  : ""}
              </p>
            </Card>
          </Link>
        ))}
        {(documents ?? []).length === 0 && (
          <p className="text-sm text-ink-muted">
            No documents yet — add the first one below.
          </p>
        )}
      </div>

      <PolicyDocumentUploader
        insurers={(insurers ?? []).map((i) => ({ id: i.id, label: i.brand_name }))}
        products={(products ?? []).map((p) => ({
          id: p.id,
          label: `${p.product_name} (${insurerName.get(p.insurer_id) ?? "?"})`,
          insurerId: p.insurer_id,
        }))}
        pdsDocuments={(documents ?? [])
          .filter((d) => d.document_type === "pds")
          .map((d) => ({ id: d.id, label: d.document_title }))}
      />
    </Container>
  );
}
