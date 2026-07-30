-- HIGH-2: Replace plaintext refreshToken + token columns with refreshTokenHash.
-- CRIT-2: Add unique constraint on deposits.gatewayRef for coupon redemption idempotency.
--
-- IMPORTANT: This migration will invalidate all existing sessions (users must re-login once).
-- The raw refresh token is never stored in the DB; only its SHA-256 hash is kept.

-- Step 1: Add the new refreshTokenHash column (nullable initially so existing rows don't fail)
ALTER TABLE "sessions" ADD COLUMN "refreshTokenHash" TEXT;

-- Step 2: Invalidate all existing sessions (they use the old plaintext column)
UPDATE "sessions" SET "isActive" = false;

-- Step 3: Set a placeholder hash for all inactive sessions so we can add NOT NULL + UNIQUE
UPDATE "sessions" SET "refreshTokenHash" = 'invalidated-' || id WHERE "refreshTokenHash" IS NULL;

-- Step 4: Enforce NOT NULL and UNIQUE on the new column
ALTER TABLE "sessions" ALTER COLUMN "refreshTokenHash" SET NOT NULL;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_refreshTokenHash_key" UNIQUE ("refreshTokenHash");

-- Step 5: Drop the old plaintext columns
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "token";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "refreshToken";

-- CRIT-2: Add unique constraint on deposits.gatewayRef
-- Existing rows with NULL gatewayRef are not affected (NULL != NULL in SQL unique indexes).
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_gatewayRef_key" UNIQUE ("gatewayRef");
