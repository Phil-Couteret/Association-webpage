# Paycomet Integration Plan

This document outlines what's needed to add Paycomet as a payment option alongside Stripe.

---

## Current State

- **Stripe**: Fully integrated via `StripePayment` class, hosted checkout, webhooks
- **Payment flow**: `PaymentCheckout` → `create-checkout.php` → Stripe Checkout redirect → `confirm-payment.php` or webhook → member updated
- **Config**: `payment_config` table stores Stripe keys (api_key_public, api_key_secret, webhook_secret)
- **Paycomet**: Already referenced in terms, membership dialog (manual payment method), but no online checkout integration

---

## What We Need to Do

### 1. Database

- **payment_config**: Already supports multiple gateways. Add Paycomet row:
  ```sql
  INSERT INTO payment_config (gateway, is_active) VALUES ('paycomet', FALSE)
  ON DUPLICATE KEY UPDATE gateway = gateway;
  ```
- Paycomet typically needs: API key (or merchant code + terminal + password), JET ID for card tokenization
- May need to extend `config_json` for Paycomet-specific fields (merchant_code, terminal_id, jet_id, etc.)

### 2. Backend – PaycometPayment Class

Create `api/classes/PaycometPayment.php`:

- Load config from `payment_config WHERE gateway = 'paycomet'`
- **Create payment**: Paycomet REST API – create order/payment, get redirect URL or form URL
- **Handle callback**: Paycomet sends IPN (Instant Payment Notification) to a callback URL
- **Verify payment**: Query Paycomet API for order status
- Store transaction in `payment_transactions` with `payment_gateway = 'paycomet'`

**Paycomet API flow** (typical):
1. Create order via REST API → get `orderId` and redirect URL
2. User completes payment on Paycomet hosted page (or JET iframe)
3. Paycomet calls your callback URL with result
4. You verify, update member, send confirmation emails

### 3. API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `api/payment/create-checkout.php` | **Modify**: Add gateway param, branch to Stripe or Paycomet |
| `api/payment/create-paycomet.php` | **New**: Create Paycomet order, return redirect URL |
| `api/payment/callback-paycomet.php` | **New**: Handle Paycomet IPN/callback (no session) |
| `api/payment/confirm-payment.php` | **Modify**: Add Paycomet confirmation path if needed |

### 4. Frontend – PaymentCheckout

- Add **gateway selector**: "Pay with Stripe" / "Pay with Paycomet" (or card icons)
- If Stripe: keep current flow (redirect to Stripe Checkout)
- If Paycomet: call `create-paycomet.php` → redirect to Paycomet hosted page
- After Paycomet: redirect to success URL (similar to Stripe) – callback updates DB, user lands on success page

### 5. Admin – PaymentConfigManager

- Add Paycomet config section (or second card)
- Fields: merchant_code, terminal_id, API key/password, JET ID (if using JET), callback URL
- Toggle `is_active` for Paycomet

### 6. Post-Payment Flow (Shared)

- Both Stripe and Paycomet should:
  - Insert into `payment_transactions` with correct `payment_gateway`
  - Update `members` (membership_type, membership_end_date, payment_status, terms_accepted_at)
  - Trigger `EmailAutomation::sendPaymentRecordedEmails()` (tax receipt, confirmation)
  - Update `member_invitations` if applicable

### 7. Success / Cancel URLs

- **Stripe**: Uses `success_url` and `cancel_url` in checkout session
- **Paycomet**: Configure success/cancel URLs when creating order; callback URL for server-side confirmation

---

## Implementation Order

1. **Research Paycomet API** – Get API docs, test credentials, understand exact REST endpoints and callback format
2. **Database** – Add Paycomet to payment_config, extend config_json if needed
3. **PaycometPayment class** – Create order, verify callback, store transaction
4. **create-paycomet.php** – Create order, return redirect URL
5. **callback-paycomet.php** – Handle IPN, verify, update member, idempotency
6. **PaymentCheckout** – Gateway selector, branch to Stripe or Paycomet
7. **PaymentConfigManager** – Paycomet config UI
8. **Testing** – Paycomet sandbox, test cards, full flow

---

## Paycomet-Specific Notes

- **Docs**: https://docs.paycomet.com (REST API, JET iframe, SEPA)
- **Auth**: API KEY or merchant_code + terminal + password
- **Currency**: EUR
- **PSD2/SCA**: Paycomet handles 3DS
- **Callback**: Configure IPN URL in Paycomet panel; verify signature/hash if provided

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `database/add-paycomet-config.sql` | Create migration |
| `api/classes/PaycometPayment.php` | Create |
| `api/payment/create-paycomet.php` | Create |
| `api/payment/callback-paycomet.php` | Create |
| `api/payment/create-checkout.php` | Modify – gateway param |
| `src/components/payment/PaymentCheckout.tsx` | Modify – gateway selector |
| `src/components/admin/PaymentConfigManager.tsx` | Modify – Paycomet config |

---

## Implementation Status (Pre-Credentials)

The following is **ready** and awaits Paycomet API credentials/docs:

| Item | Status |
|------|--------|
| Database migration `add-paycomet-support.sql` | ✅ Done |
| `PaycometPayment` class skeleton | ✅ Done |
| `create-paycomet.php` | ✅ Done (throws until implemented) |
| `callback-paycomet.php` | ✅ Done (skeleton, logs incoming) |
| `create-checkout.php` gateway param | ✅ Done |
| `confirm-payment.php` Paycomet path | ✅ Done |
| `active-gateways.php` | ✅ Done |
| PaymentCheckout gateway selector | ✅ Done |
| PaymentSuccess order_id support | ✅ Done |
| PaymentConfigManager Paycomet hints | ✅ Done |

**Remaining (after credentials):**
- Implement `PaycometPayment::createPaymentOrder()` – call Paycomet REST API
- Implement `PaycometPayment::processCallback()` – verify IPN, update member
- Configure success URL in order: `https://www.elektr-ame.com/payment-success?order_id={ORDER_ID}&gateway=paycomet`
- Configure IPN/callback URL in Paycomet panel: `https://www.elektr-ame.com/api/payment/callback-paycomet.php`
- Run migration: `database/add-paycomet-support.sql`

---

## Next Step

**Get Paycomet API credentials and documentation** – Merchant account, API keys, and the exact REST API spec for "create order" and "IPN callback" format. Once you have those, we can implement the `PaycometPayment` class and endpoints.
