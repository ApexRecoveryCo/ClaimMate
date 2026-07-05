# ClaimMate

AI-powered evidence, insurance-claim and disaster-documentation app. Create a claim, collect evidence, keep a timeline and call log, generate cautious AI drafts, ask source-backed policy questions, and export everything as a PDF evidence pack.

See `CLAUDE.md` for architecture and conventions, and `docs/ClaimMate_Master_Planner.txt` for the full product plan.

## Getting started

Fastest path — run the setup helper (checks Node, installs deps, creates
`.env.local`, and bundles the migrations into one paste-ready SQL file):

```bash
./setup.sh
```

Or do it by hand:

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL and anon key
npm run dev
```

Apply all migrations in `supabase/migrations/` **in filename order** (Supabase SQL editor, or `supabase db push` with the CLI). They create the schema, RLS policies, storage buckets and helper functions.

In your Supabase project's Auth settings, set the Site URL / redirect URL to match `NEXT_PUBLIC_SITE_URL` so signup confirmation emails link back to `/auth/confirm`.

### Demo data (optional)

To land on a populated dashboard instead of an empty state, sign up first, then edit the email at the top of `supabase/seed.sql` to your account's email and run it in the Supabase SQL editor. It adds one worked storm-damage claim (timeline, call log, evidence metadata, linked policy) plus a couple of sample insurers/products. It's safe to re-run.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase project |
| `NEXT_PUBLIC_SITE_URL` | Yes | Auth email redirects + Stripe return URLs |
| `ANTHROPIC_API_KEY` | For AI tools | Claim summary, evidence gaps, email drafts, policy answers (server-side only) |
| `VOYAGE_API_KEY` | Optional | Vector retrieval for policy clauses (falls back to full-text search) |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` | Optional | Charge for evidence packs; leave unset for free exports |

### Making yourself an admin

The policy library admin (`/admin`) is gated by `profiles.is_admin`. After signing up, run in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

Then add insurers, products and policy PDFs, run clause extraction, and approve clauses — customer policy answers only ever use approved clauses.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — lint
- `npx tsc --noEmit` — type check
