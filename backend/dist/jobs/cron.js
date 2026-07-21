"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const server_1 = require("../server");
const crypto_1 = __importDefault(require("crypto"));
const jackpot_service_1 = require("../services/jackpot.service");
const parser = require('cron-parser');
function generateNumbers(pool, count) {
    const nums = new Set();
    while (nums.size < count) {
        nums.add(crypto_1.default.randomInt(1, pool + 1));
    }
    return Array.from(nums).sort((a, b) => a - b);
}
function initCronJobs() {
    console.log('🕒 Initializing Cron Jobs...');
    // Run every minute
    node_cron_1.default.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Find draws that are scheduled to run
            const pendingDraws = await server_1.prisma.draw.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: { lte: now }
                },
                include: {
                    game: {
                        include: { prizeDivisions: { orderBy: { divisionOrder: 'asc' } } }
                    },
                    tickets: {
                        include: { numbers: true }
                    }
                }
            });
            if (pendingDraws.length > 0) {
                console.log(`🎰 Found ${pendingDraws.length} draws to execute.`);
            }
            for (const draw of pendingDraws) {
                console.log(`Executing Draw #${draw.drawNumber} for ${draw.game.name}`);
                // 1. Generate Winning Numbers
                const winningNumbers = generateNumbers(draw.game.numberPool, draw.game.minNumbers);
                const powerball = draw.game.hasPowerball ? crypto_1.default.randomInt(1, draw.game.powerballPool + 1) : null;
                // 2. Mark as IN_PROGRESS
                await server_1.prisma.draw.update({
                    where: { id: draw.id },
                    data: {
                        status: 'IN_PROGRESS',
                        winningNumbers,
                        powerball,
                        drawnAt: now
                    }
                });
                // 3. Process Tickets — collect jackpot winners separately
                const jackpotDivision = draw.game.prizeDivisions.find(d => d.isJackpot);
                const jackpotWinnerUserIds = [];
                // We'll do ticket processing inside a transaction with the jackpot logic
                let totalPrizes = 0;
                const ticketResults = [];
                for (const ticket of draw.tickets) {
                    if (ticket.status === 'CANCELLED')
                        continue;
                    let bestDivision = null;
                    let bestPrize = 0;
                    let isJackpotWin = false;
                    for (const line of ticket.numbers) {
                        const nums = line.numbers;
                        const matched = nums.filter((n) => winningNumbers.includes(n)).length;
                        const pbMatched = powerball && line.powerball === powerball;
                        for (const div of draw.game.prizeDivisions) {
                            const numMatch = div.matchNumbers === matched;
                            const pbMatch = !div.matchPB || pbMatched;
                            if (numMatch && pbMatch) {
                                const prizeAmt = div.isJackpot
                                    ? Number(draw.jackpotAmount) // will be replaced by jackpot service
                                    : Number(div.fixedPrize || 0);
                                if (prizeAmt > bestPrize) {
                                    bestPrize = prizeAmt;
                                    bestDivision = div;
                                    isJackpotWin = div.isJackpot;
                                }
                                break;
                            }
                        }
                    }
                    if (bestDivision && (!bestDivision.isJackpot || bestPrize > 0 || jackpotDivision)) {
                        ticketResults.push({
                            ticketId: ticket.id,
                            userId: ticket.userId,
                            status: 'WON',
                            bestDivision,
                            bestPrize: bestDivision.isJackpot ? 0 : bestPrize, // jackpot handled separately
                            isJackpotWin: bestDivision.isJackpot,
                        });
                        if (bestDivision.isJackpot)
                            jackpotWinnerUserIds.push(ticket.userId);
                    }
                    else if (!bestDivision) {
                        ticketResults.push({ ticketId: ticket.id, userId: ticket.userId, status: 'LOST', bestDivision: null, bestPrize: 0, isJackpotWin: false });
                    }
                }
                const totalSales = Number(draw.totalSales);
                // 4. Execute jackpot + non-jackpot payouts in a single atomic transaction
                await server_1.prisma.$transaction(async (tx) => {
                    // Process jackpot rollover / payout
                    const jpResult = await (0, jackpot_service_1.processDrawJackpot)(tx, draw.game.id, draw.id, draw.drawNumber, totalSales, jackpotWinnerUserIds, draw.game.minJackpot);
                    // Process non-jackpot winners and losers
                    for (const result of ticketResults) {
                        if (result.status === 'WON') {
                            const prize = result.isJackpotWin ? jpResult.perWinnerAmount : result.bestPrize;
                            await tx.winningEntry.create({
                                data: {
                                    ticketId: result.ticketId,
                                    drawId: draw.id,
                                    divisionName: result.bestDivision.divisionName,
                                    prizeAmount: prize,
                                },
                            });
                            await tx.ticket.update({
                                where: { id: result.ticketId },
                                data: {
                                    status: 'WON',
                                    prizeAmount: prize,
                                    prizeDivision: result.bestDivision.divisionName,
                                },
                            });
                            // Non-jackpot prize credits (jackpot credits done inside jackpot service)
                            if (!result.isJackpotWin && prize > 0) {
                                const wallet = await tx.wallet.findUnique({ where: { userId: result.userId } });
                                if (wallet) {
                                    await tx.wallet.update({
                                        where: { id: wallet.id },
                                        data: { balance: { increment: prize }, totalWon: { increment: prize } }
                                    });
                                    await tx.transaction.create({
                                        data: {
                                            userId: result.userId,
                                            walletId: wallet.id,
                                            type: 'PRIZE_CREDIT',
                                            amount: prize,
                                            balanceBefore: Number(wallet.balance),
                                            balanceAfter: Number(wallet.balance) + prize,
                                            reference: `WIN-${draw.id}-${result.ticketId}`,
                                            description: `Winnings from Draw #${draw.drawNumber} — ${result.bestDivision.divisionName}`,
                                            status: 'COMPLETED',
                                            drawId: draw.id,
                                        }
                                    });
                                    await tx.notification.create({
                                        data: {
                                            userId: result.userId,
                                            title: '🏆 You won a prize!',
                                            message: `Congratulations! You won ${result.bestDivision.divisionName} (🪙${prize.toFixed(2)}) in Draw #${draw.drawNumber}!`,
                                            data: { ticketId: result.ticketId, drawId: draw.id },
                                        },
                                    });
                                }
                                totalPrizes += prize;
                            }
                            else if (result.isJackpotWin) {
                                totalPrizes += jpResult.perWinnerAmount;
                            }
                        }
                        else {
                            await tx.ticket.update({
                                where: { id: result.ticketId },
                                data: { status: 'LOST' },
                            });
                        }
                    }
                    // Mark draw COMPLETED
                    await tx.draw.update({
                        where: { id: draw.id },
                        data: { status: 'COMPLETED', totalPrizes },
                    });
                    console.log(jpResult.isRollover
                        ? `🔄 Jackpot rolled over to 🪙${jpResult.jackpotAfter.toFixed(2)} for ${draw.game.name}`
                        : `💰 Jackpot of 🪙${jpResult.jackpotPaid.toFixed(2)} paid to ${jpResult.winnerCount} winner(s). Reset to 🪙${jpResult.jackpotAfter.toFixed(2)}`);
                });
                // 5. Schedule Next Draw with the updated jackpot amount
                if (draw.game.drawSchedule) {
                    try {
                        const interval = parser.parseExpression(draw.game.drawSchedule, { currentDate: now });
                        const nextDate = interval.next().toDate();
                        // Fetch updated jackpot from the pool
                        const updatedPool = await server_1.prisma.jackpotPool.findUnique({ where: { gameId: draw.game.id } });
                        const nextJackpot = updatedPool ? Number(updatedPool.currentJackpot) : Number(draw.jackpotAmount);
                        await server_1.prisma.draw.create({
                            data: {
                                gameId: draw.game.id,
                                drawNumber: draw.drawNumber + 1,
                                scheduledAt: nextDate,
                                jackpotAmount: nextJackpot,
                                status: 'SCHEDULED'
                            }
                        });
                        console.log(`📅 Scheduled next draw for ${draw.game.name} on ${nextDate.toISOString()} — jackpot: 🪙${nextJackpot.toFixed(2)}`);
                    }
                    catch (e) {
                        console.error('Failed to schedule next draw:', e);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error executing draws cron:', error);
        }
    });
}
//# sourceMappingURL=cron.js.map