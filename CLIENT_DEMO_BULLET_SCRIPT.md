# 📋 Client Presentation & Live Demo Script (Bullet-Point Edition)

> [!TIP]
> **Demo Objective:** Present a seamless, step-by-step walkthrough of how CouponVault and OzLotto / MegaDraw operate together. Focus on ease-of-use for customers and complete control for admins/merchants.

---

## 🖥️ Pre-Call Tab Setup

* **Tab 1:** `http://localhost:5174` — **CouponVault Portal** (Merchant & Voucher Store)
* **Tab 2:** `http://localhost:5173` — **OzLotto Platform** (User Portal & Games)
* **Tab 3:** `http://localhost:5173/wallet/deposit` — **Deposit & Redeem Page**
* **Tab 4:** `http://localhost:5173/admin` — **MegaDraw Admin Dashboard**

---

## 👤 SECTION 1: Customer Journey (User Flow)

### 📍 Step 1: Voucher Acquisition (CouponVault)
* **Screen:** Tab 1 (`http://localhost:5174`)
* **On-Screen Action:**
  * Scroll through available gift vouchers ($10, $50, $100).
  * Hover over Razorpay / Stripe payment checkout buttons.
* **Talking Points:**
  * **Unified Ecosystem:** Merchants sell digital gift vouchers directly to customers or retail partners.
  * **Flexible Checkout:** Built-in integration with Razorpay and credit card gateways.
  * **Instant Code Generation:** Upon purchase, a unique encrypted code (e.g. `FREE50`) is generated along with a QR code.
* **Technical Highlight:** Single-use security token with expiration timestamps to prevent fraud.

---

### 📍 Step 2: Code Redemption & Wallet Credit (OzLotto Platform)
* **Screen:** Tab 3 (`http://localhost:5173/wallet/deposit`)
* **On-Screen Action:**
  * Type promo code `FREE50` into the "Redeem Coupon" box.
  * Click **Redeem Code**.
  * Point to the instant wallet balance increment in the top navbar.
* **Talking Points:**
  * **Zero Friction:** Users convert vouchers into lottery wallet balance without re-entering credit card details.
  * **Instant Update:** Wallet balance updates in real-time on successful API verification.
  * **Automatic Lock:** Redeemed coupon codes are locked immediately to prevent double spending.
* **Technical Highlight:** Fastify backend executes an authenticated API handshake with CouponVault in <100ms.

---

### 📍 Step 3: Game Selection & Ticket Purchase
* **Screen:** Tab 2 (`http://localhost:5173`)
* **On-Screen Action:**
  * Click **Games** ➔ Select **Powerball** or **MegaDraw**.
  * Click **Quick Pick** (or select numbers manually).
  * Click **Buy Ticket** button.
* **Talking Points:**
  * **8+ Game Formats:** Supports Powerball, MegaDraw, Saturday Lotto, Set for Life, etc.
  * **Flexible Play Styles:** Choose manual numbers, auto-generated Quick Picks, or multi-user Syndicates.
  * **Instant Receipt:** Generates a digital ticket backed by a unique QR code and serial number.
* **Technical Highlight:** Wallet balance is atomically updated via database transactions.

---

### 📍 Step 4: Draw Execution & Automated Winning Payouts
* **Screen:** Tab 2 (`My Tickets` section)
* **Talking Points:**
  * **Automated Cron Draws:** Scheduled background jobs pick winning numbers according to official schedules.
  * **Prize Tier Calculation:** Automatic matching across all 7+ prize divisions.
  * **Instant Credit:** Winnings credit directly back to the user's wallet with email and push notifications.

---

## 👑 SECTION 2: Operational Control (Admin & Merchant Flow)

### 📍 Step 5: Merchant Campaign Management (CouponVault)
* **Screen:** Tab 1 (Merchant Dashboard area)
* **On-Screen Action:**
  * Show campaign creation form (Face value, usage limits, expiration rules).
  * Show real-time voucher sales & redemption chart.
* **Talking Points:**
  * **Campaign Creation:** Merchants define voucher face values, total batch quantities, and promo bonuses.
  * **Real-time Analytics:** Track issued vs. redeemed vouchers in real time.
  * **Financial Settlement:** Export automated settlement reports for monthly accounting.

---

### 📍 Step 6: Platform Governance & Compliance (MegaDraw Admin)
* **Screen:** Tab 4 (`http://localhost:5173/admin`)
* **On-Screen Action:**
  * Click **Games & Draws** tab (show draw schedule editor & jackpot controls).
  * Click **KYC Approvals** tab (show document review UI).
  * Click **RBAC Roles** tab (show Super Admin vs. Support Agent permissions).
* **Talking Points:**
  * **Game Control:** Customize cron draw schedules, ticket prices, and jackpot pools.
  * **Identity Verification (KYC):** Compliance officers review ID documents before approving bank withdrawals.
  * **Role-Based Access Control (RBAC):** Restrict access across Super Admin, Support Agents, and Affiliate Managers.
  * **Audit Trails:** Full audit logging of all admin actions and financial transactions.

---

## ❓ SECTION 3: Client Q&A Bullet Points

### 🔹 Q1: How is double redemption prevented?
* **Answer:** Atomic database locks immediately flip coupon status from `ACTIVE` to `REDEEMED` during the first API handshake.

### 🔹 Q2: Can physical scratch cards be used?
* **Answer:** Yes! Physical cards printed with scratch-off codes or QR codes map to the exact same redemption API endpoint.

### 🔹 Q3: How are unauthorized withdrawals prevented?
* **Answer:** Withdrawals strictly require **Approved KYC verification**, and bonus balances can be bound by wagering requirements.

---

## 🏁 Summary Closing Bullet Points

* **For Customers:** Seamless, 1-click gift card redemption into lottery balance.
* **For Merchants:** New revenue stream and promotional marketing channel.
* **For Admins:** Total control over security, draws, compliance, and finances.
* **Status:** Fully developed, containerized, and ready for Phase 1 deployment.
