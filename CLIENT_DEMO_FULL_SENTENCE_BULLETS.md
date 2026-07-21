# 🎙️ Video Call Demo Script: Full Sentence Bullet-Point Edition

> [!NOTE]
> **Instructions for the Presenter:** This script formats all talking points into complete, natural sentences organized by bullet points. You can read these bullet points directly aloud to your client during the live screen-share presentation.

---

## 🖥️ Pre-Call Browser Setup

* Open **Tab 1** (`http://localhost:5174`) for the **CouponVault Merchant & User Portal**.
* Open **Tab 2** (`http://localhost:5173`) for the **OzLotto / MegaDraw Player Application**.
* Open **Tab 3** (`http://localhost:5173/wallet/deposit`) for the **Redeem Coupon & Deposit Page**.
* Open **Tab 4** (`http://localhost:5173/admin`) for the **MegaDraw Admin & Governance Portal**.

---

## 👤 SECTION 1: Customer Journey (User Flow Presentation)

### 📍 Step 1: Purchasing Vouchers on CouponVault
* **Target Screen:** Switch to **Tab 1** (`http://localhost:5174`).
* **On-Screen Action:** Scroll through the gift card showcase, then hover over the Razorpay and credit card checkout options.
* **What to Say (Full Sentence Bullet Points):**
  * *"Welcome everyone, today I want to show you how our ecosystem connects merchant rewards directly into lottery gameplay."*
  * *"On this first screen, customers can purchase promotional gift cards or lottery vouchers using integrated payment gateways like Razorpay or standard credit cards."*
  * *"Merchants can also distribute these vouchers as rewards for loyalty programs or retail promotional campaigns."*
  * *"Once the payment is completed, the system generates a unique, single-use encrypted coupon code alongside a printable QR code."*
* **Technical & Security Highlights:**
  * *"Each coupon code is protected by single-use token constraints and configurable expiration dates to prevent fraudulent redemptions."*

---

### 📍 Step 2: Redeeming Coupons & Funding the Lottery Wallet
* **Target Screen:** Switch to **Tab 3** (`http://localhost:5173/wallet/deposit`).
* **On-Screen Action:** Type the promo code `FREE50` into the redemption input box, click **Redeem Code**, and point out the updated wallet balance in the header.
* **What to Say (Full Sentence Bullet Points):**
  * *"Now, let's look at how easy it is for the customer to redeem their voucher inside the OzLotto platform."*
  * *"The user simply opens the deposit page, enters their voucher code, and clicks 'Redeem Code' without having to type in any bank or credit card details."*
  * *"Behind the scenes, our Fastify backend performs an instant secure API check with CouponVault to verify the voucher balance."*
  * *"Once validated, the voucher is immediately locked to prevent double spending, and the user's wallet is credited in real time."*
* **Technical & Security Highlights:**
  * *"The entire validation handshake between Fastify and CouponVault executes atomically in under 100 milliseconds."*

---

### 📍 Step 3: Game Selection & Ticket Purchase
* **Target Screen:** Switch to **Tab 2** (`http://localhost:5173`).
* **On-Screen Action:** Navigate to **Games**, choose **Powerball** or **MegaDraw**, click **Quick Pick**, and then click **Buy Ticket**.
* **What to Say (Full Sentence Bullet Points):**
  * *"With funds now in their wallet, the player can immediately participate in upcoming major draws like Thursday's Powerball or Tuesday's MegaDraw."*
  * *"Players can manually choose their favorite numbers, click 'Quick Pick' for automated selection, or join a Syndicate pool to share ticket costs."*
  * *"When the player confirms the purchase, the system deducts the ticket cost from their wallet and issues a digital ticket containing a unique QR code and serial number."*
* **Technical & Security Highlights:**
  * *"Ticket generation and wallet deductions are handled inside isolated database transactions to ensure mathematical precision and zero concurrency errors."*

---

### 📍 Step 4: Automated Draws & Instant Prize Distribution
* **Target Screen:** Remain on **Tab 2** and navigate to the **My Tickets** section.
* **What to Say (Full Sentence Bullet Points):**
  * *"When the official draw time arrives, our automated background engine selects the winning numbers according to the game schedule."*
  * *"The system automatically checks every active ticket line across all prize divisions and calculates prize payouts."*
  * *"Winning funds are credited directly back into the player's wallet balance, and instant notification alerts are sent via email and in-app notifications."*

---

## 👑 SECTION 2: Operational Governance (Admin & Merchant Flow)

### 📍 Step 5: Merchant Campaign & Analytics Management
* **Target Screen:** Switch back to **Tab 1** (Merchant Dashboard area).
* **On-Screen Action:** Show the campaign creation form, usage limit inputs, and real-time sales charts.
* **What to Say (Full Sentence Bullet Points):**
  * *"Next, let's look at how merchants manage their promotional voucher campaigns."*
  * *"Merchants can create custom voucher batches where they specify discount amounts, total voucher volumes, expiration rules, and bonus percentages."*
  * *"They also gain access to real-time analytics tracking how many vouchers were issued, how many were redeemed on the lottery site, and total sales revenue."*
  * *"At the end of each billing cycle, merchants can export automated financial reports for easy accounting settlements."*

---

### 📍 Step 6: Platform Governance & Compliance Control
* **Target Screen:** Switch to **Tab 4** (`http://localhost:5173/admin`).
* **On-Screen Action:** Click through the **Games & Draws**, **KYC Requests**, and **RBAC Roles** tabs.
* **What to Say (Full Sentence Bullet Points):**
  * *"Finally, let's explore the central MegaDraw Admin Portal where administrators maintain complete operational control."*
  * *"Admins can configure draw schedules using cron expressions, update ticket prices, and adjust jackpot prize pools."*
  * *"Our compliance team can inspect uploaded government identity documents to approve or reject customer bank withdrawal requests."*
  * *"We enforce strict Role-Based Access Control so that Super Admins, Support Agents, and Affiliate Managers only access their permitted features."*
  * *"Every single admin action and financial movement is tracked inside a permanent system audit log."*

---

## ❓ SECTION 3: Anticipated Client Questions & Full-Sentence Answers

### 🔹 Q1: How do you guarantee that a user cannot redeem a coupon twice?
* **Full-Sentence Answer:**
  * *"We enforce atomic database locks during the redemption handshake so that the token status flips from 'ACTIVE' to 'REDEEMED' immediately upon validation, rendering duplicate redemption attempts impossible."*

### 🔹 Q2: Can we sell physical paper or plastic voucher cards at retail locations?
* **Full-Sentence Answer:**
  * *"Yes, physical cards can be printed with scratch-off codes or scannable QR codes that connect directly into the exact same redemption API endpoint."*

### 🔹 Q3: How do you prevent users from immediately withdrawing coupon funds without playing?
* **Full-Sentence Answer:**
  * *"All cash withdrawals strictly require an approved KYC identity verification, and our system settings allow us to apply wagering requirements on promotional balances before funds become eligible for withdrawal."*

---

## 🏁 SECTION 4: Concluding Summary Statement

* *"In summary, this solution delivers a complete, closed-loop gaming and marketing ecosystem for your enterprise."*
* *"Merchants gain an effective channel to acquire customers and sell gift vouchers."*
* *"Players experience a seamless, zero-friction deposit process and automated lottery gameplay."*
* *"Your administrative team retains total authority over security, regulatory compliance, and financial tracking."*
* *"Our team is completely prepared to launch Phase 1 of the implementation roadmap whenever you are ready to proceed."*
