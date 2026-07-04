import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function PrivacyPage() {
  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Privacy</h1>

      <Card className="flex flex-col gap-3 text-sm leading-6 text-ink">
        <h2 className="font-semibold">What we store</h2>
        <p>
          Your account details, the claim information you enter, the files you
          upload, your call notes and timelines, and the AI drafts generated
          from your claim. We collect only what&apos;s needed to organise your
          claim — optional fields are truly optional.
        </p>

        <h2 className="font-semibold">How it&apos;s protected</h2>
        <p>
          Every record is scoped to your account with database-level row
          security. Files live in private storage — there are no public links;
          access uses short-lived signed URLs only you can create. AI
          processing happens server-side; your data is never used to train
          models.
        </p>

        <h2 className="font-semibold">Your control</h2>
        <p>
          You can download everything we hold about you from Settings at any
          time, and you can permanently delete your account and all your data
          yourself — no email required. Deleting a claim removes its files
          too.
        </p>

        <h2 className="font-semibold">Retention</h2>
        <p>
          We keep your data while your account exists so your claim history
          stays available to you. When you delete your account, your data and
          files are deleted immediately.
        </p>
      </Card>
    </Container>
  );
}
