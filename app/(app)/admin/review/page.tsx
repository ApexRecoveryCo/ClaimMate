import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { requireAdmin } from "@/lib/admin";
import {
  CLAUSE_CATEGORIES,
  CLAUSE_CATEGORY_LABELS,
  type PolicyClause,
  type PolicyDocument,
} from "@/types/policy";
import { reviewClause } from "../actions";

const PAGE_SIZE = 20;

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string }>;
}) {
  const { document: documentFilter } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("policy_clauses")
    .select("*")
    .eq("approval_status", "draft")
    .order("document_id")
    .order("page_number", { ascending: true })
    .limit(PAGE_SIZE);
  if (documentFilter) {
    query = query.eq("document_id", documentFilter);
  }

  const [{ data: clauses }, { data: documents }, { count: totalDraft }] =
    await Promise.all([
      query.returns<PolicyClause[]>(),
      supabase.from("policy_documents").select("*").returns<PolicyDocument[]>(),
      supabase
        .from("policy_clauses")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "draft"),
    ]);

  const docTitle = new Map(
    (documents ?? []).map((doc) => [doc.id, doc.document_title]),
  );
  const returnTo = documentFilter
    ? `/admin/review?document=${documentFilter}`
    : "/admin/review";

  return (
    <Container className="flex flex-col gap-6 py-8">
      <Link href="/admin" className="text-sm text-brand-700">
        ← Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Clause review</h1>
        <Badge tone={totalDraft ? "warning" : "success"}>
          {totalDraft ?? 0} awaiting review
        </Badge>
      </div>
      <p className="text-sm text-ink-muted">
        Check each clause against the source PDF: is the text right, the page
        number right, the category right, and the summary cautious and
        accurate? Only approved clauses can appear in customer answers.
      </p>

      {(clauses ?? []).length === 0 ? (
        <Card className="py-10 text-center">
          <p className="text-sm text-ink-muted">
            Nothing waiting for review{documentFilter ? " for this document" : ""}.
          </p>
        </Card>
      ) : (
        (clauses ?? []).map((clause) => {
          const reviewAction = reviewClause.bind(null, clause.id);
          return (
            <Card key={clause.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium text-ink">
                    {clause.section_title ?? "Untitled section"}
                    {clause.section_number ? ` (${clause.section_number})` : ""}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {docTitle.get(clause.document_id) ?? "Unknown document"}
                    {clause.page_number ? ` · page ${clause.page_number}` : ""}
                  </p>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg bg-surface-muted p-3">
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {clause.clause_text}
                </p>
              </div>

              <form action={reviewAction} className="flex flex-col gap-3">
                <input type="hidden" name="returnTo" value={returnTo} />
                <Label>
                  Category
                  <Select name="category" defaultValue={clause.clause_category}>
                    {CLAUSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CLAUSE_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </Select>
                </Label>
                <Label>
                  Plain-English summary
                  <Textarea
                    name="summary"
                    rows={2}
                    defaultValue={clause.plain_english_summary ?? ""}
                  />
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" name="decision" value="approved">
                    Approve
                  </Button>
                  <Button
                    type="submit"
                    name="decision"
                    value="rejected"
                    variant="danger"
                  >
                    Reject
                  </Button>
                  <Button
                    type="submit"
                    name="decision"
                    value="draft"
                    variant="secondary"
                  >
                    Save edits only
                  </Button>
                </div>
              </form>
            </Card>
          );
        })
      )}
    </Container>
  );
}
