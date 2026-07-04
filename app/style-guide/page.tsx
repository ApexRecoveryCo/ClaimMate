import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";

export default function StyleGuide() {
  return (
    <Container className="flex flex-col gap-10 py-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Buttons</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="success">Approved</Badge>
          <Badge tone="warning">Pending</Badge>
          <Badge tone="danger">Rejected</Badge>
          <Badge tone="info">Draft</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Input</h2>
        <Input placeholder="e.g. Storm damage to roof" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Card</h2>
        <Card>
          <p className="text-sm text-ink-muted">
            Cards hold grouped content such as a claim summary or evidence
            item.
          </p>
        </Card>
      </section>
    </Container>
  );
}
