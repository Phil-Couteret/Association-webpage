# Stripe Payment Integration - Deployment Notes

**Date:** January 2025  
**Deployment Status:** ✅ Frontend and API Files Deployed

---

## ✅ What Was Deployed

### Frontend Files
- Payment configuration admin interface (`PaymentConfigManager.tsx`)
- Updated Admin portal with Payment tab
- All frontend assets built and deployed

### Backend API Files
- `api/classes/StripePayment.php` - Stripe payment handler class
- `api/payment-config-list.php` - List payment configurations
- `api/payment-config-create.php` - Create payment gateway config
- `api/payment-config-update.php` - Update payment gateway config
- `api/payment/create-checkout.php` - Create Stripe checkout session
- `api/payment/confirm-payment.php` - Confirm payment after redirect
- `api/payment/webhook-stripe.php` - Handle Stripe webhook events
- `api/add-payment-confirmation-template.php` - Add email template script
- `api/payment-history.php` - Updated to use transactions table

---

## ⚠️ Post-Deployment Steps Required

### 1. Database Setup (Run on Server)

**Option A: Via SSH/Command Line**
```bash
# SSH into server, then:
cd /www
php database/setup-payment-tables.php
php api/add-payment-confirmation-template.php
```

**Option B: Via phpMyAdmin**
- Run SQL files manually:
  - `database/create-payment-transactions-table.sql`
  - `database/create-payment-webhooks-table.sql`
  - `database/create-payment-config-table.sql`
  - `database/add-payment-confirmation-template.sql`

### 2. Configure Stripe in Admin Portal

1. Log in to Admin Portal: https://www.elektr-ame.com/admin
2. Go to "Payment" tab
3. Click "Add Gateway"
4. Enter:
   - **Gateway:** `stripe`
   - **Public Key:** `pk_test_...` (Your Stripe publishable test key)
   - **Secret Key:** `sk_test_...` (Your Stripe secret test key)
   - **Webhook Secret:** (Get from Stripe Dashboard after setting up webhook)
   - **Active:** Enable when ready

### 3. Set Up Stripe Webhook

1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to: Developers → Webhooks
3. Click "Add endpoint"
4. Enter endpoint URL: `https://www.elektr-ame.com/api/payment/webhook-stripe.php`
5. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
6. Click "Add endpoint"
7. Copy the "Signing secret" (starts with `whsec_`)
8. Go back to Admin Portal → Payment tab
9. Edit Stripe configuration
10. Paste webhook secret
11. Save

---

## 🧪 Testing Checklist

After completing setup:

- [ ] Database tables created (`payment_transactions`, `payment_webhooks`, `payment_config`)
- [ ] Payment confirmation email template added
- [ ] Stripe API keys configured in admin portal
- [ ] Stripe webhook endpoint configured
- [ ] Webhook secret added to payment config
- [ ] Test payment flow (use Stripe test card: 4242 4242 4242 4242)
- [ ] Verify payment updates member status
- [ ] Verify emails are sent (confirmation, welcome, tax receipt)
- [ ] Verify webhook events are processed

---

## 📋 Stripe Test Cards

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**3D Secure Required:**
- Card: `4000 0025 0000 3155`

---

## 🔄 Rollback Instructions

If issues occur:

1. **Disable Stripe in Admin Portal:**
   - Admin Portal → Payment tab
   - Edit Stripe configuration
   - Set "Active" to false
   - Save

2. **Remove API Files (if needed):**
   ```bash
   # Via SSH or FTP, delete:
   - api/classes/StripePayment.php
   - api/payment-config-*.php
   - api/payment/*.php
   ```

3. **Database tables can remain** (they won't affect existing functionality)

---

## 📝 Notes

- All API keys are stored securely in database (not in code)
- Webhook endpoint is public but secured via signature verification
- Payment transactions are logged for audit trail
- Email automation triggers on successful payments
- Tax receipts automatically sent for sponsor memberships (>€40)

---

**Deployment Complete!** ✅

Next: Complete post-deployment steps above, then proceed with Phase 3 (Frontend components).

