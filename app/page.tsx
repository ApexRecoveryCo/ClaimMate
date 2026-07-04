import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function Home() {
  return (
    <Container className="flex flex-1 flex-col justify-center gap-6 py-12">
      <div className="flex flex-col gap-3">
        <Badge tone="info">Phase 1 — foundation</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Organise your evidence. Prove what happened.
        </h1>
        <p className="text-base leading-7 text-ink-muted">
          ClaimMate helps you collect evidence, track your claim and generate
          a clear evidence pack — one step at a time.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-ink-muted">
          ClaimMate does not provide legal advice, financial advice, emergency
          advice or a claim outcome prediction. For immediate danger, contact
          emergency services.
        </p>
        <Button disabled>Create a claim (coming soon)</Button>
      </Card>
    </Container>
  );
}
