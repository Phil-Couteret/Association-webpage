# Phase 1 — Security & Hygiene Checklist

Ordered, executable cleanup for the `Association-webpage` template repo. Everything
here must be done before the template is used to create a real association site.

Status legend: `[ ]` to do · `[x]` done.

---

## A. Credentials (live exposure) — DONE

- [x] Rotate the production **database** password (OVH panel) and update the
      server's `api/config.php`.
- [x] Rotate the **FTP/SSH** password (was the same string, found in `.env`).
- [x] Confirm the leaked string appears nowhere in the repo:
      `git grep -i "92alcolea"` returns nothing.

> The new repo was seeded without git history, so the old secret was never
> committed here. No history scrub is required for this repo.

---

## B. Delete leftover debug / one-off scripts

These were committed in the initial import and should be removed. None is part
of the running product; each is a diagnostic or run-once utility. Several are
reachable over HTTP.

Run from the repo root:

```bash
# Debug / test endpoints
git rm api/smtp-test.php

# Run-once migration / setup scripts (belong in the migration system, not shipped)
git rm database/run-migration-payment-intent-id.php \
       database/setup-payment-tables.php \
       scripts/generate-password-hash.js
```

- [x] Deleted the debug/test endpoints above.
- [x] Deleted the run-once scripts above (and the `generate-hash` entry in `package.json`).
- [ ] Decide on `api/email-test-send.php` and `api/tax-receipt-test.php`. They were
      originally on the delete list, but admin UI buttons call them
      (`EmailAutomationManager.tsx`, `MembershipDialog.tsx`), so they're kept for now.
      Both have an inline `$_SESSION['admin_logged_in']` check. Either remove each one
      together with its button, or switch it to the standard guard.
- `invitations-debug.php`, `invitations-fix-now.php` and `invitations-fix-link.php`
  were moved from this list to §D. `invitations-fix-now.php` is called by the admin
  "Fix link" button (`InvitationsManager.tsx`).
- [ ] Grep for any others: `grep -rilE "run this once|diagnostic|delete this file|one-time" api database scripts` — review and remove real one-offs (keep genuine `*-template.php` files).

---

## C. Remove build output committed by mistake

```bash
git rm -r deployment/        # ~2 MB pre-built site with Elektr-Âme branding/bundles
```

- [x] Removed `deployment/`.
- [x] Add to `.gitignore` so it can't return: append `deployment/` and `dist/` and `www/`.
- [ ] `deploy.sh` still runs `cp -r dist/* deployment/`. Add `mkdir -p deployment`
      or rework the script before using it again.

---

## D. Add authentication to state-changing endpoints

The guard already exists (`api/require-admin-section.php`,
`requireLoggedInAdmin()`); it just isn't applied everywhere. Add it to the top of
each endpoint below, after `session_start()` and the config include.

**Admin-only write endpoints missing a guard — add `requireLoggedInAdmin()` (and a section check where relevant):**

- [x] `api/upload-artist-images.php` → `requireAdminSection('artists')` (+ `session_start()`, then `session_write_close()`). Before: no auth at all. *`Access-Control-Allow-Origin: *` still present, see §E.*
- [x] `api/upload-gallery-images.php` → `requireAnyAdminSection(['gallery','events'])` (+ `session_start()`, then `session_write_close()`). Before: no auth at all.
- [x] `api/upload-gallery-chunk.php` → `requireAnyAdminSection(['gallery','events'])` (+ `session_start()`, then `session_write_close()`). Before: no auth at all.
- [x] `api/delete-artist-image.php` → `requireAdminSection('artists')` (+ `session_start()`). Before: no auth at all. *Also sends `Access-Control-Allow-Origin: *`, see §E.*
- [x] `api/delete-gallery-image.php` → `requireAdminSection('gallery')` (+ `session_start()`). Before: no auth at all.
- [x] `api/update-artist-image.php` → `requireAdminSection('artists')` (+ `session_start()`). Before: no auth at all. *Also sends `Access-Control-Allow-Origin: *`, see §E.*
- [x] `api/galleries-create.php` → `requireAnyAdminSection(['gallery','events'])` (+ `session_start()`, was absent). Before: no auth at all.
- [x] `api/galleries-update.php` → `requireAdminSection('gallery')` (+ `session_start()`). Before: no auth at all.
- [x] `api/galleries-delete.php` → `requireAdminSection('gallery')` (+ `session_start()`). Before: no auth at all.
- [x] `api/unarchive-event.php` → `requireAdminSection('events')` (+ `session_start()`). Before: no auth at all.
- [ ] `api/add-payment-confirmation-template.php`
- [ ] `api/invitations-fix-now.php`  *(no standard guard, only an inline
      `$_SESSION['admin_logged_in']` check with no section check; writes invitation data)*
- [ ] `api/invitations-fix-link.php`  *(inline session check only; no standard guard)*
- [ ] `api/invitations-debug.php`  *(inline session check only; diagnostic, so consider deleting instead)*

**Check individually (may be an include, a public flow, or gateway-verified — confirm before acting):**

- [ ] `api/open-call-member-helper.php` — helper include, not a direct endpoint; confirm it's only `require`d, then no guard needed.
- [ ] `api/payment/sponsor-create-checkout.php` — public sponsor flow; verify amount is server-set and input validated, rather than adding admin auth.

Guard pattern to add at the top:

```php
session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireLoggedInAdmin();
requireAdminSection('gallery');   // or the relevant section
```

For an endpoint shared by several tabs (e.g. gallery uploads from both Gallery and
Events), use `requireAnyAdminSection(['gallery', 'events'])`. The admin needs
**any** of the listed sections. `requireAdminSections([...])` requires **all** of them.

---

## E. Harden file uploads

In `upload-artist-images.php`, `upload-gallery-images.php`, `upload-gallery-chunk.php`:

- [ ] Remove `header('Access-Control-Allow-Origin: *')`; use the allow-list in `cors-headers.php`.
- [ ] Validate real content type with `finfo` (not the client-supplied `$file['type']`):
      ```php
      $finfo = new finfo(FILEINFO_MIME_TYPE);
      $realType = $finfo->file($file['tmp_name']);
      // compare $realType against the allow-list, reject otherwise
      ```
- [ ] Keep random filenames (already done in most places) — never trust the uploaded name.
- [ ] Add a `.htaccess` to every upload directory that disables PHP execution:
      ```apache
      # public/artist-images/.htaccess, public/gallery-images/.htaccess, etc.
      php_flag engine off
      RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps
      RemoveType .php .phtml .php3 .php4 .php5 .php7 .phps
      ```

---

## F. Admin credentials in SQL

- [x] Removed the plaintext password comment lines from `database/admin-users.sql`.
- [ ] Confirm no admin account still uses the old password; if any does, set a new
      one and store only the hash (generate with a local script, then delete it).

---

## G. Final verification

- [ ] `git grep -iE "92alcolea|sk_live_|whsec_[a-z0-9]{6}"` returns nothing real (placeholders in Stripe docs are fine).
- [ ] `git grep -n "Allow-Origin: \*" api` returns nothing.
- [ ] Every file in §D either has a guard or is confirmed public-by-design.
- [ ] App still builds: `npm install && npm run build`.
- [ ] Commit: `git commit -m "Phase 1: remove debug scripts, build output; secure endpoints; harden uploads"` and push.

---

*Once §B–§G are green, the repo is ready for Phase 2 (repo restructure + single
migration system). See `OUTSOURCING_ROADMAP.md`.*
