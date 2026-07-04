"use client";

import { useState, useTransition } from "react";
import {
  askPolicyQuestion,
  type PolicyAnswer,
} from "@/app/(app)/claims/[id]/policy/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

interface PolicyQAProps {
  claimId: string;
  aiConfigured: boolean;
  hasPolicyDetails: boolean;
}

export function PolicyQA({
  claimId,
  aiConfigured,
  hasPolicyDetails,
}: PolicyQAProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<PolicyAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function ask() {
    setError(null);
    startTransition(async () => {
      const result = await askPolicyQuestion(claimId, question);
      if ("error" in result) {
        setError(result.error);
        setAnswer(null);
      } else {
        setAnswer(result);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Ask about your policy</h2>
      <p className="text-sm text-ink-muted">
        Answers come only from approved wording in our policy library that
        matches your policy — never from general AI knowledge. If we can&apos;t
        find the right wording, we&apos;ll say so.
      </p>

      {!aiConfigured && (
        <Notice tone="info">
          AI answers aren&apos;t set up on this server yet.
        </Notice>
      )}
      {!hasPolicyDetails && (
        <Notice tone="info">
          Add your insurer and product above before asking — we need them to
          find the right policy wording.
        </Notice>
      )}

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Is water damage from a burst pipe covered?"
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isPending || !aiConfigured || !hasPolicyDetails}
          className="sm:w-auto"
        >
          {isPending ? "Checking the wording…" : "Ask"}
        </Button>
      </form>

      {error && <Notice tone="danger">{error}</Notice>}

      {answer && (
        <Card className="flex flex-col gap-3">
          <Badge tone="info">AI-generated explanation — not advice</Badge>
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
            {answer.text}
          </p>
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <h3 className="text-sm font-semibold text-ink">Sources used</h3>
            {answer.sources.map((source, index) => (
              <p key={index} className="text-xs text-ink-muted">
                {source.documentTitle}
                {source.sectionTitle ? ` — ${source.sectionTitle}` : ""}
                {source.pageNumber ? `, page ${source.pageNumber}` : ""} (
                {source.category})
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
