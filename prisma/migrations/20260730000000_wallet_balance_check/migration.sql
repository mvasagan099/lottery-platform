-- ============================================================
-- C-1 Defense-in-Depth: Prevent negative wallet balances at DB level
-- Applied automatically by: npx prisma migrate deploy
-- ============================================================

-- Add a CHECK constraint so the database itself rejects any UPDATE
-- that would make a wallet balance go below zero. This is a second
-- line of defense behind the FOR UPDATE row-lock in wallet.ts.
ALTER TABLE wallets
  ADD CONSTRAINT wallets_balance_nonneg CHECK (balance >= 0);

-- Also protect bonus and pending balances from going negative
ALTER TABLE wallets
  ADD CONSTRAINT wallets_bonus_balance_nonneg CHECK ("bonusBalance" >= 0);
