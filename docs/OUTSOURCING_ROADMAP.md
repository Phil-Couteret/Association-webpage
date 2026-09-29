# Outsourcing Roadmap — White-Label Association Platform

Turning the Elektr-Âme website into a reusable template that any association can
deploy by changing colours, name, and a selection of features.

---

## 0. Goal & guardrails for the contractor

**Objective.** Refactor the existing React/TypeScript + PHP/MySQL codebase into a
white-label platform. A new association site is created by copying one config
file, editing values, and adding brand assets — with zero code edits.

**Definition of done.** A named test association ("Demo Assoc") runs with a
different name, colour scheme, logo, and a different subset of features, produced
only by editing `site.config.ts`, `public/brand/*`, and locale files.

**Hard constraints.**
- No brand string, colour value, or URL may remain hardcoded in `src/` or `api/`.
- Feature flags must gate the front-end **and** the back-end.
- No regression in existing Elektr-Âme functionality.
- Security fixes in Phase 1 are non-negotiable and come first.

---

## Phase 1 — Security & hygiene (do before anything else)

This phase protects the existing live site and must ship before refactoring.

1. **Rotate the exposed production DB password** (it is in git history) and the
   reused admin password. Update `config.php` on the server.
2. **Remove all debug/one-off scripts** from repo and server: `find-files.php`,
   `check-files.php`, `check-video-file.php`, `move-images-to-public.php`,
   `fix-video-mismatch.php`, `list-artist-images-dir.php`,
   `generate-password-hash.php`, `setup-smtp-config.php`,
   `add-payment-allocation-columns.php`, and the other run-once utilities (~40 files).
3. **Add auth to every state-changing endpoint.** Apply the existing
   `requireLoggedInAdmin()` / `require-admin-section.php` guard to every
   create/update/delete/upload endpoint. Audit list attached in the brief.
4. **Fix file uploads.** Validate real content with `finfo` (not client MIME),
   keep random filenames, and add a `.htaccess` to every upload directory that
   disables PHP execution (`php_flag engine off` / `RemoveHandler`).
5. **Lock down CORS.** Remove `Access-Control-Allow-Origin: *` from upload
   endpoints; use the allow-list in `cors-headers.php` everywhere.
6. **Scrub git history** (BFG or `git filter-repo`) or start a clean repo for the
   template so no secret is inherited by every future association.

Deliverable: a security checklist, all items closed, plus the cleaned repo.

---

## Phase 2 — Repository restructure

Make the codebase legible before parameterising it.

1. **Reorganise `api/`** into subfolders: `api/endpoints/`, `api/lib/`,
   `api/classes/` (already exists), and delete migrations/debug from here.
2. **Consolidate the 76 SQL files into one migration system.** Produce a single
   `schema.sql` of record, then sequential migrations (`0001_init.sql`,
   `0002_add_members.sql`, …) applied by a small runner or a tool like Phinx.
   This is what makes "stand up a new association's DB" a one-command step.
3. **Move the 15 root status `.md` notes into `/docs`**; remove `.bak`/`.backup`
   files (git already has the history).
4. **Turn on TypeScript strictness incrementally**: enable `strictNullChecks`
   then `noImplicitAny` then `strict`, fixing per module.
5. **Split the giant components** (`MemberPortal.tsx` 1,938 lines,
   `MembersManager.tsx` 1,076) into smaller pieces. Do this where it reduces
   risk for the parameterisation work; it need not be exhaustive.

Deliverable: reorganised tree, single migration path, a fresh DB provable from
`schema.sql` + migrations alone.

---

## Phase 3 — Theming engine (the "change of colours")

1. Create `config/site.config.ts` (template provided) as the single source of truth.
2. Add a `ThemeProvider` that, at startup, writes `theme.light` / `theme.dark`
   HSL values and `radius` into CSS variables on `:root` and `.dark`. shadcn/ui
   and Tailwind already read these variables, so recolouring is automatic.
3. **Remove the ~769 bespoke colour classes** (`neon-pink`, `electric-blue`,
   `deep-purple`, `blue-dark`, …) from components. Replace with semantic tokens
   (`primary`, `accent`, `muted`) so a theme change needs no component edits.
   Keep the named palette only as optional config-driven variables.
4. Font family and logo become config values; hero/header read them from config.

Deliverable: switching the `theme` block in `site.config.ts` visibly re-skins the
whole site with no other change.

---

## Phase 4 — Identity & content extraction (the "change of name")

1. Replace all ~273 brand strings in `src/` and ~235 in `api/` with reads from
   config (`siteConfig.name`, `siteConfig.tagline`, …).
