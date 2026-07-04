import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center text-lg font-semibold text-brand-700">
            ClaimMate
          </Link>
          <Link
            href="/login"
            className="flex items-center text-sm font-medium text-ink-muted hover:text-ink"
          >
            Log in
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
