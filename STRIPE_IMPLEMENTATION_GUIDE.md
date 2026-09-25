# Stripe Payment Integration - Implementation Guide

**Status:** Ready to Implement  
**Date:** January 2025

---

## 📋 Overview

This guide outlines everything needed to implement Stripe payment processing for membership fees on the Elektr-Âme website.

---

## ✅ Prerequisites

### 1. Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Complete business verification (required for EU/Spain)
- [ ] Get API keys:
  - **Test Mode Keys** (for development)
  - **Live Mode Keys** (for production)
- [ ] Set up webhook endpoint in Stripe Dashboard

### 2. Required Information
- Business name: **Elektr-Âme**
- Business type: **Association/Non-profit**
- Tax ID: **G248088495** (NIF)
- Bank account details (already have)
- Business address

---

## 📦 Dependencies to Install

### Frontend (React/TypeScript)
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Backend (PHP)
Stripe PHP SDK is not required - we'll use Stripe's REST API directly via `curl` or `file_get_contents()` with PHP's built-in functions.

**Alternative:** If you prefer using the official SDK:
```bash
composer require stripe/stripe-php
```

---

## 🗄️ Database Changes

### 1. Create Payment Transactions Table
**File:** `database/create-payment-transactions-table.sql`

```sql
CREATE TABLE payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    payment_gateway ENUM('stripe', 'paypal', 'redsys', 'bank_transfer') NOT NULL DEFAULT 'stripe',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    membership_type ENUM('free', 'basic', 'sponsor', 'lifetime') NOT NULL,
    membership_start_date DATE NULL,
    membership_end_date DATE NULL,
    payment_method VARCHAR(50) NULL,
    gateway_response TEXT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Create Payment Webhooks Table
**File:** `database/create-payment-webhooks-table.sql`

```sql
CREATE TABLE payment_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    payload TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gateway (gateway),
    INDEX idx_event_id (event_id),
    INDEX idx_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Create Payment Configuration Table
**File:** `database/create-payment-config-table.sql`

```sql
CREATE TABLE payment_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway VARCHAR(50) NOT NULL UNIQUE DEFAULT 'stripe',
    is_active BOOLEAN DEFAULT FALSE,
    api_key_public VARCHAR(255) NULL,
    api_key_secret VARCHAR(255) NULL,
    webhook_secret VARCHAR(255) NULL,
    config_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Stripe config (inactive)
INSERT INTO payment_config (gateway, is_active) VALUES ('stripe', FALSE);
```

---

## 🔧 Backend API Endpoints

### 1. Create Checkout Session
**File:** `api/payment/create-checkout.php`

**Purpose:** Creates a Stripe Checkout Session and returns the session ID

**Input:**
- `membership_type`: 'basic' | 'sponsor' | 'lifetime'
- `amount`: Decimal (optional for sponsor, required for lifetime)
- `member_id`: Current logged-in member

**Output:**
- `session_id`: Stripe Checkout Session ID
- `checkout_url`: URL to redirect user to Stripe Checkout

**Key Features:**
- Calculate membership end date (1 year from now for basic/sponsor)
- Create Stripe Checkout Session with line items
- Store pending transaction in database
- Set success/cancel URLs

### 2. Payment Confirmation
**File:** `api/payment/confirm-payment.php`

**Purpose:** Confirms payment after Stripe redirect

**Input:**
- `session_id`: Stripe Checkout Session ID

**Output:**
- Payment status
- Updated member information

**Key Features:**
- Verify payment with Stripe
- Update member payment status
- Update membership dates
- Trigger email automation
- Generate tax receipt for sponsors

### 3. Webhook Handler
**File:** `api/payment/webhook-stripe.php`

**Purpose:** Handles Stripe webhook events

**Key Features:**
- Verify webhook signature
- Handle events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- Update transaction status
- Update member status
- Log all webhook events

### 4. Payment History (Already Exists)
**File:** `api/payment-history.php`

**Update:** Modify to query `payment_transactions` table instead of `members` table

### 5. Refund Endpoint (Admin Only)
**File:** `api/payment/refund.php`

**Purpose:** Process refunds through Stripe

**Key Features:**
- Verify admin authentication
- Process refund via Stripe API
- Update transaction status
- Update member status if needed

---

## 🎨 Frontend Components

### 1. Payment Checkout Component
**File:** `src/components/payment/PaymentCheckout.tsx`

**Features:**
- Display membership type and amount
- Show membership period (start/end dates)
- "Pay with Stripe" button
- Loading states
- Error handling

**Integration:**
- Uses `@stripe/react-stripe-js` for Stripe Elements (optional)
- Or redirects to Stripe Checkout (simpler, recommended)

### 2. Payment Success Page
**File:** `src/pages/PaymentSuccess.tsx`

**Features:**
- Display success message
- Show payment details
- Link to member portal
- Download receipt option

### 3. Payment Failure Page
**File:** `src/pages/PaymentFailure.tsx`

**Features:**
- Display error message
- Retry payment button
- Contact support link

### 4. Membership Renewal Component
**File:** `src/components/payment/MembershipRenewal.tsx`

**Features:**
- Pre-fill membership type
- Show current membership end date
- Calculate renewal amount
- Payment button

### 5. Update Payment History Component
**File:** `src/components/portal/PaymentHistory.tsx`

**Update:** Already exists, just needs to work with new `payment_transactions` table

