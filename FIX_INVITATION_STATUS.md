# Fix Invitation Status Issue

## Problem
Invitation status is not updating when members are approved or paid. Status remains "sent" even after member registration, payment, and approval.

## Solution

### Step 1: Debug the Issue
First, check what's in the database for the specific member:

**In browser console or via API call:**
```javascript
// Check invitation status for member
fetch('/api/invitations-debug.php?email=pcout@online.fr', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data));
```

Or access directly in browser (as admin):
```
https://www.elektr-ame.com/api/invitations-debug.php?email=pcout@online.fr
```

### Step 2: Fix the Link
Use the fix-link endpoint to manually link the invitation to the member and update status:

**In browser console or via API call:**
```javascript
// Fix invitation link and update status
fetch('/api/invitations-fix-link.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'pcout@online.fr'
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

Or use curl:
```bash
curl -X POST https://www.elektr-ame.com/api/invitations-fix-link.php \
  -H "Content-Type: application/json" \
  -d '{"email":"pcout@online.fr"}' \
  --cookie "PHPSESSID=your_session_id"
```

### Step 3: Verify
After running the fix, check the invitation status again:
- Member portal → Sponsorship tab
- Admin portal → Invitations tab

The status should now reflect:
- "registered" if member registered
- "payed" if member paid
- "approved" if member approved

## Root Cause
The invitation wasn't properly linked during registration because:
1. Member didn't use the invitation token link
2. Email matching failed (case sensitivity or whitespace)
3. `invitee_member_id` was never set

## Prevention
The updated code now:
- Uses `LOWER(TRIM(invitee_email))` for better email matching
- Tries multiple matching methods (member_id, email, inviter_id + email)
- Automatically links invitations during status updates

