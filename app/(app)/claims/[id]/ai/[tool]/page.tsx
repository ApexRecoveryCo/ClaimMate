import Link from "next/link";
import { notFound } from "next/navigation";
import { AiToolPanel } from "@/components/ai/AiToolPanel";
import { Container } from "@/components/ui/Container";
import { isAiConfigured } from "@/lib/ai/client";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import { type AiOutputType } from "@/types/ai";

const TOOL_CONFIG: Record<
  string,
  { outputType: AiOutputType; title: string; intro: string }
> = {
  summary: {
    outputType: "summary",
    title: "Claim summary",
    intro:
      "Generates a plain-English overview from your claim details, evidence, timeline and calls.",
  },
  "evidence-gaps": {
    outputType: "evidence_gaps",
    title: "Missing evidence check",
    intro:
      "Compares your claim type with the evidence you've added and suggests what you may still want to collect.",
  },
  "follow-up-email": {
    outputType: "follow_up_email",
    title: "Follow-up email",
    intro:
      "Drafts a factual, editable email to your insurer using only the details in this claim.",
  },
};

export default async function AiToolPage({
  params,
}: {
  params: Promise<{ id: string; tool: string }>;
}) {
  const { id, tool } = await params;
  const config = TOOL_CONFIG[tool];
  if (!config) notFound();

  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("ai_outputs")
    .select("response_text")
    .eq("claim_id", claim.id)
    .eq("output_type", config.outputType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ response_text: string }>();

  return (
    <Container className="flex flex-col gap-4 py-8">
      <Link href={`/claims/${claim.id}/ai`} className="text-sm text-brand-700">
        ← All AI tools
      </Link>
      <h1 className="text-2xl font-semibold text-ink">{config.title}</h1>
      <p className="text-sm text-ink-muted">{config.intro}</p>

      <AiToolPanel
        claimId={claim.id}
        outputType={config.outputType}
        aiConfigured={isAiConfigured()}
        initialDraft={latest?.response_text ?? null}
      />
    </Container>
  );
}
