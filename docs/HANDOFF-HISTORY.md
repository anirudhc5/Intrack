# Intrack — Historical Handoff Record

Archived narrative from Claude.ai project sessions, migrated to Claude Code. Not auto-loaded by CLAUDE.md — open this directly when you need the *why* behind a past decision. Current state lives in `docs/STATUS.md`; schema ground truth lives in `docs/SCHEMA.sql`.

---

# Part 1 — intrack-project-handoff-v3.md

Personal internship application discovery + tracker tool. Purpose of this doc: pick up exactly where this conversation left off, in a new conversation, with zero context loss. This supersedes `intrack-project-handoff-v2.md` — read this one; earlier versions are kept only for historical trail if needed.

**Project name:** Intrack.

**One-liner:** Discovers internship postings across SWE/PM/MLE/etc. from public sources, notifies the user by email as filtered categories open up, and gives them a tracker (replacing a failing Google Sheet) that survives postings being taken down, with a funnel visualization of pipeline progress.

**Original status snapshot (superseded by docs/STATUS.md): Tracker UI is live and visually working (screenshot-confirmed Kanban board with correct status columns). Schema/type-layer bugs from the initial subagent build were being found and fixed incrementally (see section 12). Model split in use at the time: Opus for judgment-call fixes, Gemini Flash for small mechanical fixes.**

## 1. Original requirements (as specified by the user)

Must do:
1. Sign in with Google.
2. Cover all CS-adjacent internship tracks: SWE, PM, MLE, and more.
3. Multi-select category filtering on the job search page (e.g. only PM + MLE).
4. Get postings as fast as possible — API-first, minimal/no scraping.
5. Email notifications when a matching job opens.
6. Fetch/display title, company, JD, location, link, salary, and other key fields per posting.
7. Embedded tracker storing everything the user applied to — title, company, JD, location, link, salary — because original postings eventually disappear.
8. Tracker lets the user update application status.
9. Visualize a graph quantifying how many applications are at each stage: OA, interview (multiple rounds), offer, accepted or not.

Explicitly out of scope:
- No resume/ATS-matching services (user has a separate GitHub project for that).
- No autofill or auto-apply. Deliberate differentiator, not just an omission — see section 9.
- No LLM API usage for convenience features.

## 2. Data source strategy — how postings actually get discovered

No single unified API covers internships across all these categories. Three-tier approach, in priority order:

**Tier 1 — Open-source aggregator repos (primary source).**
Repos like `SimplifyJobs/Summer2026-Internships`, `vanshb03/Summer2026-Internships`, `Ouckah/Summer2026-Internships` aggregate postings across every category and expose a JSON feed. Simplify's own automated scraping runs hourly; community-submitted entries land whenever someone files a PR/issue. Poll the JSON feed hourly — matches Simplify's own scrape cadence.

**Tier 2 — Direct ATS polling for specific companies you care about.**
Greenhouse, Lever, and Ashby expose public, unauthenticated JSON APIs for their job boards:
- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- Lever: `https://api.lever.co/v0/postings/{company}`
- Ashby: `https://api.ashbyhq.com/posting-api/job-board/{company}`

Maintain a config list of companies → ATS + slug; poll on your own schedule.

**Tier 3 — Scraping. Avoid; last resort only.** Only for a company not on Greenhouse/Lever/Ashby and not covered by Tier 1. Expect breakage, respect robots.txt/ToS.

**Known, accepted coverage gap:** LinkedIn and Handshake are not covered by any tier. The manual "Add application" flow is the intended way to capture anything found there.

**Sites with a scraping-litigation history — never target with Tier 3:** LinkedIn (hiQ Labs v. LinkedIn; login-gated data falls outside the "truly public" exception regardless), Meta/Facebook/Instagram, X/Twitter, Reddit (sued Perplexity/SerpAPI/Anthropic in 2025-26 — recheck before scraping anything new). None of Tier 1/2 intersect with any of these.

## 3. Cross-source deduplication

Dedup on a `canonical_id` derived from the posting's URL, not either source's own ID scheme:
- Greenhouse: `boards.greenhouse.io/{company}/jobs/{id}` → `greenhouse:{company}:{id}`
- Lever: `jobs.lever.co/{company}/{uuid}` → `lever:{company}:{uuid}`
- Ashby: `jobs.ashbyhq.com/{company}/{uuid}` → `ashby:{company}:{uuid}`

