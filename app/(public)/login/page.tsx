import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Container className="flex flex-1 flex-col justify-center gap-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Log in</h1>
        <p className="text-sm text-ink-muted">
          Access your claims and evidence.
        </p>
      </div>

      <Card>
        <form action={login} className="flex flex-col gap-4">
          {error && <Notice tone="danger">{error}</Notice>}
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
              autoComplete="current-password"
            />
          </Label>
          <Button type="submit">Log in</Button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-700">
          Create one
        </Link>
      </p>
    </Container>
  );
}
