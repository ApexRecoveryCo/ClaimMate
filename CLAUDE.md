# ClaimMate

AI-powered evidence, insurance-claim and disaster-documentation app.

**One-line promise:** When something goes wrong, ClaimMate helps everyday people prove what happened, organise their evidence, track the claim, and generate a clear evidence pack.

**Boundary (do not violate in copy, prompts, or UI):** ClaimMate is not legal advice, financial advice, emergency advice or a claim-outcome predictor. It is an evidence organisation, plain-English explanation and document-preparation tool. Never write copy implying an insurer "must pay" or a claim "is covered" — describe what a policy *appears* to say and tell the user to confirm with their insurer or a qualified adviser.

Full product spec: `docs/ClaimMate_Master_Planner.txt` (extracted from the master planner doc v1.1 — MVP scope, feature matrix, screens/flows, data model, Claude AI prompt templates, security/trust requirements, 16-week roadmap, and the verified Policy Knowledge Base / RAG / insurer policy backend design in section 20). Read it before implementing anything outside the current phase.

Next.js version-specific rules: see `AGENTS.md` before writing framework code — this project may use APIs that differ from older Next.js training data.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Auth / database / storage:** Supabase (Postgres, RLS, storage buckets)
- **Vector search:** pgvector (Supabase Postgres extension, for policy clause retrieval — Phase 7/8)
- **AI:** Claude API (server-side only, never exposed to the browser)
- **PDF generation:** server-side HTML-to-PDF (Phase 10)
- **Payments:** Stripe (Phase 11)

## Build phases

Development proceeds in gated phases. Do not start work on a later phase until the current phase's scope is complete and confirmed.

### Phase 1 — Project setup (complete)
- Next.js + TypeScript project scaffold (App Router)
- Tailwind CSS with a base design system (colour tokens, typography scale, spacing)
- Supabase project wired up (client/server helpers, env var scaffold)
- Mobile-first base layout shell
- Clean folder structure
- Base UI primitives (Button, Card, Input, Badge, etc.)

Scope was infrastructure only — no auth pages, no dashboard content, no claim-specific screens.

### Phase 2 — Authentication (complete)
- Supabase Auth sign up/login/log out (`app/signup`, `app/login`, `app/dashboard/actions.ts`)
- Email confirmation route (`app/auth/confirm`)
- `profiles` table migration with RLS and an auto-provisioning trigger (`supabase/migrations`)
- `proxy.ts` session refresh + route protection (redirects signed-out users away from `/dashboard`, signed-in users away from `/login`/`/signup`)
- Minimal protected `/dashboard` placeholder (signed-in confirmation only — no claim content)

Scope was auth infrastructure only — no claim-specific screens.

### Phase 3 — Claims (complete)
- `claims` table migration with RLS (type/status check constraints, `set_updated_at` trigger)
- Create-claim wizard at `/claims/new` (3 steps: type → incident facts → insurer details), emergency notice, "skip for now" affordances
- Dashboard claim list with status badges and empty state; claim detail at `/claims/[id]`; edit + delete at `/claims/[id]/edit`
- Route groups: `app/(public)` (marketing/auth pages) and `app/(app)` (signed-in pages with nav header + sign out)
- Static "evidence you may want to collect" hints per claim type (`types/claims.ts`)

### Phase 4 — Evidence vault (complete)
- `evidence_items` migration with RLS + private `claim-evidence` bucket (50 MB cap, image/PDF/video mime allowlist, per-user-folder storage policies)
- Browser-direct upload (`components/evidence/EvidenceUploader.tsx`) to `<user_id>/<claim_id>/<uuid>-<name>`, then server action records rows (path prefix verified server-side)
- Evidence grid with signed-URL thumbnails on claim detail; evidence detail page with preview, editable category/date/notes, delete (removes storage object + row)

### Phase 5 — Timeline and call logs (complete)
- `call_logs` + `timeline_events` migrations with RLS (`source`: user/ai/system)
- Call log list + form at `/claims/[id]/calls` (with "add to timeline" checkbox); timeline view/add/edit at `/claims/[id]/timeline`
- Synthetic incident anchor rendered from claim data; system events auto-added on status change and evidence upload