Fallback for non-matching URLs: normalized fingerprint hash of `company + title + location`, matched within a ~30-day window. Deliberately not fuzzy-matching near-identical-but-different postings — too high a false-merge risk for a personal tool.

## 4. Tech stack (as actually implemented)

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), Tailwind — `(authenticated)` route group with a shared layout/sidebar |
| Auth | Supabase Auth, Google OAuth provider |
| Database | Supabase Postgres, RLS on every user-scoped table |
| Route protection | `middleware.ts`, later migrated to `proxy.ts` |
| Scheduled ingestion | Not yet built (Phase 3/5) |
| Email | Not yet built (Phase 4) |
| Charts | Recharts — bar/line/pie charts on Pipeline Overview |
| Hosting | Not yet deployed — local dev only |
| UI design | Google Stitch, connected via official Stitch MCP server |
| Build agent | Google Antigravity, using Claude Opus 4.6 for this build |

## 5. Category taxonomy

Fixed list: `SWE`, `MLE_AI`, `Data_Science`, `PM`, `Quant`, `Hardware`, `Design`, `Other`. Ingestion keyword-matches titles; anything ambiguous defaults to `Other` — no LLM classification fallback, by deliberate decision.

## 6. Build state at the time of v3

Built via Antigravity + Stitch MCP + Claude Opus 4.6, parallel subagents per screen. Build completed with `npx next build` succeeding; all routes registered correctly.

Implemented: shared foundation (design tokens, Supabase client utilities, types), Login, Authenticated shell, Auth callback route, Tracker + Add Application Modal, Browse Postings, Pipeline Overview, Preferences. RLS respected throughout per subagent reports. No peer/cohort comparison anywhere, confirmed cut per design decision.

Known issues from the build itself:
1. A subagent falsely reported creating `PreferencesForm.tsx`; build failed on a missing module and the file had to be manually recreated. Signal: things a subagent could get subtly wrong without triggering a build error would not be caught the same way.
2. Pipeline Overview deviated from the Stitch design (horizontal stacked bar, not a Sankey) and possibly from requirement #9's intent — unconfirmed whether `status` still stored `interview_1/2/3+` distinctly or whether the distinction was lost in the data itself.
3. Tracker + Add Application Modal build was not fully visible in the build transcript — needed a direct look.
4. A TypeScript error with `LayoutProps<'/(authenticated)'>` came up (Next.js 16 route groups); patched, but worth a sanity check the fix didn't paper over something more substantive.

## 7. Model selection notes for this build

Antigravity's roster at the time included Gemini 3.1 Pro (High/Low), Gemini 3.5 Flash, Gemini 3 Flash, Claude Sonnet 4.6, and Claude Opus 4.6. Decision: run the full six-screen implementation prompt on Claude Opus 4.6 in one shot, given the number of hard constraints that needed to hold simultaneously across all screens. A single strong-reasoning pass was judged more reliable than splitting across weaker models per-screen.

Mid-build, an "Individual quota reached" error interrupted the run during a final verification step, after all six screens had already been implemented and `next build` had already succeeded — no implementation work lost, only a verification step. Recommended handoff pattern for a similar situation: tell the next session what's already done, point it at the existing code to infer established patterns, and only ask it to continue the remaining/unverified work.

## 8. Database schema

See `docs/SCHEMA.sql` for the current, reconciled version. Historically, three additions were agreed but their live status inside the running Supabase project needed direct reconfirmation: `status_detail` on `applications`, `categories` on `applications`, `weekly_goal` on `user_preferences`.

## 9. Competitive landscape

Existing tools fall into three buckets: manual trackers (Huntr, Teal — generic Kanban, no discovery/notifications), autofill extensions with a tracker attached (Simplify, Careerflow — tracker only logs what passed through the extension), and auto-apply agents (Jobright, Resumly, LazyApply — reviews flag low callback rates and billing complaints). Intrack differentiates on: internship-specific category taxonomy driving both discovery and tracking; granular per-round interview funnel; durable full-posting snapshot on the `applications` row; discovery-first architecture; no subscription surface (self-hosted); no autofill/auto-apply by design.

## 10. Open items as of v3 (superseded — see docs/STATUS.md for current state)

1. Enable Google OAuth in Supabase.
2. Migrate `middleware.ts` to `proxy.ts` — flagged safety-relevant (a leftover `middleware.ts` could be silently ignored at build time, leaving protected routes publicly reachable with no warning).
3. Verify the Tracker + Add Application Modal build directly.
4. Verify Pipeline Overview's underlying data, not just its chart.
5. Confirm the three pending `alter table` statements are actually live.
6. Grep the codebase for any stray AI/LLM API calls.
7. Once 1–6 confirmed clean: commit, then move to Phase 3 (Tier 1 ingestion).

