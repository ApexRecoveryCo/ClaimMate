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

### Phase 2 — Authentication (not started)
Supabase Auth sign up/login/session handling, `profiles` table, protected routes. No claim-specific screens yet.

### Phase 3 — Claims (not started)
Create-claim wizard (type, incident, insurer details), claim list, claim detail/dashboard, claim CRUD — all RLS-scoped to `user_id`.

### Phase 4 — Evidence vault (not started)
Photo/document/video upload, categorisation, evidence detail view, notes, private storage bucket with signed URLs.

### Phase 5 — Timeline and call logs (not started)
Call log entries, manual timeline events, chronological timeline view, claim status updates.

### Phase 6 — AI claim tools (not started)
Claude-powered claim summary, missing-evidence finder and follow-up email drafter, per the prompt templates in the planner (server-side only, cautious language, editable drafts).

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
app/            Next.js App Router routes
components/     Shared UI components (design system primitives in components/ui)
lib/            Supabase clients, utilities, shared logic
lib/supabase/   Supabase client (browser) and server helpers
types/          Shared TypeScript types
docs/           Product planner and reference docs
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
- Keep Phase 1 UI generic (design-system/style-guide level) — do not build claim-specific screens yet.