2. Replace all ~195 hardcoded `elektr-ame.com` URLs with `siteConfig.domain`.
3. Generate `index.html` `<title>`/meta, `manifest.json`, and favicon references
   from config at build time (a small Vite plugin or prebuild script).
4. Confirm the three locale files contain no brand-specific copy that should be
   config (association name in sentences → interpolate `{{name}}`).

Deliverable: grep for `elektr` / `Âme` in `src` and `api` returns **zero**
results outside `site.config.ts` and locale interpolation.

---

## Phase 5 — Feature toggle system (the "selection of features")

1. Add `useFeature(flag)` hook + `<Feature name="gallery">…</Feature>` wrapper,
   both reading `siteConfig.features`.
2. Gate **routes** (don't mount disabled routes in `App.tsx`), **nav items**
   (Header/Footer), and **admin tabs** (`Admin.tsx`) by flag.
3. Add the PHP `require_feature('gallery')` guard (template provided) at the top
   of every endpoint belonging to a toggleable feature, reading
   `site.config.php`. A disabled feature returns 403 server-side.
4. Make membership tiers, payment gateway, and legal entity data-driven from config.
5. Ensure disabling a feature leaves **no broken links and no dead nav** — test
   each flag off in isolation.

Toggleable feature catalogue (initial): Events, Artists, Gallery, Member Portal,
Membership Payments, Sponsor/Donations, Newsletter, Email Automation, Open Call,
Tax Receipts, (association-specific modules default off).

Deliverable: the Demo Assoc runs with a **different subset** of features than
Elektr-Âme, set only in config.

---

## Phase 6 — Provisioning & docs

1. Configure the repo as a **GitHub Template Repository**, plus a
   `create-association` script (or documented steps) that scaffolds
   `site.config.ts`, a `public/brand/` folder, and a fresh database.
2. `CONTRACTOR_BRIEF.md`-level docs plus a "How to launch a new association"
   guide and a per-tenant deployment checklist.
3. **Document the per-tenant provisioning steps** and the (decided)
   copy-per-association model.
4. Quality gates: basic test suite for critical flows (auth, payment webhook,
   membership signup), a lint/build CI (GitHub Actions), and route-level code
   splitting to cut the 1.2 MB bundle.

Deliverable: a documented, repeatable path from zero to a live association site.

---

## Deployment & repository model (DECIDED: copy-per-association)

One **new, separate** template repo; each association is a copy with its own repo,
hosting account, and database. No shared runtime between associations.

| Model | How | Status |
|---|---|---|
| **Copy-per-association** | New template repo, made a GitHub Template Repository. Each association = "Use this template" → its own repo, one DB, one hosting account. | **Chosen.** Low risk, fits OVH setup and the config-file model. |
| **Multi-tenant single deploy** | One deployment serves many associations, tenant chosen by domain; config + data keyed by tenant. | Later option only. Code should not preclude it, but it is out of scope now. |

**Repo setup (do this, not a branch of Elektr-Âme):**
- Seed a fresh repo from the Elektr-Âme codebase with git history stripped, only
  after Phase 1 cleanup, so commit #1 carries no secret and no brand strings.
- Enable the "Template repository" setting so each new association is created via
  "Use this template" with clean history.
- Per association: create from template → edit `site.config.ts` → add brand
  assets → provision DB from `schema.sql` + migrations → deploy.

---

## Suggested sequencing & rough effort

Effort is indicative for one experienced full-stack contractor; get firm quotes.

| Phase | Work | Rough size |
|---|---|---|
| 1 | Security & hygiene | ~1 week |
| 2 | Repo restructure + migrations | ~1–2 weeks |
| 3 | Theming engine | ~1 week |
| 4 | Identity/content extraction | ~1 week |
| 5 | Feature toggles (front + back) | ~1–2 weeks |
| 6 | Provisioning, tests, CI, docs | ~1 week |

Phases 1–2 are prerequisites. 3, 4, 5 can partly overlap. Ask contractors to
quote per phase with Phase 1 as a fixed-price gate.

---

## How to verify each phase (acceptance tests)

- **Theming:** change `theme.primary` → whole site recolours, no component edits.
- **Naming:** `grep -ri "elektr" src api` → only config/locale interpolation.
- **Features:** set `gallery: false` → no gallery route, nav item, admin tab, and
  `/api/galleries-list.php` returns 403. No console errors, no dead links.
- **Provisioning:** create "Demo Assoc" with different name, colours, logo, and a
  different feature set — using only config + brand assets — and it runs.
- **Security:** the Phase 1 checklist is fully closed and re-audited.