## 11. Prompting guidance reminders

- One phase = one prompt where possible; the initial six-screen build broke that rule intentionally and required more post-hoc verification as a result.
- Always paste the actual schema instead of describing it in prose.
- State explicitly what's out of scope for a given prompt.
- Ask for the RLS policy or auth check every time a new table is touched.
- Subagent self-reports of "file created" or "task complete" are not proof — a build/compile check, and ideally a direct read of the file, is the only real confirmation.

## 12. Verification pass findings — schema/type drift from the original subagent build

Verdict: `src/lib/types.ts` was written from generic/assumed field names rather than transcribed from `intrack-schema.sql`, and this propagated into every component touching `Application` or `Posting`.

### 12a. Model-routing pattern established this session
- Opus/higher reasoning: judgment calls — deciding whether a field mismatch is a hallucination to delete vs. a real planned feature missing its schema/column.
- Gemini Flash/low reasoning: small, fully-specified, single-file mechanical fixes with zero ambiguity.
- Rule of thumb: deciding *what the correct behavior should be* → high reasoning. Executing an already-decided change → low reasoning.

### 12b. Bugs found and fixed this session
1. `postings.is_active` — column didn't exist, but the feature idea was good (hide inactive/closed postings from browse view). Kept as a real feature; added via `alter table postings add column is_active boolean not null default true;` plus a partial index. **Confirmed live** by the user directly in the Supabase SQL editor. `is_active` is a display filter only, never a deletion mechanism — postings are never deleted even once inactive (FK from `applications.posting_id`, and the durable-snapshot design means the `postings` row is only needed for dedup memory).
2. `postings.created_at` — column doesn't exist; straightforward hallucination. Correct column is `first_seen_at`. Do not add a `created_at` column.
3. Status dropdown collapsed `interview_1/2/3+` into one generic "Interviewing" option and displayed raw enum labels ("Oa") instead of proper display labels — directly undermines requirement #9 and the differentiator claimed in section 9. Same root cause as the Pipeline Overview bucketing question in section 6. Fix pattern: keep `<option value>` as the literal schema enum, drive the visible label from a `STATUS_CONFIG` lookup map. Screenshot confirmed this fix live.
4. `src/lib/types.ts` rewritten wholesale against `intrack-schema.sql`: `company_name`→`company`, `role_title`→`title`, `description`→`jd_text`; `RoleCategory` values fixed from slash/space format to schema's underscore convention; fabricated `Posting.updated_at` removed; `StatusHistoryEntry` restructured to reflect it's JSONB inside `applications.status_history`, not its own table; fabricated `UserPreferences` top-level `id`/`min_salary`/`created_at`/`updated_at` removed. Added `label` fields to `STATUS_CONFIG` and a new `CATEGORY_CONFIG` + `formatCategoryLabel()` helper.
5. Fixing `types.ts` surfaced a wave of compile errors in `AddApplicationModal.tsx`, `ApplicationCard.tsx`, `PostingsGrid.tsx`, `TrackerBoard.tsx`, `PreferencesForm.tsx` — expected and correct, exposing pre-existing runtime bugs. Dispatched to Gemini Flash with instruction not to patch `types.ts` back to match the wrong component code. **Open at the time:** `PreferencesForm.tsx`'s `min_salary` reference was explicitly not auto-resolved either direction — the original Stitch design did call for a minimum-compensation filter slider, so this could be a real planned feature missing its column, not a hallucination. Flagged for an explicit decision.
6. JD field missing entirely from the Add Application modal — a real gap since `jd_text` is named in requirement #7 and is central to the durable-snapshot pitch. Fix dispatched to Gemini Flash: multiline textarea between Posting URL and Categories, optional, bound to `jd_text` exactly.
7. Cosmetic: per-page padding/title-position inconsistency across Tracker/Postings/Pipeline/Preferences, consistent with each screen being built by an independent parallel subagent. Fix dispatched to Gemini Flash: use Tracker's spacing as reference, move shared padding into `(authenticated)/layout.tsx`.

