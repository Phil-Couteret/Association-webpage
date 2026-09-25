# Future Features Roadmap

**Last Updated:** January 2025  
**Status:** Planning Phase

---

## 🎯 Overview

This document outlines the planned enhancements for the Elektr-Âme website, focusing on two major features:
1. **Online Membership Payment Integration**
2. **PrestaShop E-commerce Integration for Merchandising**

---

## 💳 Feature 1: Online Membership Payment Integration

### Current State
- ✅ Membership management system in place (free, basic €40/year, sponsor >€40/year, lifetime)
- ✅ Payment tracking fields in database (`payment_status`, `payment_amount`, `last_payment_date`)
- ✅ Admin interface for manual payment recording
- ✅ Tax receipt generation for sponsors
- ❌ **No online payment gateway integration**

### Goals
- Enable members to pay membership fees directly on the website
- Support multiple payment methods (credit card, PayPal, bank transfer)
- Automatically update membership status upon successful payment
- Send automated confirmation emails and tax receipts
- Handle payment failures and retries gracefully

### Technical Requirements

#### Payment Gateway Options
**Option A: Stripe** (Recommended)
- **Pros:**
  - Excellent EU/Spain support
  - Strong security (PCI DSS Level 1)
  - Supports SEPA Direct Debit for recurring payments
  - Good documentation and developer experience
  - Supports tax calculation and receipts
- **Cons:**
  - Transaction fees (~1.4% + €0.25 per transaction in EU)
  - Requires Stripe account setup

**Option B: PayPal**
- **Pros:**
  - Widely recognized and trusted
  - Easy integration
  - Supports recurring payments
- **Cons:**
  - Higher fees (~3.4% + fixed fee)
  - Less flexible for EU tax requirements
  - User experience can be fragmented

**Option C: RedSys (Spanish Payment Gateway)**
- **Pros:**
  - Native Spanish payment system
  - Lower fees for Spanish cards
  - Good for Spanish associations
- **Cons:**
  - More complex integration
  - Less international support
  - Requires Spanish business registration

**Recommendation:** **Stripe** for best balance of features, security, and EU compliance.

#### Database Changes Required