### Phase 6 — AI claim tools (complete)
- `ai_outputs` migration with RLS; drafts stored with `prompt_version` + `input_hash` for audit/regeneration
- Server-side Claude client (`lib/ai/client.ts`, model `claude-opus-4-8`, adaptive thinking, typed error handling, graceful "not configured" path when `ANTHROPIC_API_KEY` is absent)
- Versioned planner prompt templates in `lib/ai/prompts.ts` (claim summary, evidence gaps, follow-up email)
- Tool hub at `/claims/[id]/ai` + per-tool pages; drafts render in an editable textarea labelled "AI-generated draft" with copy button and caution copy

### Phase 7 — Policy Knowledge Base (not started)
Backend for insurer/product/policy-document/policy-clause records (Supabase Postgres + pgvector), document ingestion (PDS/SPDS/Key Facts Sheet/TMD/policy wording/claims guide), clause extraction and categorisation, version history (never overwrite old documents).

### Phase 8 — RAG policy answers (not started)
Retrieval-augmented policy explainer: match the customer's policy version, retrieve approved clauses only, answer in the planner's source-backed format (plain-English answer, evidence to collect, limits/exclusions, source, confidence). Claude never answers coverage questions from memory.

### Phase 9 — Admin dashboard (not started)
Internal tool for managing insurer/product/document records, running ingestion, and human review/approval of extracted clauses before they can be used in customer-facing answers.

### Phase 10 — PDF evidence pack (not started)
Export pack preview, section selection, server-side PDF generation, download — including source-backed policy references where relevant.

### Phase 11 — Testing and launch readiness (not started)
Privacy/security QA (RLS, signed URLs, deletion flow), AI guardrail testing, mobile UX polish, Stripe, support process, launch assets.

## Folder structure

```
app/                Next.js App Router routes
app/login/          Login page + server action
app/signup/         Signup page + server action
app/auth/confirm/   Email confirmation route handler
app/dashboard/      Protected placeholder page + sign-out action
components/         Shared UI components (design system primitives in components/ui)
lib/                Supabase clients, utilities, shared logic
lib/supabase/       Supabase client (browser), server and proxy (session refresh) helpers
supabase/migrations/ SQL migrations (run via Supabase CLI or dashboard SQL editor)
types/              Shared TypeScript types
docs/               Product planner and reference docs
proxy.ts            Next.js 16 proxy (formerly "middleware") — session refresh + route protection
```

## Design system principles (mobile-first)

From the planner's UX section — apply these across all screens:
- Each screen has one main action.
- Plain-English labels ("Add photos", not "Upload assets").
- Progress language where relevant ("3 of 7 evidence items added").
- Calm colours, high contrast, generous touch targets.
- Short questions over dense paragraphs during any wizard/flow.
- Safety/disclaimer copy shown where relevant (e.g. "For immediate danger, contact emergency services").

## AI principles (for later phases, keep in mind when designing data model)

- Never invent facts — only use user-entered data and uploaded document summaries.
- Cautious language: "may", "consider", "based on the information provided".
- No legal/financial advice; organise, summarise and draft only.
- All AI output is an editable draft, clearly labelled as AI-generated.
- Claude API calls are server-side only.

## Commands

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run lint` — lint
- `npx tsc --noEmit` — type check

## Conventions

- TypeScript strict mode on.
- No comments explaining *what* code does — only non-obvious *why*.
- Supabase Row Level Security is mandatory from the first table onward; every claim/evidence/log record is scoped to `user_id`.
- Keep UI generic (design-system/style-guide level) until Phase 3 — do not build claim-specific screens yet.
- This project uses `proxy.ts` (Next.js 16), not the deprecated `middleware.ts` convention.
- New Supabase schema changes go in `supabase/migrations/<timestamp>_<name>.sql`; never overwrite an applied migration — add a new one.