### 12c. Display-label pattern (standing project convention)
Any field with a small fixed set of values mapping to a Postgres `check` constraint or used for cross-table matching should follow:
```ts
export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; ...styling }> = { ... }
export const CATEGORY_CONFIG: Record<RoleCategory, { label: string; ...styling }> = { ... }
```
The enum/type key is always the literal schema value; `label` is the only place display text should ever be edited. `<select>`/`<option>` elements bind `value` to the enum key and render `{CONFIG[key].label}` — never the raw enum key directly.

### 12d. Open items at the end of this session (superseded — see docs/STATUS.md)
1. Decide `user_preferences.min_salary` (real feature vs. drop it).
2. Confirm Gemini Flash's dispatched fixes actually landed and rebuilt cleanly.
3. Add `is_active` to the reference schema doc.
4. Re-run the "confirm pending alter table statements are live" check, extended to include `is_active`, in one pass against `information_schema.columns`.
5. Old items 1–2 (enable Google OAuth; migrate `middleware.ts`→`proxy.ts`) still untouched — top priority once schema/type layer confirmed clean.
6. Confirm `interview_1/2/3+` granularity survives at the data level in Pipeline Overview's actual queries; grep for stray LLM/AI API calls project-wide.
7. Don't assume Browse Postings, Pipeline Overview, or Preferences are clean just because they render without visible errors — apply the same "diff every field against `intrack-schema.sql` directly" pass to each.

---

# Part 2 — intrack-handoff-section13-update.md

## 13. Infra items closed, frontend polish, functionality freeze

**Status change:** Auth and routing safety items that were top-priority open issues were resolved. Frontend work paused past this point — Tracker and Pipeline Overview considered visually/functionally acceptable as-is. Focus shifted to backend/functional work (ingestion, notifications).

### 13a. Previously open items — confirmed resolved by user this session
1. Google OAuth enabled. Not independently re-verified in that conversation.
2. `middleware.ts` → `proxy.ts` migration completed. Recommended verification (sign out, load `/tracker` directly, confirm redirect to `/login`) not yet confirmed done.
3. `user_preferences.min_salary` decision made — direction not specified in that conversation.
4. Gemini Flash fixes from the prior session confirmed landed: `created_at`→`first_seen_at` rename, component field-name fixes, JD textarea, padding/layout fix.
5. `interview_1/2/3+` granularity confirmed fine at the data/query level in `PipelineCharts.tsx`'s aggregation, not just the dropdown.
6. Stray LLM/AI API call grep confirmed clean; no-LLM constraint holds project-wide.

Note: since specifics of *how* each was verified weren't captured, if any resurface as bugs, don't assume "already checked."

### 13b. Frontend discussion and work this session
- Sidebar `⌘K` search bar flagged as likely redundant (undocumented, likely a Stitch template default; both Tracker and Browse Postings already have page-scoped search). Not yet removed — pending a quick functional check.
- Missing loading states confirmed via grep: zero route-level loading UI, no `loading.tsx` under any `(authenticated)` route, no `Suspense` usage anywhere. Gemini Flash prompt dispatched to add a `loading.tsx` skeleton per route. Not yet confirmed merged/rebuilt.
- Possible naming drift flagged, not resolved: `companyName`/`roleTitle` local variable names found in `AddApplicationModal.tsx` (line ~393) — could be legitimate local camelCase form-state vars mapping correctly to `company`/`title` on submit, or a sign the earlier rename didn't fully propagate. Not checked directly.
- Hover/cursor UX fixes dispatched to Gemini Flash: Preferences stepper button full-surface hover fix; global audit for missing `cursor-pointer` on interactive elements. Not yet confirmed merged/rebuilt.
- Unsaved-changes reminder on Preferences discussed, deliberately deferred by the user (dirty-state bar + `beforeunload` guard recommended if revisited). Frontend work is paused past this point.

### 13c. Frontend freeze — explicit decision
User decided to stop frontend polish work for now. Tracker and Pipeline Overview considered acceptable as-is. Do not proactively suggest further frontend/UX tweaks unless the user brings them up again.

Immediate next priorities at the time, in order:
1. Confirm the two dispatched Gemini fixes (loading states, hover/cursor) actually landed and passed `npx next build`.
2. Resolve the `companyName`/`roleTitle` naming question in `AddApplicationModal.tsx`.
3. Phase 3 — Tier 1 ingestion: polling `SimplifyJobs/Summer2026-Internships` and similar aggregator repos' JSON feeds hourly.
4. Phase 4 (email notifications) and remaining Tier 2 (direct ATS polling) per the original phased plan.
