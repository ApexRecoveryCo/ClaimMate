import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  TIMELINE_EVENT_LABELS,
  type TimelineEvent,
} from "@/types/timeline";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("claim_id", claim.id)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<TimelineEvent[]>();

  const entries: Array<
    | { kind: "incident"; date: string }
    | { kind: "event"; event: TimelineEvent }
  > = [
    { kind: "incident", date: claim.incident_date },
    ...(events ?? []).map((event) => ({ kind: "event" as const, event })),
  ];
  entries.sort((a, b) => {
    const dateA = a.kind === "incident" ? a.date : a.event.event_date;
    const dateB = b.kind === "incident" ? b.date : b.event.event_date;
    return dateA.localeCompare(dateB);
  });

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
          ← Back to claim
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink">Timeline</h1>
          <Link
            href={`/claims/${claim.id}/timeline/new`}
            className={buttonClassName("primary", "w-auto")}
          >
            Add event
          </Link>
        </div>
        <p className="text-sm text-ink-muted">
          The story of your claim in order. You can add or correct anything.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {entries.map((entry, index) =>
          entry.kind === "incident" ? (
            <li key="incident">
              <Card className="flex flex-col gap-1 border-l-4 border-l-brand-600">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink-muted">
                    {formatDate(entry.date)}
                  </span>
                  <Badge tone="info">Incident</Badge>
                </div>
                <p className="font-medium text-ink">The incident happened</p>
                <p className="text-sm text-ink-muted">
                  Taken from your claim details.
                </p>
              </Card>
            </li>
          ) : (
            <li key={entry.event.id ?? index}>
              <Link
                href={`/claims/${claim.id}/timeline/${entry.event.id}`}
                className="block"
              >
                <Card className="flex flex-col gap-1 transition-colors hover:border-brand-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink-muted">
                      {formatDate(entry.event.event_date)}
                    </span>
                    <Badge tone="neutral">
                      {TIMELINE_EVENT_LABELS[entry.event.event_type]}
                    </Badge>
                  </div>
                  <p className="font-medium text-ink">{entry.event.title}</p>
                  {entry.event.description && (
                    <p className="text-sm text-ink-muted">
                      {entry.event.description}
                    </p>
                  )}
                </Card>
              </Link>
            </li>
          ),
        )}
      </ol>

      {(events ?? []).length === 0 && (
        <p className="text-center text-sm text-ink-muted">
          Add key moments — calls, letters, assessor visits — so the full
          story is in one place.
        </p>
      )}
    </Container>
  );
}
