# Deployment Notes - Scroll Fixes

**Date:** December 13, 2024  
**Version:** v1.3.0 (with scroll fixes)

## Changes Made

### 1. Legal Notice Page (`src/pages/LegalNotice.tsx`)
- **Added:** `useEffect` hook to scroll to top on page load
- **Import:** Added `useEffect` from React
- **Behavior:** Smooth scroll to top when page mounts

### 2. Terms and Conditions Page (`src/pages/TermsAndConditions.tsx`)
- **Added:** `useEffect` hook to scroll to top on page load
- **Import:** Added `useEffect` from React
- **Behavior:** Smooth scroll to top when page mounts

### 3. Artist Edit Form (`src/components/admin/ArtistsManager.tsx`)
- **Added:** `useRef` and `useEffect` hooks
- **Imports:** Changed from `useState` to `useState, useEffect, useRef`
- **Added:** `formRef` to reference the form Card element
- **Added:** `useEffect` to scroll to form when `showForm` becomes true
- **Behavior:** Smooth scroll to form when editing/adding artist (100ms delay for rendering)

### 4. Deployment Script (`deploy.sh`)
- **Added:** Permission fixes after copying files to deployment folder
- **Lines 22-23:** Added `find` commands to set correct permissions:
  - Files: 644 (readable by web server)
  - Directories: 755 (executable by web server)
- **Purpose:** Prevents 403 Forbidden errors from incorrect file permissions

## Rollback Instructions

If you need to rollback these changes:

```bash
# Revert the scroll fixes (keep deploy.sh permission fixes)
git restore src/pages/LegalNotice.tsx src/pages/TermsAndConditions.tsx src/components/admin/ArtistsManager.tsx

# Rebuild and redeploy
npm run build
./deploy.sh
```

## Files Modified
- `src/pages/LegalNotice.tsx`
- `src/pages/TermsAndConditions.tsx`
- `src/components/admin/ArtistsManager.tsx`
- `deploy.sh` (permission fixes - DO NOT REVERT)

## Testing
After deployment, verify:
1. Click "Legal Notice" link → page should scroll to top
2. Click "Terms and Conditions" link → page should scroll to top
3. Edit an artist → form should scroll into view

