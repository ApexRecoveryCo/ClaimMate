import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { Container } from "@/components/ui/Container";
import { getOwnClaim } from "@/lib/claims";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { type CallLog } from "@/types/timeline";
import { deleteCallLog } from "../activity/actions";

export default async function CallLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getOwnClaim(id);

  const supabase = await createClient();
  const { data: calls } = await supabase
    .from("call_logs")
    .select("*")
    .eq("claim_id", claim.id)
    .order("call_date", { ascending: false })
    .returns<CallLog[]>();
  const callLogs = calls ?? [];

  return (
    <Container className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/claims/${claim.id}`} className="text-sm text-brand-700">
          ← Back to claim
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink">Calls</h1>
          <Link
            href={`/claims/${claim.id}/calls/new`}
            className={buttonClassName("primary", "w-auto")}
          >
            Log a call
          </Link>
        </div>
      </div>

      {callLogs.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <h2 className="text-lg font-medium text-ink">No calls logged yet</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            After you speak with your insurer, log the call here so you have a
            record of what was said and promised.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {callLogs.map((call) => {
            const deleteAction = deleteCallLog.bind(null, claim.id, call.id);
            return (
              <Card key={call.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium text-ink">{call.organisation}</h2>
                  <span className="shrink-0 text-sm text-ink-muted">
                    {formatDateTime(call.call_date)}
                  </span>
                </div>
                {call.person_spoken_to && (
                  <p className="text-sm text-ink-muted">
                    Spoke to {call.person_spoken_to}
                    {call.phone_number ? ` · ${call.phone_number}` : ""}
                  </p>
                )}
                <p className="text-sm text-ink">{call.summary}</p>
                {call.promises_made && (
                  <p className="text-sm text-ink">
                    <span className="font-medium">Promised:</span>{" "}
                    {call.promises_made}
                  </p>
                )}
                {call.next_steps && (
                  <p className="text-sm text-ink">
                    <span className="font-medium">Next steps:</span>{" "}
                    {call.next_steps}
                  </p>
                )}
                <form action={deleteAction} className="mt-1">
                  <ConfirmSubmitButton
                    variant="ghost"
                    className="w-auto px-0 text-sm text-danger-600 hover:bg-transparent"
                    confirmMessage="Delete this call record?"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
