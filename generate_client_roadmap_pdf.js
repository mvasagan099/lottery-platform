const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'Lottery_Coupon_Integration_Client_Roadmap.pdf');
const doc = new PDFDocument({
  margin: 40,
  size: 'A4',
  bufferPages: true
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// --- Colors ---
const PRIMARY = '#1E293B';    // Deep Slate
const ACCENT = '#D97706';     // Gold/Amber
const SECONDARY = '#0F172A';  // Darker Slate
const TEXT_DARK = '#334155';  // Body text
const LIGHT_BG = '#F8FAFC';   // Light background
const BORDER_COLOR = '#E2E8F0';

function addHeader(title, subtitle) {
  doc.rect(0, 0, 595.28, 110).fill(PRIMARY);
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text(title, 40, 35);
  doc.fillColor(ACCENT).fontSize(12).font('Helvetica').text(subtitle, 40, 68);
  doc.y = 125;
}

function addSectionTitle(title) {
  if (doc.y > 670) doc.addPage();
  doc.moveDown(0.6);
  doc.fillColor(SECONDARY).fontSize(15).font('Helvetica-Bold').text(title);
  doc.strokeColor(ACCENT).lineWidth(2).moveTo(40, doc.y + 3).lineTo(220, doc.y + 3).stroke();
  doc.moveDown(0.6);
}

function addSubTitle(title) {
  if (doc.y > 700) doc.addPage();
  doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);
}

function addParagraph(text) {
  if (doc.y > 710) doc.addPage();
  doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(text, { align: 'justify', lineGap: 2.5 });
  doc.moveDown(0.4);
}

function addStepBox(stepNum, stepTitle, stepDesc) {
  if (doc.y > 660) doc.addPage();
  const startY = doc.y;
  doc.rect(40, startY, 515.28, 48).fill(LIGHT_BG).stroke(BORDER_COLOR);
  
  // Step Number Badge
  doc.rect(48, startY + 8, 32, 32).fill(PRIMARY);
  doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text(stepNum, 48, startY + 18, { width: 32, align: 'center' });
  
  // Text
  doc.fillColor(SECONDARY).fontSize(10).font('Helvetica-Bold').text(stepTitle, 90, startY + 10);
  doc.fillColor(TEXT_DARK).fontSize(8.8).font('Helvetica').text(stepDesc, 90, startY + 24, { width: 450 });
  
  doc.y = startY + 54;
}

// ==================== DOCUMENT PAGES ====================

// --- PAGE 1: Executive Summary & System Overview ---
addHeader('OzLotto & Coupon Ecosystem', 'Complete User & Admin Operational Workflows');

addSectionTitle('1. Executive Overview');
addParagraph('This document presents the complete end-to-end User Flow (customer experience) and Admin/Merchant Flow (operational governance) for the integrated OzLotto / MegaDraw Gaming Platform and CouponVault System. It is designed to be presented directly to stakeholders and clients to demonstrate how users acquire coupons and play lotteries, and how admins manage merchants, draws, and payouts.');

addSectionTitle('2. User Flow (End-to-End Customer Experience)');

addStepBox('1', 'Voucher Purchase (CouponVault)', 'Customer visits the Merchant / Coupon Portal, selects a gift voucher (e.g. $10, $50), and completes checkout via Razorpay or Stripe to receive a unique single-use code.');

addStepBox('2', 'Account Login & Deposit Page (Lottery Platform)', 'User logs into the OzLotto Platform (with 2FA / KYC verification) and navigates to the Wallet > Redeem Coupon page.');

addStepBox('3', 'Code Redemption & API Handshake', 'User inputs the coupon code. The Fastify backend executes an authenticated API check with CouponVault to verify validity, expiry, and balance.');

addStepBox('4', 'Instant Wallet Credit', 'CouponVault burns (locks) the voucher code. The Lottery backend instantly credits the user\'s wallet in Coins/USD, sending a success toast and notification.');

addStepBox('5', 'Ticket Purchase & Lottery Draw', 'User chooses numbers (or Quick Pick / Syndicates) for Powerball, MegaDraw, etc. Ticket is registered with a QR code, and prizes are automatically credited upon draw completion.');

// --- PAGE 2: Admin & Merchant Workflows ---
doc.addPage();

addSectionTitle('3. Admin & Merchant Operations Flow');

addSubTitle('A. Merchant & Coupon Management Flow (CouponVault Admin)');

addStepBox('M1', 'Merchant Onboarding & API Setup', 'Super Admin creates merchant profiles and issues secure API keys (COUPON_API_KEY) for backend-to-backend communication.');

addStepBox('M2', 'Campaign & Batch Creation', 'Merchant sets up promo campaigns defining voucher face values, total batch volume, expiration rules, and bonus percentages.');

addStepBox('M3', 'Real-Time Analytics & Settlement', 'Merchant monitors sales revenue, redemption rates, and active vs expired vouchers. Financial reports are exported for monthly settlements.');

addSubTitle('B. Platform & Gaming Operations Flow (MegaDraw Admin)');

addStepBox('A1', 'Game & Draw Engine Control', 'Admin configures draw schedules (cron format), ticket prices, min/max numbers, jackpot amounts, and prize division percentages.');

addStepBox('A2', 'KYC & Withdrawal Approval', 'Compliance officers review uploaded identity documents (Passports/ID) and approve or reject customer bank withdrawal requests.');

addStepBox('A3', 'RBAC & Financial Auditing', 'Super Admin manages access roles (Admin, Support, Affiliate Manager) and reviews real-time transaction logs and affiliate commissions.');

// --- PAGE 3: Summary Roadmap & Checklist ---
doc.addPage();

addSectionTitle('4. Implementation Milestones & Technical Stack');
addParagraph('The integration relies on a dual-backend architecture designed for maximum performance, security, and uptime:');

doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text('•  Fastify Backend: ', { continued: true });
doc.fillColor(TEXT_DARK).font('Helvetica').text('Handles high-concurrency ticket sales, JWT sessions, and draw execution.', { lineGap: 3 });

doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text('•  CouponVault Supabase Engine: ', { continued: true });
doc.fillColor(TEXT_DARK).font('Helvetica').text('Manages merchant accounts, Razorpay webhooks, and single-use voucher validation.', { lineGap: 3 });

doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text('•  PostgreSQL & Redis: ', { continued: true });
doc.fillColor(TEXT_DARK).font('Helvetica').text('Ensures relational integrity, fast rate limiting, and real-time WebSocket state distribution.', { lineGap: 3 });

addSectionTitle('5. Deliverable Summary for Client');
addParagraph('With this flow, your client achieves a complete closed-loop ecosystem: merchants generate revenue selling gift cards, users convert vouchers into lottery entries with zero payment friction, and admins retain total control over compliance, draws, and finances.');

// --- Page Numbers & Footer ---
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
    `OzLotto & Coupon Integration Proposal  |  Page ${i + 1} of ${pages.count}`,
    40,
    800,
    { align: 'center', width: 515.28 }
  );
}

doc.end();

stream.on('finish', () => {
  console.log('PDF updated successfully at:', outputPath);
});
