# Intrack — Project Memory

Personal internship discovery + tracker app. Next.js (App Router) + Supabase (Postgres + Auth + RLS).

## Ground truth
- **The live database and the actual code are ground truth — not any doc, including this one.** If `docs/SCHEMA.sql` doesn't exist yet, or looks stale, regenerate it: check `supabase/migrations/` first (if this project uses the Supabase CLI, that folder already *is* the real schema history); if that doesn't exist, pull the live schema directly (`information_schema.columns`, or `supabase db dump`) and write the result into `docs/SCHEMA.sql` yourself before touching any other file. Re-run this check any time schema and code disagree.
- `docs/STATUS.md` — current open items. Keep it short, and keep it current — overwrite stale entries rather than accumulating them.
- `docs/HANDOFF-HISTORY.md` — historical narrative and rationale for past product/design decisions (why LLM calls are banned, why autofill is out of scope, etc.). Not auto-loaded — open it directly when you need the "why" behind a rule in this file, not the current state of the code.

## Non-negotiable scope boundaries
- No LLM/AI API calls anywhere in app logic. Category tagging, salary parsing, and alert tiering are deterministic/regex-based by design. If a fix seems to want an LLM call, stop and flag it instead of adding one.
- No resume/ATS matching, no autofill, no auto-apply. These are deliberate product differentiators (see HANDOFF-HISTORY §9), not missing features to fill in.
- Interview stages (`interview_1`, `interview_2`, `interview_3+`) must stay split at the *data* level always. Grouping them into one "Interviewing" bucket is fine in a chart or dropdown label — never in the schema, a `GROUP BY`, or stored data.

## Schema discipline
- Every field name, enum value, and type must be checked against `docs/SCHEMA.sql` directly — never assumed from "what's typical" (`company_name`/`role_title` were exactly this kind of hallucination, already purged once).
- Mismatch between code and schema → default assumption is the code is wrong. Only change the schema when there's a documented design reason (e.g. `is_active`, added because it was a real missing feature — see STATUS.md).
- When code references a field that isn't in the schema, explicitly present the fork before touching anything: **(a) hallucination → delete the reference**, or **(b) real planned feature missing its column → propose the exact `alter table`**. Never pick silently.

## Display vs. data separation
Any enum-like field (status, category, or similar added later) keeps its raw DB value schema-safe — matching the `check` constraint or taxonomy exactly — while display text lives in a separate `_CONFIG` lookup:

```ts
export const STATUS_CONFIG: Record<ApplicationStatus, { label: string /* + styling */ }> = { ... }
```

`<select>`/`<option>` elements bind `value` to the enum key and render `{CONFIG[key].label}`. Never render a raw enum key directly in the UI.

## Verification over trust
No self-report of "done" or "fixed" is proof — including a subagent's. After any fix, verify concretely:
- Schema/DB claims → query `information_schema.columns` directly.
- "Fixed the type layer" → run `npx next build` and read the actual output.
- "Removed all stray X" → grep for it and show the result.
- UI claims → a screenshot, or exact click-path to confirm.

## Model routing (subagents)
- `.claude/agents/schema-guardian.md` (Opus) — judgment calls: hallucination vs. missing feature, architecture decisions, anything ambiguous.
- `.claude/agents/mechanical-fixer.md` (Haiku) — fully-specified, zero-ambiguity execution: renaming a field across files, adding one described UI element, aligning styling.
Don't default to Opus for everything; don't route ambiguous judgment calls to the mechanical fixer.

## Stack quick reference
- Frontend: Next.js App Router, Tailwind, `(authenticated)` route group
- Auth: Supabase Auth, Google OAuth (reported enabled — see STATUS.md)
- DB: Supabase Postgres, RLS on every user-scoped table
- Route protection: `proxy.ts` (migrated from `middleware.ts` — see STATUS.md for re-verification status)
- Charts: Recharts (`PipelineCharts.tsx`)
- No ingestion or email yet — Phase 3 (Tier 1 aggregator polling) is the next core feature.

## Commands
- `npx next build` — run after any schema/type-layer change, not just at the end
