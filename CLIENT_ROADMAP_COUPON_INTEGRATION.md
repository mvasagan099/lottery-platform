# OzLotto / MegaDraw & CouponVault Integration Ecosystem
## Detailed User Flow, Admin Flow & Strategic Client Proposal

---

## 1. Executive Summary

This proposal outlines the strategic vision, technical architecture, user flows, and administrative workflows for integrating the **OzLotto / MegaDraw Gaming Platform** with the **CouponVault Merchant Voucher System**. 

By unifying online lottery gameplay with a dynamic merchant coupon ecosystem, businesses can drive user acquisition, enable instant digital voucher redemptions for lottery balance/coins, and allow merchants to run promotional marketing campaigns backed by real-world lottery rewards.

---

## 2. User Flow (Customer Experience)

The user flow covers the end-to-end journey from acquiring a coupon to playing lottery games and withdrawing winnings:

```text
[Step 1: Buy Voucher] ──> [Step 2: Login to Lottery] ──> [Step 3: Enter Code] ──> [Step 4: API Validation] ──> [Step 5: Play & Win]
 (CouponVault Portal)       (MegaDraw Deposit Page)       (Redeem Coupon)        (Wallet Credited)         (Draws & Payouts)
```

### Phase A: Voucher Acquisition (CouponVault Platform)
1. **Browse Vouchers:** Customer visits the Merchant / Coupon Portal (CouponVault).
2. **Select Gift Card:** User picks a gift voucher or promotional code (e.g. $10, $50, $100 lottery coupon).
3. **Payment Processing:** User completes checkout via **Razorpay** or **Stripe** (or redeems merchant loyalty points).
4. **Code Generation:** The system issues a unique, single-use encrypted coupon code (e.g., `OZ-982F-77A1`) with a QR code and expiry date.

### Phase B: Wallet Deposit & Redemption (OzLotto Platform)
1. **Account Login:** User logs into the OzLotto Gaming Platform (with 2FA / KYC verification).
2. **Redeem Coupon:** User navigates to `Wallet` -> `Add Funds / Redeem Coupon`.
3. **Code Input:** User enters the coupon code `OZ-982F-77A1`.
4. **Backend Validation:** The Fastify backend executes an authenticated API handshake with CouponVault to verify the code's validity, amount, and expiry.
5. **Wallet Credited:** CouponVault marks the token as `REDEEMED`, and the user's lottery wallet is instantly credited with Coins/USD.

### Phase C: Gameplay & Prize Payouts (OzLotto Platform)
1. **Select Game:** User selects from 8+ games (*Powerball, MegaDraw, Saturday Lotto, Set for Life, etc.*).
2. **Choose Numbers:** User picks numbers manually, uses **Quick Pick**, or joins a **Syndicate** group.
3. **Ticket Generation:** Wallet balance is deducted, and a digital ticket with a unique QR code is generated.
4. **Draw Execution & Winning:** Automated cron jobs execute the draw, calculate division prizes, and credit winnings directly back to the user's wallet.
5. **Bank Withdrawal:** User requests withdrawal to their bank account (subject to approved KYC verification).

---

## 3. Admin & Merchant Flow (Operational Governance)

```text
+------------------------------------+          +------------------------------------+
|    CouponVault Merchant Admin      |          |     MegaDraw Gaming Admin          |
+------------------------------------+          +------------------------------------+
| 1. Onboard Merchants & Issue Keys  |          | 1. Configure Games & Cron Schedules|
| 2. Create Promo Campaigns & Batches|          | 2. Perform KYC & Document Review   |
| 3. Track Sales & Redemption Analytics|       | 3. Approve Bank Withdrawals        |
| 4. Export Payout Settlement Reports |          | 4. Manage RBAC Roles & Audit Logs  |
+------------------------------------+          +------------------------------------+
```

### Phase A: Merchant & Coupon Management (CouponVault Admin Portal)
1. **Merchant Onboarding:** Super Admin creates merchant accounts and generates secure API keys (`COUPON_API_KEY`) for system communication.
2. **Campaign Setup:** Merchants create promotional voucher batches, specifying face value, usage limits, expiration rules, and bonus percentages.
3. **Real-time Analytics:** Merchants track voucher metrics:
   - Total vouchers issued vs. purchased.
   - Redemption rate & active vs. expired status.
   - Total revenue collected via Razorpay/Stripe.
4. **Financial Settlement:** System generates financial reports for merchant payout reconciliation.

### Phase B: Platform & Gaming Governance (MegaDraw Admin Portal)
1. **Game & Draw Control:** Admin configures draw schedules (cron expressions), ticket prices, jackpot amounts, and division prize allocation.
2. **Manual Verification & Override:** Admins can review draw numbers, trigger manual payouts, or suspend draws if required.
3. **KYC & Compliance:** Compliance officers inspect uploaded identity documents (Passports / Driver Licenses) and approve/reject withdrawal permissions.
4. **RBAC & Security Audit:** Super Admin manages user roles (`SUPER_ADMIN`, `ADMIN`, `SUPPORT`, `AFFILIATE_MANAGER`) and reviews system audit logs.
5. **Support & Affiliate Operations:** Support staff respond to customer tickets; Affiliate managers audit referral signups and commissions.

---

## 4. Technical Architecture Overview

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Lottery Backend** | Fastify (Node.js), TypeScript, Prisma ORM | API endpoints, draw scheduler, JWT auth |
| **Database & Cache** | PostgreSQL 16, Redis 7 | Relational storage, rate limiting, session store |
| **Coupon Backend** | Supabase, Node serverless functions | Merchant dashboard, RLS policies, Razorpay functions |
| **Payment Gateways**| Razorpay, Stripe, Bank Transfer | Fiat payment processing for coupons & deposits |
| **Frontend** | React 18, Vite, Zustand, TanStack Query | Responsive UI for lottery players & merchants |
| **Infrastructure** | Docker Compose, Render, Netlify / Vite | Containerized local dev & production hosting |

---

## 5. Implementation Roadmap (12 Weeks)

- **Weeks 1–3: Architecture & DB Synchronization** — Shared API schemas, JWT & Supabase auth linking, database migrations.
- **Weeks 4–6: Payment Gateway & Coupon Engine** — Razorpay webhooks, single-use token verification, Fastify wallet handlers.
- **Weeks 7–9: Frontend Integration & UX Polish** — Redemption UI in Lottery App, merchant analytics dashboard, real-time alerts.
- **Weeks 10–12: QA, Security Audit & Production Launch** — Load testing, Redis rate-limiting, penetration testing, Render/Docker deployment, and final client handover.

---

## 6. Generated PDF Location

The presentation PDF document has been updated and compiled at:
`c:\Users\hi\Documents\lotto coupon integration\lottery-platform\Lottery_Coupon_Integration_Client_Roadmap.pdf`
