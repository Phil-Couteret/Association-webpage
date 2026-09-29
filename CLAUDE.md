# CLAUDE.md — Association-webpage

Orientation for any Claude Code session in this repo. Read this first.

## What this project is

This repo is a **white-label refactor** of the Elektr-Âme association website
(an electronic-music community in Barcelona, elektr-ame.com). The goal: turn a
single-tenant site into a reusable template so a new association can launch by
changing **colours, name, logo, and a selection of features** — with no code
edits.

It was seeded from the original Elektr-Âme codebase with git history stripped, so
this repo's history is clean and contains no secrets. Do not re-import history
from the original repo.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui. Source in `src/`.
- **Backend:** PHP 8.4 + MySQL. Endpoints in `api/` (flat folder, ~120 files).
- **i18n:** three locales in `src/locales/{en,es,ca}.ts`.
- Config is per-server in `api/config.php` (gitignored, not in repo) — never commit it.

## Deployment model (decided)

**Copy-per-association.** One template repo, made a GitHub Template Repository.
Each association = "Use this template" → its own repo, one database, one hosting
account. No shared runtime, no multi-tenancy. Keep code clean enough that
multi-tenant stays a later option, but it is out of scope now.

## Security status — READ BEFORE TOUCHING CONFIG

- The original repo leaked a production DB password in its history. That password
  and the reused FTP/SSH password have BOTH been rotated. This repo's history is
  clean (verified: `git grep -i "92alcolea"` returns nothing).
- **Never** commit `config.php`, `.env`, or any real credential. They are
  gitignored; keep it that way. Only `*-template.php` / `*.example.*` files with
  placeholders belong in the repo.
- If you ever find a real secret staged, stop and flag it before committing.

## The plan — follow the phased roadmap

The work is organised into phases. Detailed docs should live in `docs/`:
- `docs/PHASE1_SECURITY.md` — the immediate cleanup checklist (delete debug
  scripts, remove `deployment/`, add auth to write endpoints, harden uploads).
- `docs/OUTSOURCING_ROADMAP.md` — the full 6-phase plan.
- `docs/CONTRACTOR_BRIEF.md` — the statement of work for outsourcing.
- `config/site.config.example.ts` — the intended single config file for theming,
  identity, and feature toggles.

> NOTE: if `docs/` is missing, those files haven't been committed yet — they exist
> in the white-label template package produced earlier. Ask the user for them, or
> reconstruct from the roadmap summary below before starting Phase work.

### Phase order
1. **Security & hygiene** — see `docs/PHASE1_SECURITY.md`. Do this first.
2. **Repo restructure** — organise `api/`, consolidate the ~76 `database/*.sql`
   files into one `schema.sql` + sequential migrations, enable TS strict mode.
3. **Theming engine** — `config/site.config.ts` → CSS variables; remove the
   ~769 bespoke colour classes for semantic tokens.
4. **Identity extraction** — remove ~273 brand strings + ~195 hardcoded URLs.
5. **Feature toggles** — `useFeature()` hook + `<Feature>` wrapper + PHP
   `require_feature()` guard, gating routes, nav, admin tabs, and endpoints.
6. **Provisioning & docs** — make it a GitHub Template Repository, add a
   create-association flow, tests, and CI.

## Known cleanup targets (committed by mistake in the initial import)

- Debug/one-off scripts still present: `api/invitations-debug.php`,
  `api/invitations-fix-now.php`, `api/invitations-fix-link.php`,
  `api/tax-receipt-test.php`, `api/email-test-send.php`, `api/smtp-test.php`,
  `database/run-migration-payment-intent-id.php`,
  `database/setup-payment-tables.php`, `scripts/generate-password-hash.js`.
- `deployment/` — a ~2 MB pre-built copy of the old site; remove and gitignore.
- 15 status `.md` notes in the root (STRIPE_PHASE*, FIX_*, *_ROADMAP) — move to `docs/`.

## Write endpoints missing an auth guard (Phase 1 §D)

The guard exists at `api/require-admin-section.php` (`requireLoggedInAdmin()` /
`requireAdminSection()`); it just isn't applied everywhere. Endpoints needing it:
`upload-artist-images`, `upload-gallery-images`, `upload-gallery-chunk`,
`delete-artist-image`, `delete-gallery-image`, `update-artist-image`,
`galleries-create`, `galleries-update`, `galleries-delete`, `unarchive-event`,
`add-payment-confirmation-template`. Also remove `Access-Control-Allow-Origin: *`
from the upload endpoints and validate uploads with `finfo`.

## Working conventions

- **Build/test locally before committing:** `npm install`, then `npm run build`.
- Make small, reviewable commits — one concern each. Show diffs before committing.
- Prefer editing files in place; don't create parallel `-v2` / `-new` copies.
- The dev API proxy is configured in `vite.config.ts` (`/api` → local PHP).
- Don't touch anything on the live OVH server from here; this repo is the template,
  not the running Elektr-Âme site.

## Keeping this file current

- **Verify before trusting.** At session start, check the "Known cleanup targets"
  and "Write endpoints missing an auth guard" lists against the actual repo
  (e.g. `ls` the listed files; grep each endpoint for `requireLoggedInAdmin` /
  `requireAdminSection`). These lists can go stale — the repo is the source of truth.
- **Update in the same commit.** When you complete a phase or checklist item,
  update the affected CLAUDE.md section *and* tick the matching box in the
  relevant `docs/PHASE*` checklist in the same commit as the change itself.
- **Detail in `docs/`, pointers here.** Keep step-by-step plans, checklists and
  rationale in `docs/`; CLAUDE.md should stay a short orientation with links.
- **Never make a future session less careful.** Don't remove or soften security
  warnings, mark something done that wasn't verified, or record anything
  (credentials, "safe to skip" notes, relaxed rules) that lowers the bar.
