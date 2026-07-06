import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, updateProfile } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { message, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; email: string }>();

  return (
    <Container className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>

      {message && <Notice tone="info">{message}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      <form action={updateProfile} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold text-ink">Profile</h2>
          <Label>
            Email
            <Input value={profile?.email ?? user.email ?? ""} disabled />
          </Label>
          <Label>
            Full name
            <Input name="fullName" defaultValue={profile?.full_name ?? ""} />
          </Label>
        </Card>
        <Button type="submit">Save profile</Button>
      </form>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Your data</h2>
        <p className="text-sm text-ink-muted">
          Download everything ClaimMate holds about you — claims, evidence
          details, timelines, call logs and AI drafts — as one JSON file.
          Evidence files themselves stay in your private storage; download
          them from each claim.
        </p>
        <a href="/settings/export" className={buttonClassName("secondary")}>
          Download my data
        </a>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Delete my account</h2>
        <p className="text-sm text-ink-muted">
          This permanently deletes your account, every claim, all evidence
          files and every generated pack. There is no undo. Consider
          downloading your data first.
        </p>
        <form action={deleteAccount}>
          <ConfirmSubmitButton
            variant="danger"
            confirmMessage="Permanently delete your account and ALL your claims, evidence and exports? This cannot be undone."
          >
            Delete my account permanently
          </ConfirmSubmitButton>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-muted">
        Questions?{" "}
        <Link href="/support" className="font-medium text-brand-700">
          Get support
        </Link>
      </p>
    </Container>
  );
}
