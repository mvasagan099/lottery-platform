# 🎬 Live Client Demo Script: Lottery & Coupon Platform Integration
## Step-by-Step Screen Sharing & Talking Points Guide

This script is designed for you to follow during a live video call with your client. It tells you **what tabs to open**, **what actions to click**, **what to say word-for-word**, and **how to answer common technical/business questions**.

---

## 🛠️ Step 0: Pre-Call Setup (Prepare Your Screen)

Before joining the call, open the following tabs in a single browser window:

1. **Tab 1:** `http://localhost:5174` (CouponVault Merchant & User Portal)
2. **Tab 2:** `http://localhost:5173` (OzLotto / MegaDraw Player App)
3. **Tab 3:** `http://localhost:5173/wallet/deposit` (Lottery Redeem Coupon Page)
4. **Tab 4:** `http://localhost:5173/admin` (MegaDraw Admin Portal)
5. **Tab 5:** `http://localhost:3000/docs` (Swagger API Specs - *Optional technical backup*)

---

## 📱 PART 1: The User Journey Demo (Customer Perspective)

### 📍 Step 1.1: Show the Coupon Platform (CouponVault)
- **Screen:** Switch to **Tab 1** (`http://localhost:5174`).
- **Action:** Highlight the available gift vouchers and payment checkout options.
- **🗣️ What to Say:**
  > *"Welcome everyone! Today I want to show you how our integrated ecosystem bridges merchant rewards directly into lottery gameplay. On your screen right now is the **CouponVault** platform. Here, users or retail partners can buy promotional gift cards—like a $50 Lottery Voucher—using payment options like Razorpay or credit card. Once purchased, the system generates an encrypted, single-use coupon code like `FREE50` or `LOTTO100`."*

### 📍 Step 1.2: Redeem the Coupon on the Lottery App
- **Screen:** Switch to **Tab 3** (`http://localhost:5173/wallet/deposit`).
- **Action:** Point to the **Redeem Coupon** input field. Type in `FREE50` (or your active promo code) and click **Redeem Code**.
- **🗣️ What to Say:**
  > *"Now, let's look at the customer experience. The user switches to the **OzLotto Platform** and navigates to the 'Add Funds' page. Instead of entering credit card details again, they simply enter their coupon code and click **Redeem Code**. 
  > Behind the scenes, our Fastify backend performs an instant API check with CouponVault. CouponVault validates the code, marks it as used so it can never be redeemed again, and immediately adds the funds to the user's wallet. Watch how the wallet balance updates instantly!"*

### 📍 Step 1.3: Play a Lottery Game & Buy Tickets
- **Screen:** Click on **Games** ➔ Select **Powerball** or **MegaDraw**.
- **Action:** Click **Quick Pick** to auto-select numbers, then click **Buy Ticket**.
- **🗣️ What to Say:**
  > *"Now that the wallet is funded, the user can immediately participate in active draws like Thursday's $20 Million Powerball or Tuesday's MegaDraw. They can manually choose their numbers, pick a 'Quick Pick', or even join a Syndicate pool with other players. 
  > When I click 'Buy Ticket', the wallet balance is deducted, and a digital ticket complete with a unique QR code and draw serial number is generated."*

### 📍 Step 1.4: Explain Draw Execution & Automated Payouts
- **Screen:** Show the **My Tickets** page or active draw countdown.
- **🗣️ What to Say:**
  > *"When the scheduled draw time arrives, our automated Cron engine draws the winning numbers, matches all active lines, and calculates prize divisions. If the user wins, their prize money is automatically credited straight back to their wallet, and they receive an instant email and push notification."*

---

## 👑 PART 2: The Admin & Merchant Governance Demo

### 📍 Step 2.1: Merchant Dashboard & Voucher Management
- **Screen:** Switch to **Tab 1** (Merchant Dashboard area).
- **Action:** Hover over campaign creation, voucher batch lists, and revenue charts.
- **🗣️ What to Say:**
  > *"Now let's switch to the management side. Merchants log into their **CouponVault Dashboard** where they can create custom voucher campaigns—setting discount values, batch quantities, and expiration dates. They can track real-time analytics showing how many vouchers were issued, how many were redeemed on the lottery platform, and export financial reports for monthly settlements."*

### 📍 Step 2.2: MegaDraw Admin Portal & Draw Engine Control
- **Screen:** Switch to **Tab 4** (`http://localhost:5173/admin`).
- **Action:** Show the Admin Navigation: **Games**, **Draws**, **KYC Requests**, and **RBAC Roles**.
- **🗣️ What to Say:**
  > *"On the lottery management side, administrators have total control through the **MegaDraw Admin Portal**. Here, admins can:
  > 1. Configure game rules, ticket pricing, and jackpot amounts.
  > 2. Monitor automated draw schedules or trigger manual draw verifications.
  > 3. Review KYC identity documents (Passport / Driver's License) uploaded by users before approving bank withdrawals.
  > 4. Assign granular permissions using Role-Based Access Control—separating Super Admins, Support Agents, and Affiliate Managers."*

---

## ❓ PART 3: Anticipated Client Questions & Exact Answers

Be prepared for these common questions during the demo:

### Q1: *"How do you prevent someone from using the same coupon code twice?"*
- **🗣️ Your Answer:**
  > *"Great question! We enforce a single-use token model with atomic transactions. When a redemption request comes in, CouponVault locks the token record in PostgreSQL using a transaction lock. Once validated, its status is immediately set to `REDEEMED` with a timestamp and user ID. Any subsequent attempt to reuse that code is blocked instantly at the API level."*

### Q2: *"Can we partner with retail merchants or store chains to sell physical voucher cards?"*
- **🗣️ Your Answer:**
  > *"Yes, absolutely! Physical cards can have scratch-off panels with generated coupon codes or printable QR codes. When a customer buys a scratch card at a store, they scan the QR code or type the code into the OzLotto deposit page, and it redeems seamlessly just like a digital code."*

### Q3: *"What happens if a user tries to withdraw coupon funds without playing?"*
- **🗣️ Your Answer:**
  > *"Our platform includes built-in compliance rules. First, withdrawals require an **Approved KYC** identity verification. Second, system settings allow us to enforce wagering requirements or separate bonus balances from withdrawable cash balances, ensuring regulatory compliance and preventing fraud."*

---

## 🎯 Wrap-Up Summary Statement

End your presentation with this strong concluding statement:

> *"To summarize: this integrated architecture gives you a complete, turn-key gaming ecosystem. Merchants drive user acquisition by selling gift cards, players enjoy a smooth, zero-friction deposit and lottery experience, and your management team retains complete control over security, compliance, and financial tracking. We are ready to execute Phase 1 of the implementation roadmap."*
