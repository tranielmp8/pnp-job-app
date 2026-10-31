# YoureHired — Project Plan & Progress

_Last updated: 2026-10-31_

## What we're building

A multi-user job search and application tracker.

- **Search jobs** pulled from job APIs (**JSearch** and **Adzuna**), filtered by keywords/tags, **city**, **state**, and **remote**.
- **Apply** = open the job's apply link and record it. Applied jobs get an "Already applied" badge and are hidden from future results, so nobody applies to the same job twice — even if the same posting shows up from both providers.
- **Track applications** by status: saved → applied → interviewing → offer / rejected.
- **Resumes**: upload, view in-browser, keep multiple versions, attach a version to each application.
- **Multi-user**: every user's data is fully separated.

We use official job APIs instead of scraping LinkedIn/Indeed directly (scraping violates their ToS and breaks often).

## Stack

| Area | Choice |
|---|---|
| Framework | SvelteKit 3 + Svelte 5 (runes), TypeScript |
| Styling | Tailwind 4 (+ forms, typography) |
| Database | Postgres via Drizzle ORM (postgres.js) |
| Auth | Better Auth (email + password) |
| Job data | JSearch (RapidAPI) + Adzuna |
| Hosting | **Netlify** (`@sveltejs/adapter-netlify`). Dockerfile + `adapter-node` kept for a possible VPS later |
| Database | Postgres on **Railway** |
| Resume storage | **Railway bucket** (S3-compatible) via `STORAGE_DRIVER=s3`; links-only until set up |

## Data separation rules

- `job` is a **shared cache** of public listings — no owner.
- `application`, `resume`, `saved_search` all have a `user_id` FK (cascade delete). **Every query on these tables must filter by `locals.user.id`.**
- Route protection lives in `src/hooks.server.ts` (covers pages, form actions and endpoints), not in layout loads.

## Data model (`src/lib/server/db/schema.ts`)

- **job** — source, external_id (unique per source), dedupe_hash, title, company, city, state, country, is_remote, salary min/max, description, apply_url, posted_at, fetched_at
- **application** — user_id, job_id, dedupe_hash, status, resume_id, notes, applied_at. Unique on `(user_id, job_id)` **and** `(user_id, dedupe_hash)` → can't record the same job twice.
- **resume** — user_id, label, file_name, storage_key, mime_type, size_bytes, is_default
- **saved_search** — user_id, name, keywords, city, state, remote_only, last_run_at
- Better Auth tables: user, session, account, verification (`auth.schema.ts`)

## Phases

