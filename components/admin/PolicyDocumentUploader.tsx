"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPolicyDocument } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  POLICY_DOCUMENTS_BUCKET,
} from "@/types/policy";

interface Option {
  id: string;
  label: string;
  insurerId?: string;
}

interface PolicyDocumentUploaderProps {
  insurers: Option[];
  products: Option[];
  pdsDocuments: Option[];
}

export function PolicyDocumentUploader({
  insurers,
  products,
  pdsDocuments,
}: PolicyDocumentUploaderProps) {
  const router = useRouter();
  const [insurerId, setInsurerId] = useState("");
  const [productId, setProductId] = useState("");
  const [documentType, setDocumentType] = useState("pds");
  const [title, setTitle] = useState("");
  const [versionName, setVersionName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [modifiesDocumentId, setModifiesDocumentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleProducts = products.filter(
    (product) => !insurerId || product.insurerId === insurerId,
  );

  function submit() {
    if (!file) {
      setError("Choose the PDF to upload.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Policy documents must be PDFs.");
      return;
    }
    setError(null);

    startTransition(async () => {
      setProgress("Uploading PDF…");
      const supabase = createClient();
      const path = `${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(POLICY_DOCUMENTS_BUCKET)
        .upload(path, file, { contentType: "application/pdf" });

      if (uploadError) {
        setProgress(null);
        setError("The PDF couldn't be uploaded. Check your connection and try again.");
        return;
      }

      setProgress("Saving document record…");
      const result = await createPolicyDocument({
        insurerId,
        productId,
        documentType,
        documentTitle: title,
        versionName,
        issueDate,
        effectiveFrom,
        effectiveTo,
        sourceUrl,
        storagePath: path,
        modifiesDocumentId,
      });

      setProgress(null);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("documentId" in result) {
        router.push(`/admin/documents/${result.documentId}`);
        router.refresh();
      }
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold text-ink">Add a document version</h2>
        <p className="text-sm text-ink-muted">
          New versions are always new records — old versions stay archived and
          searchable, never overwritten.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Label>
            Insurer
            <Select
              required
              value={insurerId}
              onChange={(e) => {
                setInsurerId(e.target.value);
                setProductId("");
              }}
            >
              <option value="" disabled>
                Choose
              </option>
              {insurers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Product
            <Select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="" disabled>
                Choose
              </option>
              {visibleProducts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Label>
        </div>
        <Label>
          Document type
          <Select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Label>
        {documentType === "spds" && (
          <Label>
            Modifies which PDS?
            <Select
              value={modifiesDocumentId}
              onChange={(e) => setModifiesDocumentId(e.target.value)}
            >
              <option value="">Not linked yet</option>
              {pdsDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.label}
                </option>
              ))}
            </Select>
          </Label>
        )}
        <Label>
          Document title
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Home and Contents Insurance PDS"
          />
        </Label>
        <Label>
          Version name{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
          <Input
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="e.g. v14, March 2026"
          />
        </Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Label>
            Issue date
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </Label>
          <Label>
            Effective from
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </Label>
          <Label>
            Effective to
            <Input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
            />
          </Label>
        </div>
        <Label>
          Official source URL
          <Input
            type="url"
            required
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://insurer.com.au/documents/pds.pdf"
          />
        </Label>
        <Label>
          PDF file
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </Label>
      </Card>

      {error && <Notice tone="danger">{error}</Notice>}

      <Button type="submit" disabled={isPending}>
        {progress ?? "Add document"}
      </Button>
    </form>
  );
}
