import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getOwnClaim } from "@/lib/claims";
import {
  TIMELINE_EVENT_LABELS,
  TIMELINE_EVENT_TYPES,
} from "@/types/timeline";
import { createTimelineEvent } from "../../activity/actions";

export default async function NewTimelineEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const claim = await getOwnClaim(id);
  const createAction = createTimelineEvent.bind(null, claim.id);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Container className="flex flex-col gap-4 py-8">
      <Link
        href={`/claims/${claim.id}/timeline`}
        className="text-sm text-brand-700"
      >
        ← Back to timeline
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Add to the timeline</h1>

      {error && <Notice tone="danger">{error}</Notice>}

      <form action={createAction} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <Label>
            When did it happen?
            <Input type="date" name="eventDate" required max={today} />
          </Label>
          <Label>
            What kind of event?
            <Select name="eventType" defaultValue="note">
              {TIMELINE_EVENT_TYPES.filter((t) => t !== "incident").map(
                (type) => (
                  <option key={type} value={type}>
                    {TIMELINE_EVENT_LABELS[type]}
                  </option>
                ),
              )}
            </Select>
          </Label>
          <Label>
            Short title
            <Input
              name="title"
              required
              placeholder="e.g. Assessor visited the property"
            />
          </Label>
          <Label>
            Details{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <Textarea
              name="description"
              rows={3}
              placeholder="Anything worth remembering about this moment"
            />
          </Label>
        </Card>
        <Button type="submit">Add event</Button>
      </form>
    </Container>
  );
}
