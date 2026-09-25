# Rollback Guide

## How to Properly Rollback to a Previous Version

When rolling back to a previous version (e.g., v1.0.1, v1.0.2), you must restore **ALL** files, not just code files.

### Files That Must Be Restored:

1. **Code Files** (automatically restored with git checkout):
   - `src/` - All React components
   - `public/` - Service worker, manifest, etc.
   - `package.json` - Dependencies and version
   - `vite.config.ts` - Build configuration

2. **Server Configuration Files** (must be uploaded separately):
   - `.htaccess` - Apache configuration (excluded from deployment)
   - `api/.htaccess` - API directory configuration (if exists)

3. **Build Output** (regenerated):
   - `dist/` - Will be rebuilt with `npm run build`

### Rollback Steps:

1. **Restore code to the version tag:**
   ```bash
   git checkout v1.0.2  # or v1.0.1, etc.
   git checkout main
   git reset --hard v1.0.2  # Replace with desired version
   ```

2. **Rebuild the frontend:**
   ```bash
   npm run build
   ```

3. **Upload .htaccess file separately:**
   ```bash
   ./upload-htaccess.sh
   ```
   **IMPORTANT:** The `.htaccess` file is excluded from `deploy.sh` to prevent overwriting server configuration. It must be uploaded manually.

4. **Deploy frontend:**
   ```bash
   ./deploy.sh
   ```

### What NOT to Do:

- ❌ Don't modify files after rollback (defeats the purpose)
- ❌ Don't forget to upload `.htaccess` separately
- ❌ Don't skip the rebuild step
- ❌ Don't deploy without verifying the version tag

### Verification:

After rollback, verify:
- Check git tag: `git describe --tags`
- Check service worker version in browser console
- Test the functionality that was working in that version

### Current Versions:

- **v1.0.0** - Initial stable version
- **v1.0.1** - Fix lightbox blank screen issue (ID-based lookup)
- **v1.0.2** - Fix lightbox infinite loop and close button visibility
- **v1.2.0** *(older tag — Dec 2025 snapshot)* - About section and messaging features
- **v1.2.1** - Redsys redirect payment flow (production-ready); member PHP session in UI (`member-auth-check`, portal link); hero “Upcoming events” scroll; invitation tab label i18n; Header member session fix
- **v1.3.2** - Open Call (public form + admin), promote submission to artist; admin section permissions; Header: home sections from any route; Open Call page scroll-to-top; `open-call-admin-list` compatible with older DB schemas; Open Call SQL migrations (archive, promoted artist). *(Note: an older unrelated **v1.3.0** tag exists for Paycomet/legal pages — use **v1.3.2** for this release.)*
- **v1.3.3** - Open Call: promote to members (complimentary yearly membership via explicit button only); `promoted_member_id` migration; selection decoupled from membership; copy updates (EN/ES/CA).

**Rollback to v1.3.3:**
```bash
git fetch --tags
git checkout v1.3.3
```
Then `npm ci`, `npm run build`, deploy per your process.

**Rollback to v1.3.2:**
```bash
git fetch --tags
git checkout v1.3.2
```
Then `npm ci`, `npm run build`, deploy per your process.

**Rollback to this Redsys-ready release (v1.2.1):**
```bash
git fetch --tags
git checkout v1.2.1
```
Then `npm ci`, `npm run build`, deploy per your process.

