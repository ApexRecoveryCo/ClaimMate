import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function CheckEmailPage() {
  return (
    <Container className="flex flex-1 flex-col justify-center gap-6 py-12">
      <Card className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold text-ink">Check your email</h1>
        <p className="text-sm text-ink-muted">
          We&apos;ve sent you a confirmation link. Open it to activate your
          account and log in.
        </p>
      </Card>
    </Container>
  );
}
