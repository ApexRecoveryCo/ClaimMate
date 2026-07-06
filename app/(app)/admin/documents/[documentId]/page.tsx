import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import {
  DOCUMENT_TYPE_LABELS,
  type PolicyDocument,
} from "@/types/policy";
import { runIngestion, setDocumentStatus } from "../../actions";

export default async function AdminDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { documentId } = await params;
  const { error, message } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: doc } = await supabase
    .from("policy_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle<PolicyDocument>();
  if (!doc) notFound();

  const [draft, approved, rejected] = await Promise.all([
    supabase
      .from("policy_clauses")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("approval_status", "draft"),
    supabase
      .from("policy_clauses")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("approval_status", "approved"),
    supabase
      .from("policy_clauses")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("approval_status", "rejected"),
  ]);

  const ingestAction = runIngestion.bind(null, doc.id);
  const statusAction = setDocumentStatus.bind(null, doc.id);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <Link href="/admin/documents" className="text-sm text-brand-700">
        ← Documents
      </Link>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{doc.document_title}</h1>
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

      {error && <Notice tone="danger">{error}</Notice>}
      {message && <Notice tone="info">{message}</Notice>}

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold text-ink">Details</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Type</dt>
            <dd className="text-ink">{DOCUMENT_TYPE_LABELS[doc.document_type]}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Version</dt>
            <dd className="text-ink">{doc.version_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Issue date</dt>
            <dd className="text-ink">
              {doc.issue_date ? formatDate(doc.issue_date) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Effective</dt>
            <dd className="text-ink">
              {doc.effective_from ? formatDate(doc.effective_from) : "?"} –{" "}
              {doc.effective_to ? formatDate(doc.effective_to) : "onward"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Source</dt>
            <dd className="break-all text-ink">
              <a
                href={doc.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700"
              >
                {doc.source_url}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">File hash</dt>
            <dd className="break-all text-ink">{doc.file_hash ?? "Not computed yet"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Last checked</dt>
            <dd className="text-ink">
              {doc.last_checked_at ? formatDate(doc.last_checked_at) : "Never"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Clauses</h2>
        <p className="text-sm text-ink-muted">
          {draft.count ?? 0} draft · {approved.count ?? 0} approved ·{" "}
          {rejected.count ?? 0} rejected
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form action={ingestAction}>
            <Button type="submit">Run clause extraction</Button>
          </form>
          <Link
            href={`/admin/review?document=${doc.id}`}
            className={buttonClassName("secondary")}
          >
            Review clauses
          </Link>
        </div>
        <p className="text-xs text-ink-muted">
          Extraction reads the PDF, splits it into clauses with Claude and
          saves them as drafts. Nothing reaches customers until a human
          approves it.
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Document status</h2>
        <form action={statusAction} className="flex flex-col gap-3 sm:flex-row">
          <Select name="status" defaultValue={doc.document_status} className="sm:w-auto">
            <option value="active">Active</option>
            <option value="superseded">Superseded</option>
            <option value="archived">Archived</option>
          </Select>
          <Button type="submit" variant="secondary">
            Update status
          </Button>
        </form>
        <p className="text-xs text-ink-muted">
          Never delete old versions — mark them superseded or archived so
          historical claims can still reference them.
        </p>
      </Card>
    </Container>
  );
}
