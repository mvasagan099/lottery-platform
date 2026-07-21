/**
 * Jackpot Service
 * Handles progressive jackpot pool management:
 *   - Scenario A: jackpot winner(s) → split payout → reset to base
 *   - Scenario B: no winner → carry forward → accumulate next contribution
 *
 * All DB writes are passed a Prisma transaction client (tx) so the caller
 * wraps everything in one atomic $transaction block.
 */
import { Prisma } from '@prisma/client';
export interface JackpotProcessResult {
    jackpotBefore: number;
    ticketContrib: number;
    winnerCount: number;
    jackpotPaid: number;
    jackpotAfter: number;
    rolloverAmount: number;
    isRollover: boolean;
    perWinnerAmount: number;
}
/**
 * Ensure a JackpotPool record exists for a game.
 * Creates one with baseJackpot taken from game.minJackpot if it doesn't exist.
 */
export declare function ensureJackpotPool(tx: Prisma.TransactionClient, gameId: string, gameMinJackpot: Prisma.Decimal | number): Promise<string>;
/**
 * Core draw-processing function.
 *
 * @param tx             Prisma transaction client
 * @param gameId         Game ID
 * @param drawId         Completed draw ID
 * @param drawNumber     Draw number (for history)
 * @param totalSales     Total ticket revenue for this draw
 * @param jackpotWinners Array of userIds who won the jackpot division
 * @param gameMinJackpot Base jackpot (game.minJackpot)
 */
export declare function processDrawJackpot(tx: Prisma.TransactionClient, gameId: string, drawId: string, drawNumber: number, totalSales: number, jackpotWinners: string[], gameMinJackpot: Prisma.Decimal | number): Promise<JackpotProcessResult>;
//# sourceMappingURL=jackpot.service.d.ts.map