---

## 🔐 Security Considerations

### 1. API Key Storage
- Store Stripe secret keys in `payment_config` table
- Encrypt secret keys in database (use PHP's `openssl_encrypt`)
- Never expose secret keys to frontend
- Use environment variables for sensitive data (if possible)

### 2. Webhook Security
- Verify webhook signatures using Stripe's webhook secret
- Always validate webhook events
- Idempotency: Check if event already processed

### 3. Payment Validation
- Always verify payment status server-side
- Never trust client-side payment status
- Use Stripe's API to confirm payments

### 4. Rate Limiting
- Implement rate limiting on payment endpoints
- Prevent payment spam/abuse

---

## 📝 Configuration

### Stripe Checkout Configuration

**Success URL:** `https://www.elektr-ame.com/payment-success?session_id={CHECKOUT_SESSION_ID}`

**Cancel URL:** `https://www.elektr-ame.com/payment-cancelled`

**Webhook URL:** `https://www.elektr-ame.com/api/payment/webhook-stripe.php`

**Webhook Events to Subscribe:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## 🧪 Testing

### Stripe Test Cards

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**3D Secure Required:**
- Card: `4000 0025 0000 3155`

### Test Scenarios
1. ✅ Successful basic membership payment (€40)
2. ✅ Successful sponsor payment (€100)
3. ✅ Successful lifetime payment (€500)
4. ✅ Payment failure handling
5. ✅ Webhook processing
6. ✅ Email automation triggers
7. ✅ Tax receipt generation for sponsors
8. ✅ Membership date updates
9. ✅ Payment history display
10. ✅ Refund process (admin)

---

## 🚀 Implementation Steps

### Phase 1: Setup (1-2 days)
1. Create Stripe account
2. Get API keys (test mode)
3. Create database tables
4. Add payment config admin interface

### Phase 2: Backend (3-5 days)
1. Create `create-checkout.php`
2. Create `confirm-payment.php`
3. Create `webhook-stripe.php`
4. Update `payment-history.php`
5. Create `refund.php` (admin)
6. Test all endpoints

### Phase 3: Frontend (3-4 days)
1. Create `PaymentCheckout.tsx`
2. Create `PaymentSuccess.tsx`
3. Create `PaymentFailure.tsx`
4. Create `MembershipRenewal.tsx`
5. Update `PaymentHistory.tsx`
6. Add payment buttons to member portal
7. Add routes to `App.tsx`

### Phase 4: Integration (2-3 days)
1. Connect frontend to backend
2. Test full payment flow
3. Test webhook processing
4. Test email automation
5. Test tax receipt generation

### Phase 5: Testing & Deployment (2-3 days)
1. Test with Stripe test cards
2. Test all scenarios
3. Configure production API keys
4. Set up production webhooks
5. Deploy to production
6. Monitor and verify

**Total Estimated Time:** ~2-3 weeks

---

## 💰 Membership Pricing

- **Basic:** €40/year
- **Sponsor:** >€40/year (user-defined amount)
- **Lifetime:** TBD (one-time payment)

---

## 📧 Email Automation Integration

When payment is successful:
1. Send welcome email (if first payment)
2. Send payment confirmation email
3. Send tax receipt email (if sponsor and amount >€40)
4. Update membership status in database

**Templates to use:**
- `member_welcome` - First payment
- `payment_confirmation` - Payment receipt (to be created)
- `sponsor_tax_receipt` - Tax deduction receipt (already exists)

---

## 🔄 Payment Flow

1. **User clicks "Pay Membership"**
   - Frontend calls `api/payment/create-checkout.php`
   - Backend creates Stripe Checkout Session
   - Backend stores pending transaction
   - Frontend redirects to Stripe Checkout

2. **User completes payment on Stripe**
   - Stripe processes payment
   - Stripe redirects to success/cancel URL

3. **Payment Success**
   - User lands on `/payment-success`
   - Frontend calls `api/payment/confirm-payment.php`
   - Backend verifies payment with Stripe
   - Backend updates member status
   - Backend triggers email automation

4. **Webhook Processing (Async)**
   - Stripe sends webhook to `api/payment/webhook-stripe.php`
   - Backend verifies webhook signature
   - Backend updates transaction status
   - Backend ensures member status is correct

---

## 📚 Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Checkout:** https://stripe.com/docs/payments/checkout
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Stripe PHP SDK:** https://github.com/stripe/stripe-php
- **Stripe React SDK:** https://github.com/stripe/react-stripe-js

---

## ⚠️ Important Notes

1. **Never store credit card numbers** - Stripe handles all card data
2. **Always verify payments server-side** - Never trust client-side status
3. **Use HTTPS** - Required for all payment endpoints
4. **Test thoroughly** - Use Stripe test mode before going live
5. **Monitor webhooks** - Check Stripe Dashboard for webhook delivery
6. **Handle failures gracefully** - Show clear error messages to users
7. **Keep audit trail** - Log all payment attempts and webhook events

---

## 🎯 Next Steps

1. Review this guide
2. Create Stripe account
3. Get API keys
4. Start with Phase 1 (Database setup)
5. Proceed with backend implementation
6. Then frontend implementation
7. Test thoroughly
8. Deploy to production

---

**Ready to start?** Let me know when you have your Stripe account set up and API keys ready, and I can begin implementing the backend endpoints!

