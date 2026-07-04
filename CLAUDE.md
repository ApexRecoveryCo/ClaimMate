# ClaimMate

AI-powered evidence, insurance-claim and disaster-documentation app.

**One-line promise:** When something goes wrong, ClaimMate helps everyday people prove what happened, organise their evidence, track the claim, and generate a clear evidence pack.

**Boundary (do not violate in copy, prompts, or UI):** ClaimMate is not legal advice, financial advice, emergency advice or a claim-outcome predictor. It is an evidence organisation, plain-English explanation and document-preparation tool. Never write copy implying an insurer "must pay" or a claim "is covered" — describe what a policy *appears* to say and tell the user to confirm with their insurer or a qualified adviser.

Full product spec: `docs/ClaimMate_Master_Planner.txt` (extracted from the master planner doc — MVP scope, feature matrix, screens/flows, data model, Claude AI prompt templates, security/trust requirements, 16-week roadmap). Read it before implementing anything outside the current phase.

Next.js version-specific rules: see `AGENTS.md` before writing framework code — this project may use APIs that differ from older Next.js training data.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Auth / database / storage:** Supabase (Postgres, RLS, storage buckets)
- **AI:** Claude API (server-side only, never exposed to the browser)
- **PDF generation:** server-side HTML-to-PDF (later phase)
- **Payments:** Stripe (later phase)

## Build phases

Development proceeds in gated phases. Do not start work on a later phase until the current phase's scope is complete and confirmed.

### Phase 1 — Foundation (current phase)
- Next.js + TypeScript project scaffold (App Router)
- Tailwind CSS with a base design system (colour tokens, typography scale, spacing)
- Supabase project wired up (client/server helpers, env var scaffold)
- Mobile-first base layout shell
- Clean folder structure
- Base UI primitives (Button, Card, Input, Badge, etc.)

Confirmed scope: infrastructure only. No auth pages, no dashboard content, no claim-specific screens in Phase 1 — those start in Phase 2.

### Later phases (reference only — not started)
- **Core build:** auth, claims CRUD, evidence vault, call log, timeline (private, RLS-scoped end to end)
- **AI and export:** Claude summary/gap-finder/email-drafter/policy-explainer actions, PDF evidence pack export
- **Beta hardening:** privacy/security QA, mobile UX polish, AI guardrail testing
- **Launch prep:** Stripe, landing page, onboarding, support

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
