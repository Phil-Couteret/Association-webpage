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

- Debug/one-off scripts: `smtp-test.php`, `run-migration-payment-intent-id.php`,
  `setup-payment-tables.php` and `generate-password-hash.js` have been deleted.
  `api/email-test-send.php` and `api/tax-receipt-test.php` are kept for now because
  admin UI buttons call them (see `docs/PHASE1_SECURITY.md` §B). The three
  `invitations-*` endpoints moved to the auth-guard list below.
- `deployment/` has been removed and gitignored. Note: `deploy.sh` still copies into
  `deployment/` and needs a `mkdir -p` or a rework before it's used again.
- 15 status `.md` notes in the root (STRIPE_PHASE*, FIX_*, *_ROADMAP) — move to `docs/`.

## Auth guards on write endpoints (Phase 1 §D)

Guards live in `api/require-admin-section.php`:
- `requireAdminSection('x')` implies a login check.
- `requireAnyAdminSection([...])` is for endpoints shared by several tabs.
- `requireAdminSections([...])` requires *all* of the listed sections.

Call them after `session_start()` and the `config.php` include. Many older endpoints
never call `session_start()`, and without it the guard always returns 401.

All 14 endpoints on the §D list are now guarded; see `docs/PHASE1_SECURITY.md` §D
for before/after per file. Still open in §D: review `open-call-member-helper.php`
and `payment/sponsor-create-checkout.php` individually. **Only the §D list was
audited**, so don't assume every other write endpoint in `api/` is guarded.
Still to do (§E): remove `Access-Control-Allow-Origin: *` from
`upload-artist-images`, `delete-artist-image` and `update-artist-image`, and
validate uploads with `finfo`.

## Working conventions

- **Build/test locally before committing:** `npm install`, then `npm run build`.
- Make small, reviewable commits — one concern each. Show diffs before committing.
- Prefer editing files in place; don't create parallel `-v2` / `-new` copies.
- The dev API proxy is configured in `vite.config.ts` (`/api` → local PHP).
- Don't touch anything on the live OVH server from here; this repo is the template,
  not the running Elektr-Âme site.

## Keeping this file current

- **Verify before trusting.** At session start, check the "Known cleanup targets"
  and "Auth guards on write endpoints" sections against the actual repo
  (e.g. `ls` the listed files; grep each endpoint for `requireLoggedInAdmin` /
  `requireAdminSection` / `requireAnyAdminSection`). These lists can go stale — the repo is the source of truth.
- **Update in the same commit.** When you complete a phase or checklist item,
  update the affected CLAUDE.md section *and* tick the matching box in the
  relevant `docs/PHASE*` checklist in the same commit as the change itself.
- **Detail in `docs/`, pointers here.** Keep step-by-step plans, checklists and
  rationale in `docs/`; CLAUDE.md should stay a short orientation with links.
- **Never make a future session less careful.** Don't remove or soften security
  warnings, mark something done that wasn't verified, or record anything
  (credentials, "safe to skip" notes, relaxed rules) that lowers the bar.