### ✅ Phase 0 — Foundation (done)
- [x] `git init` (branch `main`); initial commit made
- [x] Switched to `@sveltejs/adapter-node` for Coolify; `npm run build` passes
- [x] `Dockerfile` + `.dockerignore` for Coolify deployment
- [x] Better Auth schema written by hand (`npm run auth:schema` fails: CLI can't resolve SvelteKit 3's `$app/tsconfig`)
- [x] App schema: job, application, resume, saved_search
- [x] Env vars added: `JSEARCH_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `UPLOAD_DIR` (`src/env.ts`, `.env.example`)
- [x] Removed demo routes; added `/login`, `/signup`, `/logout`, nav layout, landing page
- [x] Signup has a Confirm password field: live "Passwords don't match" message in the browser, and the server rejects mismatches
- [x] Auth guard in hooks for `/jobs`, `/applications`, `/resume`, `/logout`, with safe `?redirectTo=`
- [x] Placeholder pages for `/jobs`, `/applications`, `/resume`
- [x] `npm run check`: 0 errors, 0 warnings
- [x] Tables pushed to the database
- [x] API keys in `.env`: `RAPIDAPI_KEY`, `ADZUNA_APP_ID`, `ADZUNA_API_KEY`

### ✅ Phase 1 — Job search (done, 2026-10-25)
- [x] Provider interface in `src/lib/server/jobs/` (`types.ts`, `jsearch.ts`, `adzuna.ts`)
- [x] Normalize: state names → 2-letter codes, remote detection, salaries rounded, dedupe hash (company suffixes like Inc/LLC ignored)
- [x] `searchJobs()` (`jobs/index.ts`): queries enabled providers in parallel; if one fails, the others still return results and a warning is shown. Collapses cross-provider duplicates (JSearch wins) and upserts into `job`
- [x] 30-minute in-memory cache per query, to save API quota (resets on server restart)
- [x] `/jobs`: keywords, city, state dropdown, Remote checkbox; GET params so searches are bookmarkable; pagination; "Saved" / "Already applied" badges
- [x] `/jobs/[id]`: detail page; description rendered as plain text (untrusted provider HTML)
- [x] Tested end to end against the real APIs: Adzuna returns results; Remote filter returns only remote jobs; cached repeat search ~0.3s vs ~1.1s; unknown job id → 404
- [x] Subscribed to JSearch on RapidAPI. JSearch moved its endpoint `/search` → **`/search-v2`** and now returns jobs under `data.jobs`; code updated
- [x] JSearch salaries are converted to yearly amounts (they come with an hourly/monthly/yearly period)
- [x] Re-tested with JSearch only: Austin, TX → 10 results, all in Austin; Remote → 10 results, all remote; detail page OK
- JSearch returns 10 jobs per page and takes ~3–8s per uncached search (cached repeats are fast)
- [x] 2026-10-25: **JSearch only for now.** New `JOB_PROVIDERS` env var (default `jsearch`). Adzuna code is kept; re-enable with `JOB_PROVIDERS="jsearch,adzuna"`
- Known limits: Adzuna only gives a description preview; "remote" on Adzuna is detected from text, so a few may be missed

### ✅ Theme — PrideNPurpose (done, 2026-10-25)
- [x] Tokens from `theme.md` in `src/routes/layout.css` as `--pnp-*` vars, exposed as Tailwind utilities (`bg-surface`, `bg-cream`, `text-fg`, `text-muted`, `text-primary`, `border-line`, `bg-mark`, `bg-footer`, …)
- [x] Shared classes: `.card`, `.input`, `.checkbox`, `.field-label`, `.btn-primary`, `.link`, `.badge-saved`, `.badge-applied`, `.notice`, `.text-gradient`
- [x] Added beyond theme.md: `--pnp-on-primary` (dark text on light-orange buttons in dark mode), `--pnp-danger`, `--pnp-success(-soft)`
- [x] **Light mode by default**; sun/moon toggle in the nav switches to dark. Choice saved in `localStorage`; inline script in `app.html` applies it before paint (no flash)
- [x] Restyled: nav (sticky, blurred), gradient-brand hero + feature cards on home, auth pages, job search, job detail, footer
- Use these tokens/classes for all new UI, never raw `gray-*`/`blue-*`

### ✅ Phase 2 — Application tracking (done, 2026-10-25)
- [x] `src/lib/server/applications.ts`: every query takes `userId` and filters on it (save, unsave, apply, list, counts, update, delete)
- [x] Matching is by dedupe hash, so the same job re-posted under a new id still counts as "already applied"
- [x] `JobActions` component (search results + job page): **☆ Save / ★ Saved** toggle and **Apply ↗**
  - With JS: opens the posting in a new tab immediately and records the application in the background
  - Without JS: form posts in a new tab, server records it and 303-redirects to the posting (`redirect(..., { external: true })`)
  - Applying twice never creates a duplicate; Apply promotes a Saved job to Applied
- [x] Search hides jobs you already applied to ("N you already applied to hidden · show them"); saved jobs stay visible
- [x] Apply links from providers must be `http(s)`; others are dropped (stops `javascript:` links)
- [x] `/applications`: status tabs with counts (All / Saved / Applied / Interviewing / Offer / Rejected), status dropdown (auto-saves), notes, posting link, remove (with confirm). Moving out of Saved stamps the applied date
- [x] Tested end to end with two users: save/apply/no-duplicate/hide/show/status/notes/remove all work; user B gets 404 trying to change or delete user A's application, and sees none of A's data
- Note: "Remove" is inside the Notes section of each application card

### ✅ Phase 3 — Resume (done, 2026-10-25)
- [x] Schema: `resume.kind` = `link` | `file`; `url` for links; file columns now nullable (pushed to DB)
- [x] **Links (live now):** Google Drive / Docs links show an embedded preview (`/preview` URL); other https links open in a new tab. Drive files must be shared "Anyone with the link"
- [x] **File uploads (ready, off by default):** PDF, DOCX, PNG, JPG, WebP up to 4 MB (was 5 MB; lowered for Netlify's ~6 MB request limit). Type is checked from the file's bytes, not the name
- [x] Storage layer `src/lib/server/storage/`: `StorageDriver` interface (`put` / `get` / `delete`) chosen by `STORAGE_DRIVER`
  - `none` (default): uploads hidden, links only
  - `local`: files in `UPLOAD_DIR` (needs a persistent disk — not on Netlify)
  - `s3` (2026-10-31): `s3.ts`, any S3-compatible bucket (Railway bucket). Env: `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION` (default `auto`), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`. Builds and type-checks; **not yet tested against a real bucket**
