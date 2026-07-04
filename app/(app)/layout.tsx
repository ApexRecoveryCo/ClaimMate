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
          <nav className="flex items-center gap-4">
            <Link
              href="/settings"
              className="flex items-center text-sm font-medium text-ink-muted hover:text-ink"
            >
              Settings
            </Link>
            <form action={signOut} className="flex items-center">
              <button
                type="submit"
                className="flex min-h-0 items-center text-sm font-medium text-ink-muted hover:text-ink"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-sm text-ink-muted sm:px-6">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/disclaimer" className="hover:text-ink">
            Disclaimer
          </Link>
          <Link href="/support" className="hover:text-ink">
            Support
          </Link>
        </div>
      </footer>
    </>
  );
}
