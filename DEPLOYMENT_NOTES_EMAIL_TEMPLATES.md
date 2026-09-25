# Deployment Notes - Email Template Editing Feature

**Date:** December 13, 2024  
**Feature:** Editable Email Templates in Admin Portal

## Changes Made

### 1. New API Endpoints
- `api/email-templates-create.php` - Create new email templates
- `api/email-templates-update.php` - Update existing templates
- `api/email-templates-delete.php` - Delete templates (with safety checks)

### 2. EmailAutomationManager Component (`src/components/admin/EmailAutomationManager.tsx`)
- **Added:** Full EmailTemplate interface with all language fields (subject_en/es/ca, body_en/es/ca)
- **Added:** Template edit/create dialog with:
  - Template key and name fields
  - Language tabs (English, Spanish, Catalan)
  - Subject and body fields for each language
  - Active/inactive toggle
  - Variable placeholder hints
- **Added:** Functions:
  - `handleEditTemplate()` - Opens edit dialog
  - `handleNewTemplate()` - Opens create dialog
  - `handleSaveTemplate()` - Saves/updates via API
  - `handleDeleteTemplate()` - Deletes with confirmation
- **Updated:** Templates table with:
  - "Add Template" button in header
  - Edit and Delete action buttons for each template

## Files Modified
- `src/components/admin/EmailAutomationManager.tsx`
- `api/email-templates-create.php` (new)
- `api/email-templates-update.php` (new)
- `api/email-templates-delete.php` (new)

## Rollback Instructions

If issues occur, rollback with:

```bash
# 1. Revert the component changes
git restore src/components/admin/EmailAutomationManager.tsx

# 2. Delete the new API files from server (via FTP or manually)
# Files to delete on server:
# - /www/api/email-templates-create.php
# - /www/api/email-templates-update.php
# - /www/api/email-templates-delete.php

# 3. Rebuild and redeploy frontend
npm run build
./deploy.sh
```

**Quick rollback script:**
```bash
# Use upload-api-files.sh but delete instead, or manually delete via FTP
```

## Testing Checklist
- [ ] Create a new template
- [ ] Edit an existing template
- [ ] Delete a template (should warn if used in automation rules)
- [ ] Verify all three languages save correctly
- [ ] Check that template_key cannot be changed after creation
- [ ] Test that templates work with email automation

## Current Commit
Check with: `git log --oneline -1`

