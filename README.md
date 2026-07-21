# MegaDraw / OzLotto Platform

A comprehensive, production-ready global Lottery and Gaming Platform. This repository contains both the Fastify-based backend API and the React-based frontend application, as well as a complete Dockerized environment.

---

## 🚀 Key Features

### Core System
- **Authentication & Security:** JWT-based auth, Two-Factor Authentication (2FA), Role-Based Access Control (RBAC), session management, and rate-limiting.
- **User Management & KYC:** Comprehensive user profiles, device history tracking (IP and user-agent), and an automated KYC (Know Your Customer) record submission and approval workflow.
- **Wallet & Transactions:** Multi-currency digital wallet system. Handles deposits, withdrawals, ticket purchases, and automated prize credits.
- **Payment Gateway Integrations:** Pre-configured database models and services for Stripe, PayPal, and direct Bank Transfers.
- **Lottery Games & Draws:** Dynamic game engine supporting custom number pools, supplementary numbers, and Powerballs. Automated draw scheduling via Cron expressions, jackpot management, and tier-based prize divisions.
- **Tickets & Syndicates:** Support for standard ticket lines, Quick Picks, System Entries, and Syndicate (group) play for massive prize pools.
- **Affiliate & Referral System:** Multi-tier affiliate accounts, referral tracking codes, and automated commission payouts based on user activity.
- **Support Center:** Fully-featured customer support ticketing system with department assignment, SLA tracking, internal messaging between agents, and automated priority handling.
- **CMS & Promotions:** Dynamic banners, fully customizable CMS pages (Terms, Privacy Policy, etc.), FAQs, and rich promotional/bonus structures.

---

## 🎲 Included Lottery Games

The platform seeds with several realistic, globally popular lottery formats out of the box:

1. **MegaDraw:** 7 numbers (1-47) + 2 Supplementaries.
2. **Powerball:** 7 numbers (1-35) + 1 Powerball (1-20).
3. **Saturday Lotto:** Classic 6 from 45.
4. **Weekday Windfall:** Guaranteed division prize pools on weekdays.
5. **Set for Life:** Win fixed annuities ($20k/month for 20 years).
6. **Lucky Lotteries (Mega & Super Jackpot):** Instant draw numbers with fixed prize brackets.
7. **Lotto Strike:** 4-number exact order matching.
8. **Super 66:** 6-digit game.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** [Fastify](https://www.fastify.io/) - High-performance Node.js framework.
- **Database ORM:** [Prisma](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM.
- **Database:** PostgreSQL 16.
- **Caching & Queues:** Redis (via `ioredis` & `bull`).
- **Validation:** Zod schemas.
- **Authentication:** Argon2 (hashing), Fastify-JWT.
- **Documentation:** Swagger & Swagger UI (`@fastify/swagger`).
- **Background Jobs:** Node-cron and cron-parser for executing draws.
- **File Uploads & Images:** Fastify Multipart, Sharp.
- **Email/PDF Generation:** Nodemailer, Resend, PDFKit.
- **WebSockets:** `@fastify/websocket` for real-time draw and ticket updates.

### Frontend
- **Framework:** React 18 with Vite.
- **State Management:** Zustand (global state) & TanStack React Query (server state).
- **Styling:** Tailwind CSS.
- **Routing:** React Router v6.
- **Forms & Validation:** React Hook Form + Zod resolvers.
- **Backend-as-a-Service (BaaS):** Supabase (for real-time features and selective client integrations).
- **UI & Analytics:** Recharts (admin charts), Framer Motion (animations), Lucide Icons.

---

## 📁 Project Structure

```text
lottery-platform/
├── backend/                  # Fastify API Server
│   ├── src/
│   │   ├── routes/           # 15+ API endpoint modules (auth, wallet, tickets, admin, rbac, etc.)
│   │   ├── services/         # Core business logic
│   │   ├── jobs/             # Automated draw & maintenance cron jobs
│   │   ├── server.ts         # Fastify App Initialization
│   │   └── seed.ts           # Massive DB seed script (Games, FAQs, Admin, Settings)
│   └── prisma/               # Prisma Schema & Migrations
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # Reusable components & Admin Sidebar/Drawers
│   │   ├── pages/            # Public & Admin dashboards (e.g. MerchantDashboard.tsx)
│   │   ├── lib/              # Utilities (e.g. supabase.ts)
│   │   └── services/         # API fetch wrappers
├── docker/                   # Docker environment (Postgres init scripts)
├── nginx/                    # Nginx reverse proxy configs for production
└── docker-compose.yml        # Full stack orchestration (Postgres, Redis, Backend, Frontend, Nginx)
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **Docker & Docker Compose** (for easy local setup of Postgres & Redis)
- **Git**

---

## 🚀 Getting Started

### 1. Start the Databases (Docker)

The easiest way to get PostgreSQL and Redis running is via the included `docker-compose.yml`:
```bash
docker-compose up -d postgres redis
```

### 2. Backend Setup

Navigate to the `backend/` directory:
```bash
cd backend
npm install
```

**Environment Variables (`backend/.env`):**
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Database & Cache (Matches Docker defaults)
DATABASE_URL="postgresql://lottery_user:secure_password@localhost:5432/lottery_db?schema=public"
REDIS_URL="redis://:redis_secret@localhost:6379"

# Security
JWT_SECRET="your-super-secret-jwt-key-min-32-chars!"
```

**Database Migration & Seeding:**
```bash
npm run db:migrate
npm run db:generate

# ⚠️ IMPORTANT: Seed the database! This creates the default games, settings, and the Super Admin account.
npm run db:seed
```

**Default Admin Credentials (created during seed):**
- **Email:** admin@megadraw.com (or username: admin)
- **Password:** Admin@123456

**Start the Development Server:**
```bash
npm run dev
```
The API is available at `http://localhost:3000`. 
Interactive Swagger docs: `http://localhost:3000/docs`.

### 3. Frontend Setup

Navigate to the `frontend/` directory:
```bash
cd ../frontend
npm install
```

**Environment Variables (`frontend/.env.local`):**
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

**Start the React Development Server:**
```bash
npm run dev
```
The frontend is available at `http://localhost:5173`.

---

## 🐳 Running Everything via Docker

If you want to run the entire stack (Database, Cache, Backend, Frontend, and Nginx proxy) via Docker:

```bash
docker-compose up -d --build
```
This will expose the application on ports `80` and `443` via the Nginx container.

---

## 📜 Available Scripts (Backend)

- `npm run dev`: Starts the backend server in watch mode using `tsx`.
- `npm run build`: Compiles the TypeScript backend into the `/dist` directory.
- `npm start`: Runs the compiled production backend server.
- `npm run db:migrate`: Deploys Prisma migrations to the database.
- `npm run db:generate`: Generates the Prisma Client.
- `npm run db:seed`: Executes the database seed script.
- `npm run db:studio`: Opens Prisma Studio (visual DB editor) on `localhost:5555`.

---

## 🔐 Security & Roles (RBAC)

The platform enforces strict Role-Based Access Control (RBAC). Default roles include:
- `SUPER_ADMIN`: Full access to system settings, RBAC, financial overviews, and system settings.
- `ADMIN`: Access to manage games, draws, users, and CMS content.
- `SUPPORT`: Access to the ticketing system, messages, and basic user profiles.
- `AFFILIATE_MANAGER`: Access to manage affiliate accounts, manual review of signups, and commissions.
- `USER`: Standard player account for purchasing tickets and managing the wallet.

---
*MegaDraw Platform - Engineered for scale, fairness, and reliability.*
