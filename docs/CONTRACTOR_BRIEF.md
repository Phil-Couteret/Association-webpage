# Contractor Brief — White-Label Association Platform

Short spec to attach to a request for quote. Full detail in `OUTSOURCING_ROADMAP.md`.

## Context
Existing production site: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
(front), PHP 8.4 + MySQL (back), deployed on OVH. ~123 TSX files, ~125 PHP
endpoints. Live and working. Repo will be shared read-only for assessment.

## What we want
Refactor it into a white-label template so a new association goes live by editing
one config file (`site.config.ts`), adding brand assets, and choosing features —
**no code changes.**

## Scope (fixed)
1. **Security remediation (Phase 1) — priced separately, done first:** rotate
   leaked credentials, remove ~40 unauthenticated debug scripts, add admin auth
   to all state-changing endpoints, harden file uploads, lock CORS, scrub git
   history. Acceptance: our security checklist fully closed.
2. **Repo restructure:** organise `api/`, consolidate 76 SQL files into one
   schema + sequential migrations, enable TypeScript strict mode, split the two
   largest components.
3. **Theming engine:** config-driven CSS variables; remove ~769 bespoke colour
   classes in favour of semantic tokens.
4. **Identity extraction:** remove ~273 brand strings and ~195 hardcoded URLs
   from code; generate title/meta/manifest/favicon from config.
5. **Feature toggles:** `useFeature` hook + `<Feature>` wrapper + PHP
   `require_feature()` guard gating routes, nav, admin tabs, and endpoints.
6. **Provisioning + quality:** new-association script, launch docs, basic tests
   for auth/payment/signup, and a build+lint CI.

## Acceptance tests (must all pass)
- Changing `theme.primary` recolours the whole site with no component edits.
- `grep -ri "elektr" src api` returns only config/locale interpolation.
- Setting `gallery: false` removes the gallery route, nav item and admin tab, and
  makes its endpoints return 403 — with no dead links or console errors.
- A demo association with a different name, colours, logo and feature set is
  produced using only config + brand assets.

## Deliverables
Cleaned repo, one-command DB setup, `site.config.ts` template, launch guide,
per-tenant deployment checklist, CI, and the closed security checklist.

## Repository & provisioning model (decided: copy-per-association)
- **New, separate repo** for the template — NOT a branch/folder of the existing
  Elektr-Âme repo. Start history clean (no inherited secret, no brand strings).
- Seed it from the Elektr-Âme codebase with git history stripped, and only after
  the Phase 1 security cleanup, so commit #1 is already clean.
- Configure the template repo as a **GitHub Template Repository** ("Template
  repository" checkbox in settings) so each new association is created via
  "Use this template" → its own repo with fresh history.
- **One repo + one hosting account + one database per association.** No shared
  runtime between associations.
- Per-association setup = create from template → edit `site.config.ts` → add
  `public/brand/` assets → provision a fresh DB from `schema.sql` + migrations →
  deploy. Deliver this as a documented, repeatable checklist (Phase 6).

## Tech constraints
- Keep the existing stack (no framework rewrite).
- Deployment model: copy-per-association (above); code written so multi-tenant is
  a later option, not a rewrite.
- All secrets in server env / `config.php`, never in the repo.

## How to quote
Price **per phase**, with Phase 1 as a fixed-price gate. Note any assumptions and
anything you'd recommend changing.
