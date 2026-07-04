import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import {
  TIMELINE_EVENT_LABELS,
  TIMELINE_EVENT_TYPES,
  type TimelineEvent,
} from "@/types/timeline";
import { deleteTimelineEvent, updateTimelineEvent } from "../../activity/actions";

export default async function TimelineEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, eventId } = await params;
  const { error } = await searchParams;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("id", eventId)
    .eq("claim_id", claim.id)
    .maybeSingle<TimelineEvent>();
  if (!event) notFound();

  const updateAction = updateTimelineEvent.bind(null, claim.id, event.id);
  const deleteAction = deleteTimelineEvent.bind(null, claim.id, event.id);

  return (
    <Container className="flex flex-col gap-4 py-8">
      <Link
        href={`/claims/${claim.id}/timeline`}
        className="text-sm text-brand-700"
      >
        ← Back to timeline
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Edit event</h1>
      {event.source !== "user" && (
        <p className="text-sm text-ink-muted">
          This event was added automatically — you can still correct it.
        </p>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <form action={updateAction} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <Label>
            When did it happen?
            <Input
              type="date"
              name="eventDate"
              required
              defaultValue={event.event_date}
            />
          </Label>
          <Label>
            What kind of event?
            <Select name="eventType" defaultValue={event.event_type}>
              {TIMELINE_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TIMELINE_EVENT_LABELS[type]}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Short title
            <Input name="title" required defaultValue={event.title} />
          </Label>
          <Label>
            Details
            <Textarea
              name="description"
              rows={3}
              defaultValue={event.description ?? ""}
            />
          </Label>
        </Card>
        <Button type="submit">Save changes</Button>
      </form>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Remove this event</h2>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            variant="danger"
            confirmMessage="Delete this timeline event?"
          >
            Delete event
          </ConfirmSubmitButton>
        </form>
      </Card>
    </Container>
  );
}