- [x] `/resume/[id]/file`: streams files to their owner only; PDFs/images inline, DOCX as download; `nosniff`; sandbox CSP for non-PDFs
- [x] `/resume` page: list, default badge, Make default, Delete (removes the stored file too; next resume becomes default), Link / Upload tabs, preview panel
- [x] Default resume is attached automatically on Apply; `/applications` has a "Resume sent" dropdown (only your own resumes are accepted)
- [x] Dockerfile sets `BODY_SIZE_LIMIT=6M` (adapter-node default is 512K)
- [x] Tested end to end: links + embed, http/javascript links rejected, PDF/PNG upload + byte-exact download, disguised .exe rejected, other user gets 404 on files and can't set default/delete/attach, delete promotes next default and removes the file, uploads refused when `STORAGE_DRIVER=none`

### ⏸️ Phase 4 — Extras (on hold, 2026-10-31)
- **Waiting on a paid JSearch subscription.** Scheduled fetches and alerts would use up the free quota too fast. Start this phase once the plan is upgraded.
- Saved searches + scheduled fetch, new-match alerts
- Optional AI match scoring of job vs. resume

## Deployment notes (Netlify, since 2026-10-31)
- Switched from Coolify to **Netlify**. `vite.config.ts` uses `adapter-netlify` by default; `ADAPTER=node` switches to `adapter-node` (the Dockerfile sets this).
- `netlify.toml`: build `npm run build`, publish `build`, Node 24. **Production** deploys run `node scripts/migrate.js` first (build fails, live site untouched, if a migration fails). Deploy previews skip migrations.
- Netlify env vars: `DATABASE_URL` (Railway **public** URL), `ORIGIN` (the exact public site URL, `https://`, no trailing slash — wrong value → "Cross-site POST form submissions are forbidden" / login issues), `BETTER_AUTH_SECRET`, `RAPIDAPI_KEY`, `JOB_PROVIDERS`, `STORAGE_DRIVER`, and the `S3_*` vars for the bucket.
- **Schema change workflow:** edit `schema.ts` → `npm run db:generate` → commit the new file in `drizzle/` → push. Production deploy applies it.
- `drizzle-orm`, `postgres`, `@aws-sdk/client-s3` are runtime `dependencies`.
- Serverless caveats: the 30-minute in-memory search cache only lives as long as a function instance, so cache hits are rarer; Netlify functions time out after ~10s by default (JSearch takes 3–8s).
- The existing Railway DB was created with `db:push` (no migration history), so `migrate.js` can't run against it as-is. See open question below.

### Dockerfile (not used right now)
- Kept in the repo for a possible VPS/Coolify deploy. Netlify ignores it. Disconnect/delete the Coolify app so pushes don't trigger Coolify deploys.
- Multi-stage `node:24-alpine`, `ADAPTER=node`, runs `scripts/migrate.js` then `node build` as the `node` user on port **3000**. Mount a volume at `/app/uploads` if using `STORAGE_DRIVER=local`.
- Never built locally (Docker Desktop wasn't running); production install + boot was simulated.
