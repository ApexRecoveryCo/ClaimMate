"use client";

import { useState, useTransition } from "react";
import {
  generateExportPack,
  startClaimPackCheckout,
} from "@/app/(app)/claims/[id]/export/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { type ExportSections } from "@/lib/export/pdf";

const SECTION_OPTIONS: Array<{
  key: keyof ExportSections;
  label: string;
  description: string;
}> = [
  {
    key: "evidence",
    label: "Evidence",
    description: "Every item with notes and dates; photos embedded",
  },
  {
    key: "timeline",
    label: "Timeline",
    description: "The story of the claim in date order",
  },
  {
    key: "calls",
    label: "Call log",
    description: "Who you spoke to, what was said and promised",
  },
  {
    key: "aiSummary",
    label: "Claim summary",
    description: "Your latest AI-drafted summary (clearly labelled)",
  },
  {
    key: "policyAnswer",
    label: "Policy wording explanation",
    description: "Your latest source-backed policy answer (clearly labelled)",
  },
];

export function ExportPackBuilder({ claimId }: { claimId: string }) {
  const [sections, setSections] = useState<ExportSections>({
    evidence: true,
    timeline: true,
    calls: true,
    aiSummary: true,
    policyAnswer: false,
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsPurchase, setNeedsPurchase] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof ExportSections) {
    setSections((current) => ({ ...current, [key]: !current[key] }));
  }

  function generate() {
    setError(null);
    setDownloadUrl(null);
    startTransition(async () => {
      const result = await generateExportPack(claimId, sections);
      if ("error" in result) {
        setError(result.error);
        setNeedsPurchase(Boolean(result.needsPurchase));
      } else {
        setDownloadUrl(result.downloadUrl);
      }
    });
  }

  function unlock() {
    setError(null);
    startTransition(async () => {
      const result = await startClaimPackCheckout(claimId);
      if ("error" in result) {
        setError(result.error);
      } else {
        window.location.href = result.checkoutUrl;
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">What goes in the pack?</h2>
        <p className="text-sm text-ink-muted">
          The claim snapshot and your description are always included.
        </p>
        {SECTION_OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex items-start gap-3 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={sections[option.key]}
              onChange={() => toggle(option.key)}
              className="mt-1 h-4 w-4 min-h-0 accent-brand-600"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="block text-ink-muted">{option.description}</span>
            </span>
          </label>
        ))}
      </Card>

      {error && <Notice tone="danger">{error}</Notice>}

      {needsPurchase ? (
        <Button onClick={unlock} disabled={isPending}>
          {isPending ? "Opening checkout…" : "Unlock this claim's evidence pack"}
        </Button>
      ) : (
        <Button onClick={generate} disabled={isPending}>
          {isPending ? "Building your pack…" : "Generate evidence pack (PDF)"}
        </Button>
      )}

      {downloadUrl && (
        <Notice tone="info">
          Your pack is ready —{" "}
          <a
            href={downloadUrl}
            className="font-semibold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            download the PDF
          </a>
          . The link is private and expires in an hour.
        </Notice>
      )}
    </div>
  );
}
