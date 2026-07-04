import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { type PolicyDocument } from "@/types/policy";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function recheckCutoffIso() {
  return new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [insurers, products, documents, draftClauses, docsForRecheck] =
    await Promise.all([
      supabase.from("insurers").select("id", { count: "exact", head: true }),
      supabase
        .from("insurance_products")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("policy_documents")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("policy_clauses")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "draft"),
      supabase
        .from("policy_documents")
        .select("*")
        .neq("document_status", "archived")
        .or(
          `last_checked_at.is.null,last_checked_at.lt.${recheckCutoffIso()}`,
        )
        .limit(10)
        .returns<PolicyDocument[]>(),
    ]);

  const sections = [
    {
      href: "/admin/insurers",
      title: "Insurers",
      count: insurers.count ?? 0,
      description: "Brands, legal entities and contact details",
    },
    {
      href: "/admin/products",
      title: "Products",
      count: products.count ?? 0,
      description: "Insurance products per insurer",
    },
    {
      href: "/admin/documents",
      title: "Policy documents",
      count: documents.count ?? 0,
      description: "PDS, SPDS and other official documents",
    },
    {
      href: "/admin/review",
      title: "Clause review queue",
      count: draftClauses.count ?? 0,
      description: "Extracted clauses waiting for human approval",
    },
  ];

  return (
    <Container className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Policy library admin</h1>
      <p className="text-sm text-ink-muted">
        Customer answers only ever use clauses a human has approved here.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="block">
            <Card className="flex flex-col gap-1 transition-colors hover:border-brand-300">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-ink">{section.title}</h2>
                <span className="text-lg font-semibold text-brand-700">
                  {section.count}
                </span>
              </div>
              <p className="text-sm text-ink-muted">{section.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Due for monthly recheck</h2>
        {(docsForRecheck.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing due — all documents were checked in the last 30 days.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(docsForRecheck.data ?? []).map((doc) => (
              <li key={doc.id} className="text-sm">
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="font-medium text-brand-700"
                >
                  {doc.document_title}
                </Link>{" "}
                <span className="text-ink-muted">
                  — last checked{" "}
                  {doc.last_checked_at
                    ? formatDate(doc.last_checked_at)
                    : "never"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
