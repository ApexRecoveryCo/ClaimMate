import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getOwnClaim } from "@/lib/claims";

const TOOLS = [
  {
    slug: "summary",
    title: "Claim summary",
    description:
      "A clear plain-English overview of your claim — useful for keeping track or sharing with someone helping you.",
  },
  {
    slug: "evidence-gaps",
    title: "Missing evidence check",
    description:
      "A prioritised list of evidence you may still want to collect for this type of claim.",
  },
  {
    slug: "follow-up-email",
    title: "Follow-up email",
    description:
      "A polite, factual email to your insurer based on your claim record.",
  },
];

export default async function AiToolsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

  return (
    <Container className="flex flex-col gap-4 py-8">
      <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
        ← Back to claim
      </Link>
      <h1 className="text-2xl font-semibold text-ink">AI tools</h1>
      <p className="text-sm text-ink-muted">
        Drafts are generated only from the details, evidence and notes in this
        claim. Everything is editable and clearly labelled — nothing is sent
        anywhere without you.
      </p>

      <div className="flex flex-col gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/claims/${claim.id}/ai/${tool.slug}`}
            className="block"
          >
            <Card className="flex flex-col gap-1 transition-colors hover:border-brand-300">
              <h2 className="font-medium text-ink">{tool.title}</h2>
              <p className="text-sm text-ink-muted">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
