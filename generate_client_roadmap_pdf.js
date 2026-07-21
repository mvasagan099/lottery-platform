const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'Lottery_Coupon_Integration_Client_Roadmap.pdf');
const doc = new PDFDocument({
  margin: 50,
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
const LIGHT_BG = '#F8FAFC';   // Light background for cards
const BORDER_COLOR = '#E2E8F0';

// --- Helper Functions ---
function addHeader(title, subtitle) {
  doc.rect(0, 0, 595.28, 120).fill(PRIMARY);
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text(title, 50, 40);
  doc.fillColor(ACCENT).fontSize(13).font('Helvetica').text(subtitle, 50, 75);
  doc.y = 140;
}

function addSectionTitle(title) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(0.8);
  doc.fillColor(SECONDARY).fontSize(16).font('Helvetica-Bold').text(title);
  doc.strokeColor(ACCENT).lineWidth(2).moveTo(50, doc.y + 4).lineTo(200, doc.y + 4).stroke();
  doc.moveDown(0.8);
}

function addSubTitle(title) {
  if (doc.y > 700) doc.addPage();
  doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveDown(0.4);
}

function addParagraph(text) {
  if (doc.y > 710) doc.addPage();
  doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica').text(text, { align: 'justify', lineGap: 3 });
  doc.moveDown(0.5);
}

function addBullet(label, text) {
  if (doc.y > 710) doc.addPage();
  doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text(`•  ${label}: `, { continued: true });
  doc.fillColor(TEXT_DARK).font('Helvetica').text(text, { lineGap: 2 });
  doc.moveDown(0.3);
}

function addBox(title, contentArray) {
  if (doc.y > 620) doc.addPage();
  const startY = doc.y;
  doc.rect(50, startY, 495.28, 10).fill(LIGHT_BG).stroke(BORDER_COLOR);
  
  doc.y = startY + 10;
  doc.fillColor(SECONDARY).fontSize(11).font('Helvetica-Bold').text(title, 60, doc.y);
  doc.moveDown(0.4);
  
  contentArray.forEach(item => {
    doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(`-  ${item}`, 65, doc.y, { width: 465 });
    doc.moveDown(0.3);
  });

  const endY = doc.y + 10;
  doc.rect(50, startY, 495.28, endY - startY).stroke(BORDER_COLOR);
  doc.y = endY + 15;
}

// ==================== DOCUMENT GENERATION ====================

// --- PAGE 1: Executive Overview ---
addHeader('Lotto & Coupon Ecosystem', 'Strategic Client Proposal & Technical Integration Roadmap');

addSectionTitle('1. Executive Summary');
addParagraph('This proposal outlines the seamless integration between the OzLotto / MegaDraw Gaming Platform and the CouponVault Merchant Voucher Engine. By combining a state-of-the-art online lottery system with an agile coupon infrastructure, this solution provides merchants with customer acquisition tools and offers users a frictionless way to convert gift cards into lottery ticket purchases.');

addSectionTitle('2. Core Platform Capabilities');

addSubTitle('A. OzLotto / MegaDraw Platform (Gaming Backend & Portal)');
addBullet('Global Lottery Games', 'Supports 8+ major formats (Powerball, MegaDraw, Saturday Lotto, Set for Life, Lucky Lotteries, Lotto Strike, Super 66).');
addBullet('Automated Draw Engine', 'Cron-scheduled draws, prize tier division calculations, and instant win processing.');
addBullet('Syndicates & System Entries', 'Allows group ticket purchasing and multi-number system combinations.');
addBullet('User Security & Compliance', 'JWT authentication, Argon2 password hashing, 2FA enforcement, and automated KYC verification.');

addSubTitle('B. CouponVault Platform (Merchant Engine & Payment Gateway)');
addBullet('Merchant Dashboard', 'Centralized hub for merchants to create, issue, track, and manage promotional gift vouchers.');
addBullet('Razorpay & Payment Gateway Integration', 'Instant fiat payment processing for voucher purchases.');
addBullet('Single-Use Security Token', 'Encrypted voucher redemption system guaranteeing zero double-spending.');

// --- PAGE 2: User Flow & Technical Integration ---
doc.addPage();

addSectionTitle('3. Integrated User Journey & Data Flow');
addParagraph('The integration connects merchant voucher distribution directly into the lottery wallet, driving user conversion and cross-promotions.');

addBox('Step-by-Step Integration Workflow', [
  '1. Voucher Issuance: Merchant creates or user purchases a gift coupon (e.g., FREE50, LOTTO100) via CouponVault using Razorpay/Stripe.',
  '2. Redemption Request: User navigates to the Lottery Deposit page and inputs the voucher code.',
  '3. API Handshake: Fastify backend performs an authenticated API request to CouponVault to verify validity, expiry, and balance.',
  '4. Wallet Credit: Upon confirmation, CouponVault locks/invalidates the voucher, and the Lottery backend instantly credits the user\'s wallet in Coins/USD.',
  '5. Gameplay & Payout: User purchases lottery tickets for upcoming draws. Prize winnings are credited directly back to the user\'s wallet.'
]);

addSectionTitle('4. Technical Architecture Stack');
addBullet('Backend API', 'Fastify (Node.js), TypeScript, Prisma ORM, Zod Validation.');
addBullet('Database & Cache', 'PostgreSQL 16 (Relational schemas) + Redis 7 (Rate limiting, session store, queue management).');
addBullet('Coupon Engine', 'Supabase, PostgreSQL Row-Level Security (RLS), Netlify/Node serverless functions.');
addBullet('Frontend Applications', 'React 18, Vite, Zustand state management, TanStack React Query, Tailwind CSS.');
addBullet('Deployment', 'Render (Database, Redis, Fastify Backend), Docker Compose, Netlify / Vite static hosting.');

// --- PAGE 3: Client Roadmap & Phases ---
doc.addPage();

addSectionTitle('5. Project Implementation Roadmap');

addSubTitle('Phase 1: Architecture & DB Synchronization (Weeks 1 – 3)');
addBullet('Deliverables', 'Setup shared API schemas, establish secure service-to-service API key authentication, and deploy database migrations across environments.');

addSubTitle('Phase 2: Payment Gateway & Coupon API Engine (Weeks 4 – 6)');
addBullet('Deliverables', 'Implement Razorpay/Stripe webhooks in CouponVault, build the single-use token verification endpoint, and connect Fastify wallet handlers.');

addSubTitle('Phase 3: Frontend Integration & UX Polish (Weeks 7 – 9)');
addBullet('Deliverables', 'Integrate redemption page in Lottery App, build Merchant analytics dashboard, and implement real-time toast notifications and audit logs.');

addSubTitle('Phase 4: Testing, Security Audit & Go-Live (Weeks 10 – 12)');
addBullet('Deliverables', 'End-to-end integration testing, Redis rate-limit benchmarking, penetration testing, Render/Docker production deployment, and client handover.');

addSectionTitle('6. Next Steps & Action Items');
addParagraph('To initiate Phase 1, the client and development team will align on API secret management, payment gateway keys, and merchant sandbox accounts.');

// --- Page Numbers & Footer ---
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
    `Lottery & Coupon Platform Integration Proposal  |  Page ${i + 1} of ${pages.count}`,
    50,
    780,
    { align: 'center', width: 495.28 }
  );
}

doc.end();

stream.on('finish', () => {
  console.log('PDF generated successfully at:', outputPath);
});
