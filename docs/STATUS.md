# Intrack — Status

**Last verified:** 2026-09-13
**Against:** `supabase/migrations/20260913222025_remote_schema.sql` (flattened in `docs/SCHEMA.sql`) + code at commit `a014628`

Nothing below has been fixed yet. Every open item is waiting on a decision.

---

## Open: schema ↔ code mismatches

| ID | Case | Where | Finding | Decision |
|---|---|---|---|---|
| M1 | **(a)** code references something not in schema | `src/app/(authenticated)/pipeline/page.tsx:8` | `supabase.from('status_history')` queries a **table that doesn't exist**. `status_history` is a jsonb column on `applications`. The query fails silently and returns `[]`. It's passed to `PipelineCharts` as the `statusHistory` prop (`PipelineCharts.tsx:38,44`), which the component never uses. | awaiting |
| M2 | **(b)** schema column read but never written | `src/components/PipelineCharts.tsx:91,98,234` | `applications.applied_at` is read, but no insert or update sets it (the `AddApplicationModal` payload leaves it out), so it's always null. The response-rate "vs last mo" badge can never render (0 vs 0), and the activity chart falls back to `status_history` / `created_at`. | awaiting |
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
- `PipelineCharts.tsx:237` has an unnecessary `(app as any).created_at` cast.

## Verified OK

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

## Incidental issues (outside the schema audit)

- **Rules-of-Hooks violation.** `PipelineCharts.tsx:50` returns early when `applications.length === 0`, before the `useMemo` calls at `:135,195,266`. React will throw if the list goes from empty to non-empty without a remount.
- **Same Sankey color for all interview stages.** `STATUS_COLORS` (`PipelineCharts.tsx:126-128`) gives all 3 stages `#2563eb`, even though `STATUS_CONFIG.dotColor` uses blue-500/600/700. This is cosmetic.
- **Dead code.** `isGhosted()` (`types.ts:286`) is exported but never used.
- **Import hack.** `PostingsGrid.tsx:8-14` imports `AddApplicationModal` through try/`require`, even though the file always exists.

## Unverified

- **Live DB not queried directly.** The Supabase CLI isn't installed, and `psql` needs the DB password. The snapshot relies on the 2026-09-13 `db pull`.
- **`rls_auto_enable()` attachment.** The function exists, but the dump contains no `CREATE EVENT TRIGGER`. Check `pg_event_trigger` on the live DB.
- **Google OAuth.** Carried over as reported enabled; not re-tested.
- **`proxy.ts` route protection.** `src/proxy.ts` calls `updateSession`, which redirects unauthenticated users on `/tracker`, `/pipeline`, `/postings`, and `/preferences`. Not re-tested in a browser.