```sql
-- Add payment transaction tracking
CREATE TABLE payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe/PayPal transaction ID
    payment_gateway ENUM('stripe', 'paypal', 'redsys', 'bank_transfer') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    membership_type ENUM('free', 'basic', 'sponsor', 'lifetime') NOT NULL,
    membership_start_date DATE NULL,
    membership_end_date DATE NULL,
    payment_method VARCHAR(50) NULL, -- card, sepa_direct_debit, paypal, etc.
    gateway_response TEXT NULL, -- Store full gateway response for debugging
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add webhook tracking for payment gateway callbacks
CREATE TABLE payment_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway VARCHAR(50) NOT NULL,
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

-- Add payment configuration table
CREATE TABLE payment_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT FALSE,
    api_key_public VARCHAR(255) NULL, -- Public/test keys
    api_key_secret VARCHAR(255) NULL, -- Secret keys (encrypted)
    webhook_secret VARCHAR(255) NULL, -- Webhook verification secret
    config_json TEXT NULL, -- Additional gateway-specific config
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### API Endpoints to Create

1. **`api/payment/create-checkout.php`**
   - Creates a payment session/checkout
   - Returns payment URL or checkout session ID
   - Handles different membership types and amounts

2. **`api/payment/confirm-payment.php`**
   - Confirms payment completion
   - Updates member status and membership dates
   - Triggers email automation

3. **`api/payment/webhook-stripe.php`** (or `webhook-paypal.php`)
   - Handles payment gateway webhooks
   - Processes payment status updates
   - Updates database accordingly

4. **`api/payment/payment-history.php`**
   - Returns payment history for a member
   - Used in member portal

5. **`api/payment/refund.php`** (Admin only)
   - Processes refunds through payment gateway
   - Updates membership status

#### Frontend Components to Create

1. **`src/components/payment/PaymentCheckout.tsx`**
   - Payment form/checkout interface
   - Integration with Stripe Elements or PayPal SDK
   - Handles payment flow

2. **`src/components/payment/PaymentHistory.tsx`**
   - Display payment history in member portal
   - Show invoices and receipts

3. **`src/components/payment/MembershipRenewal.tsx`**
   - Renewal flow for existing members
   - Pre-fills membership type and amount

4. **`src/pages/PaymentSuccess.tsx`** & **`src/pages/PaymentFailure.tsx`**
   - Success/failure pages after payment

#### Security Considerations

- ✅ Never store full credit card numbers
- ✅ Use HTTPS for all payment endpoints
- ✅ Implement webhook signature verification
- ✅ Encrypt sensitive API keys in database
- ✅ Implement rate limiting on payment endpoints
- ✅ Log all payment attempts for audit trail
- ✅ PCI DSS compliance (use Stripe/PayPal hosted forms)

#### Implementation Steps

1. **Phase 1: Setup & Configuration**
   - [ ] Create Stripe/PayPal account
   - [ ] Set up test and production API keys
   - [ ] Create database tables
   - [ ] Add payment configuration admin interface

2. **Phase 2: Backend Development**
   - [ ] Implement payment gateway SDK integration
   - [ ] Create payment checkout endpoint
   - [ ] Implement webhook handlers
   - [ ] Add payment confirmation logic
   - [ ] Create payment history endpoint

3. **Phase 3: Frontend Development**
   - [ ] Create payment checkout component
   - [ ] Integrate Stripe Elements or PayPal SDK
   - [ ] Add payment history to member portal
   - [ ] Create success/failure pages
   - [ ] Add payment button to membership pages

4. **Phase 4: Testing**
   - [ ] Test with Stripe test cards
   - [ ] Test webhook processing
   - [ ] Test email automation triggers
   - [ ] Test tax receipt generation
   - [ ] Test refund process

5. **Phase 5: Deployment**
   - [ ] Configure production API keys
   - [ ] Set up production webhooks
   - [ ] Deploy and monitor
   - [ ] Create admin documentation

### Estimated Timeline
- **Phase 1:** 1-2 days
- **Phase 2:** 3-5 days
- **Phase 3:** 3-4 days
- **Phase 4:** 2-3 days
- **Phase 5:** 1 day
- **Total:** ~2-3 weeks

---

## 🛒 Feature 2: PrestaShop E-commerce Integration for Merchandising

### Current State
- ✅ Website with artist profiles, events, galleries
- ✅ Membership management system
- ❌ **No e-commerce functionality**
- ❌ **No product catalog or shopping cart**

### Goals
- Sell Elektr-Âme branded merchandise (t-shirts, hoodies, vinyl records, etc.)
- Integrate PrestaShop store with main website
- Single sign-on between website and shop
- Unified member experience
- Track purchases linked to member accounts

### Technical Requirements

#### PrestaShop Setup Options

**Option A: Separate Subdomain** (Recommended)
- **Structure:** `shop.elektr-ame.com` (separate PrestaShop installation)
- **Pros:**
  - Clean separation of concerns
  - Easier maintenance and updates
  - PrestaShop can be updated independently
  - Better performance isolation
- **Cons:**
  - Requires subdomain setup
  - Need to handle SSO/cross-domain authentication

**Option B: Subdirectory Integration**
- **Structure:** `www.elektr-ame.com/shop/` (PrestaShop in subdirectory)
- **Pros:**
  - Single domain, simpler SSL setup
  - Easier cookie sharing for SSO
- **Cons:**
  - More complex routing configuration
  - Potential conflicts with React Router
  - Harder to update PrestaShop independently

**Recommendation:** **Option A (Subdomain)** for cleaner architecture.

#### Integration Architecture

```
┌─────────────────────────────────────┐
│   Main Website (React/TypeScript)   │
│   www.elektr-ame.com                │
│   - Member Portal                   │
│   - Events, Artists, Gallery       │
└──────────────┬──────────────────────┘
               │
               │ SSO / API Integration
               │
┌──────────────▼──────────────────────┐
│   PrestaShop Store                  │
│   shop.elektr-ame.com               │
│   - Product Catalog                 │
│   - Shopping Cart                   │
│   - Checkout                        │
│   - Order Management                │
└─────────────────────────────────────┘
```

#### Database Integration Strategy

**Option 1: Shared Database**
- PrestaShop uses same MySQL database
- Share `members` table for customer data
- Requires PrestaShop configuration to use existing customer table

**Option 2: API-Based Integration**
- PrestaShop has its own database
- Create API endpoints to sync member data
- PrestaShop module to authenticate via main site API

**Recommendation:** **Option 2 (API-Based)** for better separation and security.

#### PrestaShop Module Development

Create a custom PrestaShop module (`elektr-ame-integration`) that:

1. **Single Sign-On (SSO)**
   - Authenticates users via main website API
   - Creates/updates PrestaShop customer accounts
   - Syncs member status and discounts

2. **Member Discounts**
   - Applies member discounts automatically
   - Different discounts for basic/sponsor/lifetime members
   - Configurable discount rules

3. **Order Sync**
   - Sends order data back to main website
   - Links orders to member accounts
   - Updates member purchase history

4. **Branding**
   - Customizes PrestaShop theme to match main website
   - Uses Elektr-Âme logo and colors
   - Consistent navigation

#### API Endpoints to Create (Main Website)

1. **`api/shop/sso-token.php`**
   - Generates SSO token for authenticated members
   - Used by PrestaShop to verify authentication

2. **`api/shop/member-info.php`**
   - Returns member information for PrestaShop
   - Includes membership type and discount eligibility

3. **`api/shop/sync-order.php`**
   - Receives order data from PrestaShop
   - Updates member purchase history
   - Triggers email notifications

4. **`api/shop/discount-rules.php`**
   - Returns discount rules based on membership type
   - Used by PrestaShop to apply discounts

#### PrestaShop Module Structure

```
prestashop/modules/elektr-ame-integration/
├── elektr-ame-integration.php (Main module file)
├── config.xml
├── controllers/
│   ├── front/
│   │   └── sso.php (SSO authentication)
│   └── admin/
│       └── config.php (Module configuration)
├── views/
│   ├── templates/
│   │   ├── hook/
│   │   └── admin/
│   └── css/
│       └── elektr-ame.css
├── classes/
│   ├── ElektrAmeAuth.php
│   ├── ElektrAmeDiscount.php
│   └── ElektrAmeOrderSync.php
└── sql/
    └── install.sql
