import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Textarea } from "@/components/ui/Textarea";
import { getOwnClaim } from "@/lib/claims";
import { createCallLog } from "../../activity/actions";

export default async function NewCallLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const claim = await getOwnClaim(id);
  const createAction = createCallLog.bind(null, claim.id);

  return (
    <Container className="flex flex-col gap-4 py-8">
      <Link href={`/claims/${claim.id}/calls`} className="text-sm text-brand-700">
        ← Back to calls
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Log a call</h1>
      <p className="text-sm text-ink-muted">
        Recording who said what makes follow-ups much easier later.
      </p>

      {error && <Notice tone="danger">{error}</Notice>}

      <form action={createAction} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <Label>
            When was the call?
            <Input type="datetime-local" name="callDate" required />
          </Label>
          <Label>
            Who was it with?
            <Input
              name="organisation"
              required
              placeholder="e.g. AAMI claims team"
            />
          </Label>
          <Label>
            Person you spoke to{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <Input name="person" placeholder="e.g. Sarah" />
          </Label>
          <Label>
            Phone number{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <Input name="phone" type="tel" />
          </Label>
          <Label>
            What was said?
            <Textarea
              name="summary"
              required
              placeholder="Short summary of the conversation"
            />
          </Label>
          <Label>
            Anything they promised?{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <Textarea
              name="promises"
              rows={2}
              placeholder="e.g. Assessor will visit within 5 business days"
            />
          </Label>
          <Label>
            Next steps{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <Textarea
              name="nextSteps"
              rows={2}
              placeholder="e.g. Send photos of the ceiling by Friday"
            />
          </Label>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="addToTimeline"
              defaultChecked
              className="h-4 w-4 min-h-0 accent-brand-600"
            />
            Add this call to the claim timeline
          </label>
        </Card>
        <Button type="submit">Save call</Button>
      </form>
    </Container>
  );
}
