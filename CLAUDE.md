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

All 11 phases are complete. New work should follow the same conventions and update this file.

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
- `profiles` table migration with RLS and an auto-provisioning trigger (`supabase/migrations`); column-level grants stop users self-updating `is_admin` (added in Phase 7) — admin is provisioned via SQL editor / service role only
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

### Phase 7 — Policy Knowledge Base (complete)
- Migration: pgvector extension, `insurers` / `insurance_products` / `policy_documents` (immutable versions, SPDS links, file hash, status) / `policy_clauses` (category check, FTS `search` column + GIN, `embedding vector(1024)` + HNSW, approval workflow) / `customer_policies` / `policy_answer_sources`; `profiles.is_admin` + `is_admin()` helper; admin-only `policy-documents` bucket
- Retrieval functions: `search_policy_clauses` (FTS) and `match_policy_clauses` (vector) — approved clauses only
- Ingestion pipeline (`lib/policy/ingest.ts`): unpdf page extraction → Claude structured-output clause extraction/categorisation/summaries (draft status) → optional Voyage embeddings (`lib/policy/embeddings.ts`, falls back to FTS when `VOYAGE_API_KEY` unset)

### Phase 8 — RAG policy answers (complete)
- `/claims/[id]/policy`: link insurer/product/policy number/dates/excess (`customer_policies` upsert), Policy Schedule prompt (via evidence category), plain-English Q&A panel
- Version matching (`lib/policy/retrieval.ts`): confirmed document → else product documents whose effective range covers the incident date, plus linked SPDS; no match → cautious refusal
- Retrieval: Voyage vector search when configured, Postgres FTS otherwise — approved clauses only; answers follow the planner 20.8 source-backed format with guardrails (20.9); sources logged to `policy_answer_sources`, answers to `ai_outputs` (`policy_answer` type)

### Phase 9 — Admin dashboard (complete)
- `/admin` (guarded by `requireAdmin` in `lib/admin.ts` + RLS): overview with counts and 30-day recheck list
- Insurers (add/edit incl. legal entity/underwriter/APRA name/contacts), products (add/list)
- Document upload (browser → `policy-documents` bucket, then record with type/dates/source URL/SPDS link), document detail with "run clause extraction" (ingestion pipeline), status control (active/superseded/archived — never delete)
- Clause review queue: edit category/summary, approve/reject/save — only approved clauses reach customer answers

### Phase 10 — PDF evidence pack (complete)
- `/claims/[id]/export`: section checkboxes (evidence/timeline/calls/AI summary/policy answer), server-side generation via `@react-pdf/renderer` (`lib/export/pdf.tsx`), JPEG/PNG evidence embedded (capped at 12), AI content clearly labelled, disclaimer + generated date on every pack
- `claim_exports` migration + private `claim-exports` bucket (per-user folders); packs download via 1-hour signed URLs; previous exports listed

### Phase 11 — Testing and launch readiness (complete)
- `/settings`: profile edit, full data export (JSON download at `/settings/export`), self-service permanent account deletion (`delete_user()` security-definer RPC after storage cleanup)
- Public `/privacy`, `/disclaimer` (planner 11.3 wording), `/support` (FAQ + contact); footers on both layouts
- Stripe (env-gated, free when unconfigured): `purchases` table, checkout server action, signature-verified webhook at `/api/stripe/webhook` (service-role insert), export gating with "unlock" flow
- Storage-leak fixes: deleting a claim or account now removes its evidence/export files (`lib/storage-cleanup.ts`)

## Folder structure

```
app/(public)/        Marketing, auth, privacy/disclaimer/support pages
app/(app)/           Signed-in pages (nav header + footer): dashboard, claims/*, admin/*, settings
app/(app)/claims/[id]/  Claim detail + evidence, timeline, calls, ai, policy, export sub-routes
app/(app)/admin/     Policy library admin (insurers, products, documents, clause review)
app/auth/confirm/    Email confirmation route handler
app/api/stripe/webhook/  Stripe webhook (signature-verified, service-role writes)
components/          UI primitives (components/ui) + feature components (claims, evidence, ai, policy, admin, export)
lib/                 Supabase clients (browser/server/proxy/service), ai (Claude client + prompts), policy (ingest/embeddings/retrieval), export (PDF), payments, storage-cleanup, admin guard
supabase/migrations/ SQL migrations (run in order via Supabase CLI or dashboard SQL editor)
types/               Shared TypeScript types per domain
docs/                Product planner and reference docs
proxy.ts             Next.js 16 proxy (formerly "middleware") — session refresh + route protection
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
