import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function DisclaimerPage() {
  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">What ClaimMate is — and isn&apos;t</h1>

      <Card className="flex flex-col gap-3 text-sm leading-6 text-ink">
        <p>
          ClaimMate helps you organise your claim information, evidence and
          communications. It does not provide legal advice, financial advice,
          emergency advice or insurance advice.
        </p>
        <p>
          AI-generated summaries and drafts may be incomplete or incorrect and
          should be checked before use. Policy explanations describe what a
          document appears to say — they are not decisions about your cover.
          Always confirm with your insurer or a qualified adviser before
          making a decision.
        </p>
        <p className="font-medium">
          For urgent danger, contact emergency services (000 in Australia).
          Never delay safety action to collect evidence.
        </p>
        <p>
          For legal, financial or insurance advice, contact a qualified
          professional or your insurer. If a claim dispute escalates, the
          Australian Financial Complaints Authority (AFCA) provides free,
          independent dispute resolution.
        </p>
      </Card>
    </Container>
  );
}
