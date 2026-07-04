import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

const FAQS = [
  {
    q: "Is my evidence private?",
    a: "Yes. Files are stored privately, scoped to your account, and only accessible through short-lived links that only you can create.",
  },
  {
    q: "Will ClaimMate tell me if my claim will be paid?",
    a: "No — and be wary of anything that does. ClaimMate organises your evidence and explains what policy wording appears to say. Your insurer decides claims.",
  },
  {
    q: "Are the AI drafts safe to send?",
    a: "Treat them as a first draft. They only use the information in your claim, they're clearly labelled, and you should always read and edit them before sending.",
  },
  {
    q: "Can I get my data out?",
    a: "Yes — download everything as JSON from Settings, export your evidence pack as a PDF, and delete your account (and all data) whenever you want.",
  },
  {
    q: "What should I do first after damage or loss?",
    a: "Stay safe — if there's immediate danger call 000. Then start a claim in ClaimMate and add photos early; timestamps and notes made close to the event are the most useful.",
  },
];

export default function SupportPage() {
  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Support</h1>

      <Card className="flex flex-col gap-4">
        {FAQS.map((faq) => (
          <div key={faq.q} className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-ink">{faq.q}</h2>
            <p className="text-sm leading-6 text-ink-muted">{faq.a}</p>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold text-ink">Still stuck?</h2>
        <p className="text-sm text-ink-muted">
          Email{" "}
          <a
            href="mailto:hello@apexrecovery.au"
            className="font-medium text-brand-700"
          >
            hello@apexrecovery.au
          </a>{" "}
          and we&apos;ll get back to you. Include the claim name (never send
          us your documents by email — they stay in your vault).
        </p>
      </Card>
    </Container>
  );
}
