# OzLotto / MegaDraw & CouponVault Integration Ecosystem
## Strategic Client Proposal, Integration Architecture & Project Roadmap

---

## 1. Executive Summary

This proposal outlines the strategic vision, technical architecture, and implementation roadmap for integrating the **OzLotto / MegaDraw Gaming Platform** with the **CouponVault Merchant Voucher System**. 

By unifying online lottery gameplay with a dynamic merchant coupon ecosystem, businesses can drive user acquisition, enable instant digital voucher redemptions for lottery balance/coins, and allow merchants to run promotional marketing campaigns backed by real-world lottery rewards.

---

## 2. Platform Architecture Overview

### A. OzLotto / MegaDraw Gaming Platform
- **Core Gaming Engine:** Supports 8+ global lottery formats including *Powerball, MegaDraw, Saturday Lotto, Set for Life, Lucky Lotteries, Lotto Strike, and Super 66*.
- **Automated Draw Execution:** Cron-scheduled draw engine, prize tier division processing, and instant win notification system.
- **Ticket & Syndicate System:** Handles single ticket entries, Quick Picks, System Entries, and multi-share Syndicates.
- **Security & Compliance:** Fastify-JWT authentication, Argon2 password hashing, 2FA, rate limiting, and complete KYC identity verification workflows.

### B. CouponVault Merchant Platform
- **Merchant Management Portal:** Dashboard allowing merchants to create, issue, and manage promotional vouchers, gift cards, and discount codes.
- **Payment Gateway Integration:** Direct payment checkout via **Razorpay** and **Stripe** for acquiring gift vouchers.
- **Single-Use Token Verification:** Encrypted token lifecycle management preventing double-redemption or fraudulent reuse.
- **Granular Security:** Supabase backend with Row-Level Security (RLS) policies and admin function controls.

---

## 3. Integrated User Journey & Data Flow

```
+------------------------+          +------------------------+          +-------------------------+
|      CouponVault       |          |  API Handshake Server  |          |   OzLotto Platform      |
| (Merchant / Payment)   |          |  (Single-Use Validation) |          | (Wallet & Lottery App)  |
+-----------+------------+          +-----------+------------+          +------------+------------+
            |                                   |                                    |
  1. User buys / receives                       |                                    |
     Coupon (e.g. FREE50)                       |                                    |
            |                                   |                                    |
            +-----------------------------------|----------------------------------->| 2. User submits Code
                                                |                                       in Deposit Page
                                                |<-----------------------------------+
                                                | 3. Verify Code & Expiry
                                                |
                                                | 4. Invalidate Token & Return Amount
                                                +----------------------------------->|
                                                                                     | 5. Credit Wallet Balance
                                                                                     | 6. User plays Lottery!
```

1. **Voucher Acquisition:** A user buys or receives a promotional voucher (e.g., `FREE50`, `LOTTO100`) via CouponVault or merchant marketing campaigns.
2. **Redemption Request:** The user navigates to the Lottery Platform Deposit Page and inputs their coupon code.
3. **Secure Handshake:** The Fastify backend executes an authenticated API request to the CouponVault service to validate the voucher's status, balance, and expiration date.
4. **Token Burn & Credit:** Once verified, CouponVault marks the voucher as `REDEEMED`, and the Lottery Platform instantly credits the equivalent balance/coins to the user's wallet.
5. **Gameplay:** The user selects their lottery numbers or quick picks and enters upcoming draws.

---

## 4. Technical Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Lottery Backend** | Fastify (Node.js), TypeScript, Prisma ORM | API endpoints, draw scheduler, JWT auth |
| **Database & Cache** | PostgreSQL 16, Redis 7 | Relational storage, rate limiting, session store |
| **Coupon Backend** | Supabase, Node serverless functions | Merchant dashboard, RLS policies, Razorpay functions |
| **Payment Gateways**| Razorpay, Stripe, Bank Transfer | Fiat payment processing for coupons & deposits |
| **Frontend** | React 18, Vite, Zustand, TanStack Query | Responsive UI for lottery players & merchants |
| **Infrastructure** | Docker Compose, Render, Netlify / Vite | Containerized local dev & production hosting |

---

## 5. Project Implementation Roadmap

```
+-----------------------------------------------------------------------------------+
| Phase 1: Foundation & DB Sync (Weeks 1 - 3)                                       |
| - Finalize API contracts, JWT / Supabase auth links, and database schemas.       |
+-----------------------------------------------------------------------------------+
                                      │
                                      ▼
+-----------------------------------------------------------------------------------+
| Phase 2: Payment Gateway & Coupon API Engine (Weeks 4 - 6)                        |
| - Implement Razorpay webhooks, token burn logic, and Fastify wallet handlers.      |
+-----------------------------------------------------------------------------------+
                                      │
                                      ▼
+-----------------------------------------------------------------------------------+
| Phase 3: Frontend Integration & UX Polish (Weeks 7 - 9)                           |
| - Build Redemption UI in Lottery App, Merchant analytics, and real-time alerts.    |
+-----------------------------------------------------------------------------------+
                                      │
                                      ▼
+-----------------------------------------------------------------------------------+
| Phase 4: QA, Security Audit & Production Launch (Weeks 10 - 12)                    |
| - Load testing, penetration testing, Render/Docker deployment, client handover.   |
+-----------------------------------------------------------------------------------+
```

---

## 6. PDF Artifact Location

The formatted presentation document has been compiled and saved to:
`c:\Users\hi\Documents\lotto coupon integration\lottery-platform\Lottery_Coupon_Integration_Client_Roadmap.pdf`