```

#### Frontend Integration (Main Website)

1. **Add "Shop" Navigation Link**
   - Link to `https://shop.elektr-ame.com`
   - Pass SSO token if member is logged in

2. **Member Portal Integration**
   - Show recent orders from PrestaShop
   - Display purchase history
   - Link to shop account

3. **Product Showcase**
   - Display featured products on main website
   - Link to PrestaShop product pages

#### Implementation Steps

1. **Phase 1: PrestaShop Setup**
   - [ ] Install PrestaShop on subdomain
   - [ ] Configure SSL certificate
   - [ ] Set up basic theme and branding
   - [ ] Configure payment methods (Stripe/PayPal)
   - [ ] Set up shipping methods

2. **Phase 2: Product Catalog**
   - [ ] Create product categories
   - [ ] Add initial products (t-shirts, hoodies, etc.)
   - [ ] Set up product images and descriptions
   - [ ] Configure inventory management

3. **Phase 3: SSO Module Development**
   - [ ] Develop PrestaShop SSO module
   - [ ] Create API endpoints on main website
   - [ ] Test authentication flow
   - [ ] Implement member discount logic

4. **Phase 4: Order Sync**
   - [ ] Implement order sync API
   - [ ] Create order history in member portal
   - [ ] Set up email notifications

5. **Phase 5: Frontend Integration**
   - [ ] Add shop navigation link
   - [ ] Create product showcase components
   - [ ] Integrate order history in member portal

6. **Phase 6: Testing & Launch**
   - [ ] Test complete purchase flow
   - [ ] Test SSO authentication
   - [ ] Test discount application
   - [ ] Test order sync
   - [ ] Launch and monitor

### Estimated Timeline
- **Phase 1:** 3-5 days
- **Phase 2:** 2-3 days
- **Phase 3:** 5-7 days
- **Phase 4:** 2-3 days
- **Phase 5:** 2-3 days
- **Phase 6:** 2-3 days
- **Total:** ~3-4 weeks

---

## 🔄 Integration Between Features

### Combined Workflow
1. Member joins website → Gets free membership
2. Member pays membership fee → Upgraded to basic/sponsor
3. Member gets discount code → Can use in PrestaShop store
4. Member purchases merchandise → Order synced to member account
5. Member can view all transactions (membership + purchases) in portal

### Shared Components
- Member authentication system (already exists)
- Email automation (already exists)
- Tax receipt generation (already exists, can extend for product purchases)

---

## 📋 Priority & Dependencies

### Recommended Order
1. **First:** Payment Integration (enables immediate revenue)
2. **Second:** PrestaShop Integration (builds on payment infrastructure)

### Dependencies
- Payment Integration: None (can start immediately)
- PrestaShop Integration: Benefits from payment integration (shared payment gateway)

---

## 💰 Cost Considerations

### Payment Gateway Fees
- **Stripe:** ~1.4% + €0.25 per transaction
- **PayPal:** ~3.4% + fixed fee per transaction
- **Bank Transfer:** Usually free, but manual processing required

### PrestaShop Costs
- **PrestaShop:** Free (open source)
- **Hosting:** Additional subdomain hosting (~€5-10/month)
- **SSL Certificate:** Usually included with hosting
- **Payment Gateway:** Same as above (shared)

### Development Costs
- Payment Integration: ~2-3 weeks development time
- PrestaShop Integration: ~3-4 weeks development time
- **Total:** ~5-7 weeks combined

---

## 📝 Notes & Considerations

### Legal/Compliance
- ✅ GDPR compliance for payment data
- ✅ PCI DSS compliance (via Stripe/PayPal)
- ✅ Spanish tax regulations (already handled for memberships)
- ✅ Consumer protection laws for e-commerce

### Maintenance
- Regular PrestaShop security updates
- Payment gateway API updates
- Monitor payment success rates
- Handle payment disputes/refunds

### Future Enhancements
- Recurring membership payments (Stripe subscriptions)
- Gift memberships
- Member referral program with shop discounts
- Limited edition products for members only
- Pre-order system for vinyl releases

---

## 🎯 Success Metrics

### Payment Integration
- % of members paying online vs. manual
- Payment success rate
- Average time from signup to payment
- Refund rate

### PrestaShop Integration
- Number of orders per month
- Average order value
- Member vs. non-member purchase ratio
- Conversion rate from website to shop

---

**Document Status:** Planning Phase  
**Next Steps:** Review and prioritize features, allocate resources, begin Phase 1 of Payment Integration

