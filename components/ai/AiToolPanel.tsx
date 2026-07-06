"use client";

import { useState, useTransition } from "react";
import { generateAiDraft } from "@/app/(app)/claims/[id]/ai/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EMAIL_TONES, type AiOutputType } from "@/types/ai";

interface AiToolPanelProps {
  claimId: string;
  outputType: AiOutputType;
  aiConfigured: boolean;
  initialDraft: string | null;
}

export function AiToolPanel({
  claimId,
  outputType,
  aiConfigured,
  initialDraft,
}: AiToolPanelProps) {
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<string>(EMAIL_TONES[0]);
  const [goal, setGoal] = useState("");
  const [isPending, startTransition] = useTransition();

  const isEmail = outputType === "follow_up_email";

  function generate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await generateAiDraft(
        claimId,
        outputType,
        isEmail ? { tone, goal } : undefined,
      );
      if ("error" in result) {
        setError(result.error);
      } else {
        setDraft(result.text);
      }
    });
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {!aiConfigured && (
        <Notice tone="info">
          AI tools aren&apos;t set up on this server yet. Everything else in
          ClaimMate still works without them.
        </Notice>
      )}

      {isEmail && (
        <Card className="flex flex-col gap-4">
          <Label>
            What should the email achieve?
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Ask for an update and a timeframe for the assessor visit"
            />
          </Label>
          <Label>
            Tone
            <Select value={tone} onChange={(e) => setTone(e.target.value)}>
              {EMAIL_TONES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Label>
        </Card>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <Button onClick={generate} disabled={isPending || !aiConfigured}>
        {isPending
          ? "Generating…"
          : draft
            ? "Regenerate draft"
            : "Generate draft"}
      </Button>

      {draft && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Badge tone="info">AI-generated draft</Badge>
            <button
              type="button"
              onClick={copy}
              className="min-h-0 text-sm font-medium text-brand-700"
            >
              {copied ? "Copied!" : "Copy text"}
            </button>
          </div>
          <Textarea
            rows={16}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <p className="text-xs text-ink-muted">
            This is an AI-generated draft based only on the information in
            your claim. Check it before using it — it may be incomplete or
            incorrect, and it isn&apos;t legal or insurance advice.
          </p>
        </Card>
      )}
    </div>
  );
}
