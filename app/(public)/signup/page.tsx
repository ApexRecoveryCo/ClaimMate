import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Container className="flex flex-1 flex-col justify-center gap-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
        <p className="text-sm text-ink-muted">
          ClaimMate helps you organise evidence and prepare your claim. It
          does not provide legal, financial or emergency advice.
        </p>
      </div>

      <Card>
        <form action={signup} className="flex flex-col gap-4">
          {error && <Notice tone="danger">{error}</Notice>}
          <Label>
            Full name
            <Input type="text" name="fullName" autoComplete="name" />
          </Label>
          <Label>
            Email
            <Input type="email" name="email" required autoComplete="email" />
          </Label>
          <Label>
            Password
            <Input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Label>
          <Button type="submit">Create account</Button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-700">
          Log in
        </Link>
      </p>
    </Container>
  );
}
