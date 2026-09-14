# Intrack — Status

**Last verified:** 2026-09-13
**Against:** live DB (read-only catalog queries via `psql`), `supabase/migrations/20260913222025_remote_schema.sql` (flattened in `docs/SCHEMA.sql`), and code at `ab9c066` + working tree

Items marked **awaiting** are still waiting on a decision.

---

## Open: schema ↔ code mismatches

| ID | Case | Where | Finding | Decision |
|---|---|---|---|---|
| M1 | **(a)** code references something not in schema | — | ~~`supabase.from('status_history')` queried a table that doesn't exist.~~ **Resolved (2026-09-14):** the query and the unused `statusHistory` prop/param were deleted from `pipeline/page.tsx` and `PipelineCharts.tsx`. The two remaining queries (`applications`, `user_preferences`) are now parallelized with `Promise.all`. | **Resolved** |
| M2 | **(b)** schema column read but never written | `src/components/PipelineCharts.tsx:66,73` | `applications.applied_at` is NULL on all 16 live rows because nothing writes it. The heatmap that replaced the line chart doesn't read it. The only remaining read is the "vs last mo" response-rate badge (`PipelineCharts.tsx`, `appsThisMonth`/`appsLastMonth`), which can therefore never render. The Application Activity heatmap uses the `status_history` 'applied' entry, falling back to `created_at`. | awaiting |
| M3 | **(b)** schema column unused | `src/app/(authenticated)/postings/page.tsx:15` | `postings.posted_at` is unused and has a dedicated desc index, but the page orders by `first_seen_at`. | awaiting |
| M4 | **(b)** schema column unused | Postings UI / prefill | `postings.jd_text` is never shown or passed into the Add Application prefill. | awaiting |

Greps turned up no other (a)-type references. There are no `company_name`, `role_title`, `min_salary`, or postings `updated_at` references in `src/`. `AddApplicationModal` still names its local state `companyName`/`roleTitle`, but it writes the correct `company`/`title` columns.

## Open: type-layer drift (`src/lib/types.ts`)

- `Application.created_at` / `updated_at` are typed `string`, but the columns are nullable.
- `Posting.first_seen_at` is typed `string`, but the column is nullable.
- `UserPreferences.notify_email` is typed `boolean`, but the column is nullable.
- `UserPreferences.notification_emails` is optional (`?`), but the column is `NOT NULL default '{}'`.
- `RoleCategory` (8 values) has no DB check constraint. `categories` is plain `text[]` on all 3 tables, so only code enforces the taxonomy.
- `StatusHistoryEntry` shape is code-only; the jsonb column is unconstrained.
- The header comment points to a nonexistent `intrack-schema.sql`; it should point to `docs/SCHEMA.sql`.

## Verified OK

- **Live DB matches `docs/SCHEMA.sql` exactly (2026-09-13).** Checked with read-only catalog queries over the pooler connection (password from `.env.local`):
  - `information_schema.columns`: 37 columns; name, type, nullability, and default all match (17/15/5).
  - `information_schema.tables`: only `applications`, `postings`, `user_preferences` in `public`, so there is no `status_history` table (M1 — since fixed).
  - `pg_constraint`: 8 constraints match, including the 10-value `applications_status_check`.
  - `pg_indexes`, `pg_trigger`: 4 custom indexes and `trg_applications_updated_at` match.
  - `pg_class.relrowsecurity`: RLS is on for all 3 tables. `pg_policies`: 3 policies match.
  - `pg_extension`: `pg_net` is absent, matching the migration's drop.
  - `pg_event_trigger`: **`ensure_rls`** (`ddl_command_end`, owner `postgres`, enabled) runs `rls_auto_enable()`. The function *is* attached; `db pull` omitted it because event triggers are database-level objects, not part of the `public` schema dump.

- **Interview stages stay distinct at the data level.**
  - Nothing is aggregated in the DB (`select('*')`, no GROUP BY).
  - The Sankey chart keys nodes on the raw `status_history[].status`, so `interview_1`/`_2`/`_3+` are 3 separate nodes.
  - The Tracker board shows 3 separate columns.
  - `STATUS_ORDER` ranks them 3/4/5.
  - Saves store the raw enum value.
  - The only merge is the "Active Pipeline" count card, which is display-only and allowed.
- **Zero LLM/AI calls.** A case-insensitive grep of `src/` for anthropic, openai, @ai-sdk, langchain, gemini, cohere, mistral, ollama, groq, replicate, huggingface, llm, gpt-, claude, and the completion/message endpoints found nothing. `src/` has no `fetch(` calls, and `package.json` has no AI packages.
- **Status enum matches the DB.** `ApplicationStatus`, `ALL_STATUSES`, and `STATUS_CONFIG` match `applications_status_check` exactly (10 values).
- **`user_preferences` is fully used.** Code uses all 5 columns.

