import Link from "next/link";
import { signOut } from "./actions";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center text-lg font-semibold text-brand-700"
          >
            ClaimMate
          </Link>
          <form action={signOut} className="flex items-center">
            <button
              type="submit"
              className="flex min-h-0 items-center text-sm font-medium text-ink-muted hover:text-ink"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
