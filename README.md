# ClaimMate

AI-powered evidence, insurance-claim and disaster-documentation app.

See `CLAUDE.md` for project scope, current build phase and conventions, and `docs/ClaimMate_Master_Planner.txt` for the full product plan.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL and anon key
npm run dev
```

Apply the database migrations to your Supabase project (SQL editor, or `supabase db push` if you use the Supabase CLI):

```
supabase/migrations/20260704000000_create_profiles.sql
```

In your Supabase project's Auth settings, set the Site URL / redirect URL to match `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` for local dev) so signup confirmation emails link back to `/auth/confirm` correctly.

Open [http://localhost:3000](http://localhost:3000) for the home page, [http://localhost:3000/signup](http://localhost:3000/signup) to create an account, or [http://localhost:3000/style-guide](http://localhost:3000/style-guide) for the design system primitives.
