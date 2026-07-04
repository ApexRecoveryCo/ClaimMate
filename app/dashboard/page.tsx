import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Container className="flex flex-1 flex-col justify-center gap-6 py-12">
      <Card className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            You&apos;re signed in
          </h1>
          <p className="text-sm text-ink-muted">{user.email}</p>
        </div>
        <p className="text-sm text-ink-muted">
          Claims and evidence tools are coming in a later phase.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Log out
          </Button>
        </form>
      </Card>
    </Container>
  );
}