## Unused by design (Phase 3 ingestion)

- `postings.source`, `external_id`, `canonical_id`, and `raw` exist for aggregator ingestion, which hasn't been built yet.

## Open: product/copy

- **`weekly_goal` is no longer displayed anywhere.** The Pipeline "Activity Over Time" line chart (Applications vs Weekly Goal) was replaced by the Application Activity heatmap, which has no goal comparison. `PreferencesForm.tsx:328` still says the goal "appears as the target line in Pipeline Overview", and the setting is still saved. Left as-is by decision; awaiting a follow-up.

## Incidental issues (outside the schema audit)

- ~~**Rules-of-Hooks violation.**~~ **Resolved.** The empty-state early return in `PipelineCharts` now sits after all 3 `useMemo` calls. The diff is a pure 15-line move, and `npx next build` passes.
- **Same Sankey color for all interview stages.** `STATUS_COLORS` (`PipelineCharts.tsx:111-113`) gives all 3 stages `#2563eb`, even though `STATUS_CONFIG.dotColor` uses blue-500/600/700. This is cosmetic.

### Classified by schema-guardian (2026-09-13)

| ID | Item | Fork | Evidence | Proposed action | Decision |
|---|---|---|---|---|---|
| I1 | `isGhosted()` (`types.ts:283-292`) | **Dead code** | Its only caller was the "Ghosted" bar in the old stacked funnel (`5bb3bd7`), removed when the Sankey replaced it (`15004ea`). HANDOFF-HISTORY never mentions ghosting. The logic is also wrong: `updated_at` is nullable and gets bumped by *any* edit. | Delete lines 283-292. If ghosting ever becomes a feature, rebuild it on the last `status_history[].changed_at`. | **Resolved:** deleted from `types.ts` |
| I2 | try/`require` import in `PostingsGrid.tsx:7-14` | **Dead code** (leftover scaffolding) | The comment says "in case it isn't created yet," a leftover from the parallel-subagent build (HANDOFF §6). No circular import (the modal never imports `PostingsGrid`), both files are `'use client'`, and `TrackerBoard.tsx:6` imports it normally. The `catch` can never run, and the `{AddApplicationModal && ...}` guard is always truthy. The hack also turns off prop type checking, which helped M4 go unnoticed. | Replace with `import AddApplicationModal from './AddApplicationModal'` and drop the `&&` wrapper (`:229-244`). | **Resolved:** normal import, `&&` guard removed |
| I3 | `rls_auto_enable()` | **Neither: live and working** | Attached on the live DB through the `ensure_rls` event trigger (see Verified OK). It looks like Supabase's auto-RLS helper; nobody in the repo wrote it. It isn't redundant, because it guards future Phase 3/4 tables. | **Keep.** One real gap remains: a local DB rebuilt from `supabase/migrations/` gets the function but *not* the trigger, because `db pull` omits event triggers. Optionally add a migration with the `create event trigger ensure_rls ...` shown in `SCHEMA.sql`. | awaiting (migration only) |

## Diagnosed: dev-log noise on /pipeline (2026-09-14)

Recurring log pattern:
```
GET /pipeline 200 in 333ms (next.js: 4ms, proxy.ts: 50ms, application-code: 280ms)
⨯ Error: The destination stream closed early.
```
**Not an application bug.** This is a confirmed, tracked upstream Next.js bug: [vercel/next.js#96704](https://github.com/vercel/next.js/issues/96704). Next's error handler is supposed to ignore a client disconnecting mid-stream, but only recognizes specific abort error types; this generic error slips past that filter and gets logged as if it were a real failure. The request itself succeeds — the `200` logs *before* the error.

Mechanism: `/pipeline` has a `loading.tsx`, so Next streams the page (skeleton first, real content once the Server Component resolves). The Sidebar's `next/link` to `/pipeline` prefetches by default; if a prefetch starts and the user navigates elsewhere before the stream finishes, the browser aborts the connection and Next logs this error trying to write into it. The exposure window is however long `application-code` takes — `/pipeline` was running 3 sequential Supabase calls, one of them M1's dead `status_history` query. **M1 is now fixed** (see above) and the two real queries are parallelized, which shrinks that window but can't eliminate the race outright — that needs an upstream Next.js fix. No suppression code was added; hiding a real (if generic) error class isn't worth it for a harmless dev-log line.

## Unverified

- **Google OAuth.** Carried over as reported enabled; not re-tested.
- **`proxy.ts` route protection.** `src/proxy.ts` calls `updateSession`, which redirects unauthenticated users on `/tracker`, `/pipeline`, `/postings`, and `/preferences`. Not re-tested in a browser.